const express = require('express');
const router = express.Router();
const {
  getProfile,
  updateProfile,
  getChallenges,
  expressInterest,
  acceptChallenge,
  declineChallenge
} = require('../controllers/universityController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Strictly protect all university routes for UNIVERSITY role
router.use(protect);
router.use(authorize('UNIVERSITY'));

// Institutional Profile
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

// Challenge Marketplace & Projects
router.get('/challenges', getChallenges);
router.post('/challenges/:id/interest', expressInterest);
router.post('/challenges/:id/accept', acceptChallenge);
router.post('/challenges/:id/decline', declineChallenge);

module.exports = router;

