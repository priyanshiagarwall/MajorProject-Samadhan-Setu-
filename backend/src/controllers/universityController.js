const mongoose = require('mongoose');
const University = require('../models/University');
const User = require('../models/User');
const Challenge = require('../models/Challenge');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Faculty = require('../models/Faculty');
const AuditLog = require('../models/AuditLog');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { successResponse, errorResponse } = require('../utils/responseHandler');
const { validateTransition } = require('../utils/validationWorkflow');

const DEFAULT_EXPERTISE_TAGS = [
  'AI/ML',
  'Computer Vision',
  'IoT',
  'Agriculture',
  'Water Management',
  'Healthcare Technology',
  'Education Technology',
  'Renewable Energy',
  'Urban Planning',
  'Environmental Engineering',
  'Accessibility',
  'Public Administration'
];

const CATEGORY_EXPERTISE_MAP = {
  'Sanitation': ['Environmental Engineering', 'IoT', 'Urban Planning'],
  'Water Management': ['Water Management', 'IoT', 'Environmental Engineering'],
  'Environment': ['Environmental Engineering', 'AI/ML', 'Renewable Energy'],
  'Urban Infrastructure': ['Urban Planning', 'Computer Vision', 'IoT'],
  'Accessibility': ['Accessibility', 'IoT', 'AI/ML'],
  'Healthcare': ['Healthcare Technology', 'AI/ML', 'IoT'],
  'Energy': ['Renewable Energy', 'IoT', 'Urban Planning'],
  'Education': ['Education Technology', 'AI/ML'],
  'Agriculture': ['Agriculture', 'IoT', 'Water Management'],
  'Public Services': ['Public Administration', 'AI/ML'],
  'Rural Livelihoods': ['Agriculture', 'Public Administration']
};

/**
 * Helper to get user match identifiers (both string and ObjectId forms)
 */
const getUniversityUserMatches = (userId) => {
  const matches = [userId ? userId.toString() : null];
  if (mongoose.Types.ObjectId.isValid(userId)) {
    matches.push(new mongoose.Types.ObjectId(userId));
  }
  return matches.filter(Boolean);
};

/**
 * Shared filter for challenge eligibility in University Marketplace and Dashboard
 * Strict Option A: Challenge must be VALIDATED, unassigned, and have an AI recommendation
 * for this university that is not IGNORED.
 */
const buildUniversityEligibilityFilter = (userId) => {
  const userMatches = getUniversityUserMatches(userId);
  return {
    status: 'VALIDATED',
    assignedUniversity: null,
    aiRecommendedUniversities: {
      $elemMatch: {
        universityId: { $in: userMatches },
        status: { $ne: 'IGNORED' }
      }
    }
  };
};

const VALID_DELHI_DISTRICTS = [
  'Central Delhi',
  'East Delhi',
  'New Delhi',
  'North Delhi',
  'North East Delhi',
  'North West Delhi',
  'Shahdara',
  'South Delhi',
  'South East Delhi',
  'South West Delhi',
  'West Delhi'
];

/**
 * Get or create profile for authenticated University
 * GET /api/universities/profile
 */
