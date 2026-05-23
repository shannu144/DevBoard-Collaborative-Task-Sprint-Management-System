const Task = require('../models/Task');
const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { getRedisClient, clearCachePattern } = require('../config/redis');
const { getIO } = require('../config/socket');

// Helper to log activities
const createActivity = async (projectId, userId, action, taskId, details) => {
  try {
    await ActivityLog.create({
      projectId,
      userId,
      action,
      taskId,
      details
    });
  } catch (err) {
    console.error('⚠️ Failed to create activity log:', err.message);
  }
};

// Helper to safely emit socket events
const emitSocketEvent = (room, event, data) => {
  try {
    const io = getIO();
    io.to(room).emit(event, data);
    console.log(`📡 Socket event "${event}" emitted to room "${room}"`);
  } catch (err) {
    console.warn(`⚠️ Socket emit failed (server probably initializing/idle):`, err.message);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
exports.createTask = catchAsync(async (req, res, next) => {
  const { title, description, projectId, sprintId, assignedTo, priority, status, subtasks } = req.body;

  // 1) Verify Project exists and user is part of it
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }
  
  if (
    req.user.role !== 'admin' &&
    project.createdBy.toString() !== req.user._id.toString() &&
    !project.members.includes(req.user._id)
  ) {
    return next(new AppError('You do not have permission to add tasks to this project', 403));
  }

  // 2) Verify Sprint exists and belongs to project
  const sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    return next(new AppError('Sprint not found', 404));
  }
  if (sprint.projectId.toString() !== projectId) {
    return next(new AppError('Sprint does not belong to the specified project', 400));
  }

  // 3) Create task
  const task = await Task.create({
    title,
    description,
    projectId,
    sprintId,
    assignedTo,
    priority,
    status,
    subtasks: subtasks || [],
    createdBy: req.user._id
  });

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('sprintId', 'name startDate endDate status');

  // 4) Log activity
  await createActivity(
    projectId,
    req.user._id,
    'task:created',
    task._id,
    `Created task "${title}" in sprint "${sprint.name}"`
  );

  // 5) Real-time Socket.IO notifications
  // Direct notification to the assignee
  emitSocketEvent(`user:${assignedTo}`, 'task:assigned', {
    message: `You have been assigned a new task: "${title}"`,
    task: populatedTask
  });

  // Project-wide notification so Kanban boards sync
  emitSocketEvent(`project:${projectId}`, 'task:created', {
    message: `New task "${title}" was created`,
    task: populatedTask
  });

  // 6) Invalidate Redis Cache
  await clearCachePattern('tasks:*');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task: populatedTask }
  });
});

// @desc    Get filtered task list with Redis Caching (60s TTL)
// @route   GET /api/tasks
// @access  Private
exports.getAllTasks = catchAsync(async (req, res, next) => {
  const { projectId, sprintId, assignedTo } = req.query;

  // Build filter query
  const query = {};
  if (projectId) query.projectId = projectId;
  if (sprintId) query.sprintId = sprintId;
  if (assignedTo) query.assignedTo = assignedTo;

  // Generate Redis Cache Key
  const cacheKey = `tasks:proj:${projectId || 'all'}:sprint:${sprintId || 'all'}:user:${assignedTo || 'all'}`;

  // Try fetching from Redis Cache
  const redis = getRedisClient();
  if (redis) {
    try {
      const cachedTasks = await redis.get(cacheKey);
      if (cachedTasks) {
        console.log('⚡ Tasks retrieved from Redis Cache!');
        return res.status(200).json({
          success: true,
          message: 'Tasks retrieved successfully (cached)',
          data: { tasks: JSON.parse(cachedTasks) }
        });
      }
    } catch (err) {
      console.warn('⚠️ Redis GET error, falling back to MongoDB:', err.message);
    }
  }

  // Fallback to MongoDB Query
  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('sprintId', 'name startDate endDate status')
    .sort({ createdAt: -1 });

  // Store in Redis with 60s TTL
  if (redis) {
    try {
      await redis.setEx(cacheKey, 60, JSON.stringify(tasks));
      console.log('💾 Tasks saved to Redis Cache');
    } catch (err) {
      console.warn('⚠️ Redis SETEX error:', err.message);
    }
  }

  res.status(200).json({
    success: true,
    message: 'Tasks retrieved successfully',
    data: { tasks }
  });
});

