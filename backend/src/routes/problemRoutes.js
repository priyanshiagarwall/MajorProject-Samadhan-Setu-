const express = require('express');
const router = express.Router();
const {
  getMyProblems,
  getProblemById,
  getSavedProblems,
  toggleSaveProblem
} = require('../controllers/problemController');
const { protect } = require('../middleware/authMiddleware');

// Authenticated citizen problem routes
router.get('/my', protect, getMyProblems);
router.get('/saved', protect, getSavedProblems);
router.get('/:id', protect, getProblemById);
router.post('/:id/save', protect, toggleSaveProblem);

module.exports = router;
