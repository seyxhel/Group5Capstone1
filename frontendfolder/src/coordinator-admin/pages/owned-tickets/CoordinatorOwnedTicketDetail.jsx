import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import styles from './CoordinatorOwnedTicketDetail.module.css';
import { backendTicketService } from '../../../services/backend/ticketService';
import { useAuth } from '../../../context/AuthContext';
import { mockOwnedTickets, coordinatorTicketActions, coordinatorMessages, requesterMessages as mockRequesterMessages } from '../../../mock-data/ownedTickets';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import Skeleton from '../../../shared/components/Skeleton/Skeleton';

const CoordinatorOwnedTicketDetail = () => {
  const { ticketNumber } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [mainTab, setMainTab] = useState('ticket');

  // Edit states
  const [isEditingSubject, setIsEditingSubject] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  // Message states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [requesterMessages, setRequesterMessages] = useState([]);
  const [replyContent, setReplyContent] = useState('');
  const [showAllMessages, setShowAllMessages] = useState(false);

  // Priority and status states
  const [ticketStatus, setTicketStatus] = useState('LOW');
  const [lifecycle, setLifecycle] = useState('Triage Ticket');

  // Action log
  const [actionLog, setActionLog] = useState([]);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        setIsLoading(true);
        let ticketList = [];
        try {
          const allTickets = await backendTicketService.getAllTickets();
          ticketList = Array.isArray(allTickets) ? allTickets : (allTickets?.results || []);
        } catch (err) {
          console.warn('Backend unavailable, using mock data:', err);
          ticketList = mockOwnedTickets;
        }
        
        // Use mock data if empty
        if (ticketList.length === 0) {
          ticketList = mockOwnedTickets;
        }
        
        const found = ticketList.find(t => {
          const tNum = t.ticket_number || t.ticket_id || t.ticketNumber || t.id;
          return String(tNum) === String(ticketNumber);
        });

        if (found) {
          setTicket({
            id: found.ticket_number || found.ticket_id || found.ticketNumber || found.id,
            subject: found.subject || 'N/A',
            description: found.description || '',
            status: found.status || 'New',
            priority: found.priority || found.priorityLevel || 'Low',
            category: found.category || 'N/A',
            subCategory: found.sub_category || found.subCategory || 'N/A',
            createdDate: found.submit_date || found.dateCreated || found.created_at || new Date().toISOString(),
            assignedTo: found.assigned_to || found.assignedTo || currentUser?.first_name || 'N/A',
            requester: found.requester_name || found.requester || 'N/A',
            department: found.department || 'N/A',
            ...found
          });

          setSubject(found.subject || '');
          setDescription(found.description || '');

          // Initialize mock messages
          setMessages([
            {
              id: '1',
              sender: 'Support Team',
              role: 'TTS Agent',
              timestamp: new Date().toLocaleDateString(),
              time: new Date().toLocaleTimeString(),
              content: 'Ticket acknowledged. Working on resolution.'
            }
          ]);

          setRequesterMessages([
            {
              id: '1',
              sender: found.requester_name || found.requester || 'Requester',
              role: 'Requester',
              timestamp: new Date(found.submit_date || found.dateCreated || new Date()).toLocaleDateString(),
              time: new Date(found.submit_date || found.dateCreated || new Date()).toLocaleTimeString(),
              content: found.description || 'No description provided',
              isOwn: false
            }
          ]);

          setActionLog([
            {
              id: '1',
              user: currentUser?.first_name || 'You',
              role: currentUser?.role || 'Coordinator',
              action: 'Assigned',
              timestamp: new Date().toLocaleDateString(),
              badge: 'ASSIGNED'
            }
          ]);
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to load ticket:', err);
        setIsLoading(false);
      }
    };

    loadTicket();
  }, [ticketNumber, currentUser]);

  const handleSaveSubject = () => {
    if (ticket) {
      setTicket({ ...ticket, subject });
      setIsEditingSubject(false);
    }
  };

  const handleSaveDescription = () => {
    if (ticket) {
      setTicket({ ...ticket, description });
      setIsEditingDescription(false);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const newMsg = {
        id: Date.now().toString(),
        sender: currentUser?.first_name || 'You',
        role: currentUser?.role || 'Agent',
        timestamp: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        content: newMessage
      };
      setMessages([...messages, newMsg]);
      setNewMessage('');
    }
  };

  const handleSendRequesterMessage = () => {
    if (replyContent.trim()) {
      const newMsg = {
        id: Date.now().toString(),
        sender: currentUser?.first_name || 'You',
        role: currentUser?.role || 'Coordinator',
        timestamp: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        content: replyContent,
        isOwn: true
      };
      setRequesterMessages([...requesterMessages, newMsg]);
      setReplyContent('');
    }
  };

  const handleStatusChange = (newStatus) => {
    setTicketStatus(newStatus);
    setActionLog([
      {
        id: Date.now().toString(),
        user: currentUser?.first_name || 'You',
        role: currentUser?.role || 'Coordinator',
        action: `Changed priority to ${newStatus}`,
        timestamp: new Date().toLocaleDateString(),
        badge: newStatus
      },
      ...actionLog
    ]);
  };

  const handleLifecycleChange = (newLifecycle) => {
    setLifecycle(newLifecycle);
    setActionLog([
      {
        id: Date.now().toString(),
        user: currentUser?.first_name || 'You',
        role: currentUser?.role || 'Coordinator',
        action: newLifecycle,
        timestamp: new Date().toLocaleDateString(),
        badge: newLifecycle.replace(' ', '_').toUpperCase()
      },
      ...actionLog
    ]);
  };

  const displayedRequesterMessages = showAllMessages 
    ? requesterMessages 
    : requesterMessages.slice(-3);

  const getPriorityColor = (priority) => {
    switch (priority?.toUpperCase()) {
      case 'CRITICAL':
        return styles['priority-critical'];
      case 'HIGH':
        return styles['priority-high'];
      case 'MEDIUM':
        return styles['priority-medium'];
      case 'LOW':
        return styles['priority-low'];
      default:
        return styles['priority-low'];
    }
  };

  const getStatusColor = (status) => {
    if (!status) return '';
    const lower = status.toLowerCase().replace(/\s+/g, '-');
    return styles[`status-${lower}`] || '';
  };

  if (isLoading) {
    return <Skeleton height={200} />;
  }

  if (!ticket) {
    return (
      <div className={styles['detail-container']}>
        <div className={styles['error-message']}>
          <p>Ticket not found</p>
          <button onClick={() => navigate('/admin/owned-tickets')}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['detail-container']}>
      {/* Header */}
      <div className={styles['detail-header']}>
        <button 
          className={styles['back-btn']}
          onClick={() => navigate('/admin/owned-tickets')}
        >
          <FaArrowLeft /> Back
        </button>
        <div className={styles['header-content']}>
          <h1>Ticket #{ticket.id}</h1>
          <div className={styles['header-badges']}>
            <span className={`${styles['status-badge']} ${getStatusColor(ticket.status)}`}>
              {ticket.status}
            </span>
            <span className={`${styles['priority-badge']} ${getPriorityColor(ticketStatus)}`}>
              {ticketStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles['content-wrapper']}>
        {/* Left Panel */}
        <div className={styles['main-panel']}>
          {/* Ticket Stage Display */}
          <div className={styles['stage-display']}>
            <label>Stage:</label>
            <span className={styles['stage-value']}>{lifecycle}</span>
          </div>

          {/* Priority Display */}
          <div className={styles['priority-display']}>
            <label>Priority:</label>
            <span className={`${styles['priority-value']} ${styles[`priority-${ticketStatus.toLowerCase()}`]}`}>
              {ticketStatus}
            </span>
          </div>

          {/* Tabs */}
          <div className={styles['tabs']}>
            <button
              className={`${styles['tab']} ${mainTab === 'ticket' ? styles['active'] : ''}`}
              onClick={() => setMainTab('ticket')}
            >
              Ticket Details
            </button>
            <button
              className={`${styles['tab']} ${mainTab === 'requester' ? styles['active'] : ''}`}
              onClick={() => setMainTab('requester')}
            >
              Requester Communication
            </button>
          </div>

          {/* Tab Content */}
          <div className={styles['tab-content']}>
            {mainTab === 'ticket' ? (
              <div className={styles['ticket-details']}>
                {/* Subject */}
                <div className={styles['field-group']}>
                  <div className={styles['field-header']}>
                    <label>Subject:</label>
                    {!isEditingSubject && (
                      <button
                        className={styles['edit-btn']}
                        onClick={() => setIsEditingSubject(true)}
                      >
                        <FaEdit /> Edit
                      </button>
                    )}
                  </div>
                  {isEditingSubject ? (
                    <div className={styles['edit-form']}>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className={styles['edit-input']}
                      />
                      <div className={styles['edit-actions']}>
                        <button
                          className={styles['save-btn']}
                          onClick={handleSaveSubject}
                        >
                          <FaSave /> Save
                        </button>
                        <button
                          className={styles['cancel-btn']}
                          onClick={() => {
                            setSubject(ticket.subject);
                            setIsEditingSubject(false);
                          }}
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles['field-value']}>{ticket.subject}</p>
                  )}
                </div>

                {/* Description */}
                <div className={styles['field-group']}>
                  <div className={styles['field-header']}>
                    <label>Description:</label>
                    {!isEditingDescription && (
                      <button
                        className={styles['edit-btn']}
                        onClick={() => setIsEditingDescription(true)}
                      >
                        <FaEdit /> Edit
                      </button>
                    )}
                  </div>
                  {isEditingDescription ? (
                    <div className={styles['edit-form']}>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className={styles['edit-textarea']}
                        rows="4"
                      />
                      <div className={styles['edit-actions']}>
                        <button
                          className={styles['save-btn']}
                          onClick={handleSaveDescription}
                        >
                          <FaSave /> Save
                        </button>
                        <button
                          className={styles['cancel-btn']}
                          onClick={() => {
                            setDescription(ticket.description);
                            setIsEditingDescription(false);
                          }}
                        >
                          <FaTimes /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className={styles['field-value']}>{ticket.description}</p>
                  )}
                </div>

                {/* Additional Info */}
                <div className={styles['info-grid']}>
                  <div>
                    <label>Category:</label>
                    <p>{ticket.category}</p>
                  </div>
                  <div>
                    <label>Sub-Category:</label>
                    <p>{ticket.subCategory}</p>
                  </div>
                  <div>
                    <label>Department:</label>
                    <p>{ticket.department}</p>
                  </div>
                  <div>
                    <label>Created Date:</label>
                    <p>{new Date(ticket.createdDate).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles['requester-comms']}>
                {/* Message Thread */}
                <div className={styles['message-thread']}>
                  {displayedRequesterMessages.map((msg) => (
                    <div key={msg.id} className={`${styles['message']} ${msg.isOwn ? styles['own'] : ''}`}>
                      <div className={styles['message-header']}>
                        <span className={styles['sender']}>{msg.sender}</span>
                        <span className={styles['role']}>({msg.role})</span>
                        <span className={styles['timestamp']}>
                          {msg.timestamp} at {msg.time}
                        </span>
                      </div>
                      <div className={styles['message-body']}>{msg.content}</div>
                    </div>
                  ))}

                  {requesterMessages.length > 3 && (
                    <div className={styles['show-more']}>
                      <button onClick={() => setShowAllMessages(!showAllMessages)}>
                        {showAllMessages ? 'Show fewer messages' : `Show all ${requesterMessages.length} messages`}
                      </button>
                    </div>
                  )}
                </div>

                {/* Reply Section */}
                <div className={styles['reply-section']}>
                  <div className={styles['reply-to']}>
                    To: <strong>{ticket.requester || 'Requester'}</strong>
                  </div>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Type your message..."
                    className={styles['reply-textarea']}
                    rows="4"
                  />
                  <div className={styles['reply-actions']}>
                    <button className={styles['attach-btn']}>
                      📎 Attach files
                    </button>
                    <button
                      className={styles['send-btn']}
                      onClick={handleSendRequesterMessage}
                      disabled={!replyContent.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className={styles['right-panel']}>
          {/* Details/Messages Tabs */}
          <div className={styles['sidebar-tabs']}>
            <button
              className={`${styles['sidebar-tab']} ${activeTab === 'details' ? styles['active'] : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Details
            </button>
            <button
              className={`${styles['sidebar-tab']} ${activeTab === 'messages' ? styles['active'] : ''}`}
              onClick={() => setActiveTab('messages')}
            >
              Messages
            </button>
          </div>

          {activeTab === 'details' ? (
            <div className={styles['sidebar-content']}>
              {/* Ticket Info */}
              <div className={styles['info-section']}>
                <h3>Ticket Information</h3>
                <div className={styles['info-item']}>
                  <label>Assigned To:</label>
                  <p>{ticket.assignedTo}</p>
                </div>
                <div className={styles['info-item']}>
                  <label>Status:</label>
                  <p>{ticket.status}</p>
                </div>
                <div className={styles['info-item']}>
                  <label>Priority:</label>
                  <p>{ticketStatus}</p>
                </div>
                <div className={styles['info-item']}>
                  <label>Lifecycle:</label>
                  <p>{lifecycle}</p>
                </div>
              </div>

              {/* Action Log */}
              <div className={styles['action-log']}>
                <h3>Action Log</h3>
                <div className={styles['log-entries']}>
                  {actionLog.map((entry) => (
                    <div key={entry.id} className={styles['log-entry']}>
                      <div className={styles['log-header']}>
                        <span className={styles['log-user']}>{entry.user}</span>
                        <span className={styles['log-badge']}>{entry.badge}</span>
                      </div>
                      <p className={styles['log-action']}>{entry.action}</p>
                      <span className={styles['log-time']}>{entry.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles['sidebar-content']}>
              {/* TTS Agent Messages */}
              <div className={styles['messages-section']}>
                <h3>TTS Agent Messages</h3>
                <div className={styles['message-list']}>
                  {messages.map((msg) => (
                    <div key={msg.id} className={styles['msg-item']}>
                      <div className={styles['msg-sender']}>{msg.sender}</div>
                      <p className={styles['msg-text']}>{msg.content}</p>
                      <span className={styles['msg-time']}>{msg.time}</span>
                    </div>
                  ))}
                </div>

                {/* Send Message */}
                <div className={styles['send-msg-form']}>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message to TTS agents..."
                    className={styles['msg-textarea']}
                    rows="3"
                  />
                  <button
                    className={styles['send-msg-btn']}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoordinatorOwnedTicketDetail;
