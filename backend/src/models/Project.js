const mongoose = require('mongoose');

const milestoneDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  submissionNote: {
    type: String,
    default: '',
    trim: true
  },
  externalLink: {
    type: String,
    default: '',
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const milestoneCommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'COMPLETED', 'DELAYED'],
    default: 'NOT_STARTED'
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  deliverables: [
    {
      type: String,
      trim: true
    }
  ],
  documents: [milestoneDocumentSchema],
  assignedMembers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  comments: [milestoneCommentSchema],
  facultyFeedback: {
    type: String,
    default: '',
    trim: true
  },
  facultyFeedbackDate: {
    type: Date
  },
  facultyReviewer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  facultyReviewerName: {
    type: String,
    default: ''
  },
  reviewStatus: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REVISION_REQUIRED'],
    default: 'PENDING'
  },
  submissionNote: {
    type: String,
    default: '',
    trim: true
  },
  externalLink: {
    type: String,
    default: '',
    trim: true
  }
});

const proposalSchema = new mongoose.Schema({
  problemUnderstanding: {
    type: String,
    trim: true
  },
  proposedSolution: {
    type: String,
    trim: true
  },
  methodology: {
    type: String,
    trim: true
  },
  technology: [
    {
      type: String,
      trim: true
    }
  ],
  timeline: {
    type: String,
    trim: true
  },
  expectedImpact: {
    type: String,
    trim: true
  },
  submittedAt: {
    type: Date
  },
  reviewedAt: {
    type: Date
  },
  reviewNotes: {
    type: String,
    default: ''
  },
  approvalStatus: {
    type: String,
    enum: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'NEEDS_REVISION'],
    default: 'DRAFT'
  }
});

const projectDocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  submissionNote: {
    type: String,
    default: '',
    trim: true
  },
  externalLink: {
    type: String,
    default: '',
    trim: true
  },
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  uploaderName: {
    type: String,
    default: 'Stakeholder'
  },
  uploaderRole: {
    type: String,
    default: 'UNIVERSITY'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const projectUpdateSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'UPDATE',
      'STAGE_TRANSITION',
      'MILESTONE_COMPLETION',
      'DOCUMENT_UPLOAD',
      'ADMIN_INTERVENTION'
    ],
    default: 'UPDATE'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const projectCommentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  userName: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const impactOutcomeSchema = new mongoose.Schema({
  solutionDescription: {
    type: String,
    default: '',
    trim: true
  },
  deploymentLocation: {
    type: String,
    default: '',
    trim: true
  },
  peopleBenefited: {
    type: Number,
    default: 0
  },
  communitiesCovered: {
    type: String,
    default: '',
    trim: true
  },
  cost: {
    type: Number,
    default: 0
  },
  outcome: {
    type: String,
    default: '',
    trim: true
  },
  evidence: [
    {
      title: String,
      url: String,
      publicId: String
    }
  ],
  technologyTransferred: {
    type: String,
    default: '',
    trim: true
  },
  patentIpInfo: {
    type: String,
    default: '',
    trim: true
  },
  startupCreated: {
    type: String,
    default: '',
    trim: true
  },
  scalabilityPotential: {
    type: String,
    default: '',
    trim: true
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  isClaimed: {
    type: Boolean,
    default: false
  }
});

const facultyReviewSchema = new mongoose.Schema({
  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Faculty'
  },
  facultyName: {
    type: String,
    default: 'Supervising Faculty Mentor'
  },
  feedback: {
    type: String,
    required: true,
    trim: true
  },
  reviewStatus: {
    type: String,
    enum: ['PENDING', 'IN_REVIEW', 'SATISFACTORY', 'NEEDS_IMPROVEMENT', 'ACTION_REQUIRED'],
    default: 'SATISFACTORY'
  },
  reviewDate: {
    type: Date,
    default: Date.now
  },
  upcomingReviewDate: {
    type: Date
  }
});

const prototypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Engineering Prototype'
  },
  version: {
    type: String,
    default: 'v1.0.0',
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  technologyUsed: [
    {
      type: String,
      trim: true
    }
  ],
  repositoryUrl: {
    type: String,
    default: '',
    trim: true
  },
  demoUrl: {
    type: String,
    default: '',
    trim: true
  },
  prototypeStatus: {
    type: String,
    enum: ['PLANNING', 'DEVELOPMENT', 'READY_FOR_TESTING', 'TESTING', 'VALIDATED'],
    default: 'DEVELOPMENT'
  },
  testingStatus: {
    type: String,
    enum: ['NOT_STARTED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'RETEST_REQUIRED'],
    default: 'IN_PROGRESS'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const testEvidenceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  url: {
    type: String,
    required: true
  },
  publicId: {
    type: String,
    default: ''
  },
  fileType: {
    type: String,
    default: 'application/pdf'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const testingRecordSchema = new mongoose.Schema({
  testName: {
    type: String,
    required: true,
    trim: true
  },
  objective: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    default: 'University Engineering Laboratory',
    trim: true
  },
  participantsSampleSize: {
    type: String,
    default: '50 cycles / 4 sensor nodes',
    trim: true
  },
  method: {
    type: String,
    required: true,
    trim: true
  },
  result: {
    type: String,
    default: '',
    trim: true
  },
  issuesFound: {
    type: String,
    default: '',
    trim: true
  },
  evidence: [testEvidenceSchema],
  status: {
    type: String,
    enum: ['PLANNED', 'IN_PROGRESS', 'PASSED', 'FAILED', 'RETEST_REQUIRED'],
    default: 'PLANNED'
  },
  testedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  testedByName: {
    type: String,
    default: 'Student Innovator'
  },
  reviewerFeedback: {
    type: String,
    default: '',
    trim: true
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedByName: {
    type: String,
    default: ''
  },
  reviewedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const projectSchema = new mongoose.Schema(
  {
    challengeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: [true, 'Associated Challenge ID is required']
    },
    universityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'University ID is required']
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Problem statement is required'],
      trim: true
    },
    proposedSolution: {
      type: String,
      required: [true, 'Proposed solution description is required'],
      trim: true
    },
    objectives: [
      {
        type: String,
        trim: true
      }
    ],
    technologies: [
      {
        type: String,
        trim: true
      }
    ],
    timeline: {
      type: String,
      default: '6 Months',
      trim: true
    },
    budget: {
      estimatedAmount: {
        type: Number,
        default: 0
      },
      breakdown: {
        type: String,
        default: ''
      }
    },
    teamRequirements: {
      type: String,
      default: ''
    },
    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    milestones: [milestoneSchema],
    deadline: {
      type: Date
    },
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: [
        'VALIDATION',
        'ASSIGNMENT',
        'SOLUTION_PROPOSAL',
        'PROTOTYPE',
        'PILOT_TESTING',
        'IMPLEMENTATION',
        'IMPACT_EVALUATION',
        'COMPLETED',
        'CHALLENGE_ACCEPTED',
        'PROJECT_CREATED',
        'PROPOSAL_SUBMITTED',
        'APPROVED',
        'RESEARCH',
        'TESTING',
        'PILOT',
        'DEPLOYMENT'
      ],
      default: 'PROJECT_CREATED'
    },
    industryPartners: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    documents: [projectDocumentSchema],
    updates: [projectUpdateSchema],
    comments: [projectCommentSchema],
    impactOutcome: {
      type: impactOutcomeSchema,
      default: () => ({})
    },
    outcomes: [
      {
        type: String,
        trim: true
      }
    ],
    proposal: proposalSchema,
    aiRecommendedIndustries: [
      {
        industryId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        organizationName: { type: String },
        organizationType: { type: String },
        industrySector: { type: String },
        score: { type: Number },
        percentage: { type: Number },
        matchingReasons: [{ type: String }],
        explainableSummary: { type: String },
        matchedAt: { type: Date, default: Date.now },
        status: {
          type: String,
          enum: ['PENDING', 'ACCEPTED', 'IGNORED'],
          default: 'PENDING'
        }
      }
    ],
    mentorReviews: [facultyReviewSchema],
    mentorReviewStatus: {
      type: String,
      enum: ['PENDING', 'IN_REVIEW', 'SATISFACTORY', 'NEEDS_IMPROVEMENT', 'ACTION_REQUIRED', 'REVIEW_REQUESTED'],
      default: 'PENDING'
    },
    lastMentorFeedback: {
      type: String,
      default: ''
    },
    lastMentorFeedbackDate: {
      type: Date
    },
    upcomingMentorReview: {
      type: Date
    },
    prototype: {
      type: prototypeSchema,
      default: () => ({})
    },
    testRecords: [testingRecordSchema]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

projectSchema.virtual('stage').get(function () {
  return this.status;
});

projectSchema.virtual('progress').get(function () {
  return this.overallProgress;
});

projectSchema.virtual('university').get(function () {
  return this.universityId;
});

projectSchema.virtual('challenge').get(function () {
  return this.challengeId;
});

module.exports = mongoose.model('Project', projectSchema);
