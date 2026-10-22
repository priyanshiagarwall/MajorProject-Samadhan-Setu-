const Project = require('../models/Project');
const Challenge = require('../models/Challenge');
const Faculty = require('../models/Faculty');
const Student = require('../models/Student');
const Team = require('../models/Team');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Industry = require('../models/Industry');
const Partnership = require('../models/Partnership');
const aiService = require('../services/aiService');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { sendRealtimeProjectMessage, sendRealtimeProjectUpdate } = require('../services/socketService');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Valid stage transition mapping for the 11-stage project lifecycle
 */
const VALID_TRANSITIONS = {
  CHALLENGE_ACCEPTED: ['PROJECT_CREATED'],
  PROJECT_CREATED: ['PROPOSAL_SUBMITTED'],
  PROPOSAL_SUBMITTED: ['APPROVED', 'PROJECT_CREATED'],
  APPROVED: ['RESEARCH', 'PROTOTYPE'],
  RESEARCH: ['PROTOTYPE'],
  PROTOTYPE: ['TESTING', 'RESEARCH'],
  TESTING: ['PILOT', 'PROTOTYPE'],
  PILOT: ['VALIDATION', 'TESTING'],
  VALIDATION: ['DEPLOYMENT', 'PILOT'],
  DEPLOYMENT: ['COMPLETED', 'VALIDATION'],
  COMPLETED: []
};

/**
 * Stage weight fallbacks if milestones are not yet populated
 */
const STAGE_PROGRESS_MAP = {
  CHALLENGE_ACCEPTED: 5,
  PROJECT_CREATED: 10,
  PROPOSAL_SUBMITTED: 20,
  APPROVED: 25,
  RESEARCH: 35,
  PROTOTYPE: 50,
  TESTING: 65,
  PILOT: 80,
  VALIDATION: 90,
  DEPLOYMENT: 95,
  COMPLETED: 100
};

/**
 * Calculate overall project progress from milestone completion
 */
const recalculateProjectProgress = (project) => {
  if (project.status === 'COMPLETED') return 100;

  if (!project.milestones || project.milestones.length === 0) {
    return STAGE_PROGRESS_MAP[project.status] || 0;
  }

  const total = project.milestones.reduce((acc, m) => {
    if (m.status === 'COMPLETED') return acc + 100;
    if (m.status === 'NOT_STARTED') return acc + 0;
    return acc + (Number(m.progress) || 0);
  }, 0);

  return Math.min(100, Math.round(total / project.milestones.length));
};

/**
 * Access Control Helper: Validates whether user is authorized to inspect or modify a project
 */
const checkProjectAccess = async (project, user, allowedRoles = []) => {
  if (!project || !user) return false;
  if (user.role === 'ADMIN') return true;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) return false;

  const userId = user.id || user._id;

  if (user.role === 'UNIVERSITY') {
    const pUniId = project.universityId?._id || project.universityId;
    return pUniId && pUniId.toString() === userId.toString();
  }

  if (user.role === 'FACULTY') {
    const faculty = await Faculty.findOne({ user: userId });
    if (!faculty || !project.mentor) return false;
    const pMentorId = project.mentor?._id || project.mentor;
    return pMentorId && pMentorId.toString() === faculty._id.toString();
  }

  if (user.role === 'STUDENT') {
    let student = await Student.findOne({ user: userId });
    if (!student) {
      student = await Student.findOne({ email: user.email?.toLowerCase() });
    }
    const studentIdStr = student ? student._id.toString() : null;
    const userIdStr = userId.toString();

    // 1. Check direct project team
    let team = null;
    if (project.team) {
      team = project.team._id ? project.team : await Team.findById(project.team);
    }
    if (!team) {
      team = await Team.findOne({ project: project._id });
    }

    if (team && Array.isArray(team.members)) {
      const isMember = team.members.some((m) => {
        const mStudentId = (m.student?._id || m.student)?.toString();
        return mStudentId === studentIdStr || mStudentId === userIdStr;
      });
      if (isMember) return true;
    }

    // 2. Check milestone assigned members
    if (project.milestones && Array.isArray(project.milestones)) {
      const isMilestoneAssigned = project.milestones.some((m) =>
        (m.assignedMembers || []).some((am) => {
          const amId = (am._id || am).toString();
          return amId === userIdStr || (studentIdStr && amId === studentIdStr);
        })
      );
      if (isMilestoneAssigned) return true;
    }

    return false;
  }

  if (user.role === 'INDUSTRY') {
    return (project.industryPartners || []).some(
      (p) => (p._id || p).toString() === userId.toString()
    );
  }

  if (user.role === 'CLIENT') {
    // Client can inspect public verified projects or projects originating from challenges they filed
    const challenge = await Challenge.findById(project.challengeId);
    if (challenge && challenge.submittedBy?.toString() === userId.toString()) {
      return true;
    }
    return ['APPROVED', 'RESEARCH', 'PROTOTYPE', 'TESTING', 'PILOT', 'VALIDATION', 'DEPLOYMENT', 'COMPLETED'].includes(
      project.status
    );
  }

  return false;
};

/**
 * Retrieve user IDs of all students associated with a project (team members, leader, milestone assignees)
 */
const getProjectStudentUserIds = async (project) => {
  const userIds = new Set();
  try {
    let team = null;
    if (project.team) {
      team = await Team.findById(project.team._id || project.team).populate('members.student');
    }
    if (!team) {
      team = await Team.findOne({ project: project._id }).populate('members.student');
    }
    if (team && Array.isArray(team.members)) {
      for (const m of team.members) {
        if (m.student?.user) {
          userIds.add(m.student.user.toString());
        } else if (m.student?.email) {
          const u = await User.findOne({ email: m.student.email.toLowerCase() });
          if (u) userIds.add(u._id.toString());
        }
      }
    }
    if (Array.isArray(project.milestones)) {
      for (const m of project.milestones) {
        for (const am of m.assignedMembers || []) {
          const amId = (am._id || am).toString();
          const u = await User.findById(amId);
          if (u && u.role === 'STUDENT') {
            userIds.add(u._id.toString());
          }
        }
      }
    }
  } catch (err) {
    console.warn('Error resolving student user IDs for project:', err.message);
  }
  return Array.from(userIds);
};

/**
 * Get projects based on stakeholder role
 * GET /api/projects
 */
