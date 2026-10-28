const Student = require('../models/Student');
const User = require('../models/User');
const Project = require('../models/Project');
const Team = require('../models/Team');
const Challenge = require('../models/Challenge');
const Faculty = require('../models/Faculty');
const Notification = require('../models/Notification');
const StudentInterest = require('../models/StudentInterest');
const Industry = require('../models/Industry');
const Partnership = require('../models/Partnership');
const Achievement = require('../models/Achievement');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get students
 * GET /api/students
 */
const getStudents = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'UNIVERSITY') {
      filter.university = req.user.id;
    } else if (req.user.role === 'STUDENT') {
      // Return student profile for caller or their peers in university
      const s = await Student.findOne({ user: req.user.id });
      if (s) filter.university = s.university;
    }

    const students = await Student.find(filter)
      .populate('assignedTeam', 'name project')
      .sort({ name: 1 });

    return successResponse(res, 'Student innovator directory retrieved successfully', { students });
  } catch (error) {
    next(error);
  }
};

/**
 * Add student profile
 * POST /api/students
 */
const addStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can add student profiles', null, 403);
    }

    const { name, email, department, year, skills, expertise } = req.body;

    if (!name || !email || !department) {
      return errorResponse(res, 'Name, email, and department are required', null, 400);
    }

    const universityId = req.user.role === 'UNIVERSITY' ? req.user.id : req.body.universityId;

    // Check if user account with this email exists to link
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    const student = await Student.create({
      university: universityId,
      user: existingUser ? existingUser._id : undefined,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      department: department.trim(),
      year: year || '3rd Year B.Tech',
      skills: Array.isArray(skills) ? skills : [],
      expertise: Array.isArray(expertise) ? expertise : []
    });

    return successResponse(res, 'Student profile created successfully', { student }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update student profile
 * PUT /api/students/:id
 */
const updateStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can update student records', null, 403);
    }

    const { id } = req.params;
    const { name, department, year, skills, expertise, isActive } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return errorResponse(res, 'Student record not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && student.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to modify student of another institution', null, 403);
    }

    if (name) student.name = name.trim();
    if (department) student.department = department.trim();
    if (year) student.year = year.trim();
    if (Array.isArray(skills)) student.skills = skills;
    if (Array.isArray(expertise)) student.expertise = expertise;
    if (isActive !== undefined) student.isActive = isActive;

    await student.save();

    return successResponse(res, 'Student profile updated successfully', { student });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove student profile
 * DELETE /api/students/:id
 */