const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    let university = await University.findOne({ user: userId });

    if (!university) {
      // Auto-provision clean initial institutional profile using authentic User record
      const user = await User.findById(userId);
      university = await University.create({
        user: userId,
        name: user?.name || user?.organization || 'Higher Education Partner',
        campus: '',
        district: (user?.district && VALID_DELHI_DISTRICTS.includes(user.district)) ? user.district : 'Central Delhi',
        departments: [],
        researchAreas: [],
        expertise: [],
        labsAndFacilities: [],
        innovationCentre: '',
        incubationFacilities: '',
        facultySpecializations: [],
        studentTeamsCount: 0,
        facultyMentorsCount: 0
      });
    }

    return successResponse(res, 'University profile retrieved successfully', {
      university,
      availableExpertiseTags: DEFAULT_EXPERTISE_TAGS
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated University profile
 * PUT /api/universities/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      name,
      campus,
      district,
      departments,
      researchAreas,
      expertise,
      labsAndFacilities,
      innovationCentre,
      incubationFacilities,
      facultySpecializations
    } = req.body;

    let university = await University.findOne({ user: userId });
    if (!university) {
      const user = await User.findById(userId);
      university = new University({
        user: userId,
        name: user?.name || user?.organization || 'University'
      });
    }

    // Name validation
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return errorResponse(res, 'University name cannot be empty', null, 400);
      }
      if (name.trim().length > 120) {
        return errorResponse(res, 'University name cannot exceed 120 characters', null, 400);
      }
      university.name = name.trim();
    }

    // Campus validation
    if (campus !== undefined) {
      if (typeof campus !== 'string') {
        return errorResponse(res, 'Campus location must be a string', null, 400);
      }
      if (campus.trim().length > 200) {
        return errorResponse(res, 'Campus location cannot exceed 200 characters', null, 400);
      }
      university.campus = campus.trim();
    }

    // District validation against Delhi revenue district schema enum
    if (district !== undefined) {
      if (typeof district !== 'string' || !VALID_DELHI_DISTRICTS.includes(district.trim())) {
        return errorResponse(res, 'Invalid Delhi district specified', null, 400);
      }
      university.district = district.trim();
    }

    // Innovation Centre validation
    if (innovationCentre !== undefined) {
      if (typeof innovationCentre !== 'string') {
        return errorResponse(res, 'Innovation centre must be a string', null, 400);
      }
      if (innovationCentre.trim().length > 200) {
        return errorResponse(res, 'Innovation centre cannot exceed 200 characters', null, 400);
      }
      university.innovationCentre = innovationCentre.trim();
    }

    // Incubation Facilities validation
    if (incubationFacilities !== undefined) {
      if (typeof incubationFacilities !== 'string') {
        return errorResponse(res, 'Incubation facilities must be a string', null, 400);
      }
      if (incubationFacilities.trim().length > 200) {
        return errorResponse(res, 'Incubation facilities cannot exceed 200 characters', null, 400);
      }
      university.incubationFacilities = incubationFacilities.trim();
    }

    // Departments array validation
    if (departments !== undefined) {
      if (!Array.isArray(departments)) {
        return errorResponse(res, 'Departments must be an array', null, 400);
      }
      if (departments.length > 50) {
        return errorResponse(res, 'Cannot exceed 50 departments', null, 400);
      }
      university.departments = departments
        .map((d) => (typeof d === 'string' ? d.trim() : ''))
        .filter(Boolean)
        .map((d) => d.slice(0, 150));
    }

    // Research Areas array validation
    if (researchAreas !== undefined) {
      if (!Array.isArray(researchAreas)) {
        return errorResponse(res, 'Research areas must be an array', null, 400);
      }
      if (researchAreas.length > 50) {
        return errorResponse(res, 'Cannot exceed 50 research areas', null, 400);
      }
      university.researchAreas = researchAreas
        .map((r) => (typeof r === 'string' ? r.trim() : ''))
        .filter(Boolean)
        .map((r) => r.slice(0, 150));
    }

    // Expertise array validation (deduplicated for AI matching)
    if (expertise !== undefined) {
      if (!Array.isArray(expertise)) {
        return errorResponse(res, 'Expertise must be an array', null, 400);
      }
      if (expertise.length > 50) {
        return errorResponse(res, 'Cannot exceed 50 expertise tags', null, 400);
      }
      const cleanedExpertise = [
        ...new Set(
          expertise
            .map((e) => (typeof e === 'string' ? e.trim() : ''))
            .filter(Boolean)
            .map((e) => e.slice(0, 80))
        )
      ];
      university.expertise = cleanedExpertise;
    }

    // Labs & Facilities array validation
    if (labsAndFacilities !== undefined) {
      if (!Array.isArray(labsAndFacilities)) {
        return errorResponse(res, 'Labs and facilities must be an array', null, 400);
      }
      if (labsAndFacilities.length > 50) {
        return errorResponse(res, 'Cannot exceed 50 lab facilities', null, 400);
      }
      university.labsAndFacilities = labsAndFacilities
        .map((l) => (typeof l === 'string' ? l.trim() : ''))
        .filter(Boolean)
        .map((l) => l.slice(0, 150));
    }

    // Faculty Specializations array validation
    if (facultySpecializations !== undefined) {
      if (!Array.isArray(facultySpecializations)) {
        return errorResponse(res, 'Faculty specializations must be an array', null, 400);
      }
      if (facultySpecializations.length > 50) {
        return errorResponse(res, 'Cannot exceed 50 faculty specializations', null, 400);
      }
      const validFac = [];
      for (const f of facultySpecializations) {
        if (typeof f === 'object' && f !== null) {
          const fName = (f.facultyName || '').toString().trim().slice(0, 100);
          const fDept = (f.department || '').toString().trim().slice(0, 100);
          const fSpec = (f.specialization || '').toString().trim().slice(0, 150);
          const fEmail = (f.email || '').toString().trim().toLowerCase().slice(0, 100);
          if (fName && fDept && fSpec) {
            validFac.push({
              facultyName: fName,
              department: fDept,
              specialization: fSpec,
              email: fEmail
            });
          }
        }
      }
      university.facultySpecializations = validFac;
    }

    await university.save();

    // Synchronize User name and organization if name changed
    if (name !== undefined) {
      await User.findByIdAndUpdate(userId, {
        name: university.name,
        organization: university.name
      });
    }

    return successResponse(res, 'University profile updated successfully', {
      university
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Marketplace & Assigned Challenges for University
 * GET /api/universities/challenges
 */
const getChallenges = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const university = await University.findOne({ user: userId });
    const uniExpertise = university?.expertise || [];

    const ACTIVE_PROJECT_STAGES = [
      'CHALLENGE_ACCEPTED',
      'PROJECT_CREATED',
      'PROPOSAL_SUBMITTED',
      'APPROVED',
      'RESEARCH',
      'PROTOTYPE',
      'TESTING',
      'PILOT',
      'VALIDATION',
      'DEPLOYMENT'
    ];

    const eligibleFilter = buildUniversityEligibilityFilter(userId);

    // Execute queries in parallel: available challenges (strictly filtered), assigned challenges, and real scoped counts
    const [
      availableRaw,
      assignedChallenges,
      activeProjects,
      completedProjects,
      studentTeams,
      facultyMentors
    ] = await Promise.all([
      Challenge.find(eligibleFilter)
        .populate('submittedBy', 'name organization district')
        .sort({ createdAt: -1 }),

      Challenge.find({
        assignedUniversity: userId,
        status: { $in: ['ASSIGNED', 'IN_PROGRESS', 'SOLUTION_PROPOSED', 'PILOT_TESTING', 'RESOLVED'] }
      })
        .populate('submittedBy', 'name organization district')
        .populate('industryPartner', 'name organization email')
        .sort({ updatedAt: -1 }),

      Project.countDocuments({
        universityId: userId,
        status: { $in: ACTIVE_PROJECT_STAGES }
      }),

      Project.countDocuments({
        universityId: userId,
        status: 'COMPLETED'
      }),

      Team.countDocuments({
        university: userId
      }),

      Faculty.countDocuments({
        university: userId,
        isActive: true
      })
    ]);

    // Enrich available challenges with AI recommended expertise tags
    const availableChallenges = availableRaw.map((c) => {
      const obj = c.toObject();
      if (!obj.aiRecommendedExpertise || obj.aiRecommendedExpertise.length === 0) {
        obj.aiRecommendedExpertise = CATEGORY_EXPERTISE_MAP[c.category] || ['Urban Planning', 'Public Administration'];
      }
      // Calculate relevance flag based on university expertise overlap
      obj.isRelevant = obj.aiRecommendedExpertise.some((tag) => uniExpertise.includes(tag));
      return obj;
    });

    const stats = {
      availableChallenges: availableChallenges.length,
      assignedChallenges: assignedChallenges.length,
      activeProjects,
      completedProjects,
      studentTeams,
      facultyMentors
    };

    return successResponse(res, 'University challenges & marketplace retrieved successfully', {
      stats,
      availableChallenges,
      assignedChallenges,
      universityExpertise: uniExpertise
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Express interest in a challenge
 * POST /api/universities/challenges/:id/interest
 */
const expressInterest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes = 'University research lab is evaluating technical feasibility for this statement.' } = req.body;
    const userId = req.user.id;
    const userMatches = getUniversityUserMatches(userId);

    const university = await University.findOne({ user: userId });
    const uniName = university?.name || req.user.name || 'University Research Lab';

    const eligibleFilter = buildUniversityEligibilityFilter(userId);

    // Atomic findOneAndUpdate: only succeeds if eligible and university hasn't already expressed interest
    const updatedChallenge = await Challenge.findOneAndUpdate(
      {
        _id: id,
        ...eligibleFilter,
        'interestedUniversities.university': { $nin: userMatches }
      },
      {
        $push: {
          interestedUniversities: {
            university: userId,
            universityName: uniName,
            expressedAt: new Date(),
            notes: (notes || '').trim()
          }
        }
      },
      {
        new: true,
        runValidators: true
      }
    );

    if (updatedChallenge) {
      // Update university's interestedChallenges if not already present
      if (university) {
        const uAlready = university.interestedChallenges?.some(
          (ic) => ic.challenge?.toString() === id.toString()
        );
        if (!uAlready) {
          university.interestedChallenges.push({
            challenge: id,
            expressedAt: new Date(),
            notes: (notes || '').trim()
          });
          await university.save();
        }
      }

      // Dispatch Notification to Citizen Submitter (non-blocking)
      try {
        if (updatedChallenge.submittedBy) {
          await dispatchNotification({
            recipient: updatedChallenge.submittedBy,
            sender: req.user.id,
            senderName: uniName,
            title: 'University Expressed Interest',
            message: `${uniName} has expressed research interest in your challenge [${updatedChallenge.code}] "${updatedChallenge.title}".`,
            type: 'UNIVERSITY_INTEREST',
            relatedEntity: 'Challenge',
            relatedEntityId: id
          });
        }
      } catch (notifErr) {
        console.warn('[Notification Warning] Failed to dispatch interest notification:', notifErr.message);
      }

      return successResponse(res, `Expression of interest registered for ${uniName}`, {
        challenge: updatedChallenge,
        alreadyExpressed: false
      });
    }

    // Atomic update did not match. Re-read to provide precise diagnostic response.
    const existing = await Challenge.findById(id);
    if (!existing) {
      return errorResponse(res, 'Challenge not found', null, 404);
    }

    // 1. Check if already expressed interest
    const already = existing.interestedUniversities?.some(
      (u) => userMatches.some((m) => m.toString() === u.university?.toString())
    );
    if (already) {
      return successResponse(res, `Interest already registered by ${uniName}`, {
        challenge: existing,
        alreadyExpressed: true
      });
    }

    // 2. Check assignment & status
    if (existing.assignedUniversity) {
      return errorResponse(res, 'Challenge is already assigned to another accredited university lab', null, 409);
    }

    if (existing.status !== 'VALIDATED') {
      return errorResponse(
        res,
        `Challenge cannot receive interest because it is in '${existing.status}' status (must be VALIDATED)`,
        null,
        400
      );
    }

    // 3. Check AI recommendation eligibility
    const rec = existing.aiRecommendedUniversities?.find(
      (r) => userMatches.some((m) => m.toString() === r.universityId?.toString())
    );
    if (!rec) {
      return errorResponse(
        res,
        'Your university is not among the AI-matched institutions for this challenge',
        null,
        403
      );
    }

    if (rec.status === 'IGNORED') {
      return errorResponse(
        res,
        'Your university has previously declined this challenge',
        null,
        403
      );
    }

    return errorResponse(res, 'Challenge is not eligible for expression of interest', null, 400);
  } catch (error) {
    next(error);
  }
};

/**
 * Accept Challenge for Institutional Adoption
 * POST /api/universities/challenges/:id/accept
 */
const acceptChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { facultyLeadName, facultyLeadDepartment, comment } = req.body;
    const userId = req.user.id;
    const userMatches = getUniversityUserMatches(userId);

    const university = await University.findOne({ user: userId });
    const uniName = university?.name || req.user.name || 'Accredited Higher Education Institution';

    const eligibleFilter = buildUniversityEligibilityFilter(userId);

    const adoptionComment = comment || `Formally accepted and adopted for research prototyping by ${uniName}`;

    const updateFields = {
      status: 'ASSIGNED',
      assignedUniversity: userId,
      'aiRecommendedUniversities.$[elem].status': 'ACCEPTED'
    };

    if (facultyLeadName) {
      updateFields.facultyLead = {
        name: facultyLeadName.trim(),
        department: (facultyLeadDepartment || 'Engineering & Applied Research').trim()
      };
    }

    // Atomic findOneAndUpdate with arrayFilters targeting ONLY this university's recommendation
    const updatedChallenge = await Challenge.findOneAndUpdate(
      {
        _id: id,
        ...eligibleFilter
      },
      {
        $set: updateFields,
        $push: {
          timeline: {
            status: 'ASSIGNED',
            label: `Adopted by ${uniName}`,
            comment: adoptionComment,
            date: new Date()
          }
        }
      },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ 'elem.universityId': { $in: userMatches } }]
      }
    );

    if (updatedChallenge) {
      // 1. Create Audit Record
      await AuditLog.create({
        challenge: id,
        user: userId,
        userName: uniName,
        userRole: 'UNIVERSITY',
        action: 'ASSIGN_UNIVERSITY',
        previousStatus: 'VALIDATED',
        newStatus: 'ASSIGNED',
        comment: adoptionComment,
        metadata: {
          universityId: userId,
          universityName: uniName,
          facultyLead: updatedChallenge.facultyLead
        }
      });

      // 2. Dispatch Citizen Notification (non-blocking)
      try {
        if (updatedChallenge.submittedBy) {
          await dispatchNotification({
            recipient: updatedChallenge.submittedBy,
            sender: req.user.id,
            senderName: uniName,
            title: 'Challenge Adopted by University Research Lab',
            message: `Your challenge [${updatedChallenge.code}] has been adopted by ${uniName} for solution engineering and student cohort prototyping.`,
            type: 'ASSIGNED',
            relatedEntity: 'Challenge',
            relatedEntityId: id
          });
        }
      } catch (notifErr) {
        console.warn('[Notification Warning] Failed to dispatch challenge adoption notification:', notifErr.message);
      }

      const populated = await Challenge.findById(id)
        .populate('submittedBy', 'name organization district')
        .populate('assignedUniversity', 'name email organization');

      return successResponse(res, `Challenge successfully adopted by ${uniName}`, {
        challenge: populated
      });
    }

    // Atomic update failed (already assigned, not eligible, or not found). Re-read to diagnose.
    const existing = await Challenge.findById(id);
    if (!existing) {
      return errorResponse(res, 'Challenge not found', null, 404);
    }

    if (existing.assignedUniversity) {
      if (userMatches.some((m) => m.toString() === existing.assignedUniversity.toString())) {
        return errorResponse(res, 'Challenge is already adopted by your university', null, 400);
      }
      return errorResponse(
        res,
        'Challenge is already assigned to another accredited university lab',
        null,
        409
      );
    }

    if (existing.status !== 'VALIDATED') {
      try {
        validateTransition(existing.status, 'ASSIGNED');
      } catch (transErr) {
        return errorResponse(res, transErr.message, null, 400);
      }
      return errorResponse(
        res,
        `Challenge cannot be adopted because it is in '${existing.status}' status (must be VALIDATED)`,
        null,
        400
      );
    }

    const rec = existing.aiRecommendedUniversities?.find(
      (r) => userMatches.some((m) => m.toString() === r.universityId?.toString())
    );
    if (!rec) {
      return errorResponse(
        res,
        'Your university is not among the AI-matched institutions for this challenge',
        null,
        403
      );
    }

    if (rec.status === 'IGNORED') {
      return errorResponse(
        res,
        'Your university has previously declined this challenge and cannot adopt it',
        null,
        403
      );
    }

    return errorResponse(res, 'Challenge cannot be adopted at this time', null, 400);
  } catch (error) {
    next(error);
  }
};

