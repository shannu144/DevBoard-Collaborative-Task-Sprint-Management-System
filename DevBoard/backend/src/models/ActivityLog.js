const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'An activity log must belong to a project']
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'An activity log must record the user who triggered it']
    },
    action: {
      type: String,
      required: [true, 'An action description is required']
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    details: {
      type: String,
      required: [true, 'Activity log details are required']
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false // We use custom timestamp field
  }
);

// Indexing for pagination and filtering
activityLogSchema.index({ projectId: 1, timestamp: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
