const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    challenge: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Challenge',
      required: false
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    userRole: {
      type: String,
      required: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'VALIDATE',
        'REJECT',
        'REQUEST_INFORMATION',
        'MARK_DUPLICATE',
        'CHANGE_PRIORITY',
        'ASSIGN_UNIVERSITY',
        'ASSIGN_CHALLENGE',
        'ADD_NOTE',
        'STATUS_CHANGE',
        'CREATE_PROJECT',
        'SUBMIT_PROPOSAL',
        'ACTIVATE_USER',
        'DEACTIVATE_USER',
        'ACTIVATE_UNIVERSITY',
        'DEACTIVATE_UNIVERSITY',
        'ACTIVATE_INDUSTRY',
        'DEACTIVATE_INDUSTRY'
      ]
    },
    previousStatus: {
      type: String,
      default: ''
    },
    newStatus: {
      type: String,
      default: ''
    },
    comment: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: false
  }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
