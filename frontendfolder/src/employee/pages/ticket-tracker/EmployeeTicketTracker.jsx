import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './EmployeeTicketTracker.module.css';
import { backendTicketService } from '../../../services/backend/ticketService';
import { toEmployeeStatus } from '../../../utilities/helpers/statusMapper';
import authService from '../../../utilities/service/authService';
import EmployeeActiveTicketsWithdrawTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal';
import EmployeeActiveTicketsCloseTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal';
import Button from '../../../shared/components/Button';

// Employee-side status progression (5 steps)
// Step 1: Pending (when admin sets New or Open)
// Step 2: In Progress
// Step 3: Resolved (employee can close from here)
// Step 4: Closed (or Rejected/Withdrawn as terminal states)
const STATUS_COMPLETION = {
  1: ['Pending', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn'],
  2: ['In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn'],
  3: ['Resolved', 'Closed', 'Rejected', 'Withdrawn'],
  4: ['Closed', 'Rejected', 'Withdrawn'],
};

const getStatusSteps = (status) =>
  [1, 2, 3, 4].map((id) => ({
    id,
    completed: STATUS_COMPLETION[id]?.includes(status) || false,
  }));

const DetailField = ({ label, value }) => (
  <fieldset>
    <label>{label}</label>
    <p>{value || 'N/A'}</p>
  </fieldset>
);

const formatDate = (date) =>
  date ? new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

// Generate logs based on ticket data (start with any persisted logs)
// Accept currentUser to decide labels for certain status changes
const generateLogs = (ticket, currentUser) => {
  const logs = Array.isArray(ticket?.logs) ? ticket.logs.map((l, idx) => ({
    id: l.id || idx + 1,
    user: l.user || 'You',
    action: l.action || `Status changed to ${ticket.status}`,
    timestamp: l.timestamp || ticket.update_date || ticket.submit_date,
  })) : [];

  // System-created entry
  logs.push({
    id: logs.length + 1,
    user: 'System',
    action: `Ticket #${ticket.ticket_number} created - ${ticket.category}`,
    timestamp: ticket.submit_date,
  });

  // Handle assignedTo as object or string
  const assignedToName = typeof ticket.assigned_to === 'object' ? ticket.assigned_to?.name : ticket.assigned_to;
  if (assignedToName) {
    logs.push({
      id: logs.length + 1,
      user: assignedToName,
      action: `Assigned to ${ticket.department} department`,
      timestamp: ticket.submit_date,
    });
  }

  // Add status change log for Withdrawn
  if (ticket.status === 'Withdrawn') {
    logs.push({
      id: logs.length + 1,
      user: 'You',
      action: `Status changed to Withdrawn`,
      timestamp: ticket.time_closed || ticket.update_date,
    });
  }

  // Add a generated status change log for other statuses (not New, Pending, or Withdrawn)
  if (ticket.status !== 'New' && ticket.status !== 'Pending' && ticket.status !== 'Withdrawn') {
    let userLabel = 'Coordinator';

    if ([ 'Resolved', 'In Progress', 'On Hold' ].includes(ticket.status)) {
      userLabel = 'Agent';
    } else if (ticket.status === 'Rejected') {
      userLabel = 'Coordinator';
    } else if (ticket.status === 'Closed') {
      // If the viewing user is the ticket owner, assume they closed it -> 'You'
      // Otherwise assume system auto-closed -> 'System'
      try {
        const ownerId = ticket.employee && (ticket.employee.id || ticket.employee);
        const viewerId = currentUser && (currentUser.id || currentUser);
        userLabel = ownerId && viewerId && Number(ownerId) === Number(viewerId) ? 'You' : 'System';
      } catch (e) {
        userLabel = 'System';
      }
    }

    logs.push({
      id: logs.length + 1,
      user: userLabel,
      action: `Status changed to ${ticket.status}`,
      timestamp: ticket.update_date,
    });
  }

  // Sort logs by timestamp (latest to oldest)
  logs.sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateB - dateA; // Descending order (newest first)
  });

  // Map timestamps into formatted strings for display
  return logs.map((l) => ({ ...l, timestamp: formatDate(l.timestamp) }));
};

