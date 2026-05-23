const express = require('express');
const { body, query } = require('express-validator');
const taskController = require('../controllers/taskController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validatorMiddleware');

const router = express.Router();

// Enforce auth token check on all task endpoints
router.use(verifyToken);

// Task creation validation schema
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 150 })
    .withMessage('Task title cannot exceed 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid Project ID'),
  body('sprintId')
    .notEmpty()
    .withMessage('Sprint ID is required')
    .isMongoId()
    .withMessage('Invalid Sprint ID'),
  body('assignedTo')
    .notEmpty()
    .withMessage('Assigned To User ID is required')
    .isMongoId()
    .withMessage('Invalid User ID for assignedTo'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage('Status must be todo, in-progress, or done'),
  validate
];

// Task update validation schema
const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Task title cannot exceed 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Priority must be low, medium, or high'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage('Status must be todo, in-progress, or done'),
  body('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid User ID for assignedTo'),
  body('sprintId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Sprint ID'),
  validate
];

// GET Task query parameters validation
const getTasksValidation = [
  query('projectId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Project ID'),
  query('sprintId')
    .optional()
    .isMongoId()
    .withMessage('Invalid Sprint ID'),
  query('assignedTo')
    .optional()
    .isMongoId()
    .withMessage('Invalid User ID'),
  validate
];

router.route('/')
  .post(createTaskValidation, taskController.createTask)
  .get(getTasksValidation, taskController.getAllTasks);

router.route('/:id')
  .put(updateTaskValidation, taskController.updateTask)
  .delete(authorizeRole('admin', 'manager'), taskController.deleteTask);

module.exports = router;
