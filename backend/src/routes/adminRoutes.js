const express = require('express');
const router = express.Router();
const {
  getOverview,
  getAdminDashboard,
  getAnalyticsDashboard,
  exportAnalyticsCSV,
  getGeographicMapData,
  recommendUniversitiesForChallenge,
  acceptUniversityRecommendation,
  ignoreUniversityRecommendation,
  getChallenges,
  getChallengeById,
  getValidationQueue,
  validateChallenge,
  rejectChallenge,
  requestInformation,
  markDuplicate,
  changePriority,
  addInternalNote,
  assignUniversity,
  getChallengeAuditHistory,
  updateChallengeStatus,
  getUniversities,
  updateUniversityStatus,
  getIndustryPartners,
  updateIndustryStatus,
  getAdminProfile,
  updateAdminProfile,
  aiAnalyzeChallenge,
  reviewChallenge,
  getChallengeRecommendations,
  getAssignmentOptions,
  getAdminProjects,
  getAdminProjectById,
  updateProjectStage,
  getAdminUsers,
  updateUserStatus
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply protect and authorize('ADMIN') to all admin endpoints
router.use(protect);
router.use(authorize('ADMIN'));

// Analytics & Dashboard
router.get('/dashboard', getAdminDashboard);
router.get('/overview', getOverview);
router.get('/analytics', getAnalyticsDashboard);
router.get('/analytics/export', exportAnalyticsCSV);
router.get('/map', getGeographicMapData);

// Challenge Management & Review
router.get('/challenges', getChallenges);
router.get('/challenges/:id', getChallengeById);
router.get('/validation-queue', getValidationQueue);
router.post('/challenges/:id/review', reviewChallenge);
router.post('/challenges/:id/validate', validateChallenge);
router.post('/challenges/:id/reject', rejectChallenge);
router.post('/challenges/:id/request-info', requestInformation);
router.post('/challenges/:id/duplicate', markDuplicate);
router.patch('/challenges/:id/priority', changePriority);
router.post('/challenges/:id/notes', addInternalNote);
router.get('/challenges/:id/audit-history', getChallengeAuditHistory);
router.patch('/challenges/:id/status', updateChallengeStatus);

// Smart Routing & AI Recommendations & Assignment
router.get('/challenges/:id/recommendations', getChallengeRecommendations);
router.get('/assignment-options', getAssignmentOptions);
router.post('/challenges/:id/assign', assignUniversity);
router.post('/challenges/:id/ai-analyze', aiAnalyzeChallenge);
router.post('/challenges/:id/recommend-universities', recommendUniversitiesForChallenge);
router.post('/challenges/:id/recommend-universities/accept', acceptUniversityRecommendation);
router.post('/challenges/:id/recommend-universities/ignore', ignoreUniversityRecommendation);

// Project Management
router.get('/projects', getAdminProjects);
router.get('/projects/:id', getAdminProjectById);
router.patch('/projects/:id/stage', updateProjectStage);

// Partner Registries & Account Management
router.get('/universities', getUniversities);
router.patch('/universities/:id/status', updateUniversityStatus);
router.get('/industry', getIndustryPartners);
router.get('/industries', getIndustryPartners);
router.patch('/industry/:id/status', updateIndustryStatus);
router.patch('/industries/:id/status', updateIndustryStatus);

// User & Role Management
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', updateUserStatus);

// Profile
router.get('/profile', getAdminProfile);
router.put('/profile', updateAdminProfile);

module.exports = router;
