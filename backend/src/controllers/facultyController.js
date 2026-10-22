const Faculty = require('../models/Faculty');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/responseHandler');

/**
 * Get all faculty mentors
 * GET /api/faculty
 */
const getFaculty = async (req, res, next) => {
  try {
    const filter = { isActive: true };
    if (req.user.role === 'UNIVERSITY') {
      filter.university = req.user.id;
    } else if (req.user.role === 'FACULTY') {
      let f = await Faculty.findOne({ user: req.user.id });
      if (!f) {
        f = await Faculty.findOne({ email: req.user.email.toLowerCase() });
        if (f) {
          f.user = req.user.id;
          await f.save();
        } else {
          // Auto-provision faculty mentor record
          let universityId;
          if (req.user.organization) {
            const matchedUni = await User.findOne({
              role: 'UNIVERSITY',
              $or: [
                { name: { $regex: req.user.organization, $options: 'i' } },
                { organization: { $regex: req.user.organization, $options: 'i' } }
              ]
            });
            if (matchedUni) universityId = matchedUni._id;
          }
          if (!universityId) {
            const defaultUni = await User.findOne({ role: 'UNIVERSITY' });
            universityId = defaultUni ? defaultUni._id : req.user.id;
          }

          f = await Faculty.create({
            university: universityId,
            user: req.user.id,
            name: req.user.name,
            email: req.user.email.toLowerCase(),
            department: req.user.organization ? `${req.user.organization} Engineering` : 'Department of Engineering & Technology',
            specialization: 'Applied Engineering & Societal Innovation',
            experience: '5+ Years',
            expertise: ['Academic Supervision', 'Prototype Validation', 'Societal Solutions']
          });
        }
      }
      if (f && f.university) filter.university = f.university;
    }

    const faculty = await Faculty.find(filter)
      .populate('assignedProjects', 'title status challengeId')
      .sort({ name: 1 });

    return successResponse(res, 'Faculty members retrieved successfully', { faculty });
  } catch (error) {
    next(error);
  }
};

/**
 * Get profile for authenticated Faculty member
 * GET /api/faculty/profile
 */
const getProfile = async (req, res, next) => {
  try {
    let faculty = await Faculty.findOne({ user: req.user.id })
      .populate('university', 'name organization district')
      .populate('assignedProjects', 'title status challengeId');

    if (!faculty) {
      faculty = await Faculty.findOne({ email: req.user.email.toLowerCase() })
        .populate('university', 'name organization district')
        .populate('assignedProjects', 'title status challengeId');
      if (faculty) {
        faculty.user = req.user.id;
        await faculty.save();
      }
    }

    if (!faculty) {
      // Auto-provision profile
      let universityId;
      if (req.user.organization) {
        const matchedUni = await User.findOne({
          role: 'UNIVERSITY',
          $or: [
            { name: { $regex: req.user.organization, $options: 'i' } },
            { organization: { $regex: req.user.organization, $options: 'i' } }
          ]
        });
        if (matchedUni) universityId = matchedUni._id;
      }
      if (!universityId) {
        const defaultUni = await User.findOne({ role: 'UNIVERSITY' });
        universityId = defaultUni ? defaultUni._id : req.user.id;
      }

      faculty = await Faculty.create({
        university: universityId,
        user: req.user.id,
        name: req.user.name,
        email: req.user.email.toLowerCase(),
        department: req.user.organization ? `${req.user.organization} Engineering` : 'Department of Engineering & Technology',
        specialization: 'Applied Engineering & Societal Innovation',
        experience: '5+ Years',
        expertise: ['Academic Supervision', 'Prototype Validation', 'Societal Solutions']
      });
    }

    return successResponse(res, 'Faculty profile retrieved successfully', { faculty });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a faculty mentor
 * POST /api/faculty
 */
const addFaculty = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can add faculty mentors', null, 403);
    }

    const { name, email, department, specialization, experience, expertise } = req.body;

    if (!name || !email || !department || !specialization) {
      return errorResponse(res, 'Name, email, department, and specialization are required', null, 400);
    }

    const universityId = req.user.role === 'UNIVERSITY' ? req.user.id : req.body.universityId;

    // Check if user account with this email exists to link
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });

    const faculty = await Faculty.create({
      university: universityId,
      user: existingUser ? existingUser._id : undefined,
      name: name.trim(),
      email: email.toLowerCase().trim(),
      department: department.trim(),
      specialization: specialization.trim(),
      experience: experience || '5+ Years',
      expertise: Array.isArray(expertise) ? expertise : []
    });

    return successResponse(res, 'Faculty mentor added successfully', { faculty }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Update a faculty mentor
 * PUT /api/faculty/:id
 */
const updateFaculty = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can update faculty', null, 403);
    }

    const { id } = req.params;
    const { name, department, specialization, experience, expertise, isActive } = req.body;

    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return errorResponse(res, 'Faculty mentor not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && faculty.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to modify faculty of another institution', null, 403);
    }

    if (name) faculty.name = name.trim();
    if (department) faculty.department = department.trim();
    if (specialization) faculty.specialization = specialization.trim();
    if (experience) faculty.experience = experience.trim();
    if (Array.isArray(expertise)) faculty.expertise = expertise;
    if (isActive !== undefined) faculty.isActive = isActive;

    await faculty.save();

    return successResponse(res, 'Faculty mentor updated successfully', { faculty });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a faculty mentor
 * DELETE /api/faculty/:id
 */
const removeFaculty = async (req, res, next) => {
  try {
    if (req.user.role !== 'UNIVERSITY' && req.user.role !== 'ADMIN') {
      return errorResponse(res, 'Only university administrators can remove faculty', null, 403);
    }

    const { id } = req.params;
    const faculty = await Faculty.findById(id);
    if (!faculty) {
      return errorResponse(res, 'Faculty mentor not found', null, 404);
    }

    if (req.user.role === 'UNIVERSITY' && faculty.university.toString() !== req.user.id) {
      return errorResponse(res, 'Unauthorized to remove faculty of another institution', null, 403);
    }

    faculty.isActive = false;
    await faculty.save();

    return successResponse(res, 'Faculty mentor removed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFaculty,
  getProfile,
  addFaculty,
  updateFaculty,
  removeFaculty
};
