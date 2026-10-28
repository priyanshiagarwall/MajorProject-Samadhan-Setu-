const express = require('express');
const router = express.Router();
const {
  getFaculty,
  getProfile,
  addFaculty,
  updateFaculty,
  removeFaculty
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/profile', getProfile);
router.get('/', authorize('UNIVERSITY', 'FACULTY', 'ADMIN'), getFaculty);
router.post('/', authorize('UNIVERSITY', 'ADMIN'), addFaculty);
router.put('/:id', authorize('UNIVERSITY', 'ADMIN'), updateFaculty);
router.delete('/:id', authorize('UNIVERSITY', 'ADMIN'), removeFaculty);

module.exports = router;