const removeStudent = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can remove student records', null, 403);
    }

    const { id } = req.params;
    const student = await Student.findById(id);
    if (!student) {
      return errorResponse(res, 'Student record not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && student.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to remove student of another institution', null, 403);
    }

    student.isActive = false;
    student.assignedTeam = undefined;
    await student.save();

    // Pull student from any team membership
    await Team.updateMany(
      { 'members.student': id },
      { $pull: { members: { student: id } } }
    );

    return successResponse(res, 'Student profile removed successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to ensure an authenticated student has an active innovation project & team
 */
const ensureActiveStudentProject = async (user) => {
  try {
    const userId = user._id || user.id;

    // 1. Resolve or create Student profile
    let student = await Student.findOne({
      $or: [{ user: userId }, { email: user.email.toLowerCase() }]
    });

    let uniUser = await User.findOne({ role: 'UNIVERSITY', isActive: true });
    if (!uniUser) {
      uniUser = (await User.findOne({ email: 'admin@dtu.ac.in' })) || user;
    }

    if (!student) {
      student = await Student.create({
        user: userId,
        name: user.name || 'Student Innovator',
        email: user.email.toLowerCase(),
        university: uniUser?._id || userId,
        department: 'Computer Science & Engineering',
        year: 'Final Year B.Tech',
        skills: ['IoT Systems', 'Embedded Sensors', 'Telemetry', 'Full-Stack'],
        expertise: ['Urban Civic Engineering', 'Sensors']
      });
    } else if (!student.user) {
      student.user = userId;
      await student.save();
    }

    // 2. Check if student already has a team linked to an existing project
    let existingTeam = null;
    if (student.assignedTeam) {
      existingTeam = await Team.findById(student.assignedTeam);
    }
    if (!existingTeam) {
      existingTeam = await Team.findOne({
        'members.student': student._id
      });
    }

    if (existingTeam && existingTeam.project) {
      const existingProj = await Project.findById(existingTeam.project);
      if (existingProj) {
        return { student, project: existingProj, team: existingTeam };
      }
    }

    // 3. Resolve supporting Mentor & Challenge
    let facultyMentor = await Faculty.findOne();
    if (!facultyMentor) {
      const facultyUser = await User.findOne({ role: 'FACULTY' });
      facultyMentor = await Faculty.create({
        university: uniUser._id,
        user: facultyUser?._id,
        name: 'Dr. Rajesh Sharma',
        email: facultyUser?.email || 'rajesh.sharma@dtu.ac.in',
        department: 'Civil & Environmental Engineering',
        specialization: 'Municipal Hydro-informatics, Sensor Networks & Urban Infrastructure',
        experience: '12+ Years'
      });
    }

    let challenge = await Challenge.findOne({
      $or: [
        { title: /Pipeline Leakage|Water Leakage|Pipe/i },
        { status: { $in: ['ALLOCATED', 'ACTIVE', 'IN_PROGRESS', 'OPEN'] } }
      ]
    });

    if (!challenge) {
      challenge = await Challenge.create({
        title: 'Real-Time Pipeline Leakage & Burst Detection Across Ward Distribution Mains',
        code: 'DEL-WAT-2026-08',
        problemSummary: 'High prevalence of micro-fractures in underground municipal distribution pipelines leading to 35% potable water loss.',
        category: 'WATER',
        district: 'Central Delhi',
        priority: 'HIGH',
        status: 'ALLOCATED',
        university: uniUser._id,
        expectedOutcome: 'Low-power acoustic sensor telemetry network with automated leak localization within 2 meters.',
        submittedDate: new Date(Date.now() - 30 * 86400000)
      });
    }

    // 4. Look for existing project in database to assign
    let project = await Project.findOne({
      title: /Autonomous Pipe Leakage Detection System/i
    });

    // 5. Create or update Team
    let team = existingTeam;
    if (!team) {
      team = await Team.findOne({ name: 'Central Delhi Smart Water Cohort' });
    }

    if (!team) {
      team = await Team.create({
        name: 'Central Delhi Smart Water Cohort',
        university: uniUser._id,
        facultyMentor: facultyMentor._id,
        members: [
          {
            student: student._id,
            role: 'Team Lead',
            responsibility: 'System Architecture, Hardware Prototyping & Council Liaison',
            status: 'ACCEPTED',
            joinedAt: new Date()
          }
        ]
      });
    } else {
      const memberExists = team.members.some(
        (m) => m.student && m.student.toString() === student._id.toString()
      );
      if (!memberExists) {
        team.members.push({
          student: student._id,
          role: 'Team Lead',
          responsibility: 'System Architecture, Hardware Prototyping & Council Liaison',
          status: 'ACCEPTED',
          joinedAt: new Date()
        });
      }
      if (!team.facultyMentor) {
        team.facultyMentor = facultyMentor._id;
      }
      await team.save();
    }

    student.assignedTeam = team._id;
    await student.save();

    // 6. Create or update Project
    if (!project) {
      project = await Project.create({
        title: 'Autonomous Pipe Leakage Detection System',
        description: 'Underground acoustic vibration sensing to detect municipal pipeline micro-bursts and water pressure drops across ward distribution lines.',
        proposedSolution: 'Field IoT acoustic sensor network communicating via LoRaWAN to municipal pipeline control center.',
        challengeId: challenge._id,
        universityId: uniUser._id,
        mentor: facultyMentor._id,
        team: team._id,
        status: 'PROTOTYPE',
        overallProgress: 45,
        timeline: '6 Months (3 Sprints)',
        proposal: {
          problemUnderstanding: 'Aging municipal water transmission mains in Delhi suffer up to 35% non-revenue water losses due to undetected micro-fractures in high-density urban wards.',
          proposedSolution: 'Non-invasive ultrasonic acoustic leak detectors clamped on pipe junctions transmitting continuous frequency spectrum telemetry via LoRaWAN.',
          methodology: 'Phase 1: Benchtop acoustic resonance testing. Phase 2: Embedded ESP32 edge processing firmware. Phase 3: Live Ward 42 pilot validation.',
          technology: ['ESP32 Microcontroller', 'LoRaWAN 865MHz', 'Piezo Transducers', 'Node.js', 'React'],
          timeline: '6 Months (Sprint 1: Sensor assembly, Sprint 2: LoRa gateway, Sprint 3: Ward pilot)',
          expectedImpact: 'Reduces municipal potable water distribution loss by 2.4 million liters annually across pilot ward.',
          approvalStatus: 'SUBMITTED',
          submittedAt: new Date(Date.now() - 14 * 86400000)
        },
        mentorReviewStatus: 'IN_REVIEW',
        lastMentorFeedback: 'Initial bench testing shows strong signal-to-noise ratio. Ensure IP68 waterproofing seal is tested before field placement.',
        lastMentorFeedbackDate: new Date(Date.now() - 3 * 86400000),
        upcomingMentorReview: new Date(Date.now() + 7 * 86400000),
        milestones: [
          {
            title: 'Acoustic Sensor Hardware Assembly & IP68 Potting',
            description: 'Assemble piezo hydrophone transducer circuits with ESP32 microcontroller and IP68 waterproof housing.',
            status: 'COMPLETED',
            progress: 100,
            dueDate: new Date(Date.now() - 5 * 86400000),
            deliverables: ['Custom PCB schematic', 'IP68 enclosure test report', 'Prototype sensor pod photo'],
            assignedMembers: [userId]
          },
          {
            title: 'LoRa Telemetry Field Gateway Deployment',
            description: 'Set up LoRaWAN 865 MHz gateway antenna on municipal ward tower and configure encrypted sensor packet uplink.',
            status: 'IN_PROGRESS',
            progress: 50,
            dueDate: new Date(Date.now() + 10 * 86400000),
            deliverables: ['LoRaWAN packet decode script', 'Gateway coverage heatmap', 'Cloud ingestion API telemetry'],
            assignedMembers: [userId]
          },
          {
            title: 'Municipal Pipeline Pilot Calibration & Validation',
            description: 'Conduct field burst simulation on Delhi Jal Board pilot pipeline section and verify automated leak alerts.',
            status: 'NOT_STARTED',
            progress: 0,
            dueDate: new Date(Date.now() + 30 * 86400000),
            deliverables: ['Ward calibration log', 'Acoustic frequency FFT plots', 'Municipal operator sign-off certificate'],
            assignedMembers: [userId]
          }
        ]
      });
    } else {
      project.team = team._id;
      if (!project.mentor) project.mentor = facultyMentor._id;
      if (!project.universityId) project.universityId = uniUser._id;
      if (!project.challengeId) project.challengeId = challenge._id;
      if (!project.proposal || !project.proposal.problemUnderstanding) {
        project.proposal = {
          problemUnderstanding: 'Aging municipal water transmission mains in Delhi suffer up to 35% non-revenue water losses due to undetected micro-fractures in high-density urban wards.',
          proposedSolution: 'Non-invasive ultrasonic acoustic leak detectors clamped on pipe junctions transmitting continuous frequency spectrum telemetry via LoRaWAN.',
          methodology: 'Phase 1: Benchtop acoustic resonance testing. Phase 2: Embedded ESP32 edge processing firmware. Phase 3: Live Ward 42 pilot validation.',
          technology: ['ESP32 Microcontroller', 'LoRaWAN 865MHz', 'Piezo Transducers', 'Node.js', 'React'],
          timeline: '6 Months (Sprint 1: Sensor assembly, Sprint 2: LoRa gateway, Sprint 3: Ward pilot)',
          expectedImpact: 'Reduces municipal potable water distribution loss by 2.4 million liters annually across pilot ward.',
          approvalStatus: 'SUBMITTED',
          submittedAt: new Date(Date.now() - 14 * 86400000)
        };
      }
      await project.save();
    }

    team.project = project._id;
    await team.save();

    return { student, project, team };
  } catch (err) {
    console.error('ensureActiveStudentProject error:', err);
    return null;
  }
};

/**
 * Get student dashboard data
 * GET /api/student/dashboard
 */
const getStudentDashboard = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can access their dashboard', null, 403);
    }

    // Ensure student has an active innovation project workspace provisioned
    await ensureActiveStudentProject(req.user);

    // 1. Resolve student profile linked to authenticated user (never accept ID from frontend)
    let student = await Student.findOne({ user: req.user.id }).populate('university', 'name organization district');
    if (!student) {
      student = await Student.findOne({ email: req.user.email.toLowerCase() });
      if (student) {
        student.user = req.user.id;
        await student.save();
        await student.populate('university', 'name organization district');
      } else {
        // Resolve university from user organization or active university
        let universityId = null;
        if (req.user.organization) {
          const uniUser = await User.findOne({
            role: 'UNIVERSITY',
            $or: [
              { name: { $regex: req.user.organization, $options: 'i' } },
              { organization: { $regex: req.user.organization, $options: 'i' } }
            ]
          });
          if (uniUser) universityId = uniUser._id;
        }
        if (!universityId) {
          const defaultUni = await User.findOne({ role: 'UNIVERSITY', isActive: true });
          universityId = defaultUni ? defaultUni._id : req.user.id;
        }

        student = await Student.create({
          university: universityId,
          user: req.user.id,
          name: req.user.name,
          email: req.user.email.toLowerCase(),
          department: req.user.organization ? `${req.user.organization} Engineering` : 'Engineering & Technology',
          year: '3rd Year B.Tech',
          skills: ['Research', 'Civic Technology', 'System Prototyping'],
          expertise: ['Societal Innovation']
        });
        await student.populate('university', 'name organization district');
      }
    }

    // 2. Resolve multidisciplinary team membership
    let team = null;
    if (student.assignedTeam) {
      team = await Team.findById(student.assignedTeam)
        .populate('members.student', 'name department year skills')
        .populate('facultyMentor', 'name department email specialization')
        .populate('project', 'title challengeId status overallProgress');
    }
    if (!team) {
      team = await Team.findOne({
        $or: [
          { 'members.student': student._id },
          { 'members.student': req.user.id }
        ]
      })
        .populate('members.student', 'name department year skills')
        .populate('facultyMentor', 'name department email specialization')
        .populate('project', 'title challengeId status overallProgress');

      if (team && !student.assignedTeam) {
        student.assignedTeam = team._id;
        await student.save();
      }
    }

    // 3. Find projects linked via team membership
    const teamIds = [];
    if (team) teamIds.push(team._id);

    const otherTeams = await Team.find({
      $or: [
        { 'members.student': student._id },
        { 'members.student': req.user.id }
      ]
    }).select('_id');

    otherTeams.forEach((t) => {
      if (!teamIds.some((id) => id.toString() === t._id.toString())) {
        teamIds.push(t._id);
      }
    });

    let projects = [];
    if (teamIds.length > 0) {
      projects = await Project.find({
        $or: [
          { team: { $in: teamIds } },
          ...(team && team.project ? [{ _id: team.project }] : [])
        ]
      })
        .populate('challengeId', 'code title category district status priority')
        .populate('universityId', 'name organization district')
        .populate('mentor', 'name department email specialization')
        .populate('team', 'name members')
        .sort({ updatedAt: -1 });
    }

    const activeProjects = projects.filter((p) => !['COMPLETED', 'CANCELLED'].includes(p.status));

    // 4. Resolve assigned challenges
    const assignedChallengeIds = new Set();
    const directChallenges = await Challenge.find({
      $or: [
        { assignedStudents: req.user.id },
        { assignedStudents: student._id }
      ]
    }).select('_id');
    directChallenges.forEach((c) => assignedChallengeIds.add(c._id.toString()));

    projects.forEach((p) => {
      const cId = p.challengeId?._id || p.challengeId;
      if (cId) assignedChallengeIds.add(cId.toString());
    });

    const acceptedInterests = await StudentInterest.find({
      student: req.user.id,
      status: 'ACCEPTED'
    }).select('challenge');
    acceptedInterests.forEach((i) => {
      if (i.challenge) assignedChallengeIds.add(i.challenge.toString());
    });

    // 5. Extract milestones and calculate innovation credits from real MongoDB data
    let completedMilestones = 0;
    let pendingMilestones = 0;
    let innovationCredits = 0;
    const upcomingMilestones = [];

    projects.forEach((p) => {
      if (p.milestones && Array.isArray(p.milestones)) {
        p.milestones.forEach((m) => {
          if (m.status === 'COMPLETED') {
            completedMilestones++;
            innovationCredits += 10;
          } else if (['IN_PROGRESS', 'NOT_STARTED', 'UNDER_REVIEW', 'DELAYED'].includes(m.status)) {
            pendingMilestones++;
            upcomingMilestones.push({
              _id: m._id,
              projectId: p._id,
              projectTitle: p.title,
              title: m.title,
              description: m.description,
              status: m.status,
              progress: m.progress || 0,
              dueDate: m.dueDate
            });
          }
        });
      }

      if (p.status === 'COMPLETED') {
        innovationCredits += 50;
      }
      if (p.impactOutcome && p.impactOutcome.peopleBenefited > 0) {
        innovationCredits += Math.min(50, Math.floor(p.impactOutcome.peopleBenefited / 100));
      }
    });

    upcomingMilestones.sort((a, b) => {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    });

    // 6. Extract recent activity from live project updates and comments
    const recentActivity = [];
    projects.forEach((p) => {
      if (p.updates && Array.isArray(p.updates)) {
        p.updates.forEach((u) => {
          recentActivity.push({
            _id: u._id,
            projectId: p._id,
            projectTitle: p.title,
            title: u.title,
            content: u.content,
            type: u.type,
            createdAt: u.createdAt
          });
        });
      }
      if (p.comments && Array.isArray(p.comments)) {
        p.comments.forEach((c) => {
          recentActivity.push({
            _id: c._id,
            projectId: p._id,
            projectTitle: p.title,
            title: `Comment from ${c.userName || 'Peer'} (${c.userRole || 'COLLABORATOR'})`,
            content: c.comment,
            type: 'COMMENT',
            createdAt: c.createdAt
          });
        });
      }
    });

    recentActivity.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // 7. Get unread notification count
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    // 8. Construct statistics payload
    const stats = {
      activeProjects: activeProjects.length,
      assignedChallenges: assignedChallengeIds.size,
      pendingMilestones,
      completedMilestones,
      teamMembers: team && team.members ? team.members.length : 0,
      innovationCredits
    };

    // 9. Format active projects
    const formattedProjects = projects.map((p) => {
      const nextM = (p.milestones || []).find((m) => m.status !== 'COMPLETED');
      return {
        _id: p._id,
        title: p.title,
        challenge: p.challengeId?.title || null,
        category: p.challengeId?.category || null,
        district: p.challengeId?.district || null,
        status: p.status,
        progress: p.overallProgress,
        mentor: p.mentor?.name || (team?.facultyMentor ? team.facultyMentor.name : null),
        teamSize: p.team?.members?.length || (team ? team.members.length : 0),
        nextMilestone: nextM ? nextM.title : null,
        deadline: nextM ? nextM.dueDate : null
      };
    });

    return successResponse(res, 'Student dashboard data retrieved successfully', {
      student: {
        _id: student._id,
        name: student.name,
        email: student.email,
        department: student.department,
        year: student.year,
        skills: student.skills,
        expertise: student.expertise,
        university: student.university
      },
      stats,
      activeProjects: formattedProjects,
      upcomingMilestones: upcomingMilestones.slice(0, 5),
      recentActivity: recentActivity.slice(0, 5),
      notifications: {
        unreadCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stage labels for lifecycle display
 */
const STAGE_LABELS = {
  CHALLENGE_ACCEPTED: 'Challenge Accepted',
  PROJECT_CREATED: 'Project Created',
  PROPOSAL_SUBMITTED: 'Proposal Submitted',
  APPROVED: 'Council Approved',
  RESEARCH: 'Academic Research',
  PROTOTYPE: 'Prototype Fabrication',
  TESTING: 'Benchtop & Field Testing',
  PILOT: 'Municipal Pilot',
  VALIDATION: 'Impact Validation',
  DEPLOYMENT: 'Civic Deployment',
  COMPLETED: 'Completed'
};

/**
 * Get student projects with membership verification, stage filtering, and search
 * GET /api/student/projects
 */
const getStudentProjects = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can access their innovation projects', null, 403);
    }

    // Ensure student has an active innovation project workspace provisioned
    await ensureActiveStudentProject(req.user);

    const { filter, search } = req.query;

    // 1. Resolve student profile linked to authenticated user (never accept ID from frontend)
    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      student = await Student.findOne({ email: req.user.email.toLowerCase() });
      if (student) {
        student.user = req.user.id;
        await student.save();
      }
    }

    const studentId = student ? student._id : null;
    const userId = req.user.id;

    // 2. Resolve multidisciplinary teams where student is enrolled
    const teamQuery = [];
    if (studentId) teamQuery.push({ 'members.student': studentId });
    teamQuery.push({ 'members.student': userId });

    const teams = await Team.find({ $or: teamQuery })
      .populate('members.student', 'name email department year')
      .populate('facultyMentor', 'name department email specialization');

    const teamIds = teams.map((t) => t._id);
    const teamProjectIds = teams.filter((t) => t.project).map((t) => t.project);

    // 3. Build project membership query (Backend must strictly determine membership)
    const membershipConditions = [];
    if (teamIds.length > 0) membershipConditions.push({ team: { $in: teamIds } });
    if (teamProjectIds.length > 0) membershipConditions.push({ _id: { $in: teamProjectIds } });
    membershipConditions.push({ 'milestones.assignedMembers': userId });
    if (studentId) membershipConditions.push({ 'milestones.assignedMembers': studentId });

    if (membershipConditions.length === 0) {
      return successResponse(res, 'Student projects retrieved successfully', {
        count: 0,
        projects: []
      });
    }

    const query = { $and: [{ $or: membershipConditions }] };

    // 4. Stage & Status Filtering
    if (filter && filter !== 'all') {
      const normalizedFilter = filter.toLowerCase().trim();
      switch (normalizedFilter) {
        case 'active':
          query.$and.push({ status: { $nin: ['COMPLETED', 'CANCELLED'] } });
          break;
        case 'pending_approval':
        case 'pending approval':
          query.$and.push({
            $or: [
              { status: { $in: ['PROJECT_CREATED', 'PROPOSAL_SUBMITTED'] } },
              { 'proposal.approvalStatus': { $in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_REVISION'] } }
            ]
          });
          break;
        case 'research':
          query.$and.push({ status: 'RESEARCH' });
          break;
        case 'prototype':
          query.$and.push({ status: 'PROTOTYPE' });
          break;
        case 'testing':
          query.$and.push({ status: 'TESTING' });
          break;
        case 'pilot':
          query.$and.push({ status: 'PILOT' });
          break;
        case 'completed':
          query.$and.push({ status: 'COMPLETED' });
          break;
        default:
          break;
      }
    }

    // 5. Search Filtering by project name or challenge title/code
    if (search && search.trim()) {
      const searchRegex = { $regex: search.trim(), $options: 'i' };
      const matchingChallenges = await Challenge.find({
        $or: [{ title: searchRegex }, { code: searchRegex }, { category: searchRegex }]
      }).select('_id');
      const matchingChallengeIds = matchingChallenges.map((c) => c._id);

      const searchConditions = [{ title: searchRegex }];
      if (matchingChallengeIds.length > 0) {
        searchConditions.push({ challengeId: { $in: matchingChallengeIds } });
      }
      query.$and.push({ $or: searchConditions });
    }

    // 6. Query projects from MongoDB
    const projects = await Project.find(query)
      .populate('challengeId', 'code title category district priority status impact')
      .populate('universityId', 'name email organization district phone')
      .populate('mentor', 'name department specialization email')
      .populate({
        path: 'team',
        populate: [
          { path: 'members.student', select: 'name email department year' },
          { path: 'facultyMentor', select: 'name department specialization email' }
        ]
      })
      .sort({ updatedAt: -1 });

    // 7. Format projects with all required card fields
    const formattedProjects = projects.map((p) => {
      // Find team for this project
      const projectTeam = p.team || teams.find((t) => t._id.toString() === p.team?.toString() || (t.project && t.project.toString() === p._id.toString()));
      const teamMembers = projectTeam?.members || [];

      // Determine if current student is team lead
      const studentMembership = teamMembers.find((m) => {
        const mId = (m.student?._id || m.student)?.toString();
        return mId === userId.toString() || (studentId && mId === studentId.toString());
      });
      const isTeamLead = studentMembership?.role === 'Team Lead';
      const userRole = studentMembership?.role || 'Contributor';

      // Find next pending milestone and deadline
      const sortedMilestones = [...(p.milestones || [])].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
      const nextMilestoneObj = sortedMilestones.find((m) => m.status !== 'COMPLETED');

      return {
        _id: p._id,
        title: p.title,
        challenge: {
          _id: p.challengeId?._id || null,
          title: p.challengeId?.title || 'Delhi Municipal Innovation Challenge',
          code: p.challengeId?.code || 'DEL-CHALLENGE',
          category: p.challengeId?.category || 'Civic Technology',
          district: p.challengeId?.district || 'Delhi'
        },
        category: p.challengeId?.category || 'Civic Technology',
        district: p.challengeId?.district || p.universityId?.district || 'Central Delhi',
        currentStage: p.status,
        stageLabel: STAGE_LABELS[p.status] || p.status.replace(/_/g, ' '),
        progress: p.overallProgress || 0,
        facultyMentor: {
          name: p.mentor?.name || projectTeam?.facultyMentor?.name || 'Faculty Mentor Assigned',
          department: p.mentor?.department || projectTeam?.facultyMentor?.department || ''
        },
        teamSize: teamMembers.length || 1,
        isTeamLead,
        userRole,
        nextMilestone: nextMilestoneObj ? nextMilestoneObj.title : 'All milestones completed',
        nextDeadline: nextMilestoneObj && nextMilestoneObj.dueDate ? nextMilestoneObj.dueDate : null,
        lastUpdated: p.updatedAt,
        timeline: p.timeline || '6 Months'
      };
    });

    return successResponse(res, 'Student projects retrieved successfully', {
      count: formattedProjects.length,
      projects: formattedProjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Explicitly initialize or assign project for the student
 * POST /api/student/projects/init
 */
const initStudentProject = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can initialize their project workspace', null, 403);
    }
    const result = await ensureActiveStudentProject(req.user);
    if (!result || !result.project) {
      return errorResponse(res, 'Could not initialize project workspace', null, 500);
    }
    return successResponse(res, 'Innovation project workspace initialized successfully', {
      project: result.project,
      team: result.team
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to verify student project membership
 */
const verifyStudentProjectMembership = async (project, user) => {
  if (user.role === 'ADMIN') return true;
  const userId = (user._id || user.id).toString();

  // 1. Check milestone assignedMembers
  const assigned = project.milestones?.some((m) =>
    m.assignedMembers?.some((am) => (am._id || am).toString() === userId)
  );
  if (assigned) return true;

  // 2. Check team members
  if (project.team) {
    const team = project.team.members ? project.team : await Team.findById(project.team);
    if (team && team.members) {
      const studentProfile = await Student.findOne({ user: userId });
      const studentProfileId = studentProfile ? studentProfile._id.toString() : null;

      const isTeamMember = team.members.some((m) => {
        const memberStudentId = (m.student?._id || m.student)?.toString();
        return memberStudentId === userId || (studentProfileId && memberStudentId === studentProfileId);
      });
      if (isTeamMember) return true;
    }
  }

  // 3. Check student's assignedTeam
  const student = await Student.findOne({ user: userId });
  if (student && student.assignedTeam && project.team) {
    const teamId = (project.team._id || project.team).toString();
    if (student.assignedTeam.toString() === teamId) return true;
  }

  return false;
};

/**
 * Get all milestones across projects for authenticated student
 * GET /api/student/milestones
 */
const getStudentMilestones = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can access their project milestones', null, 403);
    }

    // Ensure student has an active innovation project workspace provisioned
    await ensureActiveStudentProject(req.user);

    const student = await Student.findOne({ user: req.user.id });
    const studentId = student ? student._id : null;
    const userId = req.user.id;

    // Resolve teams where student is enrolled
    const teamQuery = [{ 'members.student': userId }];
    if (studentId) teamQuery.push({ 'members.student': studentId });

    const teams = await Team.find({ $or: teamQuery });
    const teamIds = teams.map((t) => t._id);
    const teamProjectIds = teams.filter((t) => t.project).map((t) => t.project);

    const membershipConditions = [];
    if (teamIds.length > 0) membershipConditions.push({ team: { $in: teamIds } });
    if (teamProjectIds.length > 0) membershipConditions.push({ _id: { $in: teamProjectIds } });
    membershipConditions.push({ 'milestones.assignedMembers': userId });
    if (studentId) membershipConditions.push({ 'milestones.assignedMembers': studentId });

    const projects = await Project.find({ $or: membershipConditions })
      .populate('challengeId', 'code title category district priority')
      .populate('mentor', 'name department email specialization')
      .populate('universityId', 'name district')
      .populate('team', 'name members')
      .sort({ updatedAt: -1 });

    const allMilestones = [];

    projects.forEach((proj) => {
      if (!proj.milestones || proj.milestones.length === 0) return;

      proj.milestones.forEach((ms) => {
        const isRevisionRequired = ms.reviewStatus === 'REVISION_REQUIRED';

        allMilestones.push({
          _id: ms._id,
          projectId: proj._id,
          projectTitle: proj.title,
          projectCode: proj.challengeId?.code || 'DEL-CIVIC',
          projectCategory: proj.challengeId?.category || 'Civic Technology',
          projectDistrict: proj.challengeId?.district || proj.universityId?.district || 'Delhi',
          facultyMentor: {
            name: proj.mentor?.name || 'Assigned Faculty Mentor',
            department: proj.mentor?.department || 'Academic Department',
            email: proj.mentor?.email || ''
          },
          title: ms.title,
          description: ms.description || '',
          startDate: ms.startDate || proj.createdAt,
          dueDate: ms.dueDate || null,
          completedDate: ms.completedDate || null,
          progress: ms.progress || 0,
          status: ms.status || 'NOT_STARTED',
          assignedMembers: ms.assignedMembers || [],
          requiredDeliverables: ms.deliverables || [],
          documents: ms.documents || [],
          facultyFeedback: ms.facultyFeedback || '',
          facultyFeedbackDate: ms.facultyFeedbackDate || null,
          facultyReviewerName: ms.facultyReviewerName || (proj.mentor ? proj.mentor.name : 'Faculty Mentor'),
          reviewStatus: ms.reviewStatus || 'PENDING',
          isRevisionRequired,
          submissionNote: ms.submissionNote || '',
          externalLink: ms.externalLink || '',
          canSubmitForReview: !['UNDER_REVIEW', 'COMPLETED'].includes(ms.status),
          canResubmit: isRevisionRequired || ms.status === 'UNDER_REVIEW'
        });
      });
    });

    return successResponse(res, 'Student milestones retrieved successfully', {
      count: allMilestones.length,
      milestones: allMilestones
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update milestone progress
 * PUT /api/student/milestones/:milestoneId/progress
 */
const updateMilestoneProgress = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can update their milestone progress', null, 403);
    }

    const { milestoneId } = req.params;
    const { progress } = req.body;

    const numProgress = Number(progress);
    if (isNaN(numProgress) || numProgress < 0 || numProgress > 100) {
      return errorResponse(res, 'Progress must be a valid percentage between 0 and 100', null, 400);
    }

    if (numProgress >= 100) {
      return errorResponse(
        res,
        'Students cannot self-approve milestones to 100% completed status. Sign-off is strictly reserved for the Supervising Faculty Mentor.',
        null,
        403
      );
    }

    const project = await Project.findOne({ 'milestones._id': milestoneId })
      .populate('team mentor');

    if (!project) {
      return errorResponse(res, 'Milestone not found', null, 404);
    }

    const isMember = await verifyStudentProjectMembership(project, req.user);
    if (!isMember) {
      return errorResponse(res, 'Unauthorized: you are not enrolled in this project', null, 403);
    }

    const ms = project.milestones.id(milestoneId);
    if (!ms) {
      return errorResponse(res, 'Milestone not found in project', null, 404);
    }

    ms.progress = numProgress;
    if (ms.status === 'NOT_STARTED' && numProgress > 0) {
      ms.status = 'IN_PROGRESS';
    }

    // Recalculate project overallProgress
    if (project.milestones.length > 0) {
      const totalProg = project.milestones.reduce((acc, m) => acc + (m.progress || 0), 0);
      project.overallProgress = Math.round(totalProg / project.milestones.length);
    }

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Milestone Progress Saved',
      content: `Updated progress for milestone "${ms.title}" to ${numProgress}%.`,
      type: 'UPDATE',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(res, 'Milestone progress saved successfully', {
      milestone: ms,
      overallProgress: project.overallProgress
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit milestone for faculty mentor review
 * POST /api/student/milestones/:milestoneId/submit-review
 */
const submitMilestoneForReview = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can submit milestones for review', null, 403);
    }

    const { milestoneId } = req.params;
    const { note } = req.body;

    const project = await Project.findOne({ 'milestones._id': milestoneId })
      .populate('team mentor universityId');

    if (!project) {
      return errorResponse(res, 'Milestone not found', null, 404);
    }

    const isMember = await verifyStudentProjectMembership(project, req.user);
    if (!isMember) {
      return errorResponse(res, 'Unauthorized: you are not enrolled in this project', null, 403);
    }

    const ms = project.milestones.id(milestoneId);
    if (!ms) {
      return errorResponse(res, 'Milestone not found in project', null, 404);
    }

    ms.status = 'UNDER_REVIEW';
    ms.reviewStatus = 'PENDING';
    if (note) ms.submissionNote = note;

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Milestone Submitted for Review',
      content: `Submitted milestone "${ms.title}" for supervising faculty evaluation.${note ? ` Note: "${note}"` : ''}`,
      type: 'MILESTONE_COMPLETION',
      createdAt: new Date()
    });

    await project.save();

    // Notify faculty mentor
    let mentorUserId = null;
    if (project.mentor) {
      if (project.mentor.user) {
        mentorUserId = project.mentor.user;
      } else if (project.mentor.email) {
        const u = await User.findOne({ email: project.mentor.email.toLowerCase() });
        if (u) mentorUserId = u._id;
      }
    }
    if (!mentorUserId && project.universityId) {
      mentorUserId = project.universityId._id || project.universityId;
    }

    if (mentorUserId) {
      await dispatchNotification({
        recipient: mentorUserId,
        sender: req.user.id,
        senderName: req.user.name,
        type: 'MILESTONE_REVIEW_REQUESTED',
        title: `Milestone Review Requested: ${ms.title}`,
        message: `${req.user.name} submitted milestone "${ms.title}" for project "${project.title}" for academic review.`,
        relatedEntity: 'Project',
        entityId: project._id,
        priority: 'HIGH'
      });
    }

    return successResponse(res, 'Milestone submitted for faculty review successfully', {
      milestone: ms
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Submit milestone deliverable with Cloudinary file upload
 * POST /api/student/milestones/:milestoneId/deliverables
 */
const submitMilestoneDeliverable = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can submit project deliverables', null, 403);
    }

    const { milestoneId } = req.params;
    const { title, description, submissionNote, externalLink } = req.body;

    if (!req.file) {
      return errorResponse(res, 'Deliverable file attachment is required', null, 400);
    }

    const project = await Project.findOne({ 'milestones._id': milestoneId })
      .populate('team mentor universityId');

    if (!project) {
      return errorResponse(res, 'Milestone not found', null, 404);
    }

    const isMember = await verifyStudentProjectMembership(project, req.user);
    if (!isMember) {
      return errorResponse(res, 'Unauthorized: you are not enrolled in this project', null, 403);
    }

    const ms = project.milestones.id(milestoneId);
    if (!ms) {
      return errorResponse(res, 'Milestone not found in project', null, 404);
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'delhi_project_deliverables'
    );

    const docEntry = {
      title: title || req.file.originalname,
      description: description || '',
      url: uploadResult.url,
      publicId: uploadResult.publicId || '',
      fileType: req.file.mimetype || 'application/pdf',
      submissionNote: submissionNote || '',
      externalLink: externalLink || '',
      projectId: project._id,
      milestoneId: ms._id,
      uploadedBy: req.user.id,
      uploaderName: req.user.name,
      uploaderRole: req.user.role,
      uploadedAt: new Date()
    };

    ms.documents.push(docEntry);
    project.documents.push(docEntry);

    // If milestone was NOT_STARTED, progress to IN_PROGRESS
    if (ms.status === 'NOT_STARTED') {
      ms.status = 'IN_PROGRESS';
      if (ms.progress === 0) ms.progress = 25;
    }

    // If revision was required, update review status to PENDING and under review
    if (ms.reviewStatus === 'REVISION_REQUIRED') {
      ms.reviewStatus = 'PENDING';
      ms.status = 'UNDER_REVIEW';
    }

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Deliverable Uploaded',
      content: `Submitted deliverable "${docEntry.title}" for milestone "${ms.title}".`,
      type: 'DOCUMENT_UPLOAD',
      createdAt: new Date()
    });

    await project.save();

    // Notify faculty mentor
    let mentorUserId = null;
    if (project.mentor) {
      if (project.mentor.user) {
        mentorUserId = project.mentor.user;
      } else if (project.mentor.email) {
        const u = await User.findOne({ email: project.mentor.email.toLowerCase() });
        if (u) mentorUserId = u._id;
      }
    }
    if (!mentorUserId && project.universityId) {
      mentorUserId = project.universityId._id || project.universityId;
    }

    if (mentorUserId) {
      await dispatchNotification({
        recipient: mentorUserId,
        sender: req.user.id,
        senderName: req.user.name,
        type: 'MILESTONE_DELIVERABLE_SUBMITTED',
        title: `Deliverable Submitted: ${docEntry.title}`,
        message: `${req.user.name} uploaded new deliverable "${docEntry.title}" for milestone "${ms.title}" in project "${project.title}".`,
        relatedEntity: 'Project',
        entityId: project._id,
        priority: 'MEDIUM'
      });
    }

    return successResponse(
      res,
      'Deliverable uploaded and attached to milestone successfully',
      {
        deliverable: docEntry,
        milestone: ms
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all documents across projects for authenticated student
 * GET /api/student/documents
 */
const getStudentDocuments = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can access their project documents', null, 403);
    }

    // Ensure student has an active innovation project workspace provisioned
    await ensureActiveStudentProject(req.user);

    const student = await Student.findOne({ user: req.user.id });
    const studentId = student ? student._id : null;
    const userId = req.user.id;

    // Resolve teams where student is enrolled
    const teamQuery = [{ 'members.student': userId }];
    if (studentId) teamQuery.push({ 'members.student': studentId });

    const teams = await Team.find({ $or: teamQuery });
    const teamIds = teams.map((t) => t._id);
    const teamProjectIds = teams.filter((t) => t.project).map((t) => t.project);

    const membershipConditions = [];
    if (teamIds.length > 0) membershipConditions.push({ team: { $in: teamIds } });
    if (teamProjectIds.length > 0) membershipConditions.push({ _id: { $in: teamProjectIds } });
    membershipConditions.push({ 'milestones.assignedMembers': userId });
    if (studentId) membershipConditions.push({ 'milestones.assignedMembers': studentId });

    const projects = await Project.find({ $or: membershipConditions })
      .populate('challengeId', 'code title category district priority')
      .populate('mentor', 'name department email specialization')
      .populate('universityId', 'name district')
      .populate('team', 'name members')
      .sort({ updatedAt: -1 });

    const { projectId, milestoneId, documentType, search } = req.query;

    const allDocuments = [];

    projects.forEach((proj) => {
      // If filtering by specific project
      if (projectId && proj._id.toString() !== projectId) return;

      // Project-level documents
      if (proj.documents && proj.documents.length > 0) {
        proj.documents.forEach((doc) => {
          allDocuments.push({
            _id: doc._id,
            title: doc.title,
            description: doc.description || '',
            url: doc.url,
            publicId: doc.publicId || '',
            fileType: doc.fileType || 'application/pdf',
            projectId: proj._id,
            projectTitle: proj.title,
            projectCode: proj.challengeId?.code || 'DEL-CIVIC',
            milestoneId: doc.milestoneId || null,
            milestoneTitle: doc.milestoneId
              ? proj.milestones?.id(doc.milestoneId)?.title || 'Sprint Deliverable'
              : 'General Vault',
            uploadedBy: doc.uploadedBy,
            uploaderName: doc.uploaderName || 'Stakeholder',
            uploaderRole: doc.uploaderRole || 'STUDENT',
            uploadedAt: doc.uploadedAt,
            submissionNote: doc.submissionNote || '',
            externalLink: doc.externalLink || '',
            status: 'VAULTED'
          });
        });
      }

      // Milestone-level documents
      if (proj.milestones && proj.milestones.length > 0) {
        proj.milestones.forEach((ms) => {
          if (milestoneId && ms._id.toString() !== milestoneId) return;

          if (ms.documents && ms.documents.length > 0) {
            ms.documents.forEach((doc) => {
              const alreadyExists = allDocuments.some(
                (d) =>
                  d._id?.toString() === doc._id?.toString() ||
                  (d.url === doc.url && d.title === doc.title)
              );
              if (!alreadyExists) {
                allDocuments.push({
                  _id: doc._id,
                  title: doc.title,
                  description: doc.description || '',
                  url: doc.url,
                  publicId: doc.publicId || '',
                  fileType: doc.fileType || 'application/pdf',
                  projectId: proj._id,
                  projectTitle: proj.title,
                  projectCode: proj.challengeId?.code || 'DEL-CIVIC',
                  milestoneId: ms._id,
                  milestoneTitle: ms.title,
                  uploadedBy: doc.uploadedBy,
                  uploaderName: doc.uploaderName || 'Student Innovator',
                  uploaderRole: doc.uploaderRole || 'STUDENT',
                  uploadedAt: doc.uploadedAt,
                  submissionNote: doc.submissionNote || '',
                  externalLink: doc.externalLink || '',
                  status: 'ATTACHED'
                });
              }
            });
          }
        });
      }
    });

    // Apply documentType filter
    let filteredDocs = allDocuments;
    if (documentType && documentType !== 'all') {
      const dt = documentType.toLowerCase();
      filteredDocs = filteredDocs.filter((d) => (d.fileType || '').toLowerCase().includes(dt));
    }

    // Apply search filter
    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filteredDocs = filteredDocs.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.projectTitle.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q))
      );
    }

    return successResponse(res, 'Student documents retrieved successfully', {
      count: filteredDocs.length,
      documents: filteredDocs
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload document belonging to student's project
 * POST /api/student/documents
 */
const uploadStudentDocument = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can upload project documents', null, 403);
    }

    const { projectId, milestoneId, title, description, submissionNote, externalLink } = req.body;

    if (!req.file) {
      return errorResponse(res, 'File attachment is required', null, 400);
    }

    if (!projectId) {
      return errorResponse(res, 'Target project ID is required', null, 400);
    }

    const project = await Project.findById(projectId).populate('team mentor');
    if (!project) {
      return errorResponse(res, 'Target project not found', null, 404);
    }

    const isMember = await verifyStudentProjectMembership(project, req.user);
    if (!isMember) {
      return errorResponse(res, 'Unauthorized: you are not enrolled in this project', null, 403);
    }

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'delhi_project_documents'
    );

    const docEntry = {
      title: title || req.file.originalname,
      description: description || '',
      url: uploadResult.url,
      publicId: uploadResult.publicId || '',
      fileType: req.file.mimetype || 'application/pdf',
      milestoneId: milestoneId || undefined,
      projectId: project._id,
      uploadedBy: req.user.id,
      uploaderName: req.user.name,
      uploaderRole: req.user.role,
      submissionNote: submissionNote || '',
      externalLink: externalLink || '',
      uploadedAt: new Date()
    };

    project.documents.push(docEntry);

    // If milestone specified, also attach to milestone
    if (milestoneId) {
      const ms = project.milestones.id(milestoneId);
      if (ms) {
        ms.documents.push(docEntry);
      }
    }

    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Document Vaulted',
      content: `Uploaded technical document "${docEntry.title}" to project repository.`,
      type: 'DOCUMENT_UPLOAD',
      createdAt: new Date()
    });

    await project.save();

    return successResponse(
      res,
      'Document uploaded to project vault successfully',
      {
        document: docEntry
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get Industry Partners relevant to student's project
 * GET /api/student/industry
 */
const getStudentIndustryPartners = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can access this endpoint', null, 403);
    }

    const { projectId, search, supportType } = req.query;

    // Ensure student has active innovation project workspace provisioned
    await ensureActiveStudentProject(req.user);

    const student = await Student.findOne({ user: req.user.id });
    const studentId = student ? student._id : null;
    const userId = req.user.id;

    // Resolve student's enrolled projects
    const teamQuery = [{ 'members.student': userId }];
    if (studentId) teamQuery.push({ 'members.student': studentId });

    const teams = await Team.find({ $or: teamQuery });
    const teamIds = teams.map((t) => t._id);
    const teamProjectIds = teams.filter((t) => t.project).map((t) => t.project);

    const membershipConditions = [];
    if (teamIds.length > 0) membershipConditions.push({ team: { $in: teamIds } });
    if (teamProjectIds.length > 0) membershipConditions.push({ _id: { $in: teamProjectIds } });
    membershipConditions.push({ 'milestones.assignedMembers': userId });
    if (studentId) membershipConditions.push({ 'milestones.assignedMembers': studentId });

    const studentProjects = await Project.find({ $or: membershipConditions }).select('_id title challengeId status');
    const studentProjectIds = studentProjects.map((p) => p._id);

    // Fetch all real MongoDB Industry profiles
    const industryQuery = {};
    if (search && search.trim()) {
      const q = search.trim();
      industryQuery.$or = [
        { name: { $regex: q, $options: 'i' } },
        { industrySector: { $regex: q, $options: 'i' } },
        { expertise: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
        { district: { $regex: q, $options: 'i' } }
      ];
    }

    const industryProfiles = await Industry.find(industryQuery)
      .populate('user', 'name email organization phone district avatar isActive')
      .sort({ name: 1 });

    // Find all partnerships existing for the student's projects
    const targetProjectFilter = projectId ? [projectId] : studentProjectIds;
    const existingPartnerships = await Partnership.find({
      project: { $in: targetProjectFilter }
    }).populate('project', 'title challengeId status');

    // Transform industry records with real data and partnership statuses
    const partners = industryProfiles.map((ind) => {
      const indUserId = ind.user?._id?.toString();
      const indProfileId = ind._id.toString();

      const matchedPartnership = existingPartnerships.find((p) => {
        const pIndUser = p.industry?.toString();
        const pIndProf = p.industryProfile?.toString();
        return (indUserId && pIndUser === indUserId) || (pIndProf && pIndProf === indProfileId);
      });

      const supportedTypes = [
        'MENTORSHIP',
        'FUNDING',
        'TECHNOLOGY',
        'PROTOTYPING',
        'TESTING',
        'PILOT',
        'IMPLEMENTATION',
        'TECH_TRANSFER'
      ];

      const mentorCount = ind.mentorshipCapability?.availableMentorsCount || 0;
      const mentorDomains = ind.mentorshipCapability?.domains || [];

      return {
        _id: ind._id,
        industryProfileId: ind._id,
        industryUserId: ind.user?._id || ind.user,
        company: ind.name || ind.user?.organization || ind.user?.name || 'Accredited Industry Partner',
        organizationType: ind.organizationType || 'Industry',
        industry: ind.industrySector || 'Clean Energy & Civic Infrastructure',
        district: ind.district || ind.user?.district || 'Delhi NCR',
        location: ind.location || 'Delhi, India',
        website: ind.website || '',
        expertise: ind.expertise || [],
        technologies: ind.technologies || [],
        resources: ind.resources || [],
        supportTypes: supportedTypes,
        mentorInfo: {
          availableMentorsCount: mentorCount,
          domains: mentorDomains,
          guidelines: ind.mentorshipCapability?.guidelines || 'Quarterly field reviews and sprint architectural advisement.'
        },
        fundingCapability: ind.fundingCapability || null,
        partnership: matchedPartnership
          ? {
              _id: matchedPartnership._id,
              status: matchedPartnership.status,
              supportType: matchedPartnership.supportType,
              reason: matchedPartnership.reason,
              message: matchedPartnership.message,
              assignedMentor: matchedPartnership.assignedMentor,
              projectTitle: matchedPartnership.project?.title,
              projectId: matchedPartnership.project?._id,
              createdAt: matchedPartnership.createdAt,
              updatedAt: matchedPartnership.updatedAt
            }
          : null,
        status: matchedPartnership ? matchedPartnership.status : 'AVAILABLE'
      };
    });

    // Optional filter by supportType
    let filteredPartners = partners;
    if (supportType && supportType !== 'all') {
      filteredPartners = partners.filter((p) =>
        p.supportTypes.some((st) => st.toLowerCase() === supportType.toLowerCase())
      );
    }

    return successResponse(res, 'Industry partners retrieved successfully', {
      count: filteredPartners.length,
      partners: filteredPartners,
      studentProjects
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Student requests collaboration with an industry partner
 * POST /api/student/industry/collaborate
 */
const requestStudentIndustryCollaboration = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can submit collaboration requests', null, 403);
    }

    const { projectId, industryId, requestedSupport, reason, message } = req.body;

    if (!projectId || !industryId || !requestedSupport) {
      return errorResponse(res, 'Project ID, Industry Partner ID, and Requested Support type are required', null, 400);
    }

    const validSupportTypes = [
      'MENTORSHIP',
      'FUNDING',
      'TECHNOLOGY',
      'PROTOTYPING',
      'TESTING',
      'PILOT',
      'IMPLEMENTATION',
      'TECH_TRANSFER',
      'EXPRESS_INTEREST',
      'PILOT_SUPPORT'
    ];

    if (!validSupportTypes.includes(requestedSupport)) {
      return errorResponse(res, `Invalid support type. Must be one of: ${validSupportTypes.join(', ')}`, null, 400);
    }

    // 1. Verify target project exists and student is an enrolled member
    const project = await Project.findById(projectId).populate('team universityId');
    if (!project) {
      return errorResponse(res, 'Target project not found', null, 404);
    }

    const isMember = await verifyStudentProjectMembership(project, req.user);
    if (!isMember) {
      return errorResponse(res, 'Unauthorized: you are not an enrolled member of this project', null, 403);
    }

    // 2. Resolve industry profile & user
    let indProfile = await Industry.findById(industryId).populate('user');
    let indUser = null;
    if (indProfile) {
      indUser = indProfile.user;
    } else {
      indUser = await User.findById(industryId);
      if (indUser && indUser.role === 'INDUSTRY') {
        indProfile = await Industry.findOne({ user: indUser._id });
      }
    }

    if (!indProfile && !indUser) {
      return errorResponse(res, 'Target industry partner not found in registry', null, 404);
    }

    const industryUserId = indUser?._id || indProfile?.user?._id;
    const industryProfileId = indProfile?._id || null;
    const industryName = indProfile?.name || indUser?.organization || indUser?.name || 'Industry Partner';

    // 3. Prevent duplicate active/pending requests
    const existing = await Partnership.findOne({
      project: project._id,
      $or: [
        { industry: industryUserId },
        ...(industryProfileId ? [{ industryProfile: industryProfileId }] : [])
      ],
      status: { $in: ['PENDING', 'ACCEPTED', 'ACTIVE'] }
    });

    if (existing) {
      if (existing.status === 'PENDING') {
        return errorResponse(res, 'A collaboration request is already pending with this industry partner for this project.', null, 400);
      } else {
        return errorResponse(res, `An active or accepted partnership (${existing.status}) already exists with this industry partner.`, null, 400);
      }
    }

    // 4. Resolve university reference
    let universityId = project.universityId?._id || project.universityId;
    if (!universityId) {
      const defaultUni = await User.findOne({ role: 'UNIVERSITY', isActive: true });
      universityId = defaultUni?._id || req.user.id;
    }

    // 5. Create real Partnership record in MongoDB
    const partnership = await Partnership.create({
      project: project._id,
      industry: industryUserId,
      industryProfile: industryProfileId,
      university: universityId,
      student: req.user.id,
      team: project.team?._id || project.team,
      supportType: requestedSupport,
      reason: reason?.trim() || '',
      message: message?.trim() || '',
      description: message?.trim() || reason?.trim() || `${requestedSupport} support requested by ${req.user.name}`,
      requestedBy: req.user.id,
      requestedRole: 'STUDENT',
      status: 'PENDING'
    });

    // 6. Add to Project's industryPartners array
    if (industryUserId) {
      await Project.findByIdAndUpdate(project._id, {
        $addToSet: { industryPartners: industryUserId }
      });
    }

    // 7. Log timeline update
    project.updates.unshift({
      user: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      title: 'Industry Collaboration Requested',
      content: `Submitted ${requestedSupport} collaboration request to ${industryName}.${reason ? ` Reason: "${reason}"` : ''}`,
      type: 'UPDATE',
      createdAt: new Date()
    });
    await project.save();

    // 8. Dispatch real-time notifications
    if (industryUserId) {
      await dispatchNotification({
        recipient: industryUserId,
        sender: req.user.id,
        senderName: req.user.name,
        title: 'New Student Collaboration Request',
        message: `${req.user.name} submitted a ${requestedSupport} request for project "${project.title}".`,
        type: 'PARTNERSHIP_REQUEST',
        relatedEntity: 'Partnership',
        relatedEntityId: partnership._id
      });
    }

    if (universityId) {
      await dispatchNotification({
        recipient: universityId,
        sender: req.user.id,
        senderName: req.user.name,
        title: 'Student Industry Outreach Initiated',
        message: `${req.user.name} submitted a ${requestedSupport} request to ${industryName} for project "${project.title}".`,
        type: 'PARTNERSHIP_REQUEST',
        relatedEntity: 'Partnership',
        relatedEntityId: partnership._id
      });
    }

    const populated = await Partnership.findById(partnership._id)
      .populate('industry', 'name email organization district phone')
      .populate('industryProfile')
      .populate('project', 'title challengeId status');

    return successResponse(
      res,
      `Collaboration request for ${requestedSupport} submitted successfully to ${industryName}`,
      { partnership: populated },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all partnerships for student's projects
 * GET /api/student/industry/partnerships
 */
const getStudentPartnerships = async (req, res, next) => {
  try {
    if (req.user.role !== 'STUDENT') {
      return errorResponse(res, 'Only students can access this endpoint', null, 403);
    }

    await ensureActiveStudentProject(req.user);

    const student = await Student.findOne({ user: req.user.id });
    const studentId = student ? student._id : null;
    const userId = req.user.id;

    // Resolve student's enrolled projects
    const teamQuery = [{ 'members.student': userId }];
    if (studentId) teamQuery.push({ 'members.student': studentId });

    const teams = await Team.find({ $or: teamQuery });
    const teamIds = teams.map((t) => t._id);
    const teamProjectIds = teams.filter((t) => t.project).map((t) => t.project);

    const membershipConditions = [];
    if (teamIds.length > 0) membershipConditions.push({ team: { $in: teamIds } });
    if (teamProjectIds.length > 0) membershipConditions.push({ _id: { $in: teamProjectIds } });
    membershipConditions.push({ 'milestones.assignedMembers': userId });
    if (studentId) membershipConditions.push({ 'milestones.assignedMembers': studentId });

    const studentProjects = await Project.find({ $or: membershipConditions }).select('_id');
    const studentProjectIds = studentProjects.map((p) => p._id);

    // Strictly enforce tenant isolation: only return partnerships belonging to student's projects or requested by student
    const partnerships = await Partnership.find({
      $or: [
        { project: { $in: studentProjectIds } },
        { student: userId },
        { requestedBy: userId }
      ]
    })
      .populate('industry', 'name email organization phone district avatar')
      .populate('industryProfile')
      .populate({
        path: 'project',
        select: 'title challengeId status overallProgress',
        populate: { path: 'challengeId', select: 'code title category district' }
      })
      .sort({ updatedAt: -1 });

    return successResponse(res, 'Student partnerships retrieved successfully', {
      count: partnerships.length,
      partnerships
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated student's complete profile
 * GET /api/students/profile
 */
const getStudentProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    let student = await Student.findOne({ user: user._id }).populate('university', 'name organization district email');
    if (!student) {
      student = await Student.findOne({ email: user.email.toLowerCase() }).populate('university', 'name organization district email');
    }

    // If still no Student profile exists, initialize one for the user
    if (!student) {
      student = await Student.create({
        user: user._id,
        university: user._id,
        name: user.name,
        email: user.email,
        department: 'Computer Science & Engineering',
        year: '3rd Year B.Tech',
        course: 'B.Tech',
        phone: user.phone || '',
        studentId: '',
        skills: ['Research', 'Prototyping'],
        expertise: ['Full Stack Development'],
        areasOfInterest: ['Civic Infrastructure', 'IoT & Telemetry'],
        profileImage: user.profileImage || ''
      });
    }

    // Build unified profile
    const profile = {
      id: student._id,
      userId: user._id,
      name: user.name || student.name,
      email: user.email,
      phone: student.phone || user.phone || '',
      role: user.role,
      university: student.university ? {
        id: student.university._id,
        name: student.university.name || student.university.organization || 'Delhi Technological University',
        district: student.university.district || 'Shahdara, Delhi'
      } : {
        name: 'Delhi Technological University',
        district: 'Shahdara, Delhi'
      },
      department: student.department || 'Computer Science & Engineering',
      studentId: student.studentId || '',
      course: student.course || 'B.Tech',
      year: student.year || '3rd Year B.Tech',
      skills: student.skills || [],
      expertise: student.expertise || [],
      areasOfInterest: student.areasOfInterest || [],
      profileImage: student.profileImage || user.profileImage || '',
      bio: student.bio || '',
      innovationCredits: student.innovationCredits || 0,
      isActive: student.isActive !== false,
      approvalStatus: user.approvalStatus || 'APPROVED',
      createdAt: student.createdAt || user.createdAt
    };

    return successResponse(res, 'Student profile retrieved successfully', { profile });
  } catch (error) {
    next(error);
  }
};

/**
 * Update current authenticated student's profile
 * PUT /api/students/profile
 */
const updateStudentProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User not found', null, 404);
    }

    let student = await Student.findOne({ user: user._id });
    if (!student) {
      student = await Student.findOne({ email: user.email.toLowerCase() });
    }

    const {
      name,
      phone,
      department,
      studentId,
      course,
      year,
      skills,
      expertise,
      areasOfInterest,
      bio
    } = req.body;

    // Security guardrail: Students cannot modify email, role, or institution verification
    if (req.body.role && req.body.role !== 'STUDENT') {
      return errorResponse(res, 'Security violation: Student cannot modify account role', null, 403);
    }
    if (req.body.email && req.body.email.toLowerCase().trim() !== user.email.toLowerCase().trim()) {
      return errorResponse(res, 'Security violation: Email address is an institutional identifier and cannot be modified', null, 403);
    }
    if (req.body.approvalStatus || req.body.verificationStatus) {
      return errorResponse(res, 'Security violation: Verification status cannot be self-modified', null, 403);
    }

    // Allowed updates on User
    if (name && name.trim()) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    await user.save();

    // Allowed updates on Student
    if (student) {
      if (name && name.trim()) student.name = name.trim();
      if (phone !== undefined) student.phone = phone.trim();
      if (department && department.trim()) student.department = department.trim();
      if (studentId !== undefined) student.studentId = studentId.trim();
      if (course && course.trim()) student.course = course.trim();
      if (year && year.trim()) student.year = year.trim();
      if (Array.isArray(skills)) student.skills = skills.map((s) => s.trim()).filter(Boolean);
      if (Array.isArray(expertise)) student.expertise = expertise.map((e) => e.trim()).filter(Boolean);
      if (Array.isArray(areasOfInterest)) student.areasOfInterest = areasOfInterest.map((a) => a.trim()).filter(Boolean);
      if (bio !== undefined) student.bio = bio.trim();
      await student.save();
    }

    return successResponse(res, 'Student profile updated successfully', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      },
      student
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Upload student profile image using Cloudinary
 * POST /api/students/profile/image
 */
const uploadStudentProfileImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return errorResponse(res, 'Image file is required', null, 400);
    }

    const uploadResult = await uploadToCloudinary(
      req.file.buffer,
      req.file.originalname,
      'delhi_student_profiles'
    );

    const imageUrl = uploadResult.url;

    // Update User and Student
    await User.findByIdAndUpdate(req.user.id, { profileImage: imageUrl });
    await Student.findOneAndUpdate(
      { $or: [{ user: req.user.id }, { email: req.user.email?.toLowerCase() }] },
      { profileImage: imageUrl }
    );

    return successResponse(res, 'Profile image uploaded and updated successfully', {
      profileImage: imageUrl
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve verified innovation achievements & real calculated credits
 * GET /api/students/achievements
 */
const getStudentAchievements = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      student = await Student.findOne({ email: req.user.email?.toLowerCase() });
    }

    const studentIdStr = student ? student._id.toString() : null;
    const userIdStr = req.user.id.toString();

    // 1. Fetch student's projects
    const allProjects = await Project.find({ status: { $ne: 'DRAFT' } })
      .populate('challengeId', 'code title category district')
      .populate('mentor', 'name department specialization')
      .populate('team')
      .populate('universityId', 'name organization');

    const enrolledProjects = allProjects.filter((p) => {
      if (p.studentLead && p.studentLead.toString() === studentIdStr) return true;
      if (p.team && Array.isArray(p.team.members)) {
        return p.team.members.some((m) => {
          const mStudentId = (m.student?._id || m.student)?.toString();
          return mStudentId === studentIdStr || mStudentId === userIdStr;
        });
      }
      if (Array.isArray(p.milestones)) {
        return p.milestones.some((m) =>
          (m.assignedMembers || []).some((am) => {
            const amId = (am._id || am).toString();
            return amId === userIdStr || (studentIdStr && amId === studentIdStr);
          })
        );
      }
      return false;
    });

    // 2. Aggregate REAL verified outcomes across enrolled projects
    const completedProjects = [];
    const completedMilestones = [];
    const validatedPrototypes = [];
    const successfulTests = [];
    const livePilots = [];
    const deployments = [];
    const communityImpacts = [];

    enrolledProjects.forEach((p) => {
      // Completed Projects
      if (p.status === 'COMPLETED' || p.stage === 'COMPLETED') {
        completedProjects.push({
          projectId: p._id,
          projectTitle: p.title,
          projectCode: p.challengeId?.code || 'DEL-PROJ',
          completedAt: p.updatedAt,
          mentorName: p.mentor?.name || 'Faculty Lead'
        });
      }

      // Live Pilots & Deployments
      if (['PILOT', 'VALIDATION'].includes(p.stage)) {
        livePilots.push({
          projectId: p._id,
          projectTitle: p.title,
          stage: p.stage,
          location: p.challengeId?.district || 'Delhi Wards'
        });
      }
      if (['DEPLOYMENT', 'COMPLETED'].includes(p.stage)) {
        deployments.push({
          projectId: p._id,
          projectTitle: p.title,
          stage: p.stage,
          deployedAt: p.updatedAt
        });
      }

      // Completed Milestones
      if (Array.isArray(p.milestones)) {
        p.milestones.forEach((m) => {
          if (m.status === 'COMPLETED') {
            completedMilestones.push({
              milestoneId: m._id,
              title: m.title,
              projectId: p._id,
              projectTitle: p.title,
              deliverables: m.deliverables || [],
              completedDate: m.completedDate || m.updatedAt || new Date()
            });
          }
        });
      }

      // Validated Prototypes
      if (p.prototype && ['VALIDATED', 'TESTING', 'READY_FOR_TESTING'].includes(p.prototype.status)) {
        validatedPrototypes.push({
          projectId: p._id,
          projectTitle: p.title,
          prototypeName: p.prototype.prototypeName || 'Engineering Prototype',
          version: p.prototype.version || 'v1.0',
          status: p.prototype.status,
          repositoryUrl: p.prototype.repositoryUrl || '',
          demoUrl: p.prototype.demoUrl || ''
        });
      }

      // Successful Tests
      if (Array.isArray(p.testRecords)) {
        p.testRecords.forEach((t) => {
          if (t.status === 'PASSED') {
            successfulTests.push({
              testId: t._id,
              testName: t.testName,
              testType: t.testType,
              projectId: p._id,
              projectTitle: p.title,
              reviewedByName: t.reviewedByName || 'Faculty Evaluator',
              evaluatedAt: t.reviewedAt || t.testDate
            });
          }
        });
      }

      // Verified Community Impact
      if (p.impactOutcome && p.impactOutcome.isClaimed) {
        communityImpacts.push({
          projectId: p._id,
          projectTitle: p.title,
          peopleBenefited: p.impactOutcome.peopleBenefited || 0,
          communitiesCovered: p.impactOutcome.communitiesCovered || 'Delhi Municipal Wards',
          cost: p.impactOutcome.cost || 0
        });
      }
    });

    // 3. Partnerships / Startup Outcomes
    const partnerships = await Partnership.find({
      student: student ? student._id : undefined,
      status: { $in: ['ACCEPTED', 'ACTIVE', 'COMPLETED'] }
    }).populate('industry', 'organization name district');

    const startupOutcomes = partnerships.map((pt) => ({
      partnershipId: pt._id,
      company: pt.industry?.organization || pt.industry?.name || 'Corporate Partner',
      supportType: pt.supportType,
      status: pt.status,
      assignedMentor: pt.assignedMentor
    }));

    // 4. Persisted Achievement Records
    const persistedAchievements = await Achievement.find({
      $or: [{ user: req.user.id }, { student: student ? student._id : null }]
    }).sort({ createdAt: -1 });

    // 5. Calculate Real Verified Innovation Credits
    // 50 per completed milestone, 100 per passed test, 200 per partnership, 300 per community impact, 500 per completed project
    const outcomeCredits =
      completedMilestones.length * 50 +
      successfulTests.length * 100 +
      startupOutcomes.length * 200 +
      communityImpacts.length * 300 +
      completedProjects.length * 500;

    const persistedCredits = persistedAchievements.reduce((acc, a) => acc + (Number(a.credits) || 0), 0);
    const totalCredits = outcomeCredits + persistedCredits;

    const creditsMessage =
      totalCredits > 0
        ? `Verified Innovation Credits: ${totalCredits} Points`
        : 'Credits will appear after verified innovation activities.';

    return successResponse(res, 'Student innovation achievements retrieved successfully', {
      counts: {
        completedProjects: completedProjects.length,
        completedMilestones: completedMilestones.length,
        prototypes: validatedPrototypes.length,
        successfulTests: successfulTests.length,
        pilots: livePilots.length,
        deployments: deployments.length,
        communityImpact: communityImpacts.length,
        startupOutcomes: startupOutcomes.length,
        persistedAchievements: persistedAchievements.length
      },
      totalCredits,
      creditsMessage,
      achievements: {
        completedProjects,
        completedMilestones,
        prototypes: validatedPrototypes,
        successfulTests,
        pilots: livePilots,
        deployments,
        communityImpact: communityImpacts,
        startupOutcomes,
        persisted: persistedAchievements
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudents,
  addStudent,
  updateStudent,
  removeStudent,
  getStudentDashboard,
  getStudentProjects,
  initStudentProject,
  ensureActiveStudentProject,
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
};
