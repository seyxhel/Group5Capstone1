import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './CoordinatorAdminTicketTracker.module.css';
import { backendTicketService } from '../../../services/backend/ticketService';
import CoordinatorAdminOpenTicketModal from '../../components/modals/CoordinatorAdminOpenTicketModal';
import CoordinatorAdminRejectTicketModal from '../../components/modals/CoordinatorAdminRejectTicketModal';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import ViewCard from '../../../shared/components/ViewCard';

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

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchTicket = async () => {
      setLoading(true);
      try {
        if (ticketNumber) {
          const t = await backendTicketService.getTicketByNumber(ticketNumber);
          if (!mounted) return;
          // normalize fields
          const norm = {
            ...t,
            ticketNumber: t.ticket_number || t.ticketNumber || t.ticket_id || t.ticketId || t.id,
            dateCreated: t.submit_date || t.createdAt || t.dateCreated || t.created_at || t.submitDate,
            lastUpdated: t.update_date || t.updatedAt || t.lastUpdated || t.updateDate,
            subCategory: t.subCategory || t.sub_category || t.subcategory || t.sub_cat || '',
            // Normalize priorityLevel for badge rendering
            priorityLevel: t.priority || t.priorityLevel || t.priority_level || null,
            // Normalize comments/logs: sort newest-first if present
            comments: Array.isArray(t.comments) ? [...t.comments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) : [],
          };
          setTicket(norm);
        } else {
          // No ticketNumber param: try fetching all and pick the last
          const all = await backendTicketService.getAllTickets();
          if (!mounted) return;
          const last = Array.isArray(all) && all.length > 0 ? all[all.length - 1] : null;
          if (last) {
            const norm = {
              ...last,
              ticketNumber: last.ticket_number || last.ticketNumber || last.ticket_id || last.ticketId || last.id,
              dateCreated: last.submit_date || last.createdAt || last.dateCreated || last.created_at || last.submitDate,
              lastUpdated: last.update_date || last.updatedAt || last.lastUpdated || last.updateDate,
              subCategory: last.subCategory || last.sub_category || last.subcategory || last.sub_cat || '',
            };
            setTicket(norm);
          } else setTicket(null);
        }
      } catch (err) {
        console.error('[TicketTracker] error fetching ticket:', err);
        setTicket(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchTicket();
    return () => { mounted = false; };
  }, [ticketNumber]);

  if (loading) {
    return (
      <div className={styles.coordinatorTicketTrackerPage}>
        <p className={styles.notFound}>Loading ticket...</p>
      </div>
    );
  }

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
  
  // Combine System log and backend comments, then sort all by timestamp (latest-to-oldest)
  let ticketLogs = [];
  const systemLog = {
    id: 'system',
    user: 'System',
    action: `Ticket #${ticket.ticketNumber} created - ${ticket.category}`,
    timestamp: formatDate(ticket.dateCreated),
    rawDate: new Date(ticket.dateCreated)
  };
  // Get current user from localStorage
  let currentUser = null;
  try {
    currentUser = JSON.parse(localStorage.getItem('hdts_current_user') || 'null');
  } catch (e) { currentUser = null; }

  let coordinatorLogs = [];
  if (Array.isArray(ticket.comments) && ticket.comments.length > 0) {
    coordinatorLogs = ticket.comments
      .filter(c => c.user?.role === 'Ticket Coordinator' || c.user?.role === 'System Admin') // Only show coordinator/admin actions
      .map((c, idx) => {
        let isCurrentCoordinator = false;
        if (currentUser && c.user) {
          // Match by id, email, username, or firstName/lastName (from localStorage)
          if (
            (c.user.id && currentUser.id && c.user.id === currentUser.id) ||
            (c.user.email && currentUser.email && c.user.email === currentUser.email) ||
            (c.user.username && currentUser.username && c.user.username === currentUser.username) ||
            (c.user.first_name && currentUser.firstName && c.user.first_name === currentUser.firstName &&
             c.user.last_name && currentUser.lastName && c.user.last_name === currentUser.lastName) ||
            (c.user.firstName && currentUser.firstName && c.user.firstName === currentUser.firstName &&
             c.user.lastName && currentUser.lastName && c.user.lastName === currentUser.lastName)
          ) {
            isCurrentCoordinator = true;
          }
        }
        return {
          id: c.id || idx,
          user: isCurrentCoordinator ? 'You' : 'Coordinator',
          action: c.comment,
          timestamp: formatDate(c.created_at),
          rawDate: new Date(c.created_at)
        };
      });
  } else {
    coordinatorLogs = generateLogs(ticket).filter(l => l.user !== 'System').map(l => ({...l, rawDate: new Date(l.timestamp)}));
  }
  ticketLogs = [systemLog, ...coordinatorLogs];
  // Sort all logs by rawDate, latest-to-oldest
  ticketLogs.sort((a, b) => b.rawDate - a.rawDate);

  return (
    <>
      <main className={styles.coordinatorTicketTrackerPage}>
        <Breadcrumb
          root="Ticket Management"
          currentPage="Ticket Tracker"
          rootNavigatePage="/admin/ticket-management/all"
          title={`Ticket No. ${number}`}
        />
        <ViewCard>
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
        </ViewCard>
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
