const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Student = require('../models/Student');
const StudentInterest = require('../models/StudentInterest');
const Project = require('../models/Project');
const Team = require('../models/Team');
const mongoose = require('mongoose');
const aiService = require('../services/aiService');
const { dispatchNotification } = require('../services/notificationDispatcher');
const AuditLog = require('../models/AuditLog');
const { validateTransition } = require('../utils/validationWorkflow');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Create a new civic challenge
 * POST /api/challenges
 */
const createChallenge = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      district,
      location,
      priority,
      attachments,
      tags
    } = req.body;

    if (!title || !description || !category || !district) {
      return errorResponse(res, 'Please provide title, description, category, and district', null, 400);
    }

    // Duplicate submission prevention (5-minute window for identical title by same citizen)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentDuplicate = await Challenge.findOne({
      submittedBy: req.user.id,
      title: title.trim(),
      createdAt: { $gte: fiveMinutesAgo }
    });
    if (recentDuplicate) {
      return errorResponse(
        res,
        'Duplicate challenge submission detected. A challenge with this title was recently submitted.',
        null,
        429
      );
    }

    const challenge = await Challenge.create({
      title,
      description,
      category,
      district,
      location: location || {
        area: '',
        landmark: '',
        coordinates: { lat: 28.6139, lng: 77.2090 }
      },
      priority: priority || 'medium',
      submittedBy: req.user.id,
      attachments: attachments || [],
      tags: tags || [],
      milestones: [
        { title: 'Community Problem Verification', completed: false },
        { title: 'University Research & Team Assignment', completed: false },
        { title: 'Functional Prototype Development', completed: false },
        { title: 'Pilot Field Testing in Delhi Ward', completed: false }
      ]
    });

    // Phase 3: AI Problem Intelligence Analysis (non-blocking, bounded timeout, safe update)
    try {
      const existingChallenges = await Challenge.find({ _id: { $ne: challenge._id } })
        .select('_id code title description')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const aiUpdates = await aiService.analyzeChallengeForCreation(
        {
          title: challenge.title,
          description: challenge.description,
          urgency: challenge.urgency,
          severity: challenge.severity,
          impact: challenge.impact,
          location: challenge.location,
          district: challenge.district
        },
        existingChallenges
      );

      if (aiUpdates && Object.keys(aiUpdates).length > 0) {
        await Challenge.findByIdAndUpdate(challenge._id, { $set: aiUpdates });
      }
    } catch (aiErr) {
      console.warn('[AI Service Notice] AI processing skipped during challenge creation:', aiErr.message);
    }

    const populated = await Challenge.findById(challenge._id)
      .select('-aiDuplicates')
      .populate('submittedBy', 'name email organization role');

    // Notify administrators of new societal challenge
    try {
      const admins = await User.find({ role: 'ADMIN' });
      for (const admin of admins) {
        await dispatchNotification({
          recipient: admin._id,
          sender: req.user.id,
          senderName: req.user.name,
          type: 'CHALLENGE_SUBMITTED',
          title: 'New Societal Challenge Submitted',
          message: `Citizen [${req.user.name}] submitted challenge [${challenge.code || 'DEL'}] "${challenge.title}" in ${challenge.district}.`,
          relatedEntity: 'Challenge',
          relatedEntityId: challenge._id
        });
      }
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return successResponse(res, 'Challenge submitted successfully for government verification', { challenge: populated }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all challenges with filtering
 * GET /api/challenges
 */
const getChallenges = async (req, res, next) => {
  try {
    const { category, district, status, priority, submittedBy, assignedUniversity } = req.query;

    const query = {};
    if (category) query.category = category;
    if (district) query.district = district;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (submittedBy) query.submittedBy = submittedBy;
    if (assignedUniversity) query.assignedUniversity = assignedUniversity;

    const challenges = await Challenge.find(query)
      .select('-aiDuplicates')
      .populate('submittedBy', 'name district organization')
      .populate('assignedUniversity', 'name email organization')
      .populate('assignedStudents', 'name email organization')
      .populate('industryPartner', 'name email organization')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Challenges retrieved successfully', {
      count: challenges.length,
      challenges
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get challenge by ID
 * GET /api/challenges/:id
 */
const getChallengeById = async (req, res, next) => {
  try {
    const challenge = await Challenge.findById(req.params.id)
      .select('-aiDuplicates')
      .populate('submittedBy', 'name district organization')
      .populate('assignedUniversity', 'name email organization')
      .populate('assignedStudents', 'name email organization')
      .populate('industryPartner', 'name email organization');

    if (!challenge) {
      return errorResponse(res, 'Challenge not found', null, 404);
    }

    const relatedProjects = await Project.find({ challengeId: req.params.id })
      .select('title status overallProgress mentor universityId timeline budget')
      .populate('universityId', 'name organization district')
      .populate('mentor', 'name department email');

    const challengeObj = challenge.toObject();
    challengeObj.relatedProjects = relatedProjects;

    return successResponse(res, 'Challenge retrieved successfully', { challenge: challengeObj });
  } catch (error) {
    next(error);
  }
};

/**
 * Update challenge status & university allocation (Admin only)
 * PATCH /api/challenges/:id/status
 */
const updateStatus = async (req, res, next) => {
  try {
    const { status, assignedUniversity, priority } = req.body;

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return errorResponse(res, 'Challenge not found', null, 404);
    }

    if (status) challenge.status = status;
    if (assignedUniversity) challenge.assignedUniversity = assignedUniversity;
    if (priority) challenge.priority = priority;

    // Auto update milestones based on status
    if (status === 'verified' && challenge.milestones.length > 0) {
      challenge.milestones[0].completed = true;
    }
    if (status === 'assigned' && challenge.milestones.length > 1) {
      challenge.milestones[0].completed = true;
      challenge.milestones[1].completed = true;
    }

    await challenge.save();

    const updated = await Challenge.findById(challenge._id)
      .populate('submittedBy', 'name email organization')
      .populate('assignedUniversity', 'name email organization');

    return successResponse(res, 'Challenge status updated successfully', { challenge: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign cohort and faculty lead (University only)
 * POST /api/challenges/:id/assign-cohort
 */
const assignCohort = async (req, res, next) => {
  try {
    const { facultyLead, studentIds, solutionNotes } = req.body;

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return errorResponse(res, 'Challenge not found', null, 404);
    }

    // University ownership check applies strictly to UNIVERSITY role
    if ((req.user?.role || '').toUpperCase() === 'UNIVERSITY' && challenge.assignedUniversity?.toString() !== req.user.id.toString()) {
      return errorResponse(res, 'Unauthorized: This challenge is not assigned to your university', null, 403);
    }

    const previousStatus = challenge.status;
    try {
      validateTransition(previousStatus, 'IN_PROGRESS');
    } catch (transErr) {
      return errorResponse(res, transErr.message, null, 400);
    }

    if (facultyLead) challenge.facultyLead = facultyLead;
    if (studentIds && Array.isArray(studentIds)) {
      challenge.assignedStudents = studentIds;
    }
    if (solutionNotes) challenge.solutionNotes = solutionNotes;
    challenge.status = 'IN_PROGRESS';

    if (challenge.milestones.length > 1) {
      challenge.milestones[0].completed = true;
      challenge.milestones[1].completed = true;
    }

    challenge.timeline.push({
      status: 'IN_PROGRESS',
      label: 'Cohort Assigned & Prototyping Active',
      comment: solutionNotes || 'Student cohort and faculty lead designated by university research lab.',
      date: new Date()
    });

    await challenge.save();

    await AuditLog.create({
      challenge: challenge._id,
      user: req.user.id,
      userName: req.user.name || 'Authorized Lead',
      userRole: req.user.role || 'UNIVERSITY',
      action: 'ASSIGN_COHORT',
      previousStatus,
      newStatus: 'IN_PROGRESS',
      comment: solutionNotes || 'Student cohort and faculty lead designated.'
    });

    const updated = await Challenge.findById(challenge._id)
      .populate('submittedBy', 'name email organization')
      .populate('assignedUniversity', 'name email organization')
      .populate('assignedStudents', 'name email organization');

    return successResponse(res, 'Cohort assigned and project set to in-progress', { challenge: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Sponsor challenge (Industry only)
 * POST /api/challenges/:id/sponsor
 */
const sponsorChallenge = async (req, res, next) => {
  try {
    const { sponsoredAmount } = req.body;

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return errorResponse(res, 'Challenge not found', null, 404);
    }

    challenge.industryPartner = req.user.id;
    if (sponsoredAmount) {
      challenge.sponsoredAmount = Number(sponsoredAmount);
    }

    await challenge.save();

    const updated = await Challenge.findById(challenge._id)
      .populate('submittedBy', 'name email organization')
      .populate('assignedUniversity', 'name email organization')
      .populate('industryPartner', 'name email organization');

    return successResponse(res, 'Sponsorship pledged successfully', { challenge: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * Get aggregated statistics for state portal
 * GET /api/challenges/stats
 */
const getStats = async (req, res, next) => {
  try {
    const total = await Challenge.countDocuments();
    const verified = await Challenge.countDocuments({ status: { $in: ['verified', 'assigned', 'in_progress', 'under_review', 'resolved'] } });
    const inProgress = await Challenge.countDocuments({ status: 'in_progress' });
    const resolved = await Challenge.countDocuments({ status: 'resolved' });

    const byDistrict = await Challenge.aggregate([
      { $group: { _id: '$district', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const byCategory = await Challenge.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    return successResponse(res, 'Statistics retrieved successfully', {
      total,
      verified,
      inProgress,
      resolved,
      byDistrict,
      byCategory
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's challenges with tabs (Assigned, Available, In Progress, Completed)
 * GET /api/challenges/student/my-challenges
 */
const getStudentChallenges = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can access their challenges', null, 403);
    }

    const {
      tab = 'available',
      category,
      district,
      priority,
      status,
      university,
      requiredSkills,
      search
    } = req.query;

    // Resolve student profile (auto-link by email if not found by user id)
    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      student = await Student.findOne({ email: req.user.email.toLowerCase() });
      if (student) {
        student.user = req.user.id;
        await student.save();
      }
    }

    // Identify all challenges linked to this student
    const myAssignedChallengeIds = new Set();

    // 1. Directly assigned on Challenge
    const directChallenges = await Challenge.find({
      $or: [
        { assignedStudents: req.user.id },
        ...(student ? [{ assignedStudents: student._id }] : [])
      ]
    }).select('_id');
    directChallenges.forEach((c) => myAssignedChallengeIds.add(c._id.toString()));

    // 2. Through multidisciplinary team's projects
    const myTeams = await Team.find({
      $or: [
        { 'members.student': req.user.id },
        ...(student ? [{ 'members.student': student._id }] : []),
        ...(student?.assignedTeam ? [{ _id: student.assignedTeam }] : [])
      ]
    }).select('_id project');

    const teamProjectIds = myTeams.map((t) => t.project).filter(Boolean);
    const myProjects = await Project.find({
      $or: [
        { team: { $in: myTeams.map((t) => t._id) } },
        { _id: { $in: teamProjectIds } }
      ]
    }).select('challengeId');

    myProjects.forEach((p) => {
      const cId = p.challengeId?._id || p.challengeId;
      if (cId) myAssignedChallengeIds.add(cId.toString());
    });

    // 3. Through accepted student interest applications
    const acceptedInterests = await StudentInterest.find({
      student: req.user.id,
      status: 'ACCEPTED'
    }).select('challenge');
    acceptedInterests.forEach((i) => {
      if (i.challenge) myAssignedChallengeIds.add(i.challenge.toString());
    });

    const assignedIdsArray = Array.from(myAssignedChallengeIds).map((id) => new mongoose.Types.ObjectId(id));

    let query = {};

    switch (tab) {
      case 'assigned':
        query = { _id: { $in: assignedIdsArray } };
        break;
      case 'in_progress':
        query = {
          _id: { $in: assignedIdsArray },
          status: { $in: ['IN_PROGRESS', 'SOLUTION_PROPOSED', 'PILOT_TESTING', 'ASSIGNED'] }
        };
        break;
      case 'completed':
        query = {
          _id: { $in: assignedIdsArray },
          status: 'RESOLVED'
        };
        break;
      case 'available':
      default:
        query = {
          status: 'VALIDATED',
          ...(assignedIdsArray.length > 0 ? { _id: { $nin: assignedIdsArray } } : {})
        };
        break;
    }

    // Apply filters
    if (category) query.category = category;
    if (district) query.district = district;
    if (priority) query.priority = priority.toLowerCase();
    if (status) query.status = status.toUpperCase();

    // Filter by University
    if (university) {
      if (mongoose.Types.ObjectId.isValid(university)) {
        query.assignedUniversity = university;
      } else {
        const uniUsers = await User.find({
          role: 'UNIVERSITY',
          $or: [
            { name: { $regex: university.trim(), $options: 'i' } },
            { organization: { $regex: university.trim(), $options: 'i' } }
          ]
        }).select('_id');
        query.assignedUniversity = { $in: uniUsers.map((u) => u._id) };
      }
    }

    // Filter by Required Skills (tags or aiRecommendedExpertise)
    if (requiredSkills) {
      const skillRegex = { $regex: requiredSkills.trim(), $options: 'i' };
      const skillCond = [
        { tags: skillRegex },
        { aiRecommendedExpertise: skillRegex }
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: skillCond }];
        delete query.$or;
      } else {
        query.$or = skillCond;
      }
    }

    // Search query across title, description, code, category, and tags
    if (search) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const searchCond = [
        { title: searchRegex },
        { description: searchRegex },
        { code: searchRegex },
        { category: searchRegex },
        { tags: searchRegex }
      ];
      if (query.$and) {
        query.$and.push({ $or: searchCond });
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchCond }];
        delete query.$or;
      } else {
        query.$or = searchCond;
      }
    }

    const challenges = await Challenge.find(query)
      .populate('submittedBy', 'name district organization')
      .populate('assignedUniversity', 'name email organization')
      .populate('assignedStudents', 'name email organization')
      .populate('industryPartner', 'name email organization')
      .sort({ createdAt: -1 });

    // Fetch student's interests for all fetched challenges
    const challengeIds = challenges.map((c) => c._id);
    const interests = await StudentInterest.find({
      student: req.user.id,
      challenge: { $in: challengeIds }
    });

    const interestMap = {};
    interests.forEach((item) => {
      interestMap[item.challenge.toString()] = {
        status: item.status,
        notes: item.notes,
        createdAt: item.createdAt
      };
    });

    const challengesWithInterest = challenges.map((challenge) => {
      const interestInfo = interestMap[challenge._id.toString()];
      return {
        ...challenge.toObject(),
        hasExpressedInterest: !!interestInfo,
        interestStatus: interestInfo ? interestInfo.status : null,
        interestNotes: interestInfo ? interestInfo.notes : null,
        interestSubmittedAt: interestInfo ? interestInfo.createdAt : null
      };
    });

    return successResponse(res, 'Student challenges retrieved successfully', {
      tab,
      count: challengesWithInterest.length,
      challenges: challengesWithInterest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Express interest in a challenge
 * POST /api/challenges/:id/express-interest
 */
const expressInterest = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can express interest in challenges', null, 403);
    }

    const { notes } = req.body;

    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      return errorResponse(res, 'Challenge not found', null, 404);
    }

    // Check if challenge is eligible for student innovation interest
    if (!['VALIDATED', 'ASSIGNED'].includes(challenge.status)) {
      return errorResponse(
        res,
        'This challenge is not currently accepting interest expressions',
        null,
        400
      );
    }

    // Check if student is already assigned
    const student = await Student.findOne({ user: req.user.id });
    if (
      challenge.assignedStudents &&
      (challenge.assignedStudents.includes(req.user.id) ||
        (student && challenge.assignedStudents.includes(student._id)))
    ) {
      return errorResponse(res, 'You are already assigned to this challenge', null, 400);
    }

    // Check for duplicate interest submission
    const existingInterest = await StudentInterest.findOne({
      student: req.user.id,
      challenge: req.params.id
    });

    if (existingInterest) {
      return errorResponse(
        res,
        'You have already expressed interest in this challenge',
        null,
        409
      );
    }

    // Create interest record with PENDING status (do not fake acceptance)
    const interest = await StudentInterest.create({
      student: req.user.id,
      challenge: req.params.id,
      status: 'PENDING',
      notes: notes ? notes.trim() : ''
    });

    // Notify assigned university if exists
    if (challenge.assignedUniversity) {
      try {
        await dispatchNotification({
          recipient: challenge.assignedUniversity,
          sender: req.user.id,
          senderName: req.user.name,
          type: 'INTEREST_EXPRESSED',
          title: 'New Student Interest Expressed',
          message: `Student [${req.user.name}] expressed interest in challenge [${challenge.code}] "${challenge.title}".`,
          relatedEntity: 'Challenge',
          relatedEntityId: challenge._id
        });
      } catch (notifErr) {
        // Notification failure should not abort interest creation
      }
    } else {
      // Notify portal administrators
      try {
        const admins = await User.find({ role: 'ADMIN', isActive: true }).select('_id');
        for (const admin of admins) {
          await dispatchNotification({
            recipient: admin._id,
            sender: req.user.id,
            senderName: req.user.name,
            type: 'INTEREST_EXPRESSED',
            title: 'New Student Interest Expressed',
            message: `Student [${req.user.name}] expressed interest in challenge [${challenge.code}] "${challenge.title}".`,
            relatedEntity: 'Challenge',
            relatedEntityId: challenge._id
          });
        }
      } catch (adminNotifErr) {}
    }

    return successResponse(
      res,
      'Interest expressed successfully. Your application has been submitted for review.',
      { interest },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get student's interest status for a challenge
 * GET /api/challenges/:id/interest-status
 */
const getInterestStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can check their interest status', null, 403);
    }

    const interest = await StudentInterest.findOne({
      student: req.user.id,
      challenge: req.params.id
    });

    if (!interest) {
      return successResponse(res, 'No interest found', { hasExpressedInterest: false });
    }

    return successResponse(res, 'Interest status retrieved', {
      hasExpressedInterest: true,
      status: interest.status,
      notes: interest.notes,
      reviewNotes: interest.reviewNotes,
      createdAt: interest.createdAt
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createChallenge,
  getChallenges,
  getChallengeById,
  updateStatus,
  assignCohort,
  sponsorChallenge,
  getStats,
  getStudentChallenges,
  expressInterest,
  getInterestStatus
};
