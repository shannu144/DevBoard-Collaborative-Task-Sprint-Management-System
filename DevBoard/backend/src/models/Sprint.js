const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'A sprint must belong to a project']
    },
    name: {
      type: String,
      required: [true, 'A sprint must have a name'],
      trim: true,
      maxlength: [100, 'A sprint name cannot exceed 100 characters']
    },
    startDate: {
      type: Date,
      required: [true, 'A sprint must have a start date']
    },
    endDate: {
      type: Date,
      required: [true, 'A sprint must have an end date']
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'completed'],
        message: 'Status must be active or completed'
      },
      default: 'active'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexing for speed in listing sprints for projects
sprintSchema.index({ projectId: 1 });

const Sprint = mongoose.model('Sprint', sprintSchema);

module.exports = Sprint;