const getProjects = async (req, res, next) => {
  try {
    const role = req.user.role;
    const filter = {};

    if (role === 'UNIVERSITY') {
      filter.universityId = req.user.id;
    } else if (role === 'FACULTY') {
      const faculty = await Faculty.findOne({ user: req.user.id });
      if (faculty) {
        filter.mentor = faculty._id;
      } else {
        return successResponse(res, 'No assigned projects found', { projects: [] });
      }
    } else if (role === 'STUDENT') {
      let student = await Student.findOne({ user: req.user.id });
      if (!student) {
        student = await Student.findOne({ email: req.user.email?.toLowerCase() });
      }
      const studentId = student ? student._id : null;
      const memberCond = [];
      if (studentId) memberCond.push({ 'members.student': studentId });
      memberCond.push({ 'members.student': req.user.id });

      const teams = await Team.find({ $or: memberCond });
      const teamIds = teams.map((t) => t._id);
      const teamProjIds = teams.filter((t) => t.project).map((t) => t.project);

      const orConds = [];
      if (teamIds.length > 0) orConds.push({ team: { $in: teamIds } });
      if (teamProjIds.length > 0) orConds.push({ _id: { $in: teamProjIds } });
      orConds.push({ 'milestones.assignedMembers': req.user.id });
      if (studentId) orConds.push({ 'milestones.assignedMembers': studentId });

      if (orConds.length > 0) {
        filter.$or = orConds;
      } else {
        return successResponse(res, 'No assigned student projects found', { projects: [] });
      }
    } else if (role === 'INDUSTRY') {
      filter.industryPartners = req.user.id;
    } else if (role === 'CLIENT') {
      // Clients only see public approved / in-progress societal projects
      filter.status = {
        $in: ['APPROVED', 'RESEARCH', 'PROTOTYPE', 'TESTING', 'PILOT', 'VALIDATION', 'DEPLOYMENT', 'COMPLETED']
      };
    }

    const projects = await Project.find(filter)
      .populate('challengeId', 'code title category district priority status impact')
      .populate('universityId', 'name email organization district')
      .populate('mentor', 'name department specialization email')
      .populate('industryPartners', 'name email organization')
      .populate('team', 'name members')
      .sort({ updatedAt: -1 });

    return successResponse(res, 'Projects retrieved successfully', { projects });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project by ID
 * GET /api/projects/:id
 */
const getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate('challengeId')
      .populate('universityId', 'name email organization district phone')
      .populate('mentor')
      .populate('industryPartners', 'name email organization district website')
      .populate({
        path: 'team',
        populate: [
          {
            path: 'members.student',
            select: 'name email department year skills expertise'
          },
          {
            path: 'facultyMentor',
            select: 'name email department specialization'
          }
        ]
      });

    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    // Role-based visibility and IDOR protection
    const hasAccess = await checkProjectAccess(
      project,
      req.user,
      ['UNIVERSITY', 'FACULTY', 'STUDENT', 'INDUSTRY', 'ADMIN', 'CLIENT']
    );
    if (!hasAccess) {
      return errorResponse(res, 'Access denied. You are not authorized to inspect this project.', null, 403);
    }

    // Privacy Redaction for CLIENT / Public viewers: Hide internal budgets, proposal reviews, student contact phones
    if (req.user.role === 'CLIENT') {
      project.budget = undefined;
      project.aiRecommendedIndustries = undefined;
      if (project.proposal) {
        project.proposal.reviewNotes = undefined;
      }
    }

    // Dynamic progress update check
    project.overallProgress = recalculateProjectProgress(project);

    return successResponse(res, 'Project details retrieved successfully', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new project linked to an accepted challenge
 * POST /api/projects
 */
const createProject = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can create projects', null, 403);
    }

    const {
      challengeId,
      title,
      description,
      proposedSolution,
      objectives,
      technologies,
      timeline,
      budget,
      teamRequirements,
      mentor
    } = req.body;

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return errorResponse(res, 'Associated challenge not found', null, 404);
    }

    const universityId = req.user.role === 'UNIVERSITY' ? req.user.id : req.body.universityId;
    if (!universityId) {
      return errorResponse(res, 'University ID is required', null, 400);
    }

    // University ownership check applies strictly to UNIVERSITY role
    if ((req.user?.role || '').toUpperCase() === 'UNIVERSITY' && challenge.assignedUniversity?.toString() !== req.user.id.toString()) {
      return errorResponse(res, 'Unauthorized: This challenge is not assigned to your university', null, 403);
    }

    const validChallengeStatuses = ['ASSIGNED', 'IN_PROGRESS'];
    if (!validChallengeStatuses.includes((challenge.status || '').toUpperCase())) {
      return errorResponse(
        res,
        `Cannot create project: Challenge is in '${challenge.status}' status (must be ASSIGNED or IN_PROGRESS)`,
        null,
        400
      );
    }

    const defaultMilestones = [
      {
        title: 'Municipal Baseline Survey & Technical Feasibility',
        description: 'Site reconnaissance, citizen input verification, and preliminary system design.',
        status: 'IN_PROGRESS',
        progress: 30,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 86400000),
        deliverables: ['Baseline site survey report', 'Sensor specification document']
      },
      {
        title: 'Laboratory Hardware & Software Prototype Fabrication',
        description: 'Assembly of core electronics and firmware test bench.',
        status: 'NOT_STARTED',
        progress: 0,
        dueDate: new Date(Date.now() + 90 * 86400000),
        deliverables: ['Working benchtop prototype', 'Firmware repository']
      },
      {
        title: 'Field Pilot Testing & Citizen Validation',
        description: 'On-site installation at Delhi field site and municipal verification.',
        status: 'NOT_STARTED',
        progress: 0,
        dueDate: new Date(Date.now() + 180 * 86400000),
        deliverables: ['Ward performance certification', 'PWD/MCD handover document']
      }
    ];

    const project = new Project({
      challengeId,
      universityId,
      title,
      description,
      proposedSolution,
      objectives: Array.isArray(objectives) ? objectives : [],
      technologies: Array.isArray(technologies) ? technologies : [],
      timeline: timeline || '6 Months',
      budget: budget || { estimatedAmount: 0, breakdown: '' },
      teamRequirements: teamRequirements || '',
      mentor: mentor || undefined,
      milestones: defaultMilestones,
      status: 'PROJECT_CREATED',
      overallProgress: 10,
      updates: [
        {
          user: req.user.id,
          userName: req.user.name || 'University Administrator',
          userRole: req.user.role,
          title: 'Project Initiated',
          content: `University innovation project "${title}" was created from challenge [${challenge.code}].`,
          type: 'STAGE_TRANSITION',
          createdAt: new Date()
        }
      ]
    });

    project.overallProgress = recalculateProjectProgress(project);
    await project.save();

    // Link project back to Challenge
    await Challenge.findByIdAndUpdate(challengeId, {
      assignedProject: project._id,
      status: 'IN_PROGRESS'
    });

    // Log in AuditLog
    await AuditLog.create({
      challenge: challengeId,
      user: req.user.id,
      userName: req.user.name || 'University Administrator',
      userRole: req.user.role,
      action: 'CREATE_PROJECT',
      previousStatus: challenge.status,
      newStatus: 'IN_PROGRESS',
      comment: `Project created: "${title}"`
    });

    // Notify citizen submitter if linked
    if (challenge.submittedBy) {
      await dispatchNotification({
        recipient: challenge.submittedBy,
        sender: req.user.id,
        senderName: req.user.name,
        type: 'PROJECT_CREATED',
        title: 'Innovation Project Initiated',
        message: `University team has initiated innovation project "${title}" for your challenge [${challenge.code}].`,
        relatedEntity: 'Project',
        relatedEntityId: project._id
      });
    }

    return successResponse(res, 'Project created successfully', { project }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Transition Project Lifecycle Stage
 * POST /api/projects/:id/transition
 */
const transitionStage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetStage, notes } = req.body;

    if (!targetStage) {
      return errorResponse(res, 'Target stage is required', null, 400);
    }

    const project = await Project.findById(id).populate('challengeId universityId mentor');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'FACULTY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to transition this project lifecycle stage', null, 403);
    }

    const currentStage = project.status;
    const allowedNext = VALID_TRANSITIONS[currentStage] || [];

    // Admin can override or perform intervention; otherwise enforce transition state machine
    if (req.user.role !== 'ADMIN' && !allowedNext.includes(targetStage)) {
      return errorResponse(
        res,
        `Invalid stage transition from "${currentStage}" to "${targetStage}". Allowed next stage(s): [${allowedNext.join(', ')}]`,
        null,
        400
      );
    }

    // Role-based restrictions
    if (targetStage === 'APPROVED' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only government administrators can approve project proposals', null, 403);
    }

    // Update status
    project.status = targetStage;
    project.overallProgress = recalculateProjectProgress(project);

    // Record activity timeline update
    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name || 'Authorized Lead',
      userRole: req.user.role,
      title: `Stage Advanced: ${targetStage}`,
      content: notes || `Project lifecycle successfully transitioned from ${currentStage} to ${targetStage}.`,
      type: 'STAGE_TRANSITION',
      createdAt: new Date()
    });

    await project.save();

    // Broadcast real-time update to project room
    sendRealtimeProjectUpdate(id, project.updates[0]);

    const notifType = targetStage === 'COMPLETED' ? 'PROJECT_COMPLETED' : 'STAGE_TRANSITION';

    // 1. Notify Citizen Submitter
    if (project.challengeId?.submittedBy) {
      await dispatchNotification({
        recipient: project.challengeId.submittedBy,
        sender: req.user.id,
        senderName: req.user.name,
        title: `Project Update: [${project.challengeId.code || 'DEL'}]`,
        message: `The engineering project for your challenge has advanced to the "${targetStage}" stage.`,
        type: notifType,
        relatedEntity: 'Project',
        relatedEntityId: project._id
      });
    }

    // 2. Notify University
    if (project.universityId?._id && req.user.id !== project.universityId._id.toString()) {
      await dispatchNotification({
        recipient: project.universityId._id,
        sender: req.user.id,
        senderName: req.user.name,
        title: `Stage Advanced: ${project.title}`,
        message: `Project stage transitioned to "${targetStage}".`,
        type: notifType,
        relatedEntity: 'Project',
        relatedEntityId: project._id,
        project: project._id
      });
    }

    // 3. Notify Student Team Members
    try {
      const studentUserIds = await getProjectStudentUserIds(project);
      for (const sId of studentUserIds) {
        if (sId !== req.user.id.toString()) {
          await dispatchNotification({
            recipient: sId,
            sender: req.user.id,
            senderName: req.user.name,
            title: `Project Stage: ${targetStage}`,
            message: `Project "${project.title}" has advanced to the "${targetStage}" stage.`,
            type: 'PROJECT_STAGE_CHANGED',
            relatedEntity: 'Project',
            relatedEntityId: project._id,
            project: project._id
          });
        }
      }
    } catch (notifErr) {
      console.warn('[Stage Notification Warning]', notifErr.message);
    }

    return successResponse(res, `Project successfully transitioned to ${targetStage}`, { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Milestone to Project
 * POST /api/projects/:id/milestones
 */
const addMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, startDate, dueDate, deliverables, assignedMembers } = req.body;

    if (!title) {
      return errorResponse(res, 'Milestone title is required', null, 400);
    }

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'FACULTY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to add milestone to this project', null, 403);
    }

    project.milestones.push({
      title: title.trim(),
      description: description || '',
      startDate: startDate || new Date(),
      dueDate: dueDate || undefined,
      status: 'NOT_STARTED',
      progress: 0,
      deliverables: Array.isArray(deliverables) ? deliverables : [],
      assignedMembers: Array.isArray(assignedMembers) ? assignedMembers : []
    });

    project.overallProgress = recalculateProjectProgress(project);

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Milestone Added',
      content: `New milestone "${title}" created.`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Milestone added successfully', { project }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Milestone
 * PUT /api/projects/:id/milestones/:milestoneId
 */
