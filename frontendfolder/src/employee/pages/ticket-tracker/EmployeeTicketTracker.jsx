import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './EmployeeTicketTracker.module.css';
import { backendTicketService } from '../../../services/backend/ticketService';
import { toEmployeeStatus } from '../../../utilities/helpers/statusMapper';
import authService from '../../../utilities/service/authService';
import EmployeeActiveTicketsWithdrawTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal';
import EmployeeActiveTicketsCloseTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal';
import TicketActivity from './TicketActivity';
import TicketMessaging from './TicketMessaging';
import ErrorBoundary from '../../../shared/components/ErrorBoundary';
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
import { getEmployeeTickets, getTicketByNumber } from '../../../utilities/storages/ticketStorage';

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

const formatDate = (date) => {
  if (!date) return 'None';
  try {
    // If it's already a Date
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    }

    // Normalize strings like 'YYYY-MM-DD' which can be parsed inconsistently across browsers
    if (typeof date === 'string') {
      const trimmed = date.trim();
      const ymd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
      const m = ymd.exec(trimmed);
      if (m) {
        const y = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const d = parseInt(m[3], 10);
        const dt = new Date(y, mo, d);
        return dt.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
      }

      // Fallback to Date parsing for ISO and other formats
      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return 'Invalid Date';
      return parsed.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    }

    // Fallback: attempt to create Date from number
    const asNum = Number(date);
    if (!isNaN(asNum)) {
      const parsed = new Date(asNum);
      if (!isNaN(parsed.getTime())) return parsed.toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
    }

    return 'Invalid Date';
  } catch (e) {
    return 'Invalid Date';
  }
};

// Date-only formatter (no time) used for schedule displays
const formatDateOnly = (date) => {
  if (!date) return 'None';
  try {
    if (date instanceof Date) {
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleString('en-US', { dateStyle: 'short' });
    }

    if (typeof date === 'string') {
      const trimmed = date.trim();
      const ymd = /^\s*(\d{4})-(\d{2})-(\d{2})\s*$/;
      const m = ymd.exec(trimmed);
      if (m) {
        const y = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10) - 1;
        const d = parseInt(m[3], 10);
        const dt = new Date(y, mo, d);
        return dt.toLocaleString('en-US', { dateStyle: 'short' });
      }

      const parsed = new Date(trimmed);
      if (isNaN(parsed.getTime())) return 'Invalid Date';
      return parsed.toLocaleString('en-US', { dateStyle: 'short' });
    }

    const asNum = Number(date);
    if (!isNaN(asNum)) {
      const parsed = new Date(asNum);
      if (!isNaN(parsed.getTime())) return parsed.toLocaleString('en-US', { dateStyle: 'short' });
    }

    return 'Invalid Date';
  } catch (e) {
    return 'Invalid Date';
  }
};

// Format for logs: YYYY-MM-DD hh:mm AM/PM (e.g., 2025-10-24 02:51 PM)
const formatLogTimestamp = (date) => {
  if (!date) return 'None';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    let hours = d.getHours();
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours === 0 ? 12 : hours;
    const hourStr = String(hours).padStart(2, '0');

    return `${year}-${month}-${day} ${hourStr}:${minutes} ${ampm}`;
  } catch (e) {
    return 'Invalid Date';
  }
};

// Format number with thousands separators and two decimal places
const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = Number(value);
  if (!isFinite(num)) return value;
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};

// Helper to render dynamic values safely (objects/arrays -> JSON string inside <pre>)
const renderDynamicValue = (val) => {
  if (val === null || val === undefined || val === '') return 'None';
  if (typeof val === 'object') {
    try {
      return <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(val, null, 2)}</pre>;
    } catch (e) {
      return String(val);
    }
  }
  return String(val);
};

