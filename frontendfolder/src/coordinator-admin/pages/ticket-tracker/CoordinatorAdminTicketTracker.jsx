import { useParams } from 'react-router-dom';
import { useState } from 'react';
import styles from './CoordinatorAdminTicketTracker.module.css';
import { getAllTickets, getTicketByNumber } from '../../../utilities/storages/ticketStorage';
import CoordinatorAdminOpenTicketModal from '../../components/modals/CoordinatorAdminOpenTicketModal';
import CoordinatorAdminRejectTicketModal from '../../components/modals/CoordinatorAdminRejectTicketModal';
import Breadcrumb from '../../../shared/components/Breadcrumb';

// Coordinator/Admin-side status progression (4 steps)
// Step 1: New (newly submitted, awaiting review)
// Step 2: Open (reviewed and assigned)
// Step 3: In Progress (being worked on)
// Step 4: Closed (or Rejected/Withdrawn as terminal states)
// Note: No "Resolved" status for admins - goes straight to Closed
const STATUS_COMPLETION = {
  1: ['New', 'Open', 'In Progress', 'Closed', 'Rejected', 'Withdrawn'],
  2: ['Open', 'In Progress', 'Closed', 'Rejected', 'Withdrawn'],
  3: ['In Progress', 'Closed', 'Rejected', 'Withdrawn'],
  4: ['Closed', 'Rejected', 'Withdrawn'],
};

const getStatusSteps = (status) =>
  [1, 2, 3, 4].map((id) => ({
    id,
    completed: STATUS_COMPLETION[id]?.includes(status) || false,
  }));

const formatDate = (date) =>
  date ? new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

// Generate logs based on ticket data
const generateLogs = (ticket) => {
  const logs = [];
  logs.push({ 
    id: 1, 
    user: 'System', 
    action: `Ticket #${ticket.ticketNumber} created - ${ticket.category}`, 
    timestamp: formatDate(ticket.dateCreated) 
  });
  
  // Handle assignedTo as object or string
  const assignedToName = typeof ticket.assignedTo === 'object' ? ticket.assignedTo?.name : ticket.assignedTo;
  
  if (assignedToName) {
    logs.push({ 
      id: 2, 
      user: assignedToName, 
      action: `Assigned to ${ticket.department} department`, 
      timestamp: formatDate(ticket.dateCreated) 
    });
  }
  
  if (ticket.status !== 'New' && ticket.status !== 'Pending') {
    logs.push({ 
      id: 3, 
      user: 'Coordinator', 
      action: `Status changed to ${ticket.status}`, 
      timestamp: formatDate(ticket.lastUpdated) 
    });
  }
  
  return logs;
};

