import React from 'react';
import { FiInbox, FiCheckCircle, FiClock, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import baseStyles from '../../../employee/pages/ticket-tracker/EmployeeTicketTracker.module.css';
import styles from './CoordinatorAdminTicketDetails.module.css';
import { getEmployeeUserById } from '../../../utilities/storages/employeeUserStorage';
import authService from '../../../utilities/service/authService';

const DEFAULT_AVATAR = '/MapLogo.png';

function PersonCard({ name, metaLines = [], image }) {
  return (
    <div className={styles.personCard}>
      <div className={styles.avatarWrap}>
        <img src={image || DEFAULT_AVATAR} alt={name || 'Profile'} className={styles.avatarImage} onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} />
      </div>
      <div className={styles.personInfo}>
        <div className={styles.personName}>{name || 'None'}</div>
        {metaLines.map((m, i) => (
          <div className={styles.personMeta} key={i}>{m}</div>
        ))}
      </div>
    </div>
  );
}

// Helper to determine ticket lifecycle stage
function getTicketStage(status) {
  const s = (status || '').toLowerCase();
  if (['new', 'pending'].includes(s)) return 'new';
  if (['in progress', 'on hold', 'open'].includes(s)) return 'in-progress';
  if (['resolved', 'closed', 'rejected', 'withdrawn'].includes(s)) return 'completed';
  return 'new';
}

// Timeline steps configuration with icons and status mapping
const TIMELINE_STEPS = [
  { 
    id: 1, 
    label: 'Submitted', 
    icon: FiInbox,
    statuses: ['new', 'pending', 'open', 'in progress', 'on hold', 'resolved', 'closed', 'rejected', 'withdrawn']
  },
  { 
    id: 2, 
    label: 'In Progress', 
    icon: FiClock,
    statuses: ['in progress', 'on hold', 'resolved', 'closed']
  },
  { 
    id: 3, 
    label: 'Resolved', 
    icon: FiCheckCircle,
    statuses: ['resolved', 'closed']
  },
  { 
    id: 4, 
    label: 'Closed', 
    icon: FiCheckCircle,
    statuses: ['closed']
  },
];

// Determine which step is active based on ticket status
function getActiveStep(status) {
  if (!status) return 0;
  const s = status.toLowerCase();
  
  // Rejected/Withdrawn are terminal states that don't follow normal progression
  if (['rejected', 'withdrawn'].includes(s)) return 1;
  
  if (['closed'].includes(s)) return 4;
  if (['resolved'].includes(s)) return 3;
  if (['in progress', 'on hold'].includes(s)) return 2;
  if (['open', 'pending', 'new'].includes(s)) return 1;
  
  return 0;
}