// @desc    Update a task (status, assignedTo, priority)
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = catchAsync(async (req, res, next) => {
  const { title, description, status, assignedTo, priority, sprintId, subtasks } = req.body;

  let task = await Task.findById(req.params.id);
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Verify project and check membership
  const project = await Project.findById(task.projectId);
  if (!project) {
    return next(new AppError('Project associated with task not found', 404));
  }

  if (
    req.user.role !== 'admin' &&
    project.createdBy.toString() !== req.user._id.toString() &&
    !project.members.includes(req.user._id)
  ) {
    return next(new AppError('You do not have permission to update tasks in this project', 403));
  }

  // Audit details construction
  let changes = [];
  let isAssigneeChanged = false;
  let isStatusChanged = false;
  const oldAssignee = task.assignedTo.toString();
  const oldStatus = task.status;

  if (title && title !== task.title) {
    changes.push(`title to "${title}"`);
    task.title = title;
  }
  if (description !== undefined && description !== task.description) {
    changes.push('description');
    task.description = description;
  }
  if (priority && priority !== task.priority) {
    changes.push(`priority to "${priority}"`);
    task.priority = priority;
  }
  if (sprintId && sprintId !== task.sprintId.toString()) {
    changes.push('sprint assignment');
    task.sprintId = sprintId;
  }
  if (subtasks) {
    changes.push('checklist subtasks');
    task.subtasks = subtasks;
  }
  if (assignedTo && assignedTo !== oldAssignee) {
    changes.push('assignee');
    task.assignedTo = assignedTo;
    isAssigneeChanged = true;
  }
  if (status && status !== oldStatus) {
    changes.push(`status to "${status}"`);
    task.status = status;
    isStatusChanged = true;
  }

  if (changes.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'No changes made to task',
      data: { task }
    });
  }

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email role')
    .populate('createdBy', 'name email role')
    .populate('sprintId', 'name startDate endDate status');

  // Log activity
  const details = `Updated task "${task.title}": changed ${changes.join(', ')}`;
  await createActivity(task.projectId, req.user._id, 'task:updated', task._id, details);

  // Socket triggers
  if (isAssigneeChanged) {
    // Notify the new assignee
    emitSocketEvent(`user:${assignedTo}`, 'task:assigned', {
      message: `You have been assigned the task: "${task.title}"`,
      task: populatedTask
    });
  }

  // Notify everyone in project for synchronization (especially status changes for Kanban board updates)
  emitSocketEvent(`project:${task.projectId}`, 'task:updated', {
    message: `Task "${task.title}" was updated: ${changes.join(', ')}`,
    task: populatedTask,
    isStatusChanged,
    oldStatus,
    newStatus: status
  });

  // Invalidate Redis Cache
  await clearCachePattern('tasks:*');

  res.status(200).json({
    success: true,
    message: 'Task updated successfully',
    data: { task: populatedTask }
  });
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin or Manager only)
exports.deleteTask = catchAsync(async (req, res, next) => {
  const task = await Task.findById(req.params.id);
  if (!task) {
    return next(new AppError('Task not found', 404));
  }

  // Check project permission: Admin or Project creator/manager
  const project = await Project.findById(task.projectId);
  if (!project) {
    return next(new AppError('Associated project not found', 404));
  }

  if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to delete tasks from this project', 403));
  }

  await task.deleteOne();

  // Log activity
  await createActivity(
    task.projectId,
    req.user._id,
    'task:deleted',
    task._id,
    `Deleted task "${task.title}"`
  );

  // Emit event to update boards
  emitSocketEvent(`project:${task.projectId}`, 'task:deleted', {
    message: `Task "${task.title}" was deleted`,
    taskId: task._id
  });

  // Invalidate Redis Cache
  await clearCachePattern('tasks:*');

  res.status(200).json({
    success: true,
    message: 'Task deleted successfully',
    data: null
  });
});
