const ActivityLog = require('../models/ActivityLog');
const Project = require('../models/Project');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

// @desc    Get paginated activity log for a project
// @route   GET /api/activity
// @access  Private
exports.getActivityLog = catchAsync(async (req, res, next) => {
  const { projectId, page = 1, limit = 20 } = req.query;

  if (!projectId) {
    return next(new AppError('Please provide a projectId', 400));
  }

  // 1) Verify Project exists and user is a member
  const project = await Project.findById(projectId);
  if (!project) {
    return next(new AppError('Project not found', 404));
  }

  if (
    req.user.role !== 'admin' &&
    project.createdBy.toString() !== req.user._id.toString() &&
    !project.members.includes(req.user._id)
  ) {
    return next(new AppError('You do not have permission to view activity logs for this project', 403));
  }

  // 2) Paginate results
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);
  const skip = (pageNum - 1) * limitNum;

  const total = await ActivityLog.countDocuments({ projectId });
  const logs = await ActivityLog.find({ projectId })
    .populate('userId', 'name email role')
    .populate('taskId', 'title status')
    .sort({ timestamp: -1 })
    .skip(skip)
    .limit(limitNum);

  res.status(200).json({
    success: true,
    message: 'Activity log retrieved successfully',
    data: {
      logs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    }
  });
});
