const Sprint = require('../models/Sprint');
const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// @desc    Create a sprint under a project
// @route   POST /api/projects/:id/sprints
// @access  Private (Admin or Manager only)
exports.createSprint = catchAsync(async (req, res, next) => {
  const { name, startDate, endDate } = req.body;
  const projectId = req.params.id;

  // Verify project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Authorize creator: Admin or Project creator/member with manager role
  if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to add sprints to this project', 403));
  }

  const sprint = await Sprint.create({
    projectId,
    name,
    startDate,
    endDate
  });

  res.status(201).json({
    success: true,
    message: 'Sprint created successfully',
    data: { sprint }
  });
});

// @desc    Get all sprints for a specific project
// @route   GET /api/projects/:id/sprints
// @access  Private
exports.getProjectSprints = catchAsync(async (req, res, next) => {
  const projectId = req.params.id;

  // Verify project exists
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  // Check project membership / permission
  if (
    req.user.role !== 'admin' &&
    project.createdBy.toString() !== req.user._id.toString() &&
    !project.members.includes(req.user._id)
  ) {
    return next(new AppError('You do not have permission to view sprints for this project', 403));
  }

  const sprints = await Sprint.find({ projectId }).sort({ startDate: 1 });

  res.status(200).json({
    success: true,
    message: 'Sprints retrieved successfully',
    data: { sprints }
  });
});

// @desc    Update a sprint's details or status
// @route   PUT /api/projects/sprints/:sprintId
// @access  Private (Admin or Manager only)
exports.updateSprint = catchAsync(async (req, res, next) => {
  const { name, startDate, endDate, status } = req.body;
  const { sprintId } = req.params;

  let sprint = await Sprint.findById(sprintId);
  if (!sprint) {
    return next(new AppError('Sprint not found', 404));
  }

  // Verify project and check permissions
  const project = await Project.findById(sprint.projectId);
  if (!project) {
    return next(new AppError('Associated project not found', 404));
  }

  if (req.user.role !== 'admin' && project.createdBy.toString() !== req.user._id.toString()) {
    return next(new AppError('You do not have permission to update sprints in this project', 403));
  }

  // Apply updates
  sprint.name = name || sprint.name;
  sprint.startDate = startDate || sprint.startDate;
  sprint.endDate = endDate || sprint.endDate;
  sprint.status = status || sprint.status;

  await sprint.save();

  res.status(200).json({
    success: true,
    message: 'Sprint updated successfully',
    data: { sprint }
  });
});
