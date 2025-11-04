import React, { useState, useEffect } from 'react';
import { FiInbox, FiCheckCircle, FiClock, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import baseStyles from '../../../employee/pages/ticket-tracker/EmployeeTicketTracker.module.css';
import styles from './CoordinatorAdminTicketDetails.module.css';
import { getEmployeeUserById } from '../../../utilities/storages/employeeUserStorage';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import authService from '../../../utilities/service/authService';
import { convertToSecureUrl, getAccessToken, isSecureUrl } from '../../../utilities/secureMedia';

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
  const [remoteEmployee, setRemoteEmployee] = useState(null);
  const rawEmployeeImage = (remoteEmployee && (remoteEmployee.image || remoteEmployee.profile_image)) || employeeUser?.profileImage || ticket?.employeeProfileImage || DEFAULT_AVATAR;
  const absoluteFallback = (img) => {
    if (!img) return null;
    if (img.startsWith('http')) return img;
    const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'http://localhost:8000/media/';
    const clean = img.startsWith('/') ? img.slice(1) : img;
    return `${MEDIA_URL}${clean}`;
  };
  // Resolve image while avoiding converting the frontend default avatar into a backend URL
  const resolveImage = (raw) => {
    if (!raw) return DEFAULT_AVATAR;
    // If it's the local frontend default asset, return it as-is
    if (raw === DEFAULT_AVATAR) return DEFAULT_AVATAR;
    try {
      const secure = convertToSecureUrl(raw);
      const abs = absoluteFallback(raw);
      const final = secure || abs || raw || DEFAULT_AVATAR;
      console.log('CoordinatorAdminTicketDetails.resolveImage', { raw, secure, abs, final, isSecure: isSecureUrl(secure) });
      return final;
    } catch (e) {
      console.warn('CoordinatorAdminTicketDetails.resolveImage error', e, 'raw=', raw);
      return raw || DEFAULT_AVATAR;
    }
  };

  const employeeImage = resolveImage(rawEmployeeImage);
  console.log('CoordinatorAdminTicketDetails: employeeImage resolved=', employeeImage, 'raw=', rawEmployeeImage);

  // Try to fetch authoritative employee data from backend when available
  useEffect(() => {
    let mounted = true;
    console.log('CoordinatorAdminTicketDetails: mount/useEffect ticket=', ticket);
    try {
      const tok = getAccessToken();
      console.log('CoordinatorAdminTicketDetails: access token present=', !!tok, tok ? `(len=${tok.length})` : tok);
    } catch (e) {
      console.warn('CoordinatorAdminTicketDetails: getAccessToken error', e);
    }
    // Extra debug: log possible employee fields so we can see why id derivation fails
    try {
      console.log('CoordinatorAdminTicketDetails: possible employee fields', {
        employeeField: ticket?.employee,
        employee_id: ticket?.employee_id,
        employeeId: ticket?.employeeId,
        requester: ticket?.requester,
        requester_id: ticket?.requester_id,
        created_by: ticket?.created_by,
        raw: ticket?.raw,
      });
    } catch (e) {
      console.warn('CoordinatorAdminTicketDetails: debug logging failed', e);
    }
    const loadEmployee = async () => {
      try {
        if (!ticket) return;

        // If ticket already includes an embedded employee object, prefer that
        const embedded = ticket.employee || ticket.requester || ticket.requested_by || ticket.createdBy || ticket.created_by;
        console.log('CoordinatorAdminTicketDetails: embedded employee found=', !!embedded, embedded);
        if (embedded && Object.keys(embedded).length > 0) {
          // If the embedded object already contains an image field, use it.
          const hasImage = !!(embedded.image || embedded.profile_image || embedded.photo || embedded.photo_url);
          console.log('CoordinatorAdminTicketDetails: embedded hasImage=', hasImage);
          if (hasImage) {
            if (mounted) setRemoteEmployee(embedded);
            return;
          }

          // Embedded present but missing image info — fetch authoritative employee by id to enrich record
          const embId = embedded.id || embedded.employee_id || embedded.user_id || null;
          if (embId) {
            console.log('CoordinatorAdminTicketDetails: embedded missing image, fetching full employee by id=', embId);
            const emp2 = await backendEmployeeService.getEmployeeById(embId).catch(() => null);
            console.log('CoordinatorAdminTicketDetails: fetched employee to enrich embedded=', emp2);
            if (!mounted) return;
            if (emp2) {
              setRemoteEmployee(emp2);
              return;
            }
            // If enrichment failed, fall back to using the embedded object
            if (mounted) setRemoteEmployee(embedded);
            return;
          }

          // No embId found — use embedded as-is
          if (mounted) setRemoteEmployee(embedded);
          return;
        }

        // Derive an employee id from multiple possible fields
        const id = ticket.employeeId || ticket.employee_id || ticket.employeeId || ticket.requester_id || ticket.requested_by_id || ticket.createdBy?.id || ticket.created_by?.id || null;
        console.log('CoordinatorAdminTicketDetails: derived employee id=', id);
        if (!id) return;

        // backendEmployeeService.getEmployeeById may throw if not available
        const emp = await backendEmployeeService.getEmployeeById(id).catch(() => null);
        console.log('CoordinatorAdminTicketDetails: fetched employee result=', emp);
        if (!mounted) return;
        if (emp) {
          console.log('CoordinatorAdminTicketDetails: setting remoteEmployee');
          setRemoteEmployee(emp);
        }
      } catch (e) {
        console.warn('Failed to fetch remote employee for ticket details:', e);
      }
    };
    loadEmployee();
    return () => { mounted = false; };
  }, [ticket]);

  const coordinatorId = ticket?.coordinatorReview?.coordinatorId || ticket?.assignedTo || null;
  const coordinatorUser = coordinatorId ? getEmployeeUserById(Number(coordinatorId)) : null;
  const rawCoordinatorImage = coordinatorUser?.profileImage || ticket?.coordinatorReview?.coordinatorProfileImage || DEFAULT_AVATAR;
  const coordinatorImage = resolveImage(rawCoordinatorImage);
  console.log('CoordinatorAdminTicketDetails: coordinatorImage resolved=', coordinatorImage, 'raw=', rawCoordinatorImage);

  // Get the agent/assignee info if ticket is assigned
  const agentId = ticket?.assignedTo;
  const agentUser = agentId ? getEmployeeUserById(Number(agentId)) : null;
  const rawAgentImage = agentUser?.profileImage || DEFAULT_AVATAR;
  const agentImage = resolveImage(rawAgentImage);
  console.log('CoordinatorAdminTicketDetails: agentImage resolved=', agentImage, 'raw=', rawAgentImage);
  const agentName = agentUser ? `${agentUser.firstName} ${agentUser.lastName}` : ticket?.assignedAgent || 'None';

  // Determine ticket stage
  const ticketStage = getTicketStage(ticket?.status);

  // Helper: detect whether ticket ever passed through one of the progressive stages
  const passedThroughProgressiveStages = (t) => {
    if (!t) return false;
    const targets = ['in progress', 'on hold', 'resolved', 'closed'];
    const checkStringForTargets = (s) => {
      if (!s) return false;
      const low = String(s).toLowerCase();
      return targets.some(ts => low.includes(ts));
    };

    try {
      // 1) activity/logs array entries
      const arraysToCheck = [t.activity, t.activity_logs, t.logs, t.history, t.status_history, t.status_changes];
      for (const arr of arraysToCheck) {
        if (Array.isArray(arr) && arr.length > 0) {
          for (const it of arr) {
            if (!it) continue;
            // check common fields
            if (checkStringForTargets(it.type || it.action || it.detail || it.details || it.note || it.status || it.new_status || it.text || it.message)) return true;
            // check serialized message content
            if (checkStringForTargets(JSON.stringify(it))) return true;
          }
        }
      }

      // 2) raw object fields
      const raw = t.raw || t;
      if (raw) {
        if (checkStringForTargets(raw.status) || checkStringForTargets(raw.current_status) || checkStringForTargets(raw.previous_statuses) || checkStringForTargets(raw.status_history)) return true;
        // deep scan for any nested status strings
        const rawStr = JSON.stringify(raw);
        if (checkStringForTargets(rawStr)) return true;
      }
    } catch (e) {
      // ignore parse errors
      console.warn('passedThroughProgressiveStages error', e);
    }

    return false;
  };

  // Don't show Assigned Agent for terminal Rejected tickets. For Withdrawn, hide only if it never passed through progressive stages.
  const statusLower = (ticket?.status || '').toLowerCase();
  const isRejected = statusLower === 'rejected';
  const isWithdrawn = statusLower === 'withdrawn';
  const withdrewWithoutProgress = isWithdrawn && !passedThroughProgressiveStages(ticket);
  const hideAssignedAgent = isRejected || withdrewWithoutProgress;
  console.debug('Assigned agent visibility:', { status: ticket?.status, isRejected, isWithdrawn, withdrewWithoutProgress, hideAssignedAgent });

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
                <img
                  src={employeeImage}
                  alt={ticket?.employeeName || 'Employee'}
                  className={styles.avatarImageInner}
                  onError={(e) => {
                    console.warn('Employee image failed to load:', e.currentTarget.src, 'ticket:', ticket?.ticketNumber || ticket?.id || ticket?.employeeId);
                    e.currentTarget.src = DEFAULT_AVATAR;
                  }}
                />
              </div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>
                  {
                    // Prefer remote employee names, then local fixture, then ticket fields
                    (remoteEmployee && ((remoteEmployee.first_name || remoteEmployee.firstName || '') + ' ' + (remoteEmployee.last_name || remoteEmployee.lastName || '')).trim())
                    || (employeeUser && `${employeeUser.firstName || ''} ${employeeUser.lastName || ''}`.trim())
                    || ticket?.employeeName
                    || 'None'
                  }
                </div>
                <div className={styles.userMeta}>
                  {
                    // department
                    (remoteEmployee && (remoteEmployee.department || remoteEmployee.dept))
                    || ticket?.employeeDepartment
                    || (employeeUser && employeeUser.department)
                    || 'None'
                  }
                  <br />
                  Employee ID: {
                    (remoteEmployee && (remoteEmployee.company_id || remoteEmployee.companyId || remoteEmployee.employee_id))
                    || ticket?.employeeCompanyId || ticket?.employeeId
                    || (employeeUser && (employeeUser.employeeId || employeeUser.id))
                    || 'None'
                  }
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
                  <img
                    src={coordinatorImage}
                    alt={ticket?.coordinatorReview?.coordinatorName || 'Coordinator'}
                    className={styles.avatarImageInner}
                    onError={(e) => {
                      console.warn('Coordinator image failed to load:', e.currentTarget.src, 'ticket:', ticket?.ticketNumber || ticket?.id);
                      e.currentTarget.src = DEFAULT_AVATAR;
                    }}
                  />
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

        {/* ASSIGNED AGENT SECTION - Visible during In Progress and Completed stages
            Show a placeholder when there is no assigned agent so the UI can be wired to backend later */}
  {['in-progress', 'completed'].includes(ticketStage) && !hideAssignedAgent && (
          <div className={styles.section}>
            <div className={styles.sectionTitle}>Assigned Agent</div>
            <div className={styles.userCardWrap}>
              {ticket?.assignedTo ? (
                <div className={styles.userCard}>
                  <div className={styles.avatar}>
                    <img
                      src={agentImage}
                      alt={agentName}
                      className={styles.avatarImageInner}
                      onError={(e) => {
                        console.warn('Agent image failed to load:', e.currentTarget.src, 'ticket:', ticket?.ticketNumber || ticket?.id);
                        e.currentTarget.src = DEFAULT_AVATAR;
                      }}
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{agentName}</div>
                    <div className={styles.userMeta}>
                      {agentUser?.department || 'None'}<br />
                      Date Assigned: {formatDate ? formatDate(ticket?.dateAssigned) : ticket?.dateAssigned || 'None'}
                    </div>
                  </div>
                </div>
                ) : (
                // Placeholder card when no agent is assigned yet
                <div className={styles.userCard}>
                  <div className={styles.avatar}>
                    <img
                      src={DEFAULT_AVATAR}
                      alt="Unassigned"
                      className={styles.avatarImageInner}
                      onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                    />
                  </div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>Unassigned</div>
                    <div className={styles.userMeta}>
                      -<br />
                      Date Assigned: None
                    </div>
                  </div>
                </div>
              )}
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