// Convert API comment objects into message objects for the UI
const mapCommentsToMessages = (comments, currentUserId) => {
  if (!Array.isArray(comments)) return [];
  return comments.map((c, idx) => {
    const userId = c.user && (c.user.id || null);
    const isCurrent = currentUserId && userId && Number(currentUserId) === Number(userId);
    return {
      id: c.id || idx + 1,
      sender: isCurrent ? 'You' : (c.user ? `${c.user.first_name} ${c.user.last_name}` : 'Support Team'),
      message: c.comment || c.message || '',
      timestamp: formatDate(c.created_at || c.createdAt || c.createdAt)
    };
  }); // API returns oldest-first, keep chronological order (oldest at top, newest at bottom)
};

export default function EmployeeTicketTracker() {
  const { ticketNumber } = useParams();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'message'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);

  // Get current logged-in user
  const currentUser = authService.getCurrentUser();
  
  // Fetch ticket from backend
  useEffect(() => {
    let isMounted = true;

    const fetchTicket = async () => {
      if (!ticketNumber) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('🔢 Fetching ticket number:', ticketNumber);
        
        // Fetch ticket by number from backend
        const fetchedTicket = await backendTicketService.getTicketByNumber(ticketNumber);
        
        if (!isMounted) return;

        console.log('✅ Fetched ticket:', fetchedTicket);
        setTicket(fetchedTicket);
      } catch (error) {
        console.error('Error fetching ticket:', error);
        if (isMounted) setTicket(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTicket();

    return () => {
      isMounted = false;
    };
  }, [ticketNumber]);

  // Load persisted comments/messages for this ticket from backend (if available)
  useEffect(() => {
    if (!ticket || !ticket.id) {
      setMessages([]);
      return;
    }

    const loadComments = async () => {
      try {
        // Fetch ticket details with comments
        const data = await backendTicketService.getTicketById(ticket.id);
        const currentUserId = currentUser?.id;
        let mapped = mapCommentsToMessages(data.comments || [], currentUserId);
        
        // Ensure the initial system message exists
        const systemMessageText = `Your ticket regarding "${ticket.subject}" has been received and is being reviewed.`;
        const hasSystem = mapped.some(m => m.sender === 'Support Team' && (m.message || '').includes('has been received'));
        
        if (!hasSystem) {
          mapped = [{
            id: 'sys-1',
            sender: 'Support Team',
            message: systemMessageText,
            timestamp: formatDate(ticket.submit_date || new Date().toISOString())
          }, ...mapped];
        }
        
        setMessages(mapped);
      } catch (e) {
        console.error('Failed to load ticket comments:', e);
        setMessages([]);
      }
    };

    // Reset messages for a fresh ticket view
    setMessages([]);
    loadComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticket?.ticket_number, ticket?.id]);

  if (loading) {
    return (
      <div className={styles.employeeTicketTrackerPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Loading...</h1>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={styles.employeeTicketTrackerPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>No Ticket Found</h1>
        </div>
        <p className={styles.notFound}>
          No ticket data available. Please navigate from the Active Tickets page or check your ticket number.
        </p>
      </div>
    );
  }

  const {
    ticket_number: number,
    subject,
    category,
    sub_category: subCategory,
    status: originalStatus,
    submit_date: dateCreated,
    update_date: lastUpdated,
    description,
    file_uploaded: fileUploaded,
    priority: priorityLevel,
    department,
    assigned_to: assignedTo,
    scheduled_date: scheduledRequest,
  } = ticket;

  // Convert status to employee view (New/Open -> Pending)
  const status = toEmployeeStatus(originalStatus);
  const statusSteps = getStatusSteps(status);
  const isClosable = status === 'Resolved';

  // Generate dynamic data based on ticket
  const ticketLogs = generateLogs(ticket, currentUser);

  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      (async () => {
        try {
          // If this ticket has a backend id, persist the comment
          if (ticket && (ticket.id || ticket.id === 0)) {
            const created = await backendTicketService.createComment(ticket.id, newMessage, false);
            // Map single returned comment to message format
            const currentUser = authService.getCurrentUser();
            const currentUserId = currentUser?.id;
            const isCurrent = created.user && currentUserId && Number(created.user.id) === Number(currentUserId);
            const msg = {
              id: created.id,
              sender: isCurrent ? 'You' : (created.user ? `${created.user.first_name} ${created.user.last_name}` : 'You'),
              message: created.comment || '',
              timestamp: formatDate(created.created_at)
            };
            setMessages((prev) => [...prev, msg]);
            setNewMessage('');
            return;
          }

          // Fallback local behavior: append to in-memory messages
          const newMsg = {
            id: messages.length + 1,
            sender: 'You',
            message: newMessage,
            timestamp: formatDate(new Date().toISOString())
          };
          setMessages([...messages, newMsg]);
          setNewMessage('');
        } catch (err) {
          console.error('Failed to send message:', err);
        }
      })();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handler for successful withdraw action from modal
  const handleWithdrawSuccess = async (ticketNum, newStatus) => {
    try {
      // Refresh the ticket data from backend after withdrawal
      if (ticketNumber) {
        const updatedTicket = await backendTicketService.getTicketByNumber(ticketNumber);
        setTicket(updatedTicket);
      }
      setShowWithdrawModal(false);
    } catch (e) {
      console.error('Failed to refresh ticket after withdrawal:', e);
      setShowWithdrawModal(false);
    }
  };

  return (
    <>
      <main className={styles.employeeTicketTrackerPage}>
        {/* Breadcrumb Navigation */}
        <div className={styles.pageHeader}>
          <p className={styles.breadcrumb}>Ticket Records / Ticket Tracker</p>
          <h1 className={styles.pageTitle}>{number}</h1>
        </div>

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
                      <div className={styles.attachmentIcon}>📄</div>
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

          {/* Right Column - Actions and Details */}
          <div className={styles.rightColumn}>
            {/* Action Button */}
            {!['Closed', 'Rejected', 'Withdrawn'].includes(status) && (
              <button
                className={isClosable ? styles.closeButton : styles.withdrawButton}
                onClick={() =>
                  isClosable ? setShowCloseModal(true) : setShowWithdrawModal(true)
                }
              >
                {isClosable ? 'Close Ticket' : 'Withdraw Ticket'}
              </button>
            )}

            {/* Tabs: Logs / Message */}
            <div className={styles.tabsContainer}>
                <div className={styles.tabs}>
                  <button 
                    className={`${styles.tab} ${activeTab === 'logs' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('logs')}
                  >
                    Logs
                  </button>
                  <button 
                    className={`${styles.tab} ${activeTab === 'message' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('message')}
                  >
                    Message
                  </button>
                </div>
                <div className={styles.tabContent}>
                  {activeTab === 'logs' ? (
                  <div className={styles.logsContent}>
                    {ticketLogs.map((log) => (
                      <div key={log.id} className={styles.logEntry}>
                        <div className={styles.logUser}>{log.user}</div>
                        <div className={styles.logAction}>{log.action}</div>
                        <div className={styles.logTimestamp}>{log.timestamp}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.messageSection}>
                    <div className={styles.messagesContent}>
                      {messages.map((msg) => (
                        <div key={msg.id} className={`${styles.messageEntry} ${msg.sender === 'You' ? styles.myMessage : styles.theirMessage}`}>
                          <div className={styles.messageSender}>{msg.sender}</div>
                          <div className={styles.messageText}>{msg.message}</div>
                          <div className={styles.messageTimestamp}>{msg.timestamp}</div>
                        </div>
                      ))}
                    </div>
                    <div className={styles.messageInputContainer}>
                      <textarea
                        className={styles.messageInput}
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        rows={2}
                      />
                      <button 
                        className={styles.sendButton}
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showWithdrawModal && (
        <EmployeeActiveTicketsWithdrawTicketModal
          ticket={ticket}
          onClose={() => setShowWithdrawModal(false)}
          onSuccess={handleWithdrawSuccess}
        />
      )}
      {showCloseModal && (
        <EmployeeActiveTicketsCloseTicketModal
          ticket={ticket}
          onClose={() => setShowCloseModal(false)}
        />
      )}
    </>
  );
}
