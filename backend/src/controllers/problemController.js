const Challenge = require('../models/Challenge');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get challenges submitted by the authenticated citizen
 * GET /api/problems/my
 */
const getMyProblems = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Fetch user for saved list count
    const user = await User.findById(userId).select('savedChallenges');

    // Fetch citizen's problems
    const problems = await Challenge.find({ submittedBy: userId })
      .populate('submittedBy', 'name email organization phone district')
      .populate('assignedUniversity', 'name email organization')
      .populate('assignedFaculty', 'name department specialization')
      .populate('assignedStudentTeam', 'name department')
      .populate('assignedStudents', 'name email organization')
      .populate('industryPartner', 'name email organization')
      .populate('assignedProject', 'title status overallProgress timeline')
      .sort({ createdAt: -1 });

    // Calculate real dynamic dashboard stats
    const total = problems.length;
    const underReview = problems.filter((p) =>
      ['UNDER_REVIEW', 'VALIDATED'].includes(p.status)
    ).length;
    const inProgress = problems.filter((p) =>
      ['ASSIGNED', 'IN_PROGRESS', 'SOLUTION_PROPOSED', 'PILOT_TESTING'].includes(p.status)
    ).length;
    const resolved = problems.filter((p) => p.status === 'RESOLVED').length;
    const submitted = problems.filter((p) => p.status === 'SUBMITTED').length;

    return successResponse(res, 'Citizen challenges retrieved successfully', {
      stats: {
        total,
        submitted,
        underReview,
        inProgress,
        resolved,
        savedCount: user?.savedChallenges?.length || 0
      },
      count: problems.length,
      problems
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single problem details by ID
 * GET /api/problems/:id
 */
const getProblemById = async (req, res, next) => {
  try {
    const problem = await Challenge.findById(req.params.id)
      .populate('submittedBy', 'name email organization phone district')
      .populate('assignedUniversity', 'name email organization phone district')
      .populate('assignedFaculty', 'name department specialization experience')
      .populate('assignedStudentTeam', 'name department university')
      .populate('assignedStudents', 'name email organization phone')
      .populate('industryPartner', 'name email organization')
      .populate('assignedProject', 'title status overallProgress timeline')
      .populate('duplicateOf', 'code title status');

    if (!problem) {
      return errorResponse(res, 'Societal challenge not found', null, 404);
    }

    // Check if current user saved this challenge
    const user = await User.findById(req.user.id).select('savedChallenges');
    const isSaved = user?.savedChallenges?.some(
      (savedId) => savedId.toString() === problem._id.toString()
    ) || false;

    return successResponse(res, 'Societal challenge retrieved successfully', {
      problem,
      isSaved
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get challenges saved/bookmarked by the authenticated user
 * GET /api/problems/saved
 */
const getSavedProblems = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'savedChallenges',
      populate: [
        { path: 'submittedBy', select: 'name email organization phone district' },
        { path: 'assignedUniversity', select: 'name email organization' },
        { path: 'assignedProject', select: 'title status overallProgress' }
      ]
    });

    const savedChallenges = (user?.savedChallenges || []).filter(Boolean);

    return successResponse(res, 'Saved challenges retrieved successfully', {
      count: savedChallenges.length,
      problems: savedChallenges
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Toggle save/bookmark challenge for the authenticated user
 * POST /api/problems/:id/save
 */
const toggleSaveProblem = async (req, res, next) => {
  try {
    const challengeId = req.params.id;
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return errorResponse(res, 'Societal challenge not found', null, 404);
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    if (!user.savedChallenges) {
      user.savedChallenges = [];
    }

    const index = user.savedChallenges.findIndex(
      (id) => id.toString() === challengeId.toString()
    );

    let isSaved = false;
    if (index > -1) {
      user.savedChallenges.splice(index, 1);
      isSaved = false;
    } else {
      user.savedChallenges.push(challengeId);
      isSaved = true;
    }

    await user.save();

    return successResponse(
      res,
      isSaved ? 'Challenge saved to bookmarks' : 'Challenge removed from bookmarks',
      {
        saved: isSaved,
        savedCount: user.savedChallenges.length
      }
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProblems,
  getProblemById,
  getSavedProblems,
  toggleSaveProblem
};
