// coordinatorAdminTicketStatuses.js
// Status options visible to Ticket Coordinators and System Admins

/**
 * Coordinator/Admin Status Options
 * - "New": Newly submitted tickets awaiting review (replaces "Submitted")
 * - "Open": Tickets that have been reviewed, approved, and assigned
 * - "In Progress": Tickets being actively worked on
 * - "On Hold": Tickets temporarily paused
 * - "Withdrawn": Tickets withdrawn by employee
 * - "Closed": Tickets completed and closed (no "Resolved" status for admins)
 * - "Rejected": Tickets rejected by coordinator/admin
 */
export const coordinatorAdminTicketStatuses = [
  'New',
  'Open',
  'In Progress',
  'On Hold',
  'Withdrawn',
  'Closed',
  'Rejected',
];

export default coordinatorAdminTicketStatuses;
