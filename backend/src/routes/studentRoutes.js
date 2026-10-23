const express = require('express');
const router = express.Router();
const {
  getStudents,
  addStudent,
  updateStudent,
  removeStudent,
  getStudentDashboard,
  getStudentProjects,
  initStudentProject,
  getStudentMilestones,
  updateMilestoneProgress,
  submitMilestoneForReview,
  submitMilestoneDeliverable,
  getStudentDocuments,
  uploadStudentDocument,
  getStudentIndustryPartners,
  requestStudentIndustryCollaboration,
  getStudentPartnerships,
  getStudentProfile,
  updateStudentProfile,
  uploadStudentProfileImage,
  getStudentAchievements
} = require('../controllers/studentController');
const { getStudentChallenges } = require('../controllers/challengeController');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.get('/', authorize('UNIVERSITY', 'STUDENT', 'ADMIN'), getStudents);
router.get('/dashboard', authorize('STUDENT'), getStudentDashboard);
router.get('/challenges', authorize('STUDENT'), getStudentChallenges);
router.get('/projects', authorize('STUDENT'), getStudentProjects);
router.post('/projects/init', authorize('STUDENT'), initStudentProject);

// Student Profile & Image Upload
router.get('/profile', authorize('STUDENT'), getStudentProfile);
router.put('/profile', authorize('STUDENT'), updateStudentProfile);
router.post('/profile/image', authorize('STUDENT'), upload.single('image'), uploadStudentProfileImage);

// Student Real Verified Achievements
router.get('/achievements', authorize('STUDENT'), getStudentAchievements);

// Student Milestones & Deliverables
router.get('/milestones', authorize('STUDENT'), getStudentMilestones);
router.put('/milestones/:milestoneId/progress', authorize('STUDENT'), updateMilestoneProgress);
router.post('/milestones/:milestoneId/submit-review', authorize('STUDENT'), submitMilestoneForReview);
router.post('/milestones/:milestoneId/deliverables', authorize('STUDENT'), upload.single('file'), submitMilestoneDeliverable);

// Student Project Documents Vault
router.get('/documents', authorize('STUDENT'), getStudentDocuments);
router.post('/documents', authorize('STUDENT'), upload.single('file'), uploadStudentDocument);

// Student Industry Collaboration
router.get('/industry', authorize('STUDENT'), getStudentIndustryPartners);
router.post('/industry/collaborate', authorize('STUDENT'), requestStudentIndustryCollaboration);
router.get('/industry/partnerships', authorize('STUDENT'), getStudentPartnerships);

router.post('/', authorize('UNIVERSITY', 'ADMIN'), addStudent);
router.put('/:id', authorize('UNIVERSITY', 'ADMIN'), updateStudent);
router.delete('/:id', authorize('UNIVERSITY', 'ADMIN'), removeStudent);

module.exports = router;
