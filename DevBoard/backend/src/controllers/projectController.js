const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (Admin or Manager only)
exports.createProject = catchAsync(async (req, res, next) => {
  const { name, description, members } = req.body;

  const project = await Project.create({
    name,
    description,
    members: members || [],
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: { project }
  });
});

// @desc    Get all projects user is member or creator of (Admin sees all)
// @route   GET /api/projects
// @access  Private
exports.getAllProjects = catchAsync(async (req, res, next) => {
  let query = {};

  // If not admin, restrict to projects created by user or where they are a member
  if (req.user.role !== 'admin') {
    query = {
      $or: [
        { createdBy: req.user._id },
        { members: req.user._id }
      ]
    };
  }

  const projects = await Project.find(query)
    .populate('createdBy', 'name email role')
    .populate('members', 'name email role')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: 'Projects retrieved successfully',
    data: { projects }
  });
});

// @desc    Get a single project's details
// @route   GET /api/projects/:id
// @access  Private
exports.getProjectById = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id)
    .populate('createdBy', 'name email role')
    .populate('members', 'name email role');

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check permissions: Admin, creator, or member
  if (
    req.user.role !== 'admin' &&
    project.createdBy._id.toString() !== req.user._id.toString() &&
    !project.members.some(member => member._id.toString() === req.user._id.toString())
  ) {
    return next(new AppError('You do not have permission to view this project', 403));
  }

  res.status(200).json({
    success: true,
    message: 'Project retrieved successfully',
    data: { project }
  });
});

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin or Manager only)
exports.updateProject = catchAsync(async (req, res, next) => {
  const { name, description, members } = req.body;

  let project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user is Admin OR the creator of this project
  if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to update this project', 403));
  }

  // Perform updates
  project.name = name || project.name;
  project.description = description !== undefined ? description : project.description;
  if (members) project.members = members;

  await project.save();

  project = await Project.findById(req.params.id)
    .populate('createdBy', 'name email role')
    .populate('members', 'name email role');

  res.status(200).json({
    success: true,
    message: 'Project updated successfully',
    data: { project }
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin or Manager only)
exports.deleteProject = catchAsync(async (req, res, next) => {
  const project = await Project.findById(req.params.id);

  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check if user is Admin OR the creator of this project
  if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to delete this project', 403));
  }

  await project.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Project deleted successfully',
    data: null
  });
});

// @desc    Seed demo project, sprint, and tasks for quick portfolio testing
// @route   POST /api/projects/seed
// @access  Private
exports.seedDemoData = catchAsync(async (req, res, next) => {
  // Import Sprint & Task inside to prevent circular dependency patterns
  const Sprint = require('../models/Sprint');
  const Task = require('../models/Task');
  const { clearCachePattern } = require('../config/redis');

  // 1. Create Project
  const project = await Project.create({
    name: 'DevBoard Sprint Pipeline',
    description: 'Scaffold core architectures, establish secure JWT cookie authorization, and set up live Socket.IO room sync.',
    members: [req.user._id],
    createdBy: req.user._id
  });

  // 2. Create Active Sprint
  const sprint = await Sprint.create({
    projectId: project._id,
    name: 'Sprint 1 - Core Services',
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'active'
  });

  // 3. Create 3 standard Tasks with nested checklist subtasks
  const task1 = await Task.create({
    title: 'Implement JWT Access & Refresh Token rotation',
    description: 'Configure secure HttpOnly cookies for refresh tokens and 15 min memory lifespans for access tokens.',
    projectId: project._id,
    sprintId: sprint._id,
    assignedTo: req.user._id,
    priority: 'high',
    status: 'todo',
    subtasks: [
      { title: 'Define User Mongoose schema', completed: true },
      { title: 'Write token generator signing helpers', completed: true },
      { title: 'Configure axios refresh interceptors', completed: false }
    ],
    createdBy: req.user._id
  });

  const task2 = await Task.create({
    title: 'Setup resilient Redis queries caching layer',
    description: 'Establish client connections, cache task query lists with a 60s TTL, and configure automatic eviction.',
    projectId: project._id,
    sprintId: sprint._id,
    assignedTo: req.user._id,
    priority: 'medium',
    status: 'in-progress',
    subtasks: [
      { title: 'Configure standard Docker Redis images', completed: true },
      { title: 'Implement key evictions upon task write updates', completed: false }
    ],
    createdBy: req.user._id
  });

  const task3 = await Task.create({
    title: 'Establish secure Socket.IO room broadcasters',
    description: 'Hook up live two-way notifications for direct user room assignments and project column movements.',
    projectId: project._id,
    sprintId: sprint._id,
    assignedTo: req.user._id,
    priority: 'low',
    status: 'done',
    subtasks: [
      { title: 'Authorise socket handshakes', completed: true }
    ],
    createdBy: req.user._id
  });

  // Invalidate Redis Cache
  await clearCachePattern('tasks:*');

  // Trigger an activity log entry
  const ActivityLog = require('../models/ActivityLog');
  await ActivityLog.create({
    projectId: project._id,
    userId: req.user._id,
    action: 'project:seeded',
    details: 'Seeded a demo project workspace with Sprint 1 and active checklist tasks.',
    timestamp: new Date()
  });

  res.status(201).json({
    success: true,
    message: 'Demo workspace seeded successfully!',
    data: { project, sprint, tasks: [task1, task2, task3] }
  });
});
