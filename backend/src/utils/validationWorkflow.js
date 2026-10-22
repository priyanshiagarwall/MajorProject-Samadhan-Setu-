/**
 * Validation Workflow State Machine
 * Strictly governs allowed state transitions for challenges in the Delhi Societal Innovation Portal.
 */

const VALID_TRANSITIONS = {
  SUBMITTED: ['UNDER_REVIEW', 'VALIDATED', 'REJECTED', 'DUPLICATE'],
  UNDER_REVIEW: [
    'VALIDATED',
    'REJECTED',
    'NEEDS_INFORMATION',
    'DUPLICATE',
    'SUBMITTED'
  ],
  NEEDS_INFORMATION: ['UNDER_REVIEW', 'SUBMITTED', 'REJECTED'],
  VALIDATED: ['ASSIGNED', 'UNDER_REVIEW', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'VALIDATED'],
  IN_PROGRESS: ['SOLUTION_PROPOSED', 'PILOT_TESTING', 'RESOLVED', 'ASSIGNED'],
  SOLUTION_PROPOSED: ['PILOT_TESTING', 'IN_PROGRESS', 'RESOLVED'],
  PILOT_TESTING: ['RESOLVED', 'IN_PROGRESS'],
  RESOLVED: ['IN_PROGRESS'], // Allow reopening if required by administration
  REJECTED: ['UNDER_REVIEW'], // Allow appeal / re-evaluation
  DUPLICATE: ['UNDER_REVIEW']
};

/**
 * Check if transition from currentStatus to newStatus is valid
 */
const canTransition = (currentStatus, newStatus) => {
  if (!currentStatus || !newStatus) return false;
  const curr = currentStatus.toUpperCase();
  const next = newStatus.toUpperCase();

  if (curr === next) return true; // Idempotent same-state check
  const allowed = VALID_TRANSITIONS[curr] || [];
  return allowed.includes(next);
};

/**
 * Validates transition and throws formatted error if disallowed
 */
const validateTransition = (currentStatus, newStatus) => {
  const curr = (currentStatus || 'SUBMITTED').toUpperCase();
  const next = (newStatus || '').toUpperCase();

  if (!canTransition(curr, next)) {
    const allowed = VALID_TRANSITIONS[curr] || [];
    const error = new Error(
      `Disallowed workflow transition: Cannot transition challenge from '${curr}' to '${next}'. Allowed next states from '${curr}' are: [${
        allowed.join(', ') || 'None (Terminal state)'
      }]`
    );
    error.statusCode = 400;
    throw error;
  }
};

const STATUS_DISPLAY_LABELS = {
  SUBMITTED: 'Submitted by Citizen',
  UNDER_REVIEW: 'Under Review by District Nodal Cell',
  NEEDS_INFORMATION: 'More Information Requested from Submitter',
  VALIDATED: 'Validated as Official Delhi Challenge',
  ASSIGNED: 'Assigned to University Research Lab',
  IN_PROGRESS: 'Solution Engineering & Prototyping Active',
  SOLUTION_PROPOSED: 'Blueprint & Solution Proposed',
  PILOT_TESTING: 'Field Pilot Testing at Municipal Site',
  RESOLVED: 'Certified & Deployed in Delhi',
  REJECTED: 'Submission Rejected',
  DUPLICATE: 'Marked as Duplicate of Existing Challenge'
};

module.exports = {
  VALID_TRANSITIONS,
  canTransition,
  validateTransition,
  STATUS_DISPLAY_LABELS
};