// Generate logs based on ticket data (start with any persisted logs)
// Accept currentUser to decide labels for certain status changes
const generateLogs = (ticket, currentUser) => {
  // Collect logs and keep raw timestamps for sorting. We will format timestamps
  // for display after sorting so we can order latest -> oldest.
  const logs = Array.isArray(ticket?.logs) ? ticket.logs.map((l, idx) => ({
    id: l.id || idx + 1,
    user: l.user || 'You',
    action: l.action || `Status changed to ${ticket.status}`,
    rawTimestamp: l.timestamp || ticket.update_date || ticket.submit_date,
  })) : [];

  // System-created entry
  logs.push({
    id: logs.length + 1,
    user: 'System',
    action: `Ticket #${ticket.ticket_number} created - ${ticket.category}`,
    rawTimestamp: ticket.submit_date,
  });

  // Handle assignedTo as object or string
  const assignedToName = typeof ticket.assigned_to === 'object' ? ticket.assigned_to?.name : ticket.assigned_to;
  if (assignedToName) {
    logs.push({
      id: logs.length + 1,
      user: assignedToName,
      action: `Assigned to ${ticket.department} department`,
      rawTimestamp: ticket.submit_date,
    });
  }

  // Add status change log for Withdrawn (attributed to the employee 'You')
  if (ticket.status === 'Withdrawn') {
    logs.push({
      id: logs.length + 1,
      user: 'You',
      action: `Status changed to Withdrawn`,
      rawTimestamp: ticket.time_closed || ticket.update_date,
    });
  }

  // Sort logs newest-first by timestamp
  logs.sort((a, b) => {
    const ta = a.rawTimestamp || a.timestamp;
    const tb = b.rawTimestamp || b.timestamp;
    const da = new Date(ta);
    const db = new Date(tb);
    if (isNaN(da.getTime()) && isNaN(db.getTime())) return 0;
    if (isNaN(da.getTime())) return 1;
    if (isNaN(db.getTime())) return -1;
    return db.getTime() - da.getTime();
  });

  // Format timestamps for display and remove rawTimestamp
  return logs.map((l) => ({
    id: l.id,
    user: l.user,
    action: l.action,
    timestamp: formatLogTimestamp(l.rawTimestamp || l.timestamp),
  }));
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
        // Support multiple shapes: backend returns { file: url, file_name },
        // older local mocks may use { name, url }, or sometimes just a URL string.
        const name = f?.file_name || f?.name || f?.filename || (typeof f === 'string' ? f.split('/').pop() : f);
        const url = f?.file || f?.url || f?.downloadUrl || f?.download_url || (typeof f === 'string' ? f : '#');
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
  const [activeTab, setActiveTab] = useState('messages'); // 'logs' or 'messages'
  // preview state removed - attachments now open in a new tab

  // Get current logged-in user
  const currentUser = authService.getCurrentUser();
  
  // Get only the current user's tickets
  const tickets = getEmployeeTickets(currentUser?.id);

  // Support both direct links (/ticket-tracker/:ticketNumber) and normal flow (latest ticket)
  const [ticket, setTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  useEffect(() => {
    let mounted = true;

    const findLocal = () => {
      if (!ticketNumber) return tickets && tickets.length > 0 ? tickets[tickets.length - 1] : null;
      return getTicketByNumber(ticketNumber) || tickets.find((t) => String(t.ticketNumber) === String(ticketNumber));
    };

    const local = findLocal();
    if (local) {
      setTicket(local);
      return () => { mounted = false; };
    }

    // If not found locally and we have a ticketNumber, fetch from backend
    if (ticketNumber) {
      setLoadingTicket(true);
      (async () => {
        try {
          const fetched = await backendTicketService.getTicketByNumber(ticketNumber);
          if (mounted) setTicket(fetched || null);
        } catch (err) {
          console.error('Error fetching ticket by number:', err);
          if (mounted) setTicket(null);
        } finally {
          if (mounted) setLoadingTicket(false);
        }
      })();
    } else {
      setTicket(local);
    }

    return () => { mounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketNumber, JSON.stringify(tickets)]);

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
  // UI-friendly category: tickets stored as 'General Request' correspond to the form label 'Others'
  const uiCategory = (category === 'General Request') ? 'Others' : category;

  // Normalize attachments across different seed/property names
  const attachments = ticket.fileAttachments || ticket.attachments || ticket.files || fileUploaded;

  // Normalize IT Support dynamic fields (prefer explicit fields then dynamic_data keys in both camelCase and snake_case)
  const dyn = ticket.dynamic_data || {};
  const getDyn = (keys) => {
    for (const k of keys) {
      if (dyn && Object.prototype.hasOwnProperty.call(dyn, k) && (dyn[k] !== null && dyn[k] !== undefined && dyn[k] !== '')) return dyn[k];
    }
    return null;
  };

  const deviceType = ticket.device_type || ticket.deviceType || getDyn(['deviceType', 'device_type', 'customDeviceType', 'custom_device_type']) || null;
  const assetName = ticket.asset_name || ticket.assetName || getDyn(['assetName', 'asset_name']) || null;
  const serialNumber = ticket.serial_number || ticket.serialNumber || getDyn(['serialNumber', 'serial_number']) || null;
  const locationField = ticket.location || getDyn(['location']) || null;
  const issueTypeField = ticket.issue_type || ticket.issueType || getDyn(['issueType', 'issue_type']) || null;
  const softwareAffectedField = ticket.softwareAffected || getDyn(['softwareAffected', 'software_affected']) || null;
  const notesField = ticket.notes || getDyn(['notes', 'note']) || null;

  // Budget proposal fields (prefer values inside dynamic_data)
  const preparedByField = ticket.preparedBy || ticket.prepared_by || getDyn(['preparedBy', 'prepared_by', 'preparedByName', 'prepared_by_name']) || null;
  const performanceStartField = ticket.performanceStartDate || ticket.performance_start_date || ticket.performanceStart || getDyn(['performanceStartDate', 'performance_start_date', 'performanceStart']) || null;
  const performanceEndField = ticket.performanceEndDate || ticket.performance_end_date || ticket.performanceEnd || getDyn(['performanceEndDate', 'performance_end_date', 'performanceEnd']) || null;
  const totalBudgetField = (ticket.totalBudget ?? ticket.total_budget) ?? getDyn(['totalBudget', 'total_budget', 'requestedBudget', 'requested_budget', 'requested_budget_value']);
  // Support both old 'budgetItems' and new 'items' structure
  const budgetItemsField = ticket.budgetItems || ticket.budget_items || getDyn(['items', 'budgetItems', 'budget_items']) || [];

  // Normalize scheduled request: explicit scheduled_date, or dynamic_data scheduled keys or nested scheduleRequest
  // Broader fallback check for schedule fields stored in dynamic_data in various shapes
  let scheduledRaw = ticket.scheduled_date || getDyn(['scheduledDate', 'scheduled_date']) || null;

  if (!scheduledRaw) {
    // Try common dynamic_data shapes: scheduleRequest or schedule_request (objects or strings)
    const possible = getDyn(['schedule', 'schedule_request', 'scheduleRequest']);
    if (possible) {
      if (typeof possible === 'string') {
        scheduledRaw = possible;
      } else if (typeof possible === 'object') {
        scheduledRaw = possible.date || possible.datetime || possible.scheduledDate || possible.scheduled_date || null;
      }
    }

    // Also check explicit nested keys if present
    if (!scheduledRaw && dyn && dyn.scheduleRequest && typeof dyn.scheduleRequest === 'object') {
      scheduledRaw = dyn.scheduleRequest.date || dyn.scheduleRequest.datetime || null;
    }
    if (!scheduledRaw && dyn && dyn.schedule_request && typeof dyn.schedule_request === 'object') {
      scheduledRaw = dyn.schedule_request.date || dyn.schedule_request.datetime || null;
    }
  }

  const scheduledRequestDisplay = scheduledRaw ? formatDateOnly(scheduledRaw) : null;

  // Categories that come from the ticket submission form (keep only these)
  const formCategories = ['IT Support', 'Asset Check In', 'Asset Check Out', 'New Budget Proposal', 'Others', 'General Request'];

  // Convert status to employee view (New/Open -> Pending)
  const status = toEmployeeStatus(originalStatus);
  const statusSteps = getStatusSteps(status);
  const isClosable = status === 'Resolved';

  // Generate dynamic data based on ticket
  const ticketLogs = generateLogs(ticket);

  // Prepare Additional Details entries (filter out schedule-like entries for 'Others')
  const _dynamicEntries = ticket.dynamic_data && typeof ticket.dynamic_data === 'object' ? Object.entries(ticket.dynamic_data) : [];
  const additionalDetailsEntries = _dynamicEntries.filter(([key, val]) => {
    if (uiCategory === 'Others') {
      try {
        const k = (key || '').toString().toLowerCase();
        if (k.includes('schedule')) return false;
        if (val && typeof val === 'object') {
          const hasDate = Object.prototype.hasOwnProperty.call(val, 'date') || Object.prototype.hasOwnProperty.call(val, 'datetime') || Object.prototype.hasOwnProperty.call(val, 'scheduledDate') || Object.prototype.hasOwnProperty.call(val, 'scheduled_date');
          const hasTime = Object.prototype.hasOwnProperty.call(val, 'time');
          const hasNotes = Object.prototype.hasOwnProperty.call(val, 'notes') || Object.prototype.hasOwnProperty.call(val, 'note');
          if (hasDate || hasTime || hasNotes) return false;
        }
      } catch (e) {
        // include by default on error
      }
    }
    return true;
  });

  // Build messages from ticket.comments (persisted) and include a system "received" message.
  const buildMessagesFromTicket = (tkt) => {
    const msgs = [];

    // System message about receipt
    msgs.push({
      id: 'system-received',
      sender: 'Support Team',
      message: `Your ticket regarding "${tkt.subject}" has been received and is being reviewed.`,
      timestamp: formatDate(tkt.submit_date || tkt.dateCreated || tkt.created_at || tkt.createdAt),
    });

    // Comments may be at ticket.comments or ticket.comments_list; normalize
    const comments = Array.isArray(tkt.comments) ? [...tkt.comments] : (Array.isArray(tkt.comment) ? [...tkt.comment] : []);

    // Filter out internal comments (employees shouldn't see internal notes)
    const visibleComments = comments.filter((c) => !c.is_internal && !c.isInternal);

    // Sort ascending by created time
    visibleComments.sort((a, b) => new Date(a.created_at || a.createdAt || a.timestamp || a.date || a.created) - new Date(b.created_at || b.createdAt || b.timestamp || b.date || b.created));

    visibleComments.forEach((c, idx) => {
      const createdAt = c.created_at || c.createdAt || c.timestamp || c.date || c.created || null;
      let sender = 'Support Team';
      // Determine if the comment was by the current user
      try {
        const commentUser = c.user || c.author || null;
        if (commentUser) {
          // If roles indicate staff, label Support Team
          const role = (commentUser.role || commentUser.user_role || '').toString().toLowerCase();
          if (role.includes('ticket') || role.includes('coordinator') || role.includes('admin') || role.includes('system')) {
            sender = 'Support Team';
          } else {
            // If user's id/email matches currentUser, label as You
            if ((currentUser && ((commentUser.id && currentUser.id && String(commentUser.id) === String(currentUser.id)) || (commentUser.email && currentUser.email && commentUser.email.toLowerCase() === currentUser.email.toLowerCase())))) {
              sender = 'You';
            } else {
              // Otherwise use display name if available
              const name = commentUser.first_name || commentUser.firstName || commentUser.name || commentUser.full_name || commentUser.fullName;
              sender = name ? name : 'Support Team';
            }
          }
        }
      } catch (e) {}

      const text = c.comment || c.message || c.body || '';
      msgs.push({ id: c.id || `c-${idx}`, sender, message: text, timestamp: formatDate(createdAt) });
    });

    return msgs;
  };

  const ticketMessages = buildMessagesFromTicket(ticket);

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
                {formCategories.includes(uiCategory) && (
                  <div className={`${styles.detailItem}`}>
                    <div className={styles.detailLabel}>Category</div>
                    <div className={styles.detailValue}>{uiCategory || 'None'}</div>
                  </div>
                )}

                {formCategories.includes(uiCategory) && (
                  <div className={styles.detailItem}>
                    <div className={styles.detailLabel}>Sub-Category</div>
                    <div className={styles.detailValue}>
                      {uiCategory === 'Others' ? (
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
                    <div className={styles.detailValue}>{scheduledRequestDisplay || 'None'}</div>
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

              {uiCategory !== 'Others' && (
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
                          <div className={styles.detailValue}>{deviceType || 'None'}</div>
                        </div>
                        {issueTypeField ? (
                          <div className={styles.detailItem}>
                            <div className={styles.detailLabel}>Specify Issue</div>
                            <div className={styles.detailValue}>{issueTypeField}</div>
                          </div>
                        ) : null}
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Software Affected</div>
                          <div className={styles.detailValue}>{softwareAffectedField || 'None'}</div>
                        </div>
                        {notesField ? (
                          <div className={styles.detailItem}>
                            <div className={styles.detailLabel}>Notes</div>
                            <div className={styles.detailValue}>{notesField}</div>
                          </div>
                        ) : null}
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
                          {issueTypeField ? (
                            <div className={styles.detailItem}>
                              <div className={styles.detailLabel}>Specify Issue</div>
                              <div className={styles.detailValue}>{issueTypeField}</div>
                            </div>
                          ) : null}
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
                          <div className={styles.detailValue}>{preparedByField || 'N/A'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Performance Start</div>
                          <div className={styles.detailValue}>{performanceStartField || 'N/A'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Performance End</div>
                          <div className={styles.detailValue}>{performanceEndField || 'N/A'}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Total Budget</div>
                          <div className={styles.detailValue}>{formatMoney(totalBudgetField)}</div>
                        </div>
                        <div className={styles.detailItem}>
                          <div className={styles.detailLabel}>Budget Items</div>
                          <div className={styles.detailValue}>
                            {(budgetItemsField || []).length > 0 ? (
                              (budgetItemsField || []).map((item, idx) => (
                                <div key={idx}>
                                  {`${item.costElement || item.cost_element || item.name || 'Item'} — ${item.estimatedCost || item.estimated_cost || item.estimated_cost_range || ''}`}
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
                  {!(category === 'IT Support' || category === 'Asset Check In' || category === 'Asset Check Out' || category === 'New Budget Proposal') && additionalDetailsEntries && additionalDetailsEntries.length > 0 && (
                    <div className={styles.dynamicDetailsGrid}>
                      <div className={styles.detailItem}>
                        <div className={styles.detailLabel}>Additional Details</div>
                        <div className={styles.detailValue}></div>
                      </div>
                      {additionalDetailsEntries.map(([key, val]) => (
                        <div className={styles.detailItem} key={key}>
                          <div className={styles.detailLabel}>{String(key).replace(/_/g, ' ')}</div>
                          <div className={styles.detailValue}>{renderDynamicValue(val)}</div>
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
                onClick={() => {
                  // log to help debug modal issues
                  try {
                    console.log('Action button clicked. isClosable=', isClosable, 'ticket=', ticket && (ticket.id || ticket.ticket_number || ticket.ticketNumber));
                  } catch (e) {}
                  isClosable ? setShowCloseModal(true) : setShowWithdrawModal(true);
                }}
                className={`${styles.ticketActionButton} ${isClosable ? styles.closeButton : styles.withdrawButton}`}
              >
                {isClosable ? 'Close Ticket' : 'Withdraw Ticket'}
              </Button>
            )}

            <Tabs
              tabs={[
                { label: 'Messages', value: 'messages' },
                { label: 'Logs', value: 'logs' },
              ]}
              active={activeTab}
              onChange={setActiveTab}
            >
              {activeTab === 'logs' ? (
                <TicketActivity ticketLogs={ticketLogs} />
              ) : (
                <TicketMessaging
                  ticketId={ticket.id || ticket.ticket_id || ticket.ticketNumber || ticket.ticket_number}
                  initialMessages={ticketMessages}
                  onCommentCreated={(created) => {
                    // Merge newly created comment into ticket state so UI updates immediately
                    try {
                      const existing = ticket.comments ? [...ticket.comments] : [];
                      existing.push(created);
                      const updated = { ...ticket, comments: existing };
                      setTicket(updated);
                    } catch (e) {
                      console.warn('Failed to merge created comment into ticket state', e);
                    }
                  }}
                />
              )}
            </Tabs>
            </div>
        </div>
  
        </ViewCard>
      </main>

      {/* Modals */}
      {showWithdrawModal && ticket && (ticket.id || ticket.ticket_number || ticket.ticketNumber) && (
        <ErrorBoundary>
          <EmployeeActiveTicketsWithdrawTicketModal
            ticket={ticket}
            onClose={() => setShowWithdrawModal(false)}
            onSuccess={typeof handleWithdrawSuccess === 'function' ? handleWithdrawSuccess : undefined}
          />
        </ErrorBoundary>
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
