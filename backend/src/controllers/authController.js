const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const University = require('../models/University');
const Industry = require('../models/Industry');
const config = require('../config/env');
const { successResponse, errorResponse } = require('../utils/responseHandler');

const normalizeRole = (r) => {
  if (!r) return null;
  const upper = r.toString().trim().toUpperCase();
  if (['CLIENT', 'CITIZEN', 'CIVIC'].includes(upper)) return 'CLIENT';
  if (['ADMIN', 'GOVERNMENT', 'GOVT', 'NODAL'].includes(upper)) return 'ADMIN';
  if (['UNIVERSITY', 'ACADEMIC', 'INSTITUTE', 'COLLEGE'].includes(upper)) return 'UNIVERSITY';
  if (['FACULTY', 'MENTOR', 'PROFESSOR', 'SUPERVISOR'].includes(upper)) return 'FACULTY';
  if (['STUDENT', 'SOLUTION-PROVIDER', 'INNOVATOR'].includes(upper)) return 'STUDENT';
  if (['INDUSTRY', 'ENTERPRISE', 'STARTUP', 'CORPORATE'].includes(upper)) return 'INDUSTRY';
  return upper;
};

const generateToken = (id, rememberMe = false) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: rememberMe ? '30d' : config.jwtExpiresIn
  });
};