export default function CoordinatorAdminTicketTracker() {
  const { ticketNumber } = useParams();
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const tickets = getAllTickets();

  const ticket = ticketNumber
    ? getTicketByNumber(ticketNumber)
    : tickets && tickets.length > 0 ? tickets[tickets.length - 1] : null;

  if (!ticket) {
    return (
      <div className={styles.coordinatorTicketTrackerPage}>
        <p className={styles.notFound}>No ticket found.</p>
      </div>
    );
  }

  const {
    ticketNumber: number,
    subject,
    category,
    subCategory,
    status: originalStatus,
    dateCreated,
    lastUpdated,
    description,
    fileUploaded,
    priorityLevel,
    department,
    assignedTo,
    scheduledRequest,
  } = ticket;

  // Convert "Submitted" to "New" for coordinator/admin view
  const status = originalStatus === 'Submitted' || originalStatus === 'Pending' ? 'New' : originalStatus;
  const statusSteps = getStatusSteps(status);
  
  // Generate dynamic data based on ticket
  const ticketLogs = generateLogs(ticket);

  return (
    <>
      <main className={styles.coordinatorTicketTrackerPage}>
        <Breadcrumb
          root="Ticket Management"
          currentPage="Ticket Tracker"
          rootNavigatePage="/admin/ticket-management/all"
          title={`Ticket No. ${number}`}
        />
        {/* Two Column Layout */}
        <div className={styles.contentGrid}>
          {/* Left Column - Ticket Information */}
          <div className={styles.leftColumn}>
            <section className={styles.ticketCard}>
              {/* Ticket Number with Priority and Status Badges */}
              <div className={styles.ticketHeader}>
                <div className={styles.headerLeft}>
                  <div className={`${styles.priorityBadge} ${styles[`priority${priorityLevel || 'NotSet'}`]}`}>
                    {priorityLevel || 'Not Set'}
                  </div>
                  <h2 className={styles.ticketNumber}>Ticket No. {number}</h2>
                </div>
                <div className={`${styles.statusBadge} ${styles[`status${status.replace(/\s+/g, '')}`]}`}>
                  {status}
                </div>
              </div>

              {/* Subject */}
              <div className={styles.subjectSection}>
                <h3 className={styles.sectionTitle}>{subject}</h3>
                <div className={styles.subjectMeta}>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Category:</span>
                    <span className={styles.metaValue}>{category} - {subCategory}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Department:</span>
                    <span className={styles.metaValue}>{department || 'N/A'}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Assigned To:</span>
                    <span className={styles.metaValue}>
                      {typeof assignedTo === 'object' ? assignedTo?.name || 'Unassigned' : assignedTo || 'Unassigned'}
                    </span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Date Created:</span>
                    <span className={styles.metaValue}>{formatDate(dateCreated)}</span>
                  </div>
                  <div className={styles.metaItem}>
                    <span className={styles.metaLabel}>Last Updated:</span>
                    <span className={styles.metaValue}>{formatDate(lastUpdated)}</span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className={styles.descriptionSection}>
                <h4 className={styles.descriptionLabel}>Description</h4>
                <p className={styles.descriptionText}>
                  {description || 'No description provided.'}
                </p>
              </div>

              {/* Attachments */}
              {fileUploaded && (
                <div className={styles.attachmentSection}>
                  <h4 className={styles.attachmentLabel}>Attachments</h4>
                  <div className={styles.attachmentGrid}>
                    <div className={styles.attachmentCard}>
                      <div className={styles.attachmentIcon}>�</div>
                      <div className={styles.attachmentInfo}>
                        <p className={styles.attachmentName}>{fileUploaded}</p>
                        <button className={styles.attachmentDownload}>Download</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* Right Column - Actions and Logs */}
          <div className={styles.rightColumn}>
            {/* Action Buttons */}
            {['New', 'Pending'].includes(status) && (
              <div className={styles.actionButtonsContainer}>
                <button
                  className={styles.openButton}
                  onClick={() => setShowOpenModal(true)}
                >
                  Open Ticket
                </button>
                <button
                  className={styles.rejectButton}
                  onClick={() => setShowRejectModal(true)}
                >
                  Reject Ticket
                </button>
              </div>
            )}

            {/* Logs Container */}
            <div className={styles.tabsContainer}>
              <div className={styles.tabs}>
                <button className={`${styles.tab} ${styles.activeTab}`}>
                  Logs
                </button>
              </div>
              <div className={styles.tabContent}>
                <div className={styles.logsContent}>
                  {ticketLogs.map((log) => (
                    <div key={log.id} className={styles.logEntry}>
                      <div className={styles.logUser}>{log.user}</div>
                      <div className={styles.logAction}>{log.action}</div>
                      <div className={styles.logTimestamp}>{log.timestamp}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showOpenModal && (
        <CoordinatorAdminOpenTicketModal
          ticket={ticket}
          onClose={() => setShowOpenModal(false)}
        />
      )}
      {showRejectModal && (
        <CoordinatorAdminRejectTicketModal
          ticket={ticket}
          onClose={() => setShowRejectModal(false)}
        />
      )}
    </>
  );
}
