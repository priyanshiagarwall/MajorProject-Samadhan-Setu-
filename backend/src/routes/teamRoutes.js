const express = require('express');
const router = express.Router();
const {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  inviteMember,
  respondInvite,
  updateMember,
  removeMember
} = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', authorize('UNIVERSITY', 'FACULTY', 'STUDENT', 'ADMIN'), getTeams);
router.post('/', authorize('UNIVERSITY', 'ADMIN'), createTeam);
router.put('/:id', authorize('UNIVERSITY', 'ADMIN'), updateTeam);
router.delete('/:id', authorize('UNIVERSITY', 'ADMIN'), deleteTeam);

// Team Member Management & Invitations
router.post('/:id/invite', authorize('STUDENT', 'UNIVERSITY', 'ADMIN'), inviteMember);
router.post('/:id/respond-invite', authorize('STUDENT'), respondInvite);
router.put('/:id/members/:memberId', authorize('STUDENT', 'UNIVERSITY', 'ADMIN'), updateMember);
router.delete('/:id/members/:memberId', authorize('STUDENT', 'UNIVERSITY', 'ADMIN'), removeMember);

module.exports = router;
