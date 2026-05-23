const express = require('express');
const { query } = require('express-validator');
const activityController = require('../controllers/activityController');
const { verifyToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validatorMiddleware');

const router = express.Router();

router.use(verifyToken);

const activityValidation = [
  query('projectId')
    .notEmpty()
    .withMessage('Project ID is required')
    .isMongoId()
    .withMessage('Invalid Project ID'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be an integer between 1 and 100'),
  validate
];

router.get('/', activityValidation, activityController.getActivityLog);

module.exports = router;