/**
 * Register user for any stakeholder portal
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      confirmPassword,
      role,
      organization,
      district,
      terms,
      adminCode,
      // Role-specific fields
      department,
      year,
      course,
      studentId,
      skills,
      expertise,
      specialization,
      experience,
      organizationType,
      industrySector,
      website,
      campus
    } = req.body;

    // 1. Basic required fields validation
    if (!name || !email || !password || !role || typeof email !== 'string' || typeof password !== 'string') {
      return errorResponse(res, 'Please provide valid full name, email, password, and stakeholder role', null, 400);
    }

    // 2. Email format validation
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      return errorResponse(res, 'Please provide a valid email address format (e.g. name@domain.in)', null, 400);
    }

    // 3. Confirm password validation
    if (confirmPassword && password !== confirmPassword) {
      return errorResponse(res, 'Password and confirmation password do not match', null, 400);
    }

    // 4. Password strength minimum
    if (password.length < 6) {
      return errorResponse(res, 'Password must be at least 6 characters long', null, 400);
    }

    // 5. Terms acceptance validation
    if (terms !== undefined && terms !== true && terms !== 'true') {
      return errorResponse(res, 'You must accept the Delhi Public Sector Portal terms and guidelines to register', null, 400);
    }

    // 6. Normalize role and validate
    const normalizedRole = normalizeRole(role);
    const validRoles = ['CLIENT', 'ADMIN', 'UNIVERSITY', 'INDUSTRY', 'FACULTY', 'STUDENT'];
    if (!validRoles.includes(normalizedRole)) {
      return errorResponse(
        res,
        `Invalid role '${role}'. Allowed registration roles are: ${validRoles.join(', ')}`,
        null,
        400
      );
    }

    // 7. Prevent duplicate email registration
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return errorResponse(
        res,
        'An account with this email address already exists. Please sign in or use another email.',
        null,
        400
      );
    }

    // 8. Organization assignment with fallback for simple registration
    let userOrg = organization ? organization.trim() : '';
    if (!userOrg) {
      if (normalizedRole === 'ADMIN') userOrg = 'Delhi State Administration';
      else if (normalizedRole === 'UNIVERSITY') userOrg = 'Participating University';
      else if (normalizedRole === 'FACULTY') userOrg = 'Academic Faculty';
      else if (normalizedRole === 'STUDENT') userOrg = 'Delhi Student Innovation Network';
      else if (normalizedRole === 'INDUSTRY') userOrg = 'Industry Partner';
      else userOrg = 'Individual Resident / Citizen';
    }

    // 9. Create user record with immediate active status
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone ? phone.trim() : '',
      password,
      role: normalizedRole,
      organization: userOrg,
      district: district || 'Central Delhi',
      profileImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7a1113&color=fff&font-size=0.4`,
      approvalStatus: 'APPROVED',
      isActive: true
    });

    // 10. Automatically provision matching portal domain profiles
    try {
      if (normalizedRole === 'STUDENT') {
        let universityId;
        if (userOrg) {
          const matchedUni = await User.findOne({
            role: 'UNIVERSITY',
            $or: [
              { name: { $regex: userOrg, $options: 'i' } },
              { organization: { $regex: userOrg, $options: 'i' } }
            ]
          });
          if (matchedUni) universityId = matchedUni._id;
        }
        if (!universityId) {
          const defaultUni = await User.findOne({ role: 'UNIVERSITY' });
          universityId = defaultUni ? defaultUni._id : user._id;
        }

        const skillList = Array.isArray(skills)
          ? skills
          : (typeof skills === 'string' && skills.trim()
              ? skills.split(',').map((s) => s.trim()).filter(Boolean)
              : ['Problem Solving', 'Prototyping', 'Software Development']);

        await Student.create({
          university: universityId,
          user: user._id,
          name: user.name,
          email: user.email,
          department: department ? department.trim() : (userOrg ? `${userOrg} Engineering` : 'Engineering & Technology'),
          year: year || '3rd Year B.Tech',
          course: course || 'B.Tech',
          studentId: studentId ? studentId.trim() : '',
          phone: user.phone || '',
          skills: skillList,
          expertise: Array.isArray(expertise) ? expertise : ['Applied Innovation'],
          areasOfInterest: ['Urban Welfare', 'Smart Systems', 'Sustainability']
        });
      } else if (normalizedRole === 'FACULTY') {
        let universityId;
        if (userOrg) {
          const matchedUni = await User.findOne({
            role: 'UNIVERSITY',
            $or: [
              { name: { $regex: userOrg, $options: 'i' } },
              { organization: { $regex: userOrg, $options: 'i' } }
            ]
          });
          if (matchedUni) universityId = matchedUni._id;
        }
        if (!universityId) {
          const defaultUni = await User.findOne({ role: 'UNIVERSITY' });
          universityId = defaultUni ? defaultUni._id : user._id;
        }

        const expertList = Array.isArray(expertise)
          ? expertise
          : (typeof expertise === 'string' && expertise.trim()
              ? expertise.split(',').map((e) => e.trim()).filter(Boolean)
              : ['Academic Mentorship', 'Prototype Validation', 'Technical Guidance']);

        await Faculty.create({
          university: universityId,
          user: user._id,
          name: user.name,
          email: user.email,
          department: department ? department.trim() : 'Department of Engineering & Technology',
          specialization: specialization ? specialization.trim() : 'Applied Engineering & Societal Innovation',
          experience: experience ? experience.trim() : '5+ Years',
          expertise: expertList
        });
      } else if (normalizedRole === 'UNIVERSITY') {
        await University.create({
          user: user._id,
          name: userOrg || user.name,
          campus: campus ? campus.trim() : 'Main Technical Campus, Delhi',
          district: user.district || 'Central Delhi',
          departments: [
            'Department of Computer Science & Engineering',
            'Department of Environmental Engineering',
            'Department of Electrical & Electronics',
            'Department of Civil & Urban Planning'
          ],
          researchAreas: [
            'Municipal IoT Telemetry & Environmental Sensors',
            'Autonomous Water Filtration & Leachate Treatment',
            'Clean Energy & Micro-grid Solar Harvesting',
            'Accessibility Technologies for Transit Commuters'
          ],
          expertise: [
            'AI/ML',
            'IoT',
            'Environmental Engineering',
            'Water Management',
            'Renewable Energy',
            'Accessibility'
          ],
          labsAndFacilities: [
            'Centre for Environmental Biotechnology & Biogas Lab',
            'Autonomous Smart Sensing & IoT Systems Lab',
            'Solar Photovoltaic Testing Facility',
            'Rapid Prototyping & Fabrication Workshop (FabLab)'
          ],
          innovationCentre: `${userOrg || user.name} Innovation & Incubation Centre`,
          incubationFacilities: 'Technology Business Incubator (TBI) & Prototype Fabrication Cell',
          studentTeamsCount: 5,
          facultyMentorsCount: 4
        });
      } else if (normalizedRole === 'INDUSTRY') {
        await Industry.create({
          user: user._id,
          name: userOrg || user.name,
          organizationType: organizationType || 'Industry',
          industrySector: industrySector || 'Clean Energy, Smart Grids & Utilities',
          location: req.body.location || 'Delhi NCR Innovation Corridor',
          district: user.district || 'Central Delhi',
          website: website ? website.trim() : '',
          expertise: ['Technology Prototyping', 'CSR Sponsorship', 'Engineering Mentorship'],
          technologies: ['IoT', 'Grid Automation', 'Clean Energy', 'Smart City Sensors'],
          resources: ['Prototyping Labs', 'Hardware Grant Funding', 'Testing Infrastructure'],
          fundingCapability: {
            maxGrantAmount: 2500000,
            csrBudgetAllocated: 10000000,
            fundingTypes: ['Prototyping Grant', 'Pilot Deployment Fund']
          },
          mentorshipCapability: {
            availableMentorsCount: 4,
            domains: ['Industrial Automation', 'Sensors & IoT', 'Product Scale-up']
          }
        });
      }
    } catch (provisionError) {
      console.warn(`[Auto-provision Notice] Domain profile creation warning for ${normalizedRole}:`, provisionError.message);
    }

    const token = generateToken(user._id);

    return successResponse(
      res,
      'Stakeholder account registered and activated successfully',
      {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          phone: user.phone,
          district: user.district,
          profileImage: user.profileImage,
          isActive: user.isActive,
          approvalStatus: user.approvalStatus,
          createdAt: user.createdAt
        },
        token
      },
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Login user for any stakeholder portal
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password, rememberMe, role } = req.body;

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return errorResponse(res, 'Please provide valid email address and password', null, 400);
    }

    // Explicitly include password for verification
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return errorResponse(res, 'Invalid email or password', null, 401);
    }

    // Verify password hash
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 'Invalid email or password', null, 401);
    }

    // Verify account active status
    if (!user.isActive) {
      return errorResponse(
        res,
        'Your account has been deactivated. Please contact the portal administrator.',
        null,
        403
      );
    }

    // If a specific role was targeted during login, verify match with normalization
    if (role) {
      const targetRole = normalizeRole(role);
      if (targetRole && user.role.toUpperCase() !== targetRole) {
        return errorResponse(
          res,
          `Account role is '${user.role}', but login was attempted for '${targetRole}'. Please log in with the correct portal role or switch to your ${user.role} workspace.`,
          { registeredRole: user.role, attemptedRole: targetRole },
          403
        );
      }
    }

    const token = generateToken(user._id, !!rememberMe);

    return successResponse(res, 'Login successful', {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        phone: user.phone,
        district: user.district,
        profileImage: user.profileImage,
        isActive: user.isActive,
        approvalStatus: user.approvalStatus,
        createdAt: user.createdAt
      },
      token
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  return successResponse(res, 'Logged out successfully');
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User profile not found', null, 404);
    }

    return successResponse(res, 'Current user profile retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, organization, district, profileImage } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return errorResponse(res, 'User profile not found', null, 404);
    }

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (organization !== undefined) user.organization = organization.trim();
    if (district) user.district = district;
    if (profileImage) user.profileImage = profileImage.trim();

    await user.save();

    return successResponse(res, 'Profile updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile
};