export default function CoordinatorAdminTicketDetails({ ticket, ticketLogs = [], canSeeCoordinatorReview, formatDate }) {
  // Get current user role
  const userRole = authService.getUserRole();
  const isTicketCoordinator = userRole === 'Ticket Coordinator';
  const isSystemAdmin = userRole === 'System Admin';

  // Resolve user profile images using the stored users fixture
  const employeeUser = ticket?.employeeId ? getEmployeeUserById(Number(ticket.employeeId)) : null;
  const employeeImage = employeeUser?.profileImage || ticket?.employeeProfileImage || DEFAULT_AVATAR;

  const coordinatorId = ticket?.coordinatorReview?.coordinatorId || ticket?.assignedTo || null;
  const coordinatorUser = coordinatorId ? getEmployeeUserById(Number(coordinatorId)) : null;
  const coordinatorImage = coordinatorUser?.profileImage || ticket?.coordinatorReview?.coordinatorProfileImage || DEFAULT_AVATAR;

  // Get the agent/assignee info if ticket is assigned
  const agentId = ticket?.assignedTo;
  const agentUser = agentId ? getEmployeeUserById(Number(agentId)) : null;
  const agentImage = agentUser?.profileImage || DEFAULT_AVATAR;
  const agentName = agentUser ? `${agentUser.firstName} ${agentUser.lastName}` : ticket?.assignedAgent || 'None';

  // Determine ticket stage
  const ticketStage = getTicketStage(ticket?.status);

  // Calculate SLA status (simplified: based on priority and time elapsed)
  const calculateSLAStatus = () => {
    if (!ticket?.dateCreated) return 'Unknown';
    const created = new Date(ticket.dateCreated);
    const now = new Date();
    const hoursDiff = (now - created) / (1000 * 60 * 60);
    const slaHours = {
      'Critical': 4,
      'High': 8,
      'Medium': 24,
      'Low': 48
    };
    const slaLimit = slaHours[ticket?.priorityLevel] || 24;
    if (hoursDiff > slaLimit) return 'Overdue';
    if (hoursDiff > slaLimit * 0.8) return 'Due Soon';
    return 'On Time';
  };

  return (
    <div className={baseStyles.detailsGrid + ' ' + styles.detailsPanel + ' ' + styles.panelRoot}>
      <div className={styles.panelContent}>
        {/* Status-based timeline */}
        <div className={styles.horizontalTimelineWrap}>
          <div className={styles.timelineSteps}>
            {TIMELINE_STEPS.map((step) => {
              const Icon = step.icon;
              const activeStepNumber = getActiveStep(ticket?.status);
              const isCompleted = step.id <= activeStepNumber;
              const isActive = step.id === activeStepNumber;
              const isRejected = ['rejected', 'withdrawn'].includes((ticket?.status || '').toLowerCase());
              
              return (
                <div key={step.id} className={`${styles.timelineStep} ${isCompleted && !isActive ? styles.stepCompleted : ''} ${isActive ? styles.stepActive : ''}`}>
                  <div className={`${styles.stepIcon} ${isCompleted ? styles.stepIconCompleted : ''} ${isActive ? styles.stepIconActive : ''}`}>
                    <Icon />
                  </div>
                  <div className={styles.stepLabel}>{step.label}</div>
                </div>
              );
            })}
            {/* Show rejected/withdrawn as a terminal state */}
            {['rejected', 'withdrawn'].includes((ticket?.status || '').toLowerCase()) && (
              <div className={styles.timelineStep}>
                <div className={`${styles.stepIcon} ${styles.stepIconRejected}`}>
                  <FiXCircle />
                </div>
                <div className={styles.stepLabel}>{ticket.status}</div>
              </div>
            )}
          </div>
        </div>

        {/* EMPLOYEE SECTION - Always visible */}
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Employee</div>
          <div className={styles.userCardWrap}>
            <div className={styles.userCard}>
              <div className={styles.avatar}>
                <img src={employeeImage} alt={ticket?.employeeName || 'Employee'} className={styles.avatarImageInner} />
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>{ticket?.employeeName || 'None'}</div>
                <div className={styles.userMeta}>
                  {ticket?.employeeDepartment || 'None'}<br />
                  Employee ID: {ticket?.employeeId || 'None'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COORDINATOR SECTION - Visible when ticket is New/Pending (stage 1) and coordinator approved it */}
        {['new', 'pending'].includes(ticketStage) && ticket?.coordinatorReview && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Ticket Coordinator Review</div>
            <div className={styles.userCardWrap}>
              <div className={styles.userCard}>
                <div className={styles.avatar}>
                  <img src={coordinatorImage} alt={ticket?.coordinatorReview?.coordinatorName || 'Coordinator'} className={styles.avatarImageInner} />
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{ticket?.coordinatorReview?.coordinatorName || (coordinatorUser ? `${coordinatorUser.firstName} ${coordinatorUser.lastName}` : 'None')}</div>
                  <div className={styles.userMeta}>
                    {coordinatorUser?.department || ticket?.department || 'None'}<br />
                    Date Reviewed: {formatDate ? formatDate(ticket?.coordinatorReview?.dateReviewed) : ticket?.coordinatorReview?.dateReviewed || 'None'}
                  </div>
                </div>
              </div>
            </div>
            {/* Coordinator Actions Info */}
            {ticket?.coordinatorReview && (
              <div className={styles.coordinatorActionsCard}>
                {ticket?.priorityLevel && (
                  <div className={styles.infoField}>
                    <div className={styles.fieldLabel}>Priority Level</div>
                    <div className={styles.fieldValue}>{ticket.priorityLevel}</div>
                  </div>
                )}
                {ticket?.department && (
                  <div className={styles.infoField}>
                    <div className={styles.fieldLabel}>Assigned Department</div>
                    <div className={styles.fieldValue}>{ticket.department}</div>
                  </div>
                )}
                {ticket?.coordinatorReview?.comment && (
                  <div className={styles.infoField}>
                    <div className={styles.fieldLabel}>Comment to Agent</div>
                    <div className={styles.fieldValue}>{ticket.coordinatorReview.comment}</div>
                  </div>
                )}
                {ticket?.coordinatorReview?.status === 'rejected' && ticket?.coordinatorReview?.rejectionComment && (
                  <div className={styles.infoField}>
                    <div className={styles.fieldLabel}>Rejection Reason</div>
                    <div className={styles.fieldValue}>{ticket.coordinatorReview.rejectionComment}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ASSIGNED AGENT SECTION - Visible during In Progress stage (stage 2-3) */}
        {['in-progress', 'completed'].includes(ticketStage) && ticket?.assignedTo && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Assigned Agent</div>
            <div className={styles.userCardWrap}>
              <div className={styles.userCard}>
                <div className={styles.avatar}>
                  <img src={agentImage} alt={agentName} className={styles.avatarImageInner} />
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{agentName}</div>
                  <div className={styles.userMeta}>
                    {agentUser?.department || 'None'}<br />
                    Date Assigned: {formatDate ? formatDate(ticket?.dateAssigned) : ticket?.dateAssigned || 'None'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MONITORING VIEW - Visible to System Admins during In Progress and Completed stages */}
        {isSystemAdmin && ['in-progress', 'completed'].includes(ticketStage) && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Monitoring & SLA</div>
            <div className={styles.monitoringCard}>
              <div className={styles.infoField}>
                <div className={styles.fieldLabel}>SLA Status</div>
                <div className={`${styles.fieldValue} ${styles[`sla-${calculateSLAStatus().toLowerCase().replace(' ', '-')}`]}`}>
                  {calculateSLAStatus()}
                </div>
              </div>
              <div className={styles.infoField}>
                <div className={styles.fieldLabel}>Current Status</div>
                <div className={styles.fieldValue}>{ticket?.status || 'None'}</div>
              </div>
              {ticket?.targetResolutionDate && (
                <div className={styles.infoField}>
                  <div className={styles.fieldLabel}>Target Resolution Date</div>
                  <div className={styles.fieldValue}>{formatDate ? formatDate(ticket.targetResolutionDate) : ticket.targetResolutionDate}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* COMPLETION INFO - Visible when ticket is Resolved, Closed, Rejected, or Withdrawn */}
        {['completed'].includes(ticketStage) && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Resolution Details</div>
            <div className={styles.resolutionCard}>
              <div className={styles.infoField}>
                <div className={styles.fieldLabel}>Status</div>
                <div className={styles.fieldValue}>{ticket?.status || 'None'}</div>
              </div>
              <div className={styles.infoField}>
                <div className={styles.fieldLabel}>Date Completed</div>
                <div className={styles.fieldValue}>{formatDate ? formatDate(ticket?.dateResolved || ticket?.dateClosed) : ticket?.dateResolved || ticket?.dateClosed || 'None'}</div>
              </div>
              {ticket?.csatRating && (
                <div className={styles.infoField}>
                  <div className={styles.fieldLabel}>CSAT Rating</div>
                  <div className={styles.fieldValue}>{ticket.csatRating}/5 ⭐</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
