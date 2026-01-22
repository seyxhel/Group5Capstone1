import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import styles from '../../../employee/pages/ticket-tracker/EmployeeTicketTracker.module.css';
import { COORDINATOR_MOCK_TICKETS } from '../../mocks/coordinatorTicketsMock';
import Skeleton from '../../../shared/components/Skeleton/Skeleton';
import ViewCard from '../../../shared/components/ViewCard';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import Tabs from '../../../shared/components/Tabs';
import detailStyles from '../ticket-tracker/CoordinatorAdminTicketDetails.module.css';
import { FaFileImage, FaFilePdf, FaFileWord, FaFileExcel, FaFileCsv, FaFile, FaDownload, FaPaperclip } from 'react-icons/fa';

const formatDate = (date) => {
  if (!date) return 'None';
  const d = new Date(date);
  if (isNaN(d)) return 'None';
  const monthName = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const yearFull = d.getFullYear();
  return `${monthName} ${day}, ${yearFull}`;
};

const formatDateTime = (date) => {
  if (!date) return 'None';
  const d = new Date(date);
  if (isNaN(d)) return 'None';
  return d.toLocaleString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const toTitleCase = (str) => {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const generateLogs = (ticket) => {
  const logs = [];
  const createdAt = ticket.dateCreated || ticket.createdAt || new Date().toISOString();
  
  // Initial assignment log
  const assignedToName = typeof ticket.assignedTo === 'object' ? ticket.assignedTo?.name : ticket.assignedTo;
  if (assignedToName) {
    logs.push({
      id: logs.length + 1,
      user: assignedToName,
      action: 'Assigned as Ticket Owner',
      timestamp: formatDate(ticket.dateAssigned || createdAt),
      badge: 'ASSIGNED',
    });
  }

  // Status change logs
  if (ticket.status && ticket.status !== 'New' && ticket.status !== 'Pending') {
    logs.push({
      id: logs.length + 1,
      user: 'Coordinator',
      action: `Status changed to ${ticket.status}`,
      timestamp: formatDate(ticket.lastUpdated || createdAt),
      badge: ticket.status.toUpperCase().replace(/\s+/g, ''),
    });
  }

  // Activity logs
  if (Array.isArray(ticket.activity) && ticket.activity.length > 0) {
    ticket.activity.forEach((a) => {
      const who = a.user || a.performedBy || 'User';
      const when = formatDate(a.timestamp || a.date || a.createdAt);
      logs.push({
        id: logs.length + 1,
        user: who,
        action: a.details || a.note || a.action || 'Activity',
        timestamp: when,
        badge: (a.type || 'ACTION').toUpperCase(),
      });
    });
  }

  return logs;
};

const renderAttachments = (files) => {
  if (!files || (Array.isArray(files) && files.length === 0)) {
    return (
      <div className={detailStyles.emptyAttachments}>
        <FaPaperclip className={detailStyles.emptyIcon} />
        <p>No attachments for this ticket</p>
      </div>
    );
  }
  const fileArray = Array.isArray(files) ? files : [files];
  
  const getFileIcon = (file) => {
    const mimeType = file?.type || file?.mimeType;
    const name = file?.name || file?.filename || file;
    if (mimeType) {
      if (mimeType.startsWith('image/')) return <FaFileImage />;
      if (mimeType === 'application/pdf') return <FaFilePdf />;
      if (mimeType.includes('word') || mimeType.includes('document')) return <FaFileWord />;
      if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return <FaFileExcel />;
      if (mimeType === 'text/csv') return <FaFileCsv />;
    }
    if (typeof name === 'string') {
      const extension = name.split('.').pop()?.toLowerCase();
      if (['png', 'jpg', 'jpeg', 'gif', 'bmp', 'svg'].includes(extension)) return <FaFileImage />;
      if (extension === 'pdf') return <FaFilePdf />;
      if (['doc', 'docx'].includes(extension)) return <FaFileWord />;
      if (['xls', 'xlsx'].includes(extension)) return <FaFileExcel />;
      if (extension === 'csv') return <FaFileCsv />;
    }
    return <FaFile />;
  };

  return (
    <div className={styles.attachmentList}>
      {fileArray.map((f, idx) => {
        const name = f?.name || f?.filename || f;
        const url = f?.url || f?.downloadUrl || '#';
        return (
          <div key={idx} className={styles.attachmentItem}>
            <div className={styles.attachmentIcon}>{getFileIcon(f)}</div>
            <div style={{ flex: 1 }}>
              <a href={url} target="_blank" rel="noreferrer" className={styles.attachmentName}>{name}</a>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a href={url} target="_blank" rel="noreferrer" className={styles.attachmentDownload}>
                <FaDownload />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function CoordinatorMyTicketsView() {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('details');
  const [rightTab, setRightTab] = useState('details');
  const [isLoading, setIsLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [agentMessageText, setAgentMessageText] = useState('');
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);

  // Get ticket from mock data
  const ticket = ticketNumber ? COORDINATOR_MOCK_TICKETS.find(t => t.ticketNumber === ticketNumber) : null;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [ticketNumber, ticket]);

  if (isLoading && !ticket) {
    return (
      <ViewCard>
        <div className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <Skeleton width="100px" height="32px" />
            <Skeleton width="100%" height="200px" style={{ marginTop: '16px' }} />
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ marginTop: '16px' }}>
                <Skeleton width="150px" height="20px" />
                <Skeleton width="100%" height="24px" style={{ marginTop: '8px' }} />
              </div>
            ))}
          </div>
          <div className={styles.rightColumn}>
            <Skeleton width="100%" height="300px" />
          </div>
        </div>
      </ViewCard>
    );
  }

  if (!ticket) {
    return (
      <div className={styles.employeeTicketTrackerPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>No Ticket Found</h1>
        </div>
        <p className={styles.notFound}>
          No ticket data available. Please navigate from the Owned Tickets page or check your ticket number.
        </p>
      </div>
    );
  }

  const {
    ticketNumber: number,
    subject,
    category,
    subCategory,
    status,
    dateCreated,
    lastUpdated,
    description,
    fileUploaded,
    priorityLevel,
    department,
    assignedTo,
    createdBy,
    requesterName,
    workflow,
    currentStep,
    currentRole,
  } = ticket;

  const attachments = ticket.fileAttachments || ticket.attachments || ticket.files || fileUploaded;
  const ticketLogs = generateLogs(ticket);
  const ticketOwnerName = typeof assignedTo === 'object' ? assignedTo?.name : assignedTo;
  const requester = requesterName || createdBy || 'Unknown Requester';

  const statusColorClass = status ? status.replace(/\s+/g, '-').toLowerCase() : 'default';
  const priorityColorClass = priorityLevel ? priorityLevel.toLowerCase() : 'not-set';

  // Sync heights between left and right columns
  useEffect(() => {
    let rAF = null;
    let resizeTimer = null;

    const sync = () => {
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        const left = leftColRef.current;
        const right = rightColRef.current;
        if (!left || !right) return;
        left.style.minHeight = '';
        right.style.minHeight = '';
        const leftH = left.getBoundingClientRect().height;
        const rightH = right.getBoundingClientRect().height;
        const maxH = Math.max(leftH, rightH);
        left.style.minHeight = `${maxH}px`;
        right.style.minHeight = `${maxH}px`;
      });
    };

    sync();
    const lateTimer = setTimeout(sync, 220);

    const handleResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sync, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      if (rAF) cancelAnimationFrame(rAF);
      if (lateTimer) clearTimeout(lateTimer);
      if (resizeTimer) clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
    };
  }, [ticket, activeTab, rightTab]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    console.log('Sending message to requester:', messageText);
    setMessageText('');
  };

  const handleSendAgentMessage = () => {
    if (!agentMessageText.trim()) return;
    console.log('Sending message to TTS agents:', agentMessageText);
    setAgentMessageText('');
  };

  return (
    <>
      <main className={styles.employeeTicketTrackerPage}>
        <ViewCard>
          <div className={styles.viewCardInner}>
            <Breadcrumb
              root="Owned Tickets"
              rootNavigatePage="/admin/my-tickets/all"
              currentPage="Ticket Details"
              title={`Ticket No. ${number?.toString().replace(/^TCK-?\d{4}-?/, '')}`}
            />
            {/* Status and meta info moved into Ticket Details tab */}
          </div>

          <div className={styles.contentGrid}>
            {/* Left Column - Main Ticket Content with Tabs */}
            <div ref={leftColRef} className={styles.leftColumn}>
              <Tabs
                tabs={[
                  { label: 'Ticket Details', value: 'details' },
                  { label: 'Attachments', value: 'attachments' },
                  { label: 'Requester Communication', value: 'communication' },
                ]}
                active={activeTab}
                onChange={setActiveTab}
                className={detailStyles.tabsContainer}
              />

              {activeTab === 'details' && (
                <section className={detailStyles.ticketSection}>
                  <div className={styles.statusBadges}>
                    <span className={`${styles.badge} ${styles[`status-${statusColorClass}`]}`}>{status || 'New'}</span>
                    <span className={`${styles.badge} ${styles[`priority-${priorityColorClass}`]}`}>{priorityLevel || 'Not Set'}</span>
                  </div>
                  <div className={styles.metaInfo}>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Stage:</span>
                      <span className={styles.metaValue}>{currentStep || 'N/A'}</span>
                    </div>
                    <div className={styles.metaItem}>
                      <span className={styles.metaLabel}>Priority:</span>
                      <span className={styles.metaValue}>{priorityLevel || 'Not Set'}</span>
                    </div>
                  </div>
                  <div className={detailStyles.detailBlock}>
                    <div className={detailStyles.detailLabel}>Subject:</div>
                    <div className={detailStyles.detailValue}>{subject || 'No subject'}</div>
                  </div>
                  <div className={detailStyles.detailBlock}>
                    <div className={detailStyles.detailLabel}>Description:</div>
                    <div className={detailStyles.detailValue}>{description || 'No description provided'}</div>
                  </div>
                  <div className={detailStyles.detailGrid}>
                    <div className={detailStyles.detailItem}>
                      <div className={detailStyles.detailLabel}>Category:</div>
                      <div className={detailStyles.detailValue}>{category || 'None'}</div>
                    </div>
                    <div className={detailStyles.detailItem}>
                      <div className={detailStyles.detailLabel}>Sub-Category:</div>
                      <div className={detailStyles.detailValue}>{subCategory || 'None'}</div>
                    </div>
                    <div className={detailStyles.detailItem}>
                      <div className={detailStyles.detailLabel}>Department:</div>
                      <div className={detailStyles.detailValue}>{department || 'None'}</div>
                    </div>
                    <div className={detailStyles.detailItem}>
                      <div className={detailStyles.detailLabel}>Created Date:</div>
                      <div className={detailStyles.detailValue}>{formatDateTime(dateCreated)}</div>
                    </div>
                  </div>
                </section>
              )}

              {activeTab === 'attachments' && (
                <section className={detailStyles.ticketSection}>
                  <h3 className={detailStyles.sectionTitle}>
                    <FaPaperclip style={{ marginRight: 8 }} />
                    Attachments
                  </h3>
                  <div className={detailStyles.attachmentsContainer}>
                    {renderAttachments(attachments)}
                  </div>
                </section>
              )}

              {activeTab === 'communication' && (
                <section className={detailStyles.ticketSection}>
                  {/* Requester's original message */}
                  <div className={detailStyles.requesterMessage}>
                    <div className={detailStyles.messageHeader}>
                      <span className={detailStyles.requesterName}>{requester}</span>
                      <span className={detailStyles.requesterLabel}>(Requester)</span>
                      <span className={detailStyles.messageDate}>{formatDateTime(dateCreated)}</span>
                    </div>
                    <div className={detailStyles.messageContent}>
                      {description || 'No description provided'}
                    </div>
                  </div>

                  <hr className={detailStyles.divider} />

                  {/* Reply to requester */}
                  <div className={detailStyles.replySection}>
                    <div className={detailStyles.replyTo}>
                      To: <strong>{requester}</strong>
                    </div>
                    <textarea
                      className={detailStyles.messageInput}
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      rows={4}
                    />
                    <div className={detailStyles.messageActions}>
                      <button className={detailStyles.attachButton}>
                        <FaPaperclip style={{ marginRight: 6 }} />
                        Attach files
                      </button>
                      <button
                        className={detailStyles.sendButton}
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Right Column - Ticket Information & Action Log / Messages */}
            <div ref={rightColRef} className={`${styles.rightColumn} ${detailStyles.rightColumnFill}`}>
              <Tabs
                tabs={[
                  { label: 'Details', value: 'details' },
                  { label: 'Messages', value: 'messages' },
                ]}
                active={rightTab}
                onChange={setRightTab}
                className={detailStyles.tabsContainer}
              />

              {rightTab === 'details' && (
                <>
                  <div className={detailStyles.infoCard}>
                    <h3 className={detailStyles.infoCardTitle}>Ticket Information</h3>
                    <div className={detailStyles.infoCardContent}>
                      <div className={detailStyles.infoItem}>
                        <span className={detailStyles.infoLabel}>Ticket Owner:</span>
                        <span className={detailStyles.infoValue}>{ticketOwnerName || 'Unassigned'}</span>
                      </div>
                      <div className={detailStyles.infoItem}>
                        <span className={detailStyles.infoLabel}>Status:</span>
                        <span className={detailStyles.infoValue}>{status || 'New'}</span>
                      </div>
                      <div className={detailStyles.infoItem}>
                        <span className={detailStyles.infoLabel}>Priority:</span>
                        <span className={detailStyles.infoValue}>{priorityLevel || 'Not Set'}</span>
                      </div>
                      <div className={detailStyles.infoItem}>
                        <span className={detailStyles.infoLabel}>Workflow:</span>
                        <span className={detailStyles.infoValue}>{workflow || 'N/A'}</span>
                      </div>
                      <div className={detailStyles.infoItem}>
                        <span className={detailStyles.infoLabel}>Current Step:</span>
                        <span className={detailStyles.infoValue}>{currentStep || 'N/A'}</span>
                      </div>
                      <div className={detailStyles.infoItem}>
                        <span className={detailStyles.infoLabel}>Current Role:</span>
                        <span className={detailStyles.infoValue}>{currentRole || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className={detailStyles.infoCard}>
                    <h3 className={detailStyles.infoCardTitle}>Action Log</h3>
                    <div className={detailStyles.actionLog}>
                      {ticketLogs.length > 0 ? (
                        ticketLogs.map((log) => (
                          <div key={log.id} className={detailStyles.logEntry}>
                            <div className={detailStyles.logHeader}>
                              <span className={detailStyles.logUser}>{log.user}</span>
                              <span className={detailStyles.logBadge}>{log.badge}</span>
                            </div>
                            <div className={detailStyles.logAction}>{log.action}</div>
                            <div className={detailStyles.logTimestamp}>{log.timestamp}</div>
                          </div>
                        ))
                      ) : (
                        <div className={detailStyles.emptyLog}>No activity logs yet.</div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {rightTab === 'messages' && (
                <div className={detailStyles.messagesPanel}>
                  <div className={detailStyles.agentMessagesHeader}>
                    <span className={detailStyles.agentMessagesTitle}>TTS Agent Messages</span>
                    <span className={detailStyles.connectionStatus}>
                      <span className={detailStyles.statusDot} style={{ backgroundColor: '#e74c3c' }} />
                      Disconnected
                    </span>
                  </div>
                  <div className={detailStyles.agentMessagesContent}>
                    <p className={detailStyles.noMessages}>No messages yet. Start a conversation with TTS agents.</p>
                  </div>
                  <div className={detailStyles.agentMessageInput}>
                    <textarea
                      className={detailStyles.messageTextarea}
                      placeholder="Type a message to TTS agents..."
                      value={agentMessageText}
                      onChange={(e) => setAgentMessageText(e.target.value)}
                      rows={3}
                    />
                    <button
                      className={detailStyles.agentSendButton}
                      onClick={handleSendAgentMessage}
                      disabled={!agentMessageText.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </ViewCard>
      </main>
    </>
  );
}
