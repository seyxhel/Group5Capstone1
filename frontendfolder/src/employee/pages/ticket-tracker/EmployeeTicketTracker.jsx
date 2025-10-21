import { useParams } from 'react-router-dom';
import { useState } from 'react';
import styles from './EmployeeTicketTracker.module.css';
import { getEmployeeTickets, getTicketByNumber } from '../../../utilities/storages/ticketStorage';
import { toEmployeeStatus } from '../../../utilities/helpers/statusMapper';
import authService from '../../../utilities/service/authService';
import EmployeeActiveTicketsWithdrawTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal';
import EmployeeActiveTicketsCloseTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal';
import TicketActivity from './TicketActivity';
import TicketMessaging from './TicketMessaging';
import Button from '../../../shared/components/Button';
import ViewCard from '../../../shared/components/ViewCard';
import Tabs from '../../../shared/components/Tabs';
import { 
  FaFileImage, 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFileCsv, 
  FaFile,
  FaDownload 
} from 'react-icons/fa';
import { convertToSecureUrl, extractFilePathFromUrl, getAccessToken } from '../../../utilities/secureMedia';

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

// Convert a key or phrase to Title Case (capitalize each word)
const toTitleCase = (str) => {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

const DetailField = ({ label, value }) => (
  <fieldset>
    <label>{toTitleCase(label)}</label>
    <p>{value || 'None'}</p>
  </fieldset>
);

const formatDate = (date) =>
  date ? new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'None';

// Format number with thousands separators and two decimal places
const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = Number(value);
  if (!isFinite(num)) return value;
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

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

// Render attachments in a consistent card/list style
const renderAttachments = (files) => {
  if (!files) return <div className={styles.detailValue}>No attachments</div>;

  // Normalize to array
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
    
    // Fallback based on file extension
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

  // We no longer fetch blobs client-side; filenames are linked to secure URLs

  const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'https://smartsupport-hdts-backend.up.railway.app/media/';

  const openAttachment = (rawUrl) => {
    const secure = convertToSecureUrl(rawUrl);
    if (secure) {
      window.open(secure, '_blank', 'noopener,noreferrer');
      return;
    }

    // Try to compute a backend media URL from the path
    const filePath = extractFilePathFromUrl(rawUrl) || (typeof rawUrl === 'string' ? rawUrl.split('?')[0] : null);
    if (filePath) {
      const clean = filePath.startsWith('/') ? filePath.slice(1) : filePath;
      let backendUrl = `${MEDIA_URL}${clean}`;
      const token = getAccessToken();
      if (token) {
        backendUrl = `${backendUrl}?token=${encodeURIComponent(token)}`;
      }
      window.open(backendUrl, '_blank', 'noopener,noreferrer');
      return;
    }

    // Fallback to opening the original url
    window.open(rawUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.attachmentList}>
      {fileArray.map((f, idx) => {
        const name = f?.name || f?.filename || f;
        const url = f?.url || f?.downloadUrl || '#';
        // compute secure/backend URL to avoid opening local dev server paths
        let secureOrBackend = convertToSecureUrl(url) || null;
        if (!secureOrBackend) {
          // try to extract a file path
          let filePath = extractFilePathFromUrl(url);
          if (!filePath && typeof url === 'string' && url.startsWith('http')) {
            try {
              const parsed = new URL(url);
              filePath = parsed.pathname || null;
            } catch (e) {
              filePath = null;
            }
          }
          if (filePath) {
            const clean = filePath.startsWith('/') ? filePath.slice(1) : filePath;
            const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 'https://smartsupport-hdts-backend.up.railway.app/media/';
            secureOrBackend = `${MEDIA_URL}${clean}`;
            const token = getAccessToken();
            if (token) secureOrBackend = `${secureOrBackend}?token=${encodeURIComponent(token)}`;
          }
        }
        // final fallback to original url
        if (!secureOrBackend) secureOrBackend = url;
        return (
          <div key={idx} className={styles.attachmentItem}>
            <div className={styles.attachmentIcon}>{getFileIcon(f)}</div>
            <div style={{ flex: 1 }}>
              <a href={secureOrBackend} target="_blank" rel="noreferrer" className={styles.attachmentName}>{name}</a>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <a href={secureOrBackend} target="_blank" rel="noreferrer" className={styles.attachmentDownload}>
                <FaDownload />
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function EmployeeTicketTracker() {
  const { ticketNumber } = useParams();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'message'
  // preview state removed - attachments now open in a new tab

  // Get current logged-in user
  const currentUser = authService.getCurrentUser();
  
  // Get only the current user's tickets
  const tickets = getEmployeeTickets(currentUser?.id);
  
  // hide verbose runtime logs in UI

  const ticket = ticketNumber
    ? tickets.find((t) => String(t.ticketNumber) === String(ticketNumber))
    : tickets && tickets.length > 0
    ? tickets[tickets.length - 1]
    : null;

  // selected ticket ready for render
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

  // Normalize attachments across different seed/property names
  const attachments = ticket.fileAttachments || ticket.attachments || ticket.files || fileUploaded;

  // Categories that come from the ticket submission form (keep only these)
  const formCategories = ['IT Support', 'Asset Check In', 'Asset Check Out', 'New Budget Proposal', 'Others', 'General Request'];

  // Convert status to employee view (New/Open -> Pending)
  const status = toEmployeeStatus(originalStatus);
  const statusSteps = getStatusSteps(status);
  const isClosable = status === 'Resolved';
  
  // Generate dynamic data based on ticket
  const ticketLogs = generateLogs(ticket);
  const ticketMessages = generateMessages(ticket);

  return (
    <>
      <main className={styles.employeeTicketTrackerPage}>
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
                  <h2 className={styles.ticketSubject}>{subject || `Ticket No. ${number}`}</h2>
                </div>
                <div className={`${styles.statusBadge} ${styles[`status${status.replace(/\s+/g, '')}`]}`}>
                  {status}
                </div>
              </div>

              {/* Ticket meta: compact metadata shown under header */}
              <div className={styles.ticketMeta}>
                <div className={styles.ticketMetaItem}>
                  <span className={styles.ticketMetaLabel}>Date Created <span className={styles.ticketMetaValue}>{formatDate(dateCreated)}</span> </span> 
                </div>
                <div className={styles.ticketMetaItem}>
                  <span className={styles.ticketMetaLabel}>Date Updated <span className={styles.ticketMetaValue}>{formatDate(lastUpdated)}</span> </span>
                </div>
              </div>

              {/* Ticket Details - consolidated and always present */}
              <div className={styles.detailsGrid}>
                {formCategories.includes(category) && (
                  <div className={`${styles.detailItem}`}>
                    <div className={styles.detailLabel}>Category</div>
                    <div className={styles.detailValue}>{category || 'None'}</div>
                  </div>
                )}

                {formCategories.includes(category) && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Sub-Category</div>
                    <div className={styles.detailValue}>
                      {category === 'Others' ? (
                        'None'
                      ) : (
                        subCategory || 'None'
                      )}
                    </div>
                  </div>
                )}

                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Assigned Agent</div>
                  <div className={styles.detailValue}>{typeof assignedTo === 'object' ? assignedTo?.name || 'Unassigned' : assignedTo || 'Unassigned'}</div>
                </div>

                <div className={styles.detailItem}>
                  <div className={styles.detailLabel}>Department</div>
                  <div className={styles.detailValue}>{department || 'None'}</div>
                </div>

                <div className={styles.singleColumnGroup}>
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Description</div>
                    <div className={styles.detailValue}>{description || 'No description provided.'}</div>
                  </div>

                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Schedule Request</div>
                    <div className={styles.detailValue}>{scheduledRequest || 'None'}</div>
                  </div>

                  <div className={`${styles.detailItem} ${styles.attachmentsRow}`}>
                    <div className={styles.detailLabel}>Attachments</div>
                    <div className={styles.detailValue}>
                        {attachments && attachments.length > 0
                          ? renderAttachments(attachments)
                          : 'None'}
                    </div>
                  </div>
                </div>

              {category !== 'Others' && (
                <div className={styles.categoryDivider}></div>
              )}

                {/* Category-specific dynamic details inserted inside detailsGrid as fullWidth */}
                <div className={styles.fullWidth}>
                  {/* IT Support */}
                  {category === 'IT Support' && (
                    <>
                      <div className={styles.categoryDetails}>IT Support Details</div>
                      <div className={styles.dynamicDetailsGrid}>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Device Type</div>
                          <div className={styles.detailValue}>{ticket.dynamic_data?.device_type || ticket.deviceType || 'None'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Asset Name</div>
                          <div className={styles.detailValue}>{ticket.asset_name || ticket.assetName || 'None'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Serial Number</div>
                          <div className={styles.detailValue}>{ticket.serial_number || ticket.serialNumber || 'None'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Location</div>
                          <div className={styles.detailValue}>{ticket.location || 'None'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Specify Issue</div>
                          <div className={styles.detailValue}>{ticket.issue_type || ticket.issueType || ticket.dynamic_data?.issueType || 'None'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Software Affected</div>
                          <div className={styles.detailValue}>{ticket.dynamic_data?.softwareAffected || ticket.softwareAffected || 'None'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Notes</div>
                          <div className={styles.detailValue}>{ticket.dynamic_data?.notes || ticket.notes || 'None'}</div>
                        </div>
                      </div>
                    </>
                  )}
                  {/* Asset Check In/Out */}
                  {(category === 'Asset Check In' || category === 'Asset Check Out') && (
                    <>
                      <div className={styles.categoryDetails}>Asset Details</div>
                      <div className={styles.dynamicDetailsGrid}>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Asset Name</div>
                          <div className={styles.detailValue}>{ticket.asset_name || ticket.assetName || 'N/A'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Serial Number</div>
                          <div className={styles.detailValue}>{ticket.serial_number || ticket.serialNumber || 'N/A'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Location</div>
                          <div className={styles.detailValue}>{ticket.location || 'N/A'}</div>
                        </div>
                        {category === 'Asset Check Out' && (
                          <div className={styles.detailItem}>
                            <div className={styles.detailLabel}>Expected Return</div>
                            <div className={styles.detailValue}>{ticket.expectedReturnDate || ticket.expected_return_date || ticket.expectedReturn || 'N/A'}</div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {/* New Budget Proposal */}
                  {category === 'New Budget Proposal' && (
                    <>
                      <div className={styles.categoryDetails}>Budget Proposal Details</div>
                      <div className={styles.dynamicDetailsGrid}>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Prepared By</div>
                          <div className={styles.detailValue}>{ticket.preparedBy || ticket.prepared_by || ticket.preparedByName || 'N/A'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Performance Start</div>
                          <div className={styles.detailValue}>{ticket.performanceStartDate || ticket.performance_start_date || ticket.performanceStart || 'N/A'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Performance End</div>
                          <div className={styles.detailValue}>{ticket.performanceEndDate || ticket.performance_end_date || ticket.performanceEnd || 'N/A'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Total Budget</div>
                          <div className={styles.detailValue}>{formatMoney(ticket.totalBudget ?? ticket.total_budget)}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Budget Items</div>
                          <div className={styles.detailValue}>
                            {(ticket.budgetItems || ticket.budget_items || []).length > 0 ? (
                              (ticket.budgetItems || ticket.budget_items || []).map((item, idx) => (
                                <div key={idx}>
                                  {`${item.costElement || item.cost_element || item.name || 'Item'} — ${item.estimatedCost || item.estimated_cost || ''}`}
                                </div>
                              ))
                            ) : (
                              'No budget items provided'
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                  {/* Fallback: dynamic_data */}
                  {!(category === 'IT Support' || category === 'Asset Check In' || category === 'Asset Check Out' || category === 'New Budget Proposal') && ticket.dynamic_data && Object.keys(ticket.dynamic_data).length > 0 && (
                    <div className={styles.dynamicDetailsGrid}>
                      <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>Additional Details</div>
                        <div className={styles.detailValue}></div>
                      </div>
                      {Object.entries(ticket.dynamic_data).map(([key, val]) => (
                        <div className={styles.detailItem} key={key}>
                          <div className={styles.detailLabel}>{String(key).replace(/_/g, ' ')}</div>
                          <div className={styles.detailValue}>{val}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

            </section>
          </div>

          {/* Right Column - Actions and Details */}
          <div className={styles.rightColumn}>
            {/* Action Button */}
            {!['Closed', 'Rejected', 'Withdrawn'].includes(status) && (
              <Button
                variant="primary"
                onClick={() =>
                  isClosable ? setShowCloseModal(true) : setShowWithdrawModal(true)
                }
                className={`${styles.ticketActionButton} ${isClosable ? styles.closeButton : styles.withdrawButton}`}
              >
                {isClosable ? 'Close Ticket' : 'Withdraw Ticket'}
              </Button>
            )}

            <Tabs
              tabs={[
                { label: 'Logs', value: 'logs' },
                { label: 'Messages', value: 'messages' },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            >
              {activeTab === 'logs' ? (
                <TicketActivity ticketLogs={ticketLogs} />
              ) : (
                <TicketMessaging initialMessages={ticketMessages} />
              )}
            </Tabs>
            </div>
        </div>
  
        </ViewCard>
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
      {/* DocumentViewer removed; attachments open in a new tab instead */}
    </>
  );
}