const updateMilestone = async (req, res, next) => {
  try {
    const { id, milestoneId } = req.params;
    const { title, description, startDate, dueDate, status, progress, deliverables } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'FACULTY', 'STUDENT', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to update milestone for this project', null, 403);
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return errorResponse(res, 'Milestone not found', null, 404);
    }

    if (title) milestone.title = title.trim();
    if (description !== undefined) milestone.description = description.trim();
    if (startDate) milestone.startDate = startDate;
    if (dueDate) milestone.dueDate = dueDate;
    if (deliverables && Array.isArray(deliverables)) milestone.deliverables = deliverables;

    // Permission Enforcement: Students cannot unilaterally approve their own milestones to COMPLETED
    if (req.user.role === 'STUDENT' && (status === 'COMPLETED' || Number(progress) === 100)) {
      return errorResponse(
        res,
        'Students cannot approve their own milestones. You may submit deliverables and update progress up to 99% or request faculty review.',
        null,
        403
      );
    }

    if (status) {
      milestone.status = status;
      if (status === 'COMPLETED') {
        milestone.progress = 100;
        milestone.completedDate = new Date();
      }
    }

    if (progress !== undefined && milestone.status !== 'COMPLETED') {
      milestone.progress = Math.min(100, Math.max(0, Number(progress) || 0));
      if (milestone.progress === 100) {
        milestone.status = 'COMPLETED';
        milestone.completedDate = new Date();
      }
    }

    project.overallProgress = recalculateProjectProgress(project);

    // If milestone completed or delayed, log update and notify
    if (status === 'COMPLETED') {
      project.updates.unshift({
        user: req.user.id,
        userName: req.user.name,
        userRole: req.user.role,
        title: 'Milestone Completed',
        content: `Milestone "${milestone.title}" was marked 100% complete.`,
        type: 'MILESTONE_COMPLETION',
        createdAt: new Date()
      });
      sendRealtimeProjectUpdate(id, project.updates[0]);

      if (project.universityId) {
        await dispatchNotification({
          recipient: project.universityId,
          sender: req.user.id,
          senderName: req.user.name,
          title: 'Milestone Completed',
          message: `Milestone "${milestone.title}" in project "${project.title}" was completed.`,
          type: 'MILESTONE_COMPLETED',
          relatedEntity: 'Project',
          relatedEntityId: project._id,
          project: project._id
        });
      }

      try {
        const studentUserIds = await getProjectStudentUserIds(project);
        for (const sId of studentUserIds) {
          if (sId !== req.user.id.toString()) {
            await dispatchNotification({
              recipient: sId,
              sender: req.user.id,
              senderName: req.user.name,
              title: 'Milestone & Deliverables Approved',
              message: `Milestone "${milestone.title}" in project "${project.title}" has been verified and completed.`,
              type: 'DELIVERABLE_APPROVED',
              relatedEntity: 'Milestone',
              relatedEntityId: milestone._id,
              project: project._id
            });
          }
        }
      } catch (notifErr) {
        console.warn('[Milestone Notification Warning]', notifErr.message);
      }
    } else if (status === 'DELAYED') {
      if (project.universityId) {
        await dispatchNotification({
          recipient: project.universityId,
          sender: req.user.id,
          senderName: req.user.name,
          title: 'Milestone Schedule Delayed',
          message: `Milestone "${milestone.title}" in project "${project.title}" has been flagged as delayed.`,
          type: 'PROJECT_DELAYED',
          relatedEntity: 'Project',
          relatedEntityId: project._id
        });
      }
    } else {
      sendRealtimeProjectUpdate(id, {
        type: 'MILESTONE_UPDATED',
        milestoneId,
        progress: milestone.progress,
        status: milestone.status,
        overallProgress: project.overallProgress
      });
    }

    await project.save();

    return successResponse(res, 'Milestone updated successfully', { project, milestone });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Milestone
 * DELETE /api/projects/:id/milestones/:milestoneId
 */
const deleteMilestone = async (req, res, next) => {
  try {
    const { id, milestoneId } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'FACULTY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to delete milestone from this project', null, 403);
    }

    project.milestones.pull({ _id: milestoneId });
    project.overallProgress = recalculateProjectProgress(project);
    await project.save();

    return successResponse(res, 'Milestone deleted successfully', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Add Comment to Milestone
 * POST /api/projects/:id/milestones/:milestoneId/comments
 */
const addMilestoneComment = async (req, res, next) => {
  try {
    const { id, milestoneId } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return errorResponse(res, 'Comment text is required', null, 400);
    }

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const milestone = project.milestones.id(milestoneId);
    if (!milestone) {
      return errorResponse(res, 'Milestone not found', null, 404);
    }

    milestone.comments.push({
      user: req.user.id,
      userName: req.user.name || 'Collaborator',
      userRole: req.user.role,
      comment: comment.trim(),
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Comment added to milestone', { milestone });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Project Deliverable / Document via Cloudinary
 * POST /api/projects/:id/documents
 */
const uploadProjectDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, milestoneId } = req.body;

    if (!req.file) {
      return errorResponse(res, 'File attachment is required', null, 400);
    }

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'FACULTY', 'STUDENT', 'ADMIN', 'INDUSTRY']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to upload documents to this project', null, 403);
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'delhi_project_deliverables'
    );

    const docEntry = {
      title: title || req.file.originalname,
      url: uploadResult.url,
      publicId: uploadResult.publicId || '',
      fileType: req.file.mimetype || 'application/pdf',
      milestoneId: milestoneId || undefined,
      uploadedBy: req.user.id,
      uploaderName: req.user.name || 'Stakeholder',
      uploaderRole: req.user.role,
      uploadedAt: new Date()
    };

    project.documents.push(docEntry);

    // If tied to milestone, also add to milestone.documents
    if (milestoneId) {
      const ms = project.milestones.id(milestoneId);
      if (ms) {
        ms.documents.push({
          title: docEntry.title,
          url: docEntry.url,
          publicId: docEntry.publicId,
          fileType: docEntry.fileType,
          uploadedBy: req.user.id,
          uploadedAt: new Date()
        });
      }
    }

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name || 'Stakeholder',
      userRole: req.user.role,
      title: 'Deliverable Uploaded',
      content: `Uploaded deliverable document: "${docEntry.title}".`,
      type: 'DOCUMENT_UPLOAD',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Document uploaded successfully', {
      document: docEntry,
      project
    }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Add Project Update (Activity Timeline)
 * POST /api/projects/:id/updates
 */
const addProjectUpdate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, content, type } = req.body;

    if (!title || !content) {
      return errorResponse(res, 'Title and content are required', null, 400);
    }

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'FACULTY', 'STUDENT', 'ADMIN', 'INDUSTRY']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to post updates to this project', null, 403);
    }

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name || 'Project Lead',
      userRole: req.user.role,
      title: title.trim(),
      content: content.trim(),
      type: type || 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Update recorded successfully', { project }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Add General Project Collaboration Comment
 * POST /api/projects/:id/comments
 */
const addProjectComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    if (!comment || !comment.trim()) {
      return errorResponse(res, 'Comment is required', null, 400);
    }

    const project = await Project.findById(id).populate('challengeId');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'FACULTY', 'STUDENT', 'ADMIN', 'INDUSTRY', 'CLIENT']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to post comments in this project', null, 403);
    }

    // Participant Authorization Check
    const isCitizen = project.challengeId?.submittedBy?.toString() === req.user.id;
    const isUniversity = project.universityId?.toString() === req.user.id;
    const isMentor = project.mentor?.toString() === req.user.id;
    const isIndustry = (project.industryPartners || []).some(
      (ip) => ip.toString() === req.user.id
    );
    const isAdmin = req.user.role === 'ADMIN';
    const isStudent = req.user.role === 'STUDENT';

    if (!isAdmin && !isUniversity && !isMentor && !isIndustry && !isCitizen && !isStudent) {
      return errorResponse(
        res,
        'You are not an authorized participant in this project communication',
        null,
        403
      );
    }

    const commentObj = {
      user: req.user.id,
      userName: req.user.name || 'Collaborator',
      userRole: req.user.role,
      comment: comment.trim(),
      projectId: project._id,
      createdAt: new Date()
    };

    project.comments.push(commentObj);
    await project.save();

    // 1. Broadcast in real-time to project room via Socket.IO
    sendRealtimeProjectMessage(id, commentObj);

    // 2. Dispatch notifications to all other stakeholders
    try {
      const stakeholderUserIds = new Set();

      // Team student members
      const studentIds = await getProjectStudentUserIds(project);
      studentIds.forEach((sid) => stakeholderUserIds.add(sid));

      // Faculty mentor
      if (project.mentor) {
        const faculty = await Faculty.findById(project.mentor._id || project.mentor);
        if (faculty?.user) stakeholderUserIds.add(faculty.user.toString());
      }

      // University Lead
      if (project.universityId) {
        stakeholderUserIds.add((project.universityId._id || project.universityId).toString());
      }

      // Industry Partners
      if (Array.isArray(project.industryPartners)) {
        project.industryPartners.forEach((ip) => {
          stakeholderUserIds.add((ip._id || ip).toString());
        });
      }

      // Exclude author
      stakeholderUserIds.delete(req.user.id.toString());

      const snippet = comment.trim().length > 60 ? `${comment.trim().slice(0, 60)}...` : comment.trim();
      for (const recipientId of stakeholderUserIds) {
        await dispatchNotification({
          recipient: recipientId,
          sender: req.user.id,
          senderName: req.user.name || 'Collaborator',
          type: 'PROJECT_DISCUSSION',
          title: `Discussion in ${project.title}`,
          message: `${req.user.name || 'Stakeholder'} (${req.user.role}): "${snippet}"`,
          relatedEntity: 'Project',
          relatedEntityId: project._id,
          project: project._id
        });
      }
    } catch (notifErr) {
      console.warn('[Discussion Notification Warning]', notifErr.message);
    }

    return successResponse(res, 'Comment posted successfully', { project, comment: commentObj }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Verified Societal Impact / Outcome
 * POST /api/projects/:id/impact
 */
const submitImpactOutcome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      solutionDescription,
      deploymentLocation,
      peopleBenefited,
      communitiesCovered,
      cost,
      outcome,
      technologyTransferred,
      patentIpInfo,
      startupCreated,
      scalabilityPotential
    } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    // Permission: Only University lead or Admin
    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized: You can only register impact for your own university project or as administrator', null, 403);
    }

    // Verify stage requirement
    if (!['DEPLOYMENT', 'COMPLETED', 'VALIDATION'].includes(project.status)) {
      return errorResponse(
        res,
        'Impact metrics can only be registered when project reaches Validation, Deployment, or Completion',
        null,
        400
      );
    }

    project.impactOutcome = {
      solutionDescription: solutionDescription || project.proposedSolution,
      deploymentLocation: deploymentLocation || project.description,
      peopleBenefited: Number(peopleBenefited) || 0,
      communitiesCovered: communitiesCovered || '',
      cost: Number(cost) || project.budget?.estimatedAmount || 0,
      outcome: outcome || '',
      technologyTransferred: technologyTransferred || '',
      patentIpInfo: patentIpInfo || '',
      startupCreated: startupCreated || '',
      scalabilityPotential: scalabilityPotential || '',
      verifiedBy: req.user.id,
      verifiedAt: new Date(),
      isClaimed: true
    };

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Societal Impact Verified',
      content: `Registered verified societal impact: ${peopleBenefited || 'Thousands of'} citizens benefited at ${deploymentLocation || 'Delhi'}.`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Verified societal impact registered successfully', {
      impactOutcome: project.impactOutcome,
      project
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin Workflow Intervention
 * POST /api/projects/:id/admin-intervene
 */
