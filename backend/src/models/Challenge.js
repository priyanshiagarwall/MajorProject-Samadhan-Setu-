const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  dueDate: { type: Date }
});

const timelineEventSchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      'SUBMITTED',
      'UNDER_REVIEW',
      'VALIDATED',
      'ASSIGNED',
      'IN_PROGRESS',
      'SOLUTION_PROPOSED',
      'PILOT_TESTING',
      'RESOLVED',
      'REJECTED',
      'NEEDS_INFORMATION',
      'DUPLICATE'
    ],
    required: true
  },
  label: { type: String, required: true },
  comment: { type: String, default: '' },
  date: { type: Date, default: Date.now }
});

const evidenceSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  fileType: { type: String, default: 'image/jpeg' },
  uploadedAt: { type: Date, default: Date.now }
});

const internalNoteSchema = new mongoose.Schema({
  note: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName: { type: String, default: 'Administrator' },
  createdAt: { type: Date, default: Date.now }
});

const challengeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      unique: true,
      trim: true,
      default: function () {
        return 'DEL-' + Math.floor(1000 + Math.random() * 9000);
      }
    },
    title: {
      type: String,
      required: [true, 'Challenge title is required'],
      trim: true,
      maxlength: [250, 'Title cannot exceed 250 characters']
    },
    description: {
      type: String,
      required: [true, 'Detailed problem description is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Education',
        'Healthcare',
        'Agriculture',
        'Water Management',
        'Sanitation',
        'Environment',
        'Energy',
        'Urban Infrastructure',
        'Accessibility',
        'Public Services',
        'Rural Livelihoods',
        'Other'
      ],
      default: 'Other'
    },
    district: {
      type: String,
      required: [true, 'Delhi district is required'],
      enum: [
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
      ],
      default: 'Central Delhi'
    },
    location: {
      area: { type: String, default: '' },
      landmark: { type: String, default: '' },
      coordinates: {
        lat: { type: Number, required: true, default: 28.6139 },
        lng: { type: Number, required: true, default: 77.2090 }
      }
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: [
        'SUBMITTED',
        'UNDER_REVIEW',
        'VALIDATED',
        'ASSIGNED',
        'IN_PROGRESS',
        'SOLUTION_PROPOSED',
        'PILOT_TESTING',
        'RESOLVED',
        'REJECTED',
        'NEEDS_INFORMATION',
        'DUPLICATE'
      ],
      default: 'SUBMITTED',
      uppercase: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'immediate'],
      default: 'medium'
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe', 'critical'],
      default: 'moderate'
    },
    impact: {
      type: String,
      default: 'Estimated 5,000+ local citizens and commuters affected'
    },
    assignedUniversity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedDepartment: {
      type: String,
      default: ''
    },
    assignedFaculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty'
    },
    facultyLead: {
      name: { type: String, default: '' },
      department: { type: String, default: '' }
    },
    assignedStudentTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    assignedStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    industryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedIndustry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    expectedOutcome: {
      type: String,
      default: ''
    },
    sponsoredAmount: {
      type: Number,
      default: 0
    },
    duplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge'
    },
    internalNotes: [internalNoteSchema],
    timeline: [timelineEventSchema],
    evidence: [evidenceSchema],
    milestones: [milestoneSchema],
    solutionNotes: {
      type: String,
      default: ''
    },
    tags: [{ type: String, trim: true }],
    // AI Problem Intelligence Insights
    aiClassification: {
      category: { type: String },
      subcategory: { type: String },
      confidence: { type: Number },
      requiresHumanReview: { type: Boolean, default: false },
      explanation: { type: String }
    },
    aiPriority: {
      recommendedPriority: { type: String },
      confidence: { type: Number },
      reasoning: { type: String }
    },
    aiDuplicateScore: { type: Number, default: 0 },
    aiDuplicates: [
      {
        challengeId: { type: String },
        code: { type: String },
        title: { type: String },
        similarityScore: { type: Number }
      }
    ],
    aiSummary: {
      problem: { type: String },
      affectedGroup: { type: String },
      location: { type: String },
      expectedOutcome: { type: String }
    },
    // Marketplace fields
    aiRecommendedExpertise: [{ type: String, trim: true }],
    interestedUniversities: [
      {
        university: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        universityName: { type: String },
        expressedAt: { type: Date, default: Date.now },
        notes: { type: String, default: '' }
      }
    ],
    aiRecommendedUniversities: [
      {
        universityId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        universityName: { type: String },
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
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual aliases to support standardized naming conventions
challengeSchema.virtual('challengeId').get(function () {
  return this.code;
});

challengeSchema.virtual('statusHistory').get(function () {
  return this.timeline;
});

challengeSchema.virtual('attachments').get(function () {
  return this.evidence;
});

challengeSchema.virtual('citizenUrgency').get(function () {
  return this.urgency;
});

challengeSchema.virtual('citizenSeverity').get(function () {
  return this.severity;
});

challengeSchema.virtual('aiSimilarChallenges').get(function () {
  return this.aiDuplicates;
});

challengeSchema.virtual('projectId').get(function () {
  return this.assignedProject;
});

challengeSchema.virtual('aiPriorityConfidence').get(function () {
  return this.aiPriority?.confidence;
});

module.exports = mongoose.model('Challenge', challengeSchema);
