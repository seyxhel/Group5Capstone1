import { useParams } from 'react-router-dom';
import { useState } from 'react';
import styles from './EmployeeTicketTracker.module.css';
import { getEmployeeTickets, getTicketByNumber } from '../../../utilities/storages/ticketStorage';
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

// Generate messages based on ticket data
const generateMessages = (ticket) => {
  return [
    { id: 1, sender: 'Support Team', message: `Your ticket regarding "${ticket.subject}" has been received and is being reviewed.`, timestamp: formatDate(ticket.dateCreated) },
    { id: 2, sender: 'You', message: 'Thank you for the update. When can I expect this to be resolved?', timestamp: formatDate(ticket.dateCreated) },
  ];
};

export default function EmployeeTicketTracker() {
  const { ticketNumber } = useParams();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'message'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Get current logged-in user
  const currentUser = authService.getCurrentUser();
  
  // Get only the current user's tickets
  const tickets = getEmployeeTickets(currentUser?.id);
  
  console.log('👤 Current User:', currentUser);
  console.log('🎫 User Tickets:', tickets);
  console.log('🔢 Ticket Number from URL:', ticketNumber);

  const ticket = ticketNumber
    ? tickets.find((t) => String(t.ticketNumber) === String(ticketNumber))
    : tickets && tickets.length > 0 ? tickets[tickets.length - 1] : null;

  console.log('✅ Selected Ticket:', ticket);

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

  // Convert status to employee view (New/Open -> Pending)
  const status = toEmployeeStatus(originalStatus);
  const statusSteps = getStatusSteps(status);
  const isClosable = status === 'Resolved';
  
  // Generate dynamic data based on ticket
  const ticketLogs = generateLogs(ticket);
  const ticketMessages = generateMessages(ticket);
  
  // Initialize messages from generated data
  if (messages.length === 0 && ticketMessages.length > 0) {
    setMessages(ticketMessages);
  }
  
  // Handle sending a new message
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: messages.length + 1,
        sender: 'You',
        message: newMessage,
        timestamp: formatDate(new Date().toISOString())
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
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