const adminIntervene = async (req, res, next) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only administrators can perform administrative workflow interventions', null, 403);
    }

    const { id } = req.params;
    const { targetStage, interventionNotes, action } = req.body;

    if (!interventionNotes) {
      return errorResponse(res, 'Intervention justification notes are required', null, 400);
    }

    const project = await Project.findById(id).populate('challengeId universityId');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const prev = project.status;
    if (targetStage) {
      project.status = targetStage;
      project.overallProgress = recalculateProjectProgress(project);
    }

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name || 'State Innovation Council Admin',
      userRole: 'ADMIN',
      title: `Admin Workflow Intervention: ${action || 'Status Override'}`,
      content: interventionNotes,
      type: 'ADMIN_INTERVENTION',
      createdAt: new Date()
    });

    await project.save();

    // Log in AuditLog
    if (project.challengeId) {
      await AuditLog.create({
        challenge: project.challengeId._id,
        user: req.user.id,
        userName: req.user.name,
        userRole: 'ADMIN',
        action: 'STATUS_CHANGE',
        previousStatus: prev,
        newStatus: targetStage || prev,
        comment: `Admin Project Intervention: ${interventionNotes}`
      });
    }

    // Notify University
    if (project.universityId?._id) {
      await Notification.create({
        recipient: project.universityId._id,
        title: 'State Administrative Workflow Intervention',
        message: `Delhi State Innovation Council intervened on project "${project.title}": ${interventionNotes}`,
        type: 'GENERAL'
      });
    }

    return successResponse(res, 'Admin intervention executed and recorded', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit Formal Project Proposal
 * POST /api/projects/:id/proposal
 */
const submitProposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      problemUnderstanding,
      proposedSolution,
      methodology,
      technology,
      timeline,
      expectedImpact,
      isDraft
    } = req.body;

    const project = await Project.findById(id).populate('challengeId');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'ADMIN', 'STUDENT']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized: Only project team members, assigned university leads, or administrators can submit project proposals', null, 403);
    }

    // Lock Enforcement: Once submitted/under review/approved, student cannot silently modify unless revision is requested or in draft
    if (
      project.proposal &&
      ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED'].includes(project.proposal.approvalStatus) &&
      project.proposal.approvalStatus !== 'NEEDS_REVISION'
    ) {
      return errorResponse(
        res,
        'Proposal has already been submitted and is locked for council evaluation. Modifications are only permitted if revision is requested or while in DRAFT status.',
        null,
        400
      );
    }

    // Handle Save Draft
    if (isDraft) {
      project.proposal = {
        problemUnderstanding,
        proposedSolution,
        methodology,
        technology: Array.isArray(technology) ? technology : [technology].filter(Boolean),
        timeline,
        expectedImpact,
        submittedAt: project.proposal?.submittedAt,
        approvalStatus: 'DRAFT',
        reviewNotes: project.proposal?.reviewNotes || ''
      };

      await project.save();
      return successResponse(res, 'Proposal draft saved successfully', { project }, 200);
    }

    // Formal Submission
    project.proposal = {
      problemUnderstanding,
      proposedSolution,
      methodology,
      technology: Array.isArray(technology) ? technology : [technology].filter(Boolean),
      timeline,
      expectedImpact,
      submittedAt: new Date(),
      approvalStatus: 'SUBMITTED',
      reviewNotes: ''
    };

    project.status = 'PROPOSAL_SUBMITTED';
    project.overallProgress = recalculateProjectProgress(project);

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Formal Proposal Submitted',
      content: 'Technical solution proposal submitted to Delhi State Innovation Council.',
      type: 'STAGE_TRANSITION',
      createdAt: new Date()
    });

    await project.save();

    // Notify admins, university, and faculty mentor of proposal submission
    try {
      const admins = await User.find({ role: 'ADMIN' });
      for (const admin of admins) {
        await dispatchNotification({
          recipient: admin._id,
          sender: req.user.id,
          senderName: req.user.name,
          type: 'PROPOSAL_SUBMITTED',
          title: 'Formal Project Proposal Submitted',
          message: `Student innovation team submitted technical proposal for "${project.title}".`,
          relatedEntity: 'Project',
          relatedEntityId: project._id
        });
      }

      if (project.universityId) {
        await dispatchNotification({
          recipient: project.universityId,
          sender: req.user.id,
          senderName: req.user.name,
          type: 'PROPOSAL_SUBMITTED',
          title: 'Formal Project Proposal Submitted',
          message: `Student team submitted proposal for "${project.title}".`,
          relatedEntity: 'Project',
          relatedEntityId: project._id
        });
      }

      if (project.mentor) {
        const facultyDoc = await Faculty.findById(project.mentor);
        if (facultyDoc && facultyDoc.user) {
          await dispatchNotification({
            recipient: facultyDoc.user,
            sender: req.user.id,
            senderName: req.user.name,
            type: 'PROPOSAL_SUBMITTED',
            title: 'Formal Project Proposal Submitted',
            message: `Supervised student team submitted proposal for "${project.title}".`,
            relatedEntity: 'Project',
            relatedEntityId: project._id
          });
        }
      }
    } catch (notifErr) {
      console.warn('[Notification Warning]', notifErr.message);
    }

    return successResponse(res, 'Proposal submitted successfully', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Review Project Proposal (Admin)
 * PUT /api/projects/:id/proposal/review
 */
const reviewProposal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvalStatus, reviewNotes } = req.body;

    if (req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only government administrators can review proposals', null, 403);
    }

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    if (!project.proposal) {
      project.proposal = {};
    }

    project.proposal.approvalStatus = approvalStatus;
    project.proposal.reviewNotes = reviewNotes || '';
    project.proposal.reviewedAt = new Date();

    if (approvalStatus === 'APPROVED') {
      project.status = 'APPROVED';
    }

    project.overallProgress = recalculateProjectProgress(project);

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: 'ADMIN',
      title: `Proposal ${approvalStatus}`,
      content: reviewNotes || `Proposal reviewed with status: ${approvalStatus}.`,
      type: 'STAGE_TRANSITION',
      createdAt: new Date()
    });

    await project.save();

    // Notify university and student team of proposal review outcome
    const notifType = approvalStatus === 'APPROVED' 
      ? 'PROPOSAL_APPROVED' 
      : (approvalStatus === 'NEEDS_REVISION' ? 'PROPOSAL_REVISION_REQUESTED' : 'STAGE_TRANSITION');

    if (project.universityId) {
      await dispatchNotification({
        recipient: project.universityId,
        sender: req.user.id,
        senderName: req.user.name,
        title: `Project Proposal ${approvalStatus}`,
        message: `Delhi State Innovation Council reviewed proposal for "${project.title}": ${approvalStatus}.`,
        type: notifType,
        relatedEntity: 'Project',
        relatedEntityId: project._id,
        project: project._id
      });
    }

    try {
      const studentUserIds = await getProjectStudentUserIds(project);
      for (const sId of studentUserIds) {
        await dispatchNotification({
          recipient: sId,
          sender: req.user.id,
          senderName: req.user.name,
          title: `Project Proposal ${approvalStatus === 'APPROVED' ? 'Approved' : 'Revision Requested'}`,
          message: reviewNotes || `Proposal for "${project.title}" review result: ${approvalStatus}.`,
          type: notifType,
          relatedEntity: 'Project',
          relatedEntityId: project._id,
          project: project._id
        });
      }
    } catch (notifErr) {
      console.warn('[Proposal Review Notification Warning]', notifErr.message);
    }

    return successResponse(res, `Proposal review status updated to ${approvalStatus}`, { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign Faculty Mentor
 * POST /api/projects/:id/assign-mentor
 */
const assignMentor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { facultyId } = req.body;

    const [project, faculty] = await Promise.all([
      Project.findById(id),
      Faculty.findById(facultyId)
    ]);

    if (!project || !faculty) {
      return errorResponse(res, 'Project or Faculty not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized: Only the assigned university or administrator can assign faculty mentors', null, 403);
    }

    project.mentor = facultyId;
    await project.save();

    await faculty.updateOne({ $addToSet: { assignedProjects: project._id } });

    return successResponse(res, 'Faculty mentor assigned to project', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * Request AI-Assisted Industry Co-Development Recommendations for a Project
 * POST /api/projects/:id/recommend-industries
 */
const recommendIndustriesForProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) return errorResponse(res, 'Project not found', null, 404);

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'ADMIN', 'FACULTY']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to view industry recommendations for this project', null, 403);
    }

    const industries = await Industry.find({}).lean();
    if (!industries || industries.length === 0) {
      return successResponse(res, 'No registered corporate partners available for matching', {
        recommendations: [],
        disclaimer: 'Manual corporate partnership invitations available.'
      });
    }

    const recommendations = await aiService.matchIndustries(project, industries);
    project.aiRecommendedIndustries = recommendations.map((rec) => ({
      ...rec,
      status: 'PENDING',
      matchedAt: new Date()
    }));
    await project.save();

    return successResponse(res, 'AI industry recommendations generated successfully', {
      recommendations: project.aiRecommendedIndustries,
      disclaimer: 'Recommended based on technical capability, CSR alignment and pilot testing infrastructure.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Accept an AI Industry Recommendation (Human Decision)
 * POST /api/projects/:id/recommend-industries/accept
 */
const acceptIndustryRecommendation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { industryId, notes } = req.body;

    if (!industryId) {
      return errorResponse(res, 'Industry ID is required', null, 400);
    }

    const project = await Project.findById(id);
    if (!project) return errorResponse(res, 'Project not found', null, 404);

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized: Only the assigned university lead or administrator can onboard industry partners', null, 403);
    }

    const targetInd = (await User.findById(industryId)) || (await Industry.findOne({ user: industryId }));
    const indName = targetInd?.name || 'Selected Industry Partner';
    const assignedUserId = targetInd?.user || targetInd?._id || industryId;

    // 1. Update AI Recommendation status
    if (project.aiRecommendedIndustries && project.aiRecommendedIndustries.length > 0) {
      project.aiRecommendedIndustries = project.aiRecommendedIndustries.map((rec) => {
        const isMatch = rec.industryId?.toString() === industryId.toString() ||
                        rec.industryId?.toString() === assignedUserId.toString();
        return {
          ...rec.toObject(),
          status: isMatch ? 'ACCEPTED' : rec.status
        };
      });
    }

    // 2. Add to project's industry partners if not present
    if (!project.industryPartners) project.industryPartners = [];
    if (!project.industryPartners.some((p) => p.toString() === assignedUserId.toString())) {
      project.industryPartners.push(assignedUserId);
    }

    project.updates.unshift({
      title: `Industry Partner Onboarded: ${indName}`,
      content: notes || 'Accepted AI recommended industry partner based on technology & pilot testing alignment.',
      author: req.user.id,
      userName: req.user.name || 'Project Lead',
      userRole: req.user.role || 'ADMIN',
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    // 3. Notify Industry Partner
    await dispatchNotification({
      recipient: assignedUserId,
      sender: req.user.id,
      senderName: req.user.name,
      title: 'Project Partnership Invitation Accepted',
      message: `Your organization has been invited and onboarded as a co-development partner for project "${project.title}".`,
      type: 'PARTNERSHIP_REQUEST',
      relatedEntity: 'Project',
      relatedEntityId: id
    });

    return successResponse(res, `Industry partner ${indName} accepted successfully`, {
      project,
      assignedPartner: indName
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Ignore an AI Industry Recommendation (Human Decision)
 * POST /api/projects/:id/recommend-industries/ignore
 */
const ignoreIndustryRecommendation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { industryId } = req.body;

    const project = await Project.findById(id);
    if (!project) return errorResponse(res, 'Project not found', null, 404);

    const hasAccess = await checkProjectAccess(project, req.user, ['UNIVERSITY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized: Only the assigned university lead or administrator can manage recommendations', null, 403);
    }

    if (project.aiRecommendedIndustries) {
      project.aiRecommendedIndustries = project.aiRecommendedIndustries.map((rec) => {
        if (!industryId || rec.industryId?.toString() === industryId.toString()) {
          return { ...rec.toObject(), status: 'IGNORED' };
        }
        return rec;
      });
      await project.save();
    }

    return successResponse(res, 'Recommendation marked as ignored', {
      recommendations: project.aiRecommendedIndustries
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request Industry Co-Development Collaboration
 * POST /api/projects/:id/request-industry
 */
const requestIndustryCollaboration = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { partnerName, areaOfInterest, message } = req.body;

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['STUDENT', 'UNIVERSITY', 'FACULTY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to request industry collaboration for this project', null, 403);
    }

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Industry Collaboration Requested',
      content: `Collaboration outreach initiated with ${partnerName || 'Corporate Ecosystem Partner'}: ${message || areaOfInterest || 'Co-development and prototype testing'}.`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Industry collaboration request recorded successfully', { project }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Student/University Requests Faculty Mentorship Review
 * POST /api/projects/:id/mentor/request-review
 */
const requestMentorReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { requestNotes } = req.body;

    const project = await Project.findById(id).populate('mentor');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['STUDENT', 'UNIVERSITY', 'FACULTY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to request mentor review for this project', null, 403);
    }

    if (!project.mentor) {
      return errorResponse(res, 'No faculty mentor has been assigned to this project yet', null, 400);
    }

    project.mentorReviewStatus = 'REVIEW_REQUESTED';
    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Mentorship Review Requested',
      content: requestNotes || `Student team requested mentorship review on project deliverables and methodology.`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    // Notify Faculty Mentor
    if (project.mentor && project.mentor.user) {
      await dispatchNotification({
        recipient: project.mentor.user,
        sender: req.user.id,
        senderName: req.user.name,
        type: 'GENERAL',
        title: 'Project Mentorship Review Requested',
        message: `Student team requested review for "${project.title}": ${requestNotes || 'Review requested for active sprint.'}`,
        relatedEntity: 'Project',
        relatedEntityId: project._id
      });
    }

    return successResponse(res, 'Mentorship review requested successfully', { project }, 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Faculty/University Records Mentorship Feedback
 * POST /api/projects/:id/mentor/feedback
 */
const addMentorFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { feedback, reviewStatus = 'SATISFACTORY', upcomingReviewDate } = req.body;

    // Security guard: Students CANNOT submit mentor feedback or modify faculty records
    if (req.user.role === 'STUDENT') {
      return errorResponse(res, 'Unauthorized: Students cannot submit mentor feedback or modify faculty records.', null, 403);
    }

    if (!feedback || !feedback.trim()) {
      return errorResponse(res, 'Feedback content is required', null, 400);
    }

    const project = await Project.findById(id).populate('mentor').populate('team');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['FACULTY', 'UNIVERSITY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to add mentor feedback for this project', null, 403);
    }

    const facultyUser = await Faculty.findOne({ user: req.user.id });
    const facultyName = facultyUser?.name || req.user.name;

    const reviewEntry = {
      faculty: facultyUser?._id || project.mentor?._id,
      facultyName,
      feedback: feedback.trim(),
      reviewStatus,
      reviewDate: new Date(),
      upcomingReviewDate: upcomingReviewDate ? new Date(upcomingReviewDate) : undefined
    };

    project.mentorReviews.unshift(reviewEntry);
    project.lastMentorFeedback = feedback.trim();
    project.lastMentorFeedbackDate = new Date();
    project.mentorReviewStatus = reviewStatus;
    if (upcomingReviewDate) {
      project.upcomingMentorReview = new Date(upcomingReviewDate);
    }

    project.updates.unshift({
      user: req.user.id,
      userName: facultyName,
      userRole: req.user.role,
      title: 'Faculty Mentor Feedback Recorded',
      content: `Supervising mentor added evaluation: "${feedback.slice(0, 120)}..."`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    // Notify student team members
    try {
      if (project.team) {
        const team = await Team.findById(project.team._id || project.team).populate('members.student');
        if (team && Array.isArray(team.members)) {
          for (const m of team.members) {
            const studentUserId = m.student?.user || m.student?._id;
            if (studentUserId) {
              await dispatchNotification({
                recipient: studentUserId,
                sender: req.user.id,
                senderName: facultyName,
                type: 'FACULTY_FEEDBACK',
                title: 'Faculty Mentor Feedback Received',
                message: `${facultyName} added feedback on "${project.title}": "${feedback.slice(0, 100)}..."`,
                relatedEntity: 'Project',
                relatedEntityId: project._id
              });
            }
          }
        }
      }
    } catch (notifErr) {
      console.warn('[Notification Warning]', notifErr.message);
    }

    return successResponse(res, 'Mentor feedback recorded successfully', { project }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Project Prototype Details
 * PUT /api/projects/:id/prototype
 */
const updateProjectPrototype = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      version,
      description,
      technologyUsed,
      repositoryUrl,
      demoUrl,
      prototypeStatus,
      testingStatus
    } = req.body;

    const project = await Project.findById(id).populate('team mentor');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['STUDENT', 'UNIVERSITY', 'FACULTY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to modify prototype records for this project', null, 403);
    }

    // Sanitize repositoryUrl: if provided, must be valid URL. No fake links.
    let cleanRepoUrl = '';
    if (repositoryUrl && repositoryUrl.trim()) {
      const trimmed = repositoryUrl.trim();
      if (!/^https?:\/\/.+/i.test(trimmed)) {
        return errorResponse(res, 'Repository URL must be a valid http:// or https:// link', null, 400);
      }
      cleanRepoUrl = trimmed;
    }

    let cleanDemoUrl = '';
    if (demoUrl && demoUrl.trim()) {
      cleanDemoUrl = demoUrl.trim();
    }

    // Technology used formatting
    let techArray = project.prototype?.technologyUsed || [];
    if (technologyUsed) {
      techArray = Array.isArray(technologyUsed)
        ? technologyUsed
        : technologyUsed.split(',').map((t) => t.trim()).filter(Boolean);
    }

    project.prototype = {
      name: name?.trim() || project.prototype?.name || 'Engineering Prototype',
      version: version?.trim() || project.prototype?.version || 'v1.0.0',
      description: description?.trim() || project.prototype?.description || '',
      technologyUsed: techArray,
      repositoryUrl: cleanRepoUrl,
      demoUrl: cleanDemoUrl,
      prototypeStatus: prototypeStatus || project.prototype?.prototypeStatus || 'DEVELOPMENT',
      testingStatus: testingStatus || project.prototype?.testingStatus || 'IN_PROGRESS',
      lastUpdatedBy: req.user.id,
      updatedAt: new Date()
    };

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Prototype Configuration Updated',
      content: `Updated prototype "${project.prototype.name}" (${project.prototype.version}) status: ${project.prototype.prototypeStatus}.`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Prototype configuration updated successfully', {
      prototype: project.prototype
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Test Records for Project
 * GET /api/projects/:id/tests
 */
const getProjectTests = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id).select('testRecords title');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }
    const testRecords = (project.testRecords || []).sort(
      (a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)
    );
    return successResponse(res, 'Project test trials retrieved successfully', {
      count: testRecords.length,
      tests: testRecords
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log New Testing Record
 * POST /api/projects/:id/tests
 */
const createProjectTest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      testName,
      objective,
      date,
      location,
      participantsSampleSize,
      method,
      result,
      issuesFound,
      status
    } = req.body;

    if (!testName || !objective || !method) {
      return errorResponse(res, 'Test Name, Objective, and Testing Methodology are required fields', null, 400);
    }

    const project = await Project.findById(id).populate('team mentor');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['STUDENT', 'UNIVERSITY', 'FACULTY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to log test records for this project', null, 403);
    }

    // Student self-approval guard: students cannot mark a test as PASSED
    let testStatus = status || 'PLANNED';
    if (req.user.role === 'STUDENT' && testStatus === 'PASSED') {
      return errorResponse(
        res,
        'Students cannot approve their own test records or set status to PASSED. Formal test validation requires Supervising Faculty Mentor review.',
        null,
        403
      );
    }

    const newTest = {
      testName: testName.trim(),
      objective: objective.trim(),
      date: date ? new Date(date) : new Date(),
      location: location?.trim() || 'University Engineering Laboratory',
      participantsSampleSize: participantsSampleSize?.trim() || 'Laboratory Prototype Bench',
      method: method.trim(),
      result: result?.trim() || '',
      issuesFound: issuesFound?.trim() || '',
      status: testStatus,
      testedBy: req.user.id,
      testedByName: req.user.name || 'Student Innovator',
      evidence: [],
      createdAt: new Date()
    };

    project.testRecords.unshift(newTest);

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Testing Trial Logged',
      content: `Recorded test run "${newTest.testName}" with status: ${newTest.status}.`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(
      res,
      'Testing record logged successfully',
      {
        test: project.testRecords[0]
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Upload Evidence Artifact for a Test Trial
 * POST /api/projects/:id/tests/:testId/evidence
 */
const uploadTestEvidence = async (req, res, next) => {
  try {
    const { id, testId } = req.params;
    const { title } = req.body;

    if (!req.file) {
      return errorResponse(res, 'Evidence file attachment is required', null, 400);
    }

    const project = await Project.findById(id).populate('team mentor');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, ['STUDENT', 'UNIVERSITY', 'FACULTY', 'ADMIN']);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to upload test evidence for this project', null, 403);
    }

    const testRecord = project.testRecords.id(testId);
    if (!testRecord) {
      return errorResponse(res, 'Test record not found', null, 404);
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'delhi_test_evidence'
    );

    const evidenceEntry = {
      title: title || req.file.originalname,
      url: uploadResult.url,
      publicId: uploadResult.publicId || '',
      fileType: req.file.mimetype || 'application/pdf',
      uploadedAt: new Date()
    };

    testRecord.evidence.push(evidenceEntry);

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Test Evidence Uploaded',
      content: `Uploaded test verification evidence "${evidenceEntry.title}" for test trial "${testRecord.testName}".`,
      type: 'DOCUMENT_UPLOAD',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(
      res,
      'Test evidence uploaded successfully',
      {
        evidence: evidenceEntry,
        test: testRecord
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Review & Validate Testing Trial (Faculty / University / Admin only)
 * POST /api/projects/:id/tests/:testId/review
 */
const reviewProjectTest = async (req, res, next) => {
  try {
    const { id, testId } = req.params;
    const { reviewerFeedback, status } = req.body;

    if (!['FACULTY', 'UNIVERSITY', 'ADMIN'].includes(req.user.role)) {
      return errorResponse(res, 'Students cannot review or sign-off on test trials', null, 403);
    }

    if (!status || !['PASSED', 'FAILED', 'RETEST_REQUIRED'].includes(status)) {
      return errorResponse(res, 'A valid evaluation status (PASSED, FAILED, RETEST_REQUIRED) is required', null, 400);
    }

    const project = await Project.findById(id).populate('team mentor');
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const testRecord = project.testRecords.id(testId);
    if (!testRecord) {
      return errorResponse(res, 'Test record not found', null, 404);
    }

    testRecord.status = status;
    testRecord.reviewerFeedback = reviewerFeedback?.trim() || '';
    testRecord.reviewedBy = req.user.id;
    testRecord.reviewedByName = req.user.name || 'Faculty Evaluator';
    testRecord.reviewedAt = new Date();

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: `Test Trial Evaluated (${status})`,
      content: `${req.user.name} evaluated test "${testRecord.testName}": marked as ${status}.${reviewerFeedback ? ` Note: "${reviewerFeedback}"` : ''}`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Test trial review recorded successfully', {
      test: testRecord
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all partnerships for a specific project
 * GET /api/projects/:id/partnerships
 */
const getProjectPartnerships = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    const hasAccess = await checkProjectAccess(project, req.user, [
      'STUDENT',
      'UNIVERSITY',
      'FACULTY',
      'ADMIN',
      'INDUSTRY'
    ]);
    if (!hasAccess) {
      return errorResponse(res, 'Unauthorized to view partnerships for this project', null, 403);
    }

    const partnerships = await Partnership.find({ project: id })
      .populate('industry', 'name email organization phone district avatar')
      .populate('industryProfile')
      .populate('student', 'name email')
      .sort({ updatedAt: -1 });

    return successResponse(res, 'Project partnerships retrieved successfully', {
      count: partnerships.length,
      partnerships
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update partnership status (Accept, Reject, Activate, Complete)
 * PUT /api/projects/:id/partnerships/:partnershipId/status
 */
const updatePartnershipStatus = async (req, res, next) => {
  try {
    const { id, partnershipId } = req.params;
    const { status, reviewNotes, assignedMentor } = req.body;

    // Security guard: Students are strictly forbidden from approving or modifying partnership status
    if (req.user.role === 'STUDENT') {
      return errorResponse(res, 'Forbidden: Students cannot approve collaboration requests or modify partnership status', null, 403);
    }

    if (!['INDUSTRY', 'UNIVERSITY', 'ADMIN'].includes(req.user.role)) {
      return errorResponse(res, 'Unauthorized to evaluate partnerships', null, 403);
    }

    const validStatuses = ['ACCEPTED', 'REJECTED', 'ACTIVE', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
      return errorResponse(res, `Invalid status. Must be one of: ${validStatuses.join(', ')}`, null, 400);
    }

    const project = await Project.findById(id);
    if (!project) {
      return errorResponse(res, 'Project not found', null, 404);
    }

    // University ownership check applies strictly to role UNIVERSITY
    if ((req.user?.role || '').toUpperCase() === 'UNIVERSITY' && project.universityId?.toString() !== req.user.id.toString()) {
      return errorResponse(res, 'Unauthorized: You can only evaluate partnerships for your university projects', null, 403);
    }

    const partnership = await Partnership.findOne({ _id: partnershipId, project: id })
      .populate('industry', 'name email organization')
      .populate('student', 'name email');

    if (!partnership) {
      return errorResponse(res, 'Partnership record not found for this project', null, 404);
    }

    partnership.status = status;
    if (reviewNotes !== undefined) partnership.reviewNotes = reviewNotes.trim();
    if (assignedMentor) partnership.assignedMentor = assignedMentor;
    partnership.reviewedAt = new Date();

    if (['ACCEPTED', 'ACTIVE'].includes(status) && partnership.industry) {
      const indId = partnership.industry._id || partnership.industry;
      await Project.findByIdAndUpdate(id, { $addToSet: { industryPartners: indId } });
    }

    const partnerName = partnership.industry?.organization || partnership.industry?.name || 'Corporate Partner';
    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: `Industry Partnership ${status}`,
      content: `${partnerName} collaboration status updated to ${status}.${reviewNotes ? ` Notes: "${reviewNotes}"` : ''}`,
      type: 'UPDATE',
      createdAt: new Date()
    });
    await project.save();
    await partnership.save();

    // Dispatch notification to student innovator
    let recipientUserId = partnership.requestedBy;
    if (!recipientUserId && partnership.student) {
      const stud = await Student.findById(partnership.student._id || partnership.student);
      if (stud?.user) recipientUserId = stud.user;
      else if (stud?.email) {
        const u = await User.findOne({ email: stud.email.toLowerCase() });
        if (u) recipientUserId = u._id;
      }
    }

    if (recipientUserId) {
      let notifTitle = 'Industry Collaboration Status Update';
      let notifMessage = `Your collaboration request with ${partnerName} for project "${project.title}" has been updated to ${status}.`;

      if (status === 'ACCEPTED') {
        notifTitle = 'Collaboration Request Accepted!';
        notifMessage = `Great news! ${partnerName} has accepted your ${partnership.supportType} request for project "${project.title}".`;
      } else if (status === 'REJECTED') {
        notifTitle = 'Collaboration Request Notice';
        notifMessage = `Your collaboration request to ${partnerName} for project "${project.title}" was not accepted at this time.`;
      } else if (status === 'ACTIVE') {
        notifTitle = 'Partnership Activated!';
        notifMessage = `Active collaboration initiated with ${partnerName} on project "${project.title}".`;
      }

      await dispatchNotification({
        recipient: recipientUserId,
        sender: req.user.id,
        senderName: req.user.name,
        title: notifTitle,
        message: notifMessage,
        type: status === 'ACCEPTED' ? 'INDUSTRY_REQUEST_ACCEPTED' : 'STATUS_CHANGE',
        relatedEntity: 'Partnership',
        relatedEntityId: partnership._id,
        project: project._id
      });
    }

    return successResponse(res, `Partnership status updated to ${status} successfully`, {
      partnership
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  createProject,
  transitionStage,
  addMilestone,
  updateMilestone,
  deleteMilestone,
  addMilestoneComment,
  uploadProjectDocument,
  addProjectUpdate,
  addProjectComment,
  submitImpactOutcome,
  adminIntervene,
  submitProposal,
  reviewProposal,
  assignMentor,
  recommendIndustriesForProject,
  acceptIndustryRecommendation,
  ignoreIndustryRecommendation,
  requestIndustryCollaboration,
  requestMentorReview,
  addMentorFeedback,
  updateProjectPrototype,
  getProjectTests,
  createProjectTest,
  uploadTestEvidence,
  reviewProjectTest,
  getProjectPartnerships,
  updatePartnershipStatus
};
