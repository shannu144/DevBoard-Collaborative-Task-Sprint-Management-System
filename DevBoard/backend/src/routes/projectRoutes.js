const express = require('express');
const { body } = require('express-validator');
const projectController = require('../controllers/projectController');
const sprintController = require('../controllers/sprintController');
const { verifyToken, authorizeRole } = require('../middleware/authMiddleware');
const validate = require('../middleware/validatorMiddleware');

const router = express.Router();

// Apply verifyToken middleware to all routes in this router
router.use(verifyToken);

// --- PROJECT ROUTES ---

// Create project validation
const projectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 100 })
    .withMessage('Project name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('members')
    .optional()
    .isArray()
    .withMessage('Members must be an array of user IDs'),
  validate
];

router.post('/seed', projectController.seedDemoData);

router.route('/')
  .post(authorizeRole('admin', 'manager'), projectValidation, projectController.createProject)
  .get(projectController.getAllProjects);

router.route('/:id')
  .get(projectController.getProjectById)
  .put(authorizeRole('admin', 'manager'), projectValidation, projectController.updateProject)
  .delete(authorizeRole('admin', 'manager'), projectController.deleteProject);

// --- SPRINT ROUTES ---

// Sprint creation validation
const sprintValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Sprint name is required')
    .isLength({ max: 100 })
    .withMessage('Sprint name cannot exceed 100 characters'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  validate
];

// Sprint update validation
const sprintUpdateValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Sprint name cannot exceed 100 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('status')
    .optional()
    .isIn(['active', 'completed'])
    .withMessage('Status must be active or completed'),
  validate
];

router.route('/:id/sprints')
  .post(authorizeRole('admin', 'manager'), sprintValidation, sprintController.createSprint)
  .get(sprintController.getProjectSprints);

router.route('/sprints/:sprintId')
  .put(authorizeRole('admin', 'manager'), sprintUpdateValidation, sprintController.updateSprint);

module.exports = router;
