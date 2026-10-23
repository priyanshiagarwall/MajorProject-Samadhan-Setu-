const Team = require('../models/Team');
const Project = require('../models/Project');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const User = require('../models/User');
const { dispatchNotification } = require('../services/notificationDispatcher');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get multidisciplinary teams
 * GET /api/teams
 */
const getTeams = async (req, res, next) => {
  try {
    const filter = {};
    if (req.user.role === 'UNIVERSITY') {
      filter.university = req.user.id;
    } else if (req.user.role === 'FACULTY') {
      const f = await Faculty.findOne({ user: req.user.id });
      filter.facultyMentor = f ? f._id : null;
    } else if (req.user.role === 'STUDENT') {
      const s = await Student.findOne({ user: req.user.id });
      filter['members.student'] = s ? s._id : null;
    }

    const teams = await Team.find(filter)
      .populate('project', 'title challengeId status')
      .populate('facultyMentor', 'name department specialization')
      .populate('members.student', 'name department year skills')
      .sort({ createdAt: -1 });

    return successResponse(res, 'Multidisciplinary teams retrieved successfully', { teams });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a multidisciplinary team
 * POST /api/teams
 */
const createTeam = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can create teams', null, 403);
    }

    const { name, project, facultyMentor, members } = req.body;

    if (!name || !name.trim()) {
      return errorResponse(res, 'Team name is required', null, 400);
    }

    const universityId = req.user.role === 'UNIVERSITY' ? req.user.id : req.body.universityId;

    // Validate project if provided
    if (project) {
      const proj = await Project.findById(project);
      if (!proj) {
        return errorResponse(res, 'Associated project not found', null, 404);
      }
      if (req.user.role === 'UNIVERSITY' && proj.universityId?.toString() !== universityId.toString()) {
        return errorResponse(res, 'Unauthorized: Project belongs to another university', null, 400);
      }
    }

    // Validate facultyMentor if provided
    if (facultyMentor) {
      const fac = await Faculty.findById(facultyMentor);
      if (!fac) {
        return errorResponse(res, 'Faculty mentor not found', null, 404);
      }
      if (req.user.role === 'UNIVERSITY' && fac.university?.toString() !== universityId.toString()) {
        return errorResponse(res, 'Unauthorized: Faculty mentor belongs to another university', null, 400);
      }
    }

    // Validate members if provided
    const memberArray = Array.isArray(members) ? members : [];
    if (memberArray.length > 0) {
      const studentIds = memberArray
        .map((m) => (m.student?._id || m.student)?.toString())
        .filter(Boolean);

      // Check intra-team duplicate student IDs
      const uniqueStudentIds = new Set(studentIds);
      if (uniqueStudentIds.size !== studentIds.length) {
        return errorResponse(
          res,
          'Duplicate students found in team members list. Each student can only be added once.',
          null,
          400
        );
      }

      const studentDocs = await Student.find({ _id: { $in: studentIds } });
      if (studentDocs.length !== studentIds.length) {
        return errorResponse(res, 'One or more selected students could not be found', null, 404);
      }

      // Check same-university and active team status
      for (const sDoc of studentDocs) {
        if (req.user.role === 'UNIVERSITY' && sDoc.university?.toString() !== universityId.toString()) {
          return errorResponse(
            res,
            `Unauthorized: Student "${sDoc.name}" belongs to another university`,
            null,
            400
          );
        }

        // One active student = one active team check
        // Check if student is active member in another existing team (ACCEPTED or INVITED)
        const activeOtherTeam = await Team.findOne({
          members: {
            $elemMatch: {
              student: sDoc._id,
              status: { $in: ['ACCEPTED', 'INVITED'] }
            }
          }
        });

        if (activeOtherTeam) {
          return errorResponse(
            res,
            `Student "${sDoc.name}" is already an active member of team "${activeOtherTeam.name}". Each student can belong to only one active team.`,
            null,
            400
          );
        }
      }
    }

    const team = await Team.create({
      name: name.trim(),
      university: universityId,
      project: project || undefined,
      facultyMentor: facultyMentor || undefined,
      members: memberArray
    });

    // If project specified, link and advance status to TEAM_FORMED
    if (project) {
      const proj = await Project.findById(project);
      if (proj) {
        proj.team = team._id;
        if (facultyMentor) proj.mentor = facultyMentor;
        await proj.save();
      }
    }

    // Update assignedTeam on member student documents
    if (memberArray.length > 0) {
      const studentIds = memberArray.map((m) => m.student?._id || m.student);
      await Student.updateMany(
        { _id: { $in: studentIds } },
        { assignedTeam: team._id }
      );
    }

    const populated = await Team.findById(team._id)
      .populate('project', 'title challengeId status')
      .populate('facultyMentor', 'name department specialization')
      .populate('members.student', 'name department year skills');

    return successResponse(res, 'Multidisciplinary team created successfully', { team: populated }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a multidisciplinary team
 * PUT /api/teams/:id
 */
const updateTeam = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can update teams', null, 403);
    }

    const { id } = req.params;
    const { name, project, facultyMentor, members } = req.body;

    const team = await Team.findById(id);
    if (!team) {
      return errorResponse(res, 'Team not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && team.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to modify team of another institution', null, 403);
    }

    // Validate project if provided
    if (project !== undefined && project) {
      const proj = await Project.findById(project);
      if (!proj) {
        return errorResponse(res, 'Associated project not found', null, 404);
      }
      if (req.user.role === 'UNIVERSITY' && proj.universityId?.toString() !== req.user.id) {
        return errorResponse(res, 'Unauthorized: Project belongs to another university', null, 400);
      }
    }

    // Validate facultyMentor if provided
    if (facultyMentor !== undefined && facultyMentor) {
      const fac = await Faculty.findById(facultyMentor);
      if (!fac) {
        return errorResponse(res, 'Faculty mentor not found', null, 404);
      }
      if (req.user.role === 'UNIVERSITY' && fac.university?.toString() !== req.user.id) {
        return errorResponse(res, 'Unauthorized: Faculty mentor belongs to another university', null, 400);
      }
    }

    // Validate members if provided
    if (Array.isArray(members)) {
      const studentIds = members
        .map((m) => (m.student?._id || m.student)?.toString())
        .filter(Boolean);

      // Check intra-team duplicate student IDs
      const uniqueStudentIds = new Set(studentIds);
      if (uniqueStudentIds.size !== studentIds.length) {
        return errorResponse(
          res,
          'Duplicate students found in team members list. Each student can only be added once.',
          null,
          400
        );
      }

      const studentDocs = await Student.find({ _id: { $in: studentIds } });
      if (studentDocs.length !== studentIds.length) {
        return errorResponse(res, 'One or more selected students could not be found', null, 404);
      }

      for (const sDoc of studentDocs) {
        if (req.user.role === 'UNIVERSITY' && sDoc.university?.toString() !== team.university.toString()) {
          return errorResponse(
            res,
            `Unauthorized: Student "${sDoc.name}" belongs to another university`,
            null,
            400
          );
        }

        // Check if student belongs to another active team (ACCEPTED or INVITED)
        const alreadyInThisTeam = team.members.some(
          (m) => (m.student?._id || m.student)?.toString() === sDoc._id.toString()
        );
        if (!alreadyInThisTeam) {
          const activeOtherTeam = await Team.findOne({
            _id: { $ne: team._id },
            members: {
              $elemMatch: {
                student: sDoc._id,
                status: { $in: ['ACCEPTED', 'INVITED'] }
              }
            }
          });
          if (activeOtherTeam) {
            return errorResponse(
              res,
              `Student "${sDoc.name}" is already an active member of team "${activeOtherTeam.name}". Each student can belong to only one active team.`,
              null,
              400
            );
          }
        }
      }

      // Synchronize Student.assignedTeam
      const oldStudentIds = team.members
        .map((m) => (m.student?._id || m.student)?.toString())
        .filter(Boolean);
      const removedIds = oldStudentIds.filter((sid) => !studentIds.includes(sid));
      const addedIds = studentIds.filter((sid) => !oldStudentIds.includes(sid));

      if (removedIds.length > 0) {
        await Student.updateMany({ _id: { $in: removedIds } }, { $unset: { assignedTeam: 1 } });
      }
      if (addedIds.length > 0) {
        await Student.updateMany({ _id: { $in: addedIds } }, { assignedTeam: team._id });
      }

      team.members = members;
    }

    if (name) team.name = name.trim();
    if (project !== undefined) {
      // If changing project, unset old project's team link
      if (team.project && team.project.toString() !== (project || '').toString()) {
        await Project.findByIdAndUpdate(team.project, { $unset: { team: 1 } });
      }
      team.project = project || undefined;
    }
    if (facultyMentor !== undefined) team.facultyMentor = facultyMentor || undefined;

    await team.save();

    // If project was updated, sync project.team
    if (project) {
      await Project.findByIdAndUpdate(project, { team: team._id });
    }

    const populated = await Team.findById(id)
      .populate('project', 'title challengeId status')
      .populate('facultyMentor', 'name department specialization')
      .populate('members.student', 'name department year skills');

    return successResponse(res, 'Team updated successfully', { team: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * Disband/Delete a team
 * DELETE /api/teams/:id
 */
const deleteTeam = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can disband teams', null, 403);
    }

    const { id } = req.params;
    const team = await Team.findById(id);
    if (!team) {
      return errorResponse(res, 'Team not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && team.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to disband team of another institution', null, 403);
    }

    // Clear reference on associated project and students
    await Project.updateMany({ team: id }, { $unset: { team: 1 } });
    await Student.updateMany({ assignedTeam: id }, { $unset: { assignedTeam: 1 } });

    await Team.findByIdAndDelete(id);

    return successResponse(res, 'Team disbanded successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Invite a student to the multidisciplinary team
 * POST /api/teams/:id/invite
 */
const inviteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { email, role = 'Research', responsibility = '' } = req.body;

    if (!email) {
      return errorResponse(res, 'Student email is required to send team invitation', null, 400);
    }

    const team = await Team.findById(id).populate('members.student');
    if (!team) {
      return errorResponse(res, 'Team not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && team.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to modify team of another institution', null, 403);
    }

    // Permission enforcement: Only Team Lead, University Coordinator, or Admin can invite
    let isLead = false;
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ user: req.user.id });
      if (student) {
        isLead = team.members.some(
          (m) =>
            m.student &&
            (m.student._id?.toString() === student._id.toString() || m.student.toString() === student._id.toString()) &&
            m.role === 'Team Lead'
        );
      }
      if (!isLead && team.members.length > 0) {
        const firstM = team.members[0];
        if (student && (firstM.student?._id?.toString() === student._id.toString() || firstM.student?.toString() === student._id.toString())) {
          isLead = true;
        }
      }
    } else if (req.user.role === 'UNIVERSITY' || req.user.role === 'ADMIN') {
      isLead = true;
    }

    if (!isLead) {
      return errorResponse(res, 'Unauthorized: Only the Team Lead or University Coordinator can invite team members.', null, 403);
    }

    // Find student in DB by email
    let studentToInvite = await Student.findOne({ email: email.toLowerCase() });
    if (!studentToInvite) {
      const userDoc = await User.findOne({ email: email.toLowerCase(), role: 'STUDENT' });
      if (userDoc) {
        studentToInvite = await Student.create({
          university: team.university,
          user: userDoc._id,
          name: userDoc.name,
          email: userDoc.email,
          department: userDoc.department || 'Engineering',
          year: '3rd Year B.Tech',
          skills: ['Research', 'Prototyping']
        });
      } else {
        return errorResponse(res, `No registered student found with email "${email}". Please verify the student email.`, null, 404);
      }
    }

    // Check if already in team
    const alreadyMember = team.members.some(
      (m) => m.student && (m.student._id?.toString() === studentToInvite._id.toString() || m.student.toString() === studentToInvite._id.toString())
    );
    if (alreadyMember) {
      return errorResponse(res, 'Student is already a member or has a pending invitation in this team.', null, 400);
    }

    if (req.user.role === 'UNIVERSITY' && studentToInvite.university?.toString() !== team.university.toString()) {
      return errorResponse(res, `Student "${studentToInvite.name}" belongs to another university`, null, 400);
    }

    const activeOtherTeam = await Team.findOne({
      _id: { $ne: team._id },
      members: {
        $elemMatch: {
          student: studentToInvite._id,
          status: { $in: ['ACCEPTED', 'INVITED'] }
        }
      }
    });
    if (activeOtherTeam) {
      return errorResponse(
        res,
        `Student "${studentToInvite.name}" is already an active member of team "${activeOtherTeam.name}". Each student can belong to only one active team.`,
        null,
        400
      );
    }

    team.members.push({
      student: studentToInvite._id,
      role,
      responsibility: responsibility.trim(),
      status: 'INVITED',
      invitedBy: req.user.id,
      invitedAt: new Date(),
      joinedAt: new Date()
    });

    await team.save();

    // Dispatch notification to invited student
    if (studentToInvite.user) {
      await dispatchNotification({
        recipient: studentToInvite.user,
        sender: req.user.id,
        senderName: req.user.name,
        type: 'TEAM_INVITATION',
        title: 'Team Invitation Received',
        message: `You have been invited to join team "${team.name}" as ${role}.`,
        relatedEntity: 'Team',
        relatedEntityId: team._id
      });
    }

    const populated = await Team.findById(id)
      .populate('project', 'title challengeId status')
      .populate('facultyMentor', 'name department specialization')
      .populate('members.student', 'name email department year skills');

    return successResponse(res, `Invitation sent to ${studentToInvite.name}`, { team: populated }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Invited student accepts or declines invitation
 * POST /api/teams/:id/respond-invite
 */
const respondInvite = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'ACCEPT' or 'REJECT'

    if (!['ACCEPT', 'REJECT'].includes(action)) {
      return errorResponse(res, 'Action must be ACCEPT or REJECT', null, 400);
    }

    const team = await Team.findById(id).populate('members.student');
    if (!team) {
      return errorResponse(res, 'Team not found', null, 404);
    }

    let student = await Student.findOne({ user: req.user.id });
    if (!student) {
      student = await Student.findOne({ email: req.user.email?.toLowerCase() });
    }
    if (!student) {
      return errorResponse(res, 'Student profile not found for authenticated user', null, 404);
    }

    const memberEntry = team.members.find(
      (m) =>
        m.student &&
        (m.student._id?.toString() === student._id.toString() || m.student.toString() === student._id.toString())
    );

    if (!memberEntry) {
      return errorResponse(res, 'No invitation found for this student on this team', null, 404);
    }

    if (action === 'ACCEPT') {
      memberEntry.status = 'ACCEPTED';
      memberEntry.joinedAt = new Date();
      student.assignedTeam = team._id;
      await student.save();
      await team.save();

      // Dispatch notification to Inviter or Team Lead
      if (memberEntry.invitedBy) {
        await dispatchNotification({
          recipient: memberEntry.invitedBy,
          sender: req.user.id,
          senderName: student.name,
          type: 'TEAM_INVITATION_ACCEPTED',
          title: 'Team Invitation Accepted',
          message: `${student.name} accepted your invitation to join team "${team.name}" as ${memberEntry.role}.`,
          relatedEntity: 'Team',
          relatedEntityId: team._id
        });
      }

      return successResponse(res, `You have successfully joined team "${team.name}"!`, { team });
    } else {
      memberEntry.status = 'REJECTED';
      await team.save();

      if (memberEntry.invitedBy) {
        await dispatchNotification({
          recipient: memberEntry.invitedBy,
          sender: req.user.id,
          senderName: student.name,
          type: 'GENERAL',
          title: 'Team Invitation Declined',
          message: `${student.name} declined the invitation to join team "${team.name}".`,
          relatedEntity: 'Team',
          relatedEntityId: team._id
        });
      }

      return successResponse(res, `You have declined the invitation to join team "${team.name}".`, { team });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Update member role and responsibility
 * PUT /api/teams/:id/members/:memberId
 */
const updateMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;
    const { role, responsibility } = req.body;

    const team = await Team.findById(id).populate('members.student');
    if (!team) {
      return errorResponse(res, 'Team not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && team.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to modify team of another institution', null, 403);
    }

    // Permission: Team Lead, University, Admin, or member editing own responsibility
    let isLead = false;
    let isSelf = false;
    if (req.user.role === 'STUDENT') {
      const student = await Student.findOne({ user: req.user.id }) || await Student.findOne({ email: req.user.email?.toLowerCase() });
      if (student) {
        isLead = team.members.some(
          (m) =>
            m.student &&
            (m.student._id?.toString() === student._id.toString() || m.student.toString() === student._id.toString()) &&
            m.role === 'Team Lead'
        );
        const targetMember = team.members.id(memberId);
        if (targetMember && (targetMember.student?._id?.toString() === student._id.toString() || targetMember.student?.toString() === student._id.toString())) {
          isSelf = true;
        }
      }
    } else if (req.user.role === 'UNIVERSITY' || req.user.role === 'ADMIN') {
      isLead = true;
    }

    if (!isLead && !isSelf) {
      return errorResponse(res, 'Unauthorized: Only the Team Lead, University Lead, or member themselves can update team member details.', null, 403);
    }

    const member = team.members.id(memberId);
    if (!member) {
      return errorResponse(res, 'Member not found in team', null, 404);
    }

    // Non-lead members can only update their own responsibility, not their role
    if (isSelf && !isLead && role && role !== member.role) {
      return errorResponse(res, 'Only the Team Lead can modify team member roles.', null, 403);
    }

    if (role && isLead) member.role = role;
    if (responsibility !== undefined) member.responsibility = responsibility.trim();

    await team.save();

    const populated = await Team.findById(id)
      .populate('project', 'title challengeId status')
      .populate('facultyMentor', 'name department specialization')
      .populate('members.student', 'name email department year skills');

    return successResponse(res, 'Team member details updated successfully', { team: populated });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a member from the team
 * DELETE /api/teams/:id/members/:memberId
 */
const removeMember = async (req, res, next) => {
  try {
    const { id, memberId } = req.params;

    const team = await Team.findById(id).populate('members.student');
    if (!team) {
      return errorResponse(res, 'Team not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && team.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to modify team of another institution', null, 403);
    }

    let isLead = false;
    let isSelf = false;
    let student = null;
    if (req.user.role === 'STUDENT') {
      student = await Student.findOne({ user: req.user.id }) || await Student.findOne({ email: req.user.email?.toLowerCase() });
      if (student) {
        isLead = team.members.some(
          (m) =>
            m.student &&
            (m.student._id?.toString() === student._id.toString() || m.student.toString() === student._id.toString()) &&
            m.role === 'Team Lead'
        );
        const targetMember = team.members.id(memberId);
        if (targetMember && (targetMember.student?._id?.toString() === student._id.toString() || targetMember.student?.toString() === student._id.toString())) {
          isSelf = true;
        }
      }
    } else if (req.user.role === 'UNIVERSITY' || req.user.role === 'ADMIN') {
      isLead = true;
    }

    if (!isLead && !isSelf) {
      return errorResponse(res, 'Unauthorized: Only the Team Lead, University Lead, or the member themselves can remove team members.', null, 403);
    }

    const targetMember = team.members.id(memberId);
    if (!targetMember) {
      return errorResponse(res, 'Member not found in team', null, 404);
    }

    const removedStudentId = targetMember.student?._id || targetMember.student;

    team.members.pull(memberId);
    await team.save();

    if (removedStudentId) {
      await Student.findByIdAndUpdate(removedStudentId, { $unset: { assignedTeam: 1 } });
    }

    const populated = await Team.findById(id)
      .populate('project', 'title challengeId status')
      .populate('facultyMentor', 'name department specialization')
      .populate('members.student', 'name email department year skills');

    return successResponse(res, 'Team member removed successfully', { team: populated });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeams,
  createTeam,
  updateTeam,
  deleteTeam,
  inviteMember,
  respondInvite,
  updateMember,
  removeMember
};