/**
 * Decline Challenge Recommendation for Authenticated University
 * POST /api/universities/challenges/:id/decline
 */
const declineChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userMatches = getUniversityUserMatches(userId);

    // Atomic update: only update this university's recommendation from PENDING to IGNORED
    // Only applies if challenge is VALIDATED, unassigned, and this university was recommended and not already ACCEPTED
    const updatedChallenge = await Challenge.findOneAndUpdate(
      {
        _id: id,
        status: 'VALIDATED',
        assignedUniversity: null,
        aiRecommendedUniversities: {
          $elemMatch: {
            universityId: { $in: userMatches },
            status: { $nin: ['ACCEPTED', 'IGNORED'] }
          }
        }
      },
      {
        $set: {
          'aiRecommendedUniversities.$[elem].status': 'IGNORED'
        }
      },
      {
        new: true,
        runValidators: true,
        arrayFilters: [{ 'elem.universityId': { $in: userMatches } }]
      }
    );

    if (updatedChallenge) {
      return successResponse(res, 'Challenge recommendation declined successfully', {
        challengeId: id
      });
    }

    // Atomic update didn't match. Re-read for exact diagnosis.
    const existing = await Challenge.findById(id);
    if (!existing) {
      return errorResponse(res, 'Challenge not found', null, 404);
    }

    if (existing.assignedUniversity) {
      return errorResponse(
        res,
        'Challenge is already assigned to an accredited university lab',
        null,
        409
      );
    }

    if (existing.status !== 'VALIDATED') {
      return errorResponse(
        res,
        `Challenge cannot be declined because it is in '${existing.status}' status (must be VALIDATED)`,
        null,
        400
      );
    }

    const rec = existing.aiRecommendedUniversities?.find(
      (r) => userMatches.some((m) => m.toString() === r.universityId?.toString())
    );
    if (!rec) {
      return errorResponse(
        res,
        'Your university is not among the AI-matched institutions for this challenge',
        null,
        403
      );
    }

    if (rec.status === 'ACCEPTED') {
      return errorResponse(
        res,
        'Cannot decline a challenge that your institution has already accepted',
        null,
        400
      );
    }

    if (rec.status === 'IGNORED') {
      return successResponse(res, 'Challenge has already been declined by your institution', {
        challengeId: id,
        alreadyDeclined: true
      });
    }

    return errorResponse(res, 'Unable to decline challenge at this time', null, 400);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getChallenges,
  expressInterest,
  acceptChallenge,
  declineChallenge,
  buildUniversityEligibilityFilter,
  getUniversityUserMatches
};

