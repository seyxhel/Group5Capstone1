import { useParams } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import styles from '../../../employee/pages/ticket-tracker/EmployeeTicketTracker.module.css';
import { getAllTickets, getTicketByNumber } from '../../../utilities/storages/ticketStorage';
import { backendTicketService } from '../../../services/backend/ticketService';
import authService from '../../../utilities/service/authService';
import { useAuth } from '../../../context/AuthContext';
import CoordinatorAdminOpenTicketModal from '../../components/modals/CoordinatorAdminOpenTicketModal';
import CoordinatorAdminRejectTicketModal from '../../components/modals/CoordinatorAdminRejectTicketModal';
import ViewCard from '../../../shared/components/ViewCard';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import Tabs from '../../../shared/components/Tabs';
import Button from '../../../shared/components/Button';
import CoordinatorAdminTicketDetails from './CoordinatorAdminTicketDetails';
import CoordinatorAdminTicketLogs from './CoordinatorAdminTicketLogs';
import detailStyles from './CoordinatorAdminTicketDetails.module.css';
import { FaFileImage, FaFilePdf, FaFileWord, FaFileExcel, FaFileCsv, FaFile, FaDownload } from 'react-icons/fa';
import { convertToSecureUrl, extractFilePathFromUrl, getAccessToken } from '../../../utilities/secureMedia';


// Status progression for coordinator/admin
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
  date ? new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'None';
// Date-only formatter used for schedule displays (keeps behaviour similar to employee view)
const formatDateOnly = (date) => {
  if (!date) return null;
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
const toTitleCase = (str) => {
  if (!str && str !== 0) return '';
  return String(str)
    .replace(/_/g, ' ')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};
const formatMoney = (value) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const num = Number(value);
  if (!isFinite(num)) return value;
  return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num);
};
const generateLogs = (ticket) => {
  // Build logs with raw timestamps, then sort newest-first before formatting for display
  const logs = [];
  // helper to determine if the actor matches the current logged-in user
  const currentUser = authService.getCurrentUser();
  const matchesCurrentUser = (actor) => {
    if (!currentUser || actor === null || actor === undefined) return false;
    const curId = currentUser.id || currentUser.user_id || null;
    const curCompany = currentUser.companyId || currentUser.company_id || currentUser.companyid || currentUser.company || null;
    const curEmail = (currentUser.email || '').toLowerCase();
    const curName = ((currentUser.firstName || currentUser.first_name || '') + ' ' + (currentUser.lastName || currentUser.last_name || '')).trim().toLowerCase();

    // actor can be primitive id, string, or object
    if (typeof actor === 'number' || (typeof actor === 'string' && /^\d+$/.test(actor))) {
      if (curId && Number(actor) === Number(curId)) return true;
    }

    if (typeof actor === 'string') {
      const a = actor.toLowerCase();
      if (curCompany && a === String(curCompany).toLowerCase()) return true;
      if (a === curEmail) return true;
      if (curName && a === curName) return true;
      if (curName && a.includes(curName)) return true;
      return false;
    }

    if (typeof actor === 'object') {
      if (curId && actor.id && Number(actor.id) === Number(curId)) return true;
      const aCompany = actor.companyId || actor.company_id || actor.company || null;
      const aEmail = (actor.email || '').toLowerCase();
      const aName = ((actor.first_name || actor.firstName || '') + ' ' + (actor.last_name || actor.lastName || '')).trim().toLowerCase();
      if (curCompany && aCompany && String(aCompany).toLowerCase() === String(curCompany).toLowerCase()) return true;
      if (aEmail && curEmail && aEmail === curEmail) return true;
      if (aName && curName && aName === curName) return true;
      if (aName && curName && aName.includes(curName)) return true;
    }

    return false;
  };

  // Include persisted comments (they often include status-change messages)
  const comments = Array.isArray(ticket.comments) ? ticket.comments : (Array.isArray(ticket.comment) ? ticket.comment : []);
  // If there is an explicit rejection/approval comment, filter out the terse "Status changed to <X>"
  // comment entries so we don't show duplicate lines in the logs (e.g. both "Ticket rejected by..." and
  // "Status changed to Rejected").
  const hasRejectionDetail = comments.some((c) => {
    const txt = (c.comment || c.message || c.body || c.text || '').toString().toLowerCase();
    return txt.includes('rejected by') || txt.includes('rejection reason') || txt.includes('rejection:') || txt.includes('rejection_reason');
  });
  comments.forEach((c) => {
    try {
      const commentUser = c.user || c.author || null;
      const actionText = (c.comment || c.message || c.body || c.text || '').toString();
      // Skip terse status-change comment when we already have a detailed rejection comment
      if (hasRejectionDetail && /status changed to\s*rejected/i.test(actionText)) return;
      // For admin/coordinator logs, avoid showing general employee chat comments (e.g. "why?").
      // Allow employee-originated comments only when they represent a withdrawal or other
      // explicit status action (contain keywords like 'withdraw' / 'withdrawn').
      try {
        const roleStr = (commentUser && (commentUser.role || commentUser.user_role || '') + '') || '';
        const isEmployee = roleStr.toString().toLowerCase().includes('employee') || roleStr.toString().toLowerCase().includes('user');
        if (isEmployee) {
          const allowedForEmployee = /\b(withdrawn|withdraw|ticket withdrawn|withdrawal)\b/i.test(actionText);
          if (!allowedForEmployee) return; // skip generic employee comments
        }
      } catch (e) {
        // ignore role parsing errors and continue
      }
      let userLabel = 'Support Team';
      if (commentUser) {
        if (matchesCurrentUser(commentUser)) {
          userLabel = 'You';
        } else {
          const role = ((commentUser.role || commentUser.user_role || '') + '').toString().toLowerCase();
          if (role.includes('ticket') || role.includes('coordinator') || role.includes('admin') || role.includes('system')) {
            userLabel = 'Coordinator';
          } else if (role.includes('employee') || role.includes('user')) {
            userLabel = 'Employee';
          } else {
            const name = commentUser.first_name || commentUser.firstName || commentUser.name || commentUser.full_name || commentUser.fullName;
            userLabel = name ? name : 'Support Team';
          }
        }
      }

      logs.push({
        id: c.id || `c-${Math.random().toString(36).slice(2, 9)}`,
        user: userLabel,
        action: c.comment || c.message || c.body || c.text || '',
        rawTimestamp: c.created_at || c.createdAt || c.timestamp || null,
        rawActor: commentUser || null,
      });
    } catch (e) {
      // ignore malformed comment
    }
  });

  // Synthetic system-created entry (if no existing comment representing creation)
  logs.push({
    id: 'system-created',
    user: 'System',
    action: `Ticket #${ticket.ticket_number || ticket.ticketNumber} created - ${ticket.category}`,
    rawTimestamp: ticket.dateCreated || ticket.submit_date || ticket.createdAt || ticket.submit_date,
  });

  // Assigned entry
  const assignedToName = typeof ticket.assignedTo === 'object' ? ticket.assignedTo?.name : ticket.assignedTo;
  if (assignedToName) {
    const assignedActor = typeof ticket.assignedTo === 'object' ? ticket.assignedTo : null;
    const assignedLabel = assignedActor && matchesCurrentUser(assignedActor) ? 'You' : assignedToName;
    logs.push({ id: 'assigned', user: assignedLabel, action: `Assigned to ${ticket.department} department`, rawTimestamp: ticket.dateCreated || ticket.submit_date, rawActor: assignedActor });
  }

  // If current ticket status is not New/Pending and there wasn't an explicit status-change comment
  // ensure we still surface a status-change entry (fallback)
  const hasStatusComment = logs.some((l) => typeof l.action === 'string' && l.action.toLowerCase().includes('status changed'));
  // If we already detected a detailed rejection/approval comment, skip adding the synthetic
  // fallback 'Status changed to ...' entry to avoid duplicates.
  if (ticket.status && ticket.status !== 'New' && ticket.status !== 'Pending' && !hasStatusComment && !hasRejectionDetail) {
    const performer = ticket.approved_by || ticket.rejected_by || ticket.coordinator || ticket.employee || null;
    const isMe = matchesCurrentUser(performer);
    const userLabel = isMe ? 'You' : (typeof performer === 'string' ? 'Coordinator' : (performer && performer.first_name ? (matchesCurrentUser(performer) ? 'You' : (performer.first_name + ' ' + (performer.last_name || ''))) : 'Coordinator'));
    logs.push({ id: 'status-change', user: userLabel, action: `Status changed to ${ticket.status}`, rawTimestamp: ticket.lastUpdated || ticket.update_date || ticket.updatedAt || null, rawActor: performer });
  }

  // Sort newest -> oldest by rawTimestamp
  logs.sort((a, b) => {
    const ta = a.rawTimestamp ? new Date(a.rawTimestamp) : new Date(0);
    const tb = b.rawTimestamp ? new Date(b.rawTimestamp) : new Date(0);
    return tb.getTime() - ta.getTime();
  });

  // Format timestamps for display but preserve rawActor for downstream components
  return logs.map((l) => ({ id: l.id, user: l.user, action: l.action, timestamp: formatDate(l.rawTimestamp), rawActor: l.rawActor || null }));
};
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

// If a ticket is New/Submitted/Pending and older than 24 hours, treat as 'Pending' for coordinators/admins
const computeEffectiveStatus = (ticket) => {
  const rawStatus = (ticket.status || '').toString();
  const lower = rawStatus.toLowerCase();
  const baseIsNew = lower === 'new' || lower === 'submitted' || lower === 'pending';
  try {
    const created = new Date(ticket.createdAt || ticket.dateCreated || ticket.created_at || ticket.submit_date || ticket.submitDate);
    if (baseIsNew && created instanceof Date && !isNaN(created)) {
      const hours = (new Date() - created) / (1000 * 60 * 60);
      if (hours >= 24) return 'Pending';
      return 'New';
    }
  } catch (e) {
    // ignore parse errors
  }
  return rawStatus || '';
};


export default function CoordinatorAdminTicketTracker() {
  const { ticketNumber } = useParams();
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const leftColRef = useRef(null);
  const rightColRef = useRef(null);
  const tickets = getAllTickets();
  const [ticket, setTicket] = useState(null);
  const [loadingTicket, setLoadingTicket] = useState(false);

  // Support both direct links (/ticket-tracker/:ticketNumber) and normal flow
  // (show latest ticket). If local storage doesn't contain the ticket, try
  // fetching from the backend by ticket number.
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

    if (ticketNumber) {
      setLoadingTicket(true);
      (async () => {
        try {
          const fetched = await backendTicketService.getTicketByNumber(ticketNumber);
          if (mounted) setTicket(fetched || null);
        } catch (err) {
          // keep behavior consistent with employee view: log error and show not found
          // so the UI doesn't crash — user can retry from Ticket Management page.
          // No rethrow here to avoid unhandled promise errors in the UI.
          // eslint-disable-next-line no-console
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
  // Sync heights between left and right columns so both match the taller one.
  // This effect is declared unconditionally so Hooks order remains stable
  useEffect(() => {
    let rAF = null;
    let resizeTimer = null;
    let imgs = [];
    let imgLoadHandlers = [];
    let observer = null;

    const sync = () => {
      // Use requestAnimationFrame for smoother reads/writes
      if (rAF) cancelAnimationFrame(rAF);
      rAF = requestAnimationFrame(() => {
        const left = leftColRef.current;
        const right = rightColRef.current;
        if (!left || !right) return;
        // Reset any previously set minHeight so natural layout can collapse first
        left.style.minHeight = '';
        right.style.minHeight = '';
        const leftH = left.getBoundingClientRect().height;
        const rightH = right.getBoundingClientRect().height;
        const maxH = Math.max(leftH, rightH);
        // Apply the taller height as min-height so content can still grow if needed
        left.style.minHeight = `${maxH}px`;
        right.style.minHeight = `${maxH}px`;
      });
    };

    // Initial sync and on ticket/tab changes
    sync();
    // re-sync shortly after to account for images/fonts loading that change layout
    const lateTimer = setTimeout(sync, 220);

    // watch images inside columns so when they load we re-sync
    const watchImages = () => {
      imgs = [];
      imgLoadHandlers = [];
      const left = leftColRef.current;
      const right = rightColRef.current;
      if (!left || !right) return;
      const nodeImgs = [...left.querySelectorAll('img'), ...right.querySelectorAll('img')];
      nodeImgs.forEach((img) => {
        // if already complete, ignore
        if (img.complete) return;
        const h = () => sync();
        img.addEventListener('load', h);
        img.addEventListener('error', h);
        imgs.push(img);
        imgLoadHandlers.push({ img, h });
      });
    };

    watchImages();

    // MutationObserver to detect dynamic content changes (attachments, tabs, etc.)
    try {
      const target = leftColRef.current?.parentElement || document.body;
      observer = new MutationObserver((mutations) => {
        // debounce inside
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(sync, 120);
      });
      if (observer && (leftColRef.current || rightColRef.current)) {
        observer.observe(leftColRef.current, { childList: true, subtree: true });
        observer.observe(rightColRef.current, { childList: true, subtree: true });
      }
    } catch (err) {
      // ignore if MutationObserver not available
    }

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(sync, 120);
    };

    window.addEventListener('resize', onResize);

    return () => {
      if (rAF) cancelAnimationFrame(rAF);
      if (resizeTimer) clearTimeout(resizeTimer);
      clearTimeout(lateTimer);
      // remove image listeners
      imgLoadHandlers.forEach(({ img, h }) => {
        try { img.removeEventListener('load', h); img.removeEventListener('error', h); } catch(e) {}
      });
      if (observer) {
        try { observer.disconnect(); } catch (e) {}
      }
      window.removeEventListener('resize', onResize);
      // cleanup styles
      if (leftColRef.current) leftColRef.current.style.minHeight = '';
      if (rightColRef.current) rightColRef.current.style.minHeight = '';
    };
  }, [ticketNumber, ticket, activeTab]);

  if (!ticket) {
    return (
      <div className={styles.employeeTicketTrackerPage}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>{loadingTicket ? 'Loading Ticket...' : 'No Ticket Found'}</h1>
        </div>
        <p className={styles.notFound}>
          {loadingTicket ? 'Fetching ticket details...' : 'No ticket data available. Please navigate from the Ticket Management page or check your ticket number.'}
        </p>
      </div>
    );
  }
  const {
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
  } = ticket;

  // Normalize created/updated timestamps from various payload shapes
  const dateCreatedRaw = ticket.dateCreated || ticket.dateCreated || ticket.submit_date || ticket.createdAt || ticket.created_at || ticket.created || ticket.date_created || ticket.submitted_at || ticket.submitDate || null;
  const lastUpdatedRaw = ticket.lastUpdated || ticket.update_date || ticket.updatedAt || ticket.updated_at || ticket.last_update || ticket.time_closed || ticket.closedAt || null;

  // Normalize ticket number from various backend/local shapes
  const number = ticket.ticketNumber || ticket.ticket_number || ticket.ticket_no || ticket.number || ticket.id || 'Unknown';

  // Dynamic data helper
  const dyn = ticket.dynamic_data || {};

  // Prepare additionalDetailsEntries similar to Employee view: when category is 'Others'
  // we want to hide schedule-like keys (schedule, scheduleRequest, scheduled_date, etc.)
  const _dynamicEntries = dyn && typeof dyn === 'object' ? Object.entries(dyn) : [];
  const additionalDetailsEntries = _dynamicEntries.filter(([key, val]) => {
    try {
      const k = (key || '').toString().toLowerCase();
      // Hide schedule-like keys for 'Others' category
      if (uiCategory === 'Others' && k.includes('schedule')) return false;
      // If value is an object that appears to be a schedule (has date/datetime/time/notes), exclude it
      if (val && typeof val === 'object') {
        const hasDate = Object.prototype.hasOwnProperty.call(val, 'date') || Object.prototype.hasOwnProperty.call(val, 'datetime') || Object.prototype.hasOwnProperty.call(val, 'scheduledDate') || Object.prototype.hasOwnProperty.call(val, 'scheduled_date');
        const hasTime = Object.prototype.hasOwnProperty.call(val, 'time');
        const hasNotes = Object.prototype.hasOwnProperty.call(val, 'notes') || Object.prototype.hasOwnProperty.call(val, 'note');
        if (hasDate || hasTime || hasNotes) {
          if (uiCategory === 'Others') return false;
        }
      }
    } catch (e) {
      // on error, keep the entry
    }
    return true;
  });

  // Normalize scheduled request: support scheduled_date, scheduledDate, nested scheduleRequest objects,
  // or dynamic_data keys used by older payloads.
  let scheduledRaw = ticket.scheduledRequest || ticket.scheduled_request || ticket.scheduled_date || ticket.scheduledDate || null;
  if (!scheduledRaw) {
    const possible = dyn.schedule || dyn.schedule_request || dyn.scheduleRequest || dyn.scheduled || dyn.scheduled_request || dyn.scheduledRequest || null;
    if (possible) {
      if (typeof possible === 'string') scheduledRaw = possible;
      else if (typeof possible === 'object') scheduledRaw = possible.date || possible.datetime || possible.scheduledDate || possible.scheduled_date || null;
    }
    if (!scheduledRaw && dyn && dyn.scheduleRequest && typeof dyn.scheduleRequest === 'object') {
      scheduledRaw = dyn.scheduleRequest.date || dyn.scheduleRequest.datetime || null;
    }
    if (!scheduledRaw && dyn && dyn.schedule_request && typeof dyn.schedule_request === 'object') {
      scheduledRaw = dyn.schedule_request.date || dyn.schedule_request.datetime || null;
    }

    // (scheduledRaw computed above)

  }

  // Budget proposal normalization
  const preparedByField = ticket.preparedBy || ticket.prepared_by || ticket.preparedByName || dyn.preparedBy || dyn.prepared_by || null;
  const totalBudgetField = (ticket.totalBudget ?? ticket.total_budget) ?? (dyn.totalBudget ?? dyn.total_budget ?? null);
  // UI-friendly category: backend/storage may use 'General Request' while the form shows 'Others'
  const uiCategory = (category === 'General Request') ? 'Others' : category;
  // Compute effective status: treat New older than 24 hours as Pending for coordinator/admin view
  const status = computeEffectiveStatus(ticket) || originalStatus;
  const statusSteps = getStatusSteps(status);
  const attachments = ticket.fileAttachments || ticket.attachments || ticket.files || fileUploaded;
  const formCategories = ['IT Support', 'Asset Check In', 'Asset Check Out', 'New Budget Proposal', 'Others', 'General Request'];
  const ticketLogs = generateLogs(ticket);
  
  // Use external auth service to determine role
  const { user: authUser, isTicketCoordinator, isAdmin } = useAuth();
  const userRole = authService.getUserRole(); // fallback for old authService if needed
  
  // Only Ticket Coordinator can see coordinator review and perform actions (Open/Reject)
  // Admin (System Admin) should NOT see these buttons
  const canSeeCoordinatorReview = isTicketCoordinator || userRole === 'Ticket Coordinator';
  const canPerformActions = isTicketCoordinator; // ONLY Ticket Coordinator, not Admin

  // Handler used by modal children to indicate success (open/reject actions completed).
  // Accepts an optional updatedTicket object. If not provided we attempt to re-fetch
  // the ticket by number so the UI reflects the latest backend state.
  const handleModalSuccess = async (updatedTicket) => {
    try {
      setShowOpenModal(false);
      setShowRejectModal(false);
      if (updatedTicket) {
        setTicket(updatedTicket);
        return;
      }
      if (ticketNumber) {
        try {
          const fresh = await backendTicketService.getTicketByNumber(ticketNumber);
          if (fresh) setTicket(fresh);
        } catch (err) {
          console.error('Failed to refresh ticket after modal success', err);
        }
      }
    } catch (e) {
      console.error('handleModalSuccess error', e);
    }
  };
 

  // Normalize scheduled request for rendering: it may be a string, date, or an object {date, time, notes}
  const computeScheduledDisplay = (raw) => {
    if (!raw) return null;
    // If it's an object with date/datetime fields, prefer those
    if (typeof raw === 'object') {
      if (raw.date) return formatDateOnly(raw.date) || raw.date;
      if (raw.datetime) return formatDateOnly(raw.datetime) || raw.datetime;
      if (raw.scheduledDate) return formatDateOnly(raw.scheduledDate) || raw.scheduledDate;
      if (raw.scheduled_date) return formatDateOnly(raw.scheduled_date) || raw.scheduled_date;
      // If object has time + date, combine
      if (raw.date && raw.time) return `${formatDateOnly(raw.date)} ${raw.time}`;
      // Fallback to stringifying notes if no date
      try { return JSON.stringify(raw); } catch (e) { return String(raw); }
    }
    // If it's a string or number, try to format as date-only
    return formatDateOnly(raw) || raw;
  };
  const scheduledRequestDisplay = computeScheduledDisplay(scheduledRaw);
  
  return (
    <>
      <main className={styles.employeeTicketTrackerPage}>
        <Breadcrumb
          root="Ticket Management"
          currentPage="Ticket Tracker"
          rootNavigatePage="/admin/ticket-management/all"
          title={`Ticket No. ${number}`}
        />
        <ViewCard>
          <div className={styles.contentGrid}>
            {/* Left Column - Ticket Information */}
            <div ref={leftColRef} className={styles.leftColumn}>
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
                    <span className={styles.ticketMetaLabel}>Date Created <span className={styles.ticketMetaValue}>{formatDate(dateCreatedRaw)}</span> </span> 
                  </div>
                  <div className={styles.ticketMetaItem}>
                    <span className={styles.ticketMetaLabel}>Date Updated <span className={styles.ticketMetaValue}>{formatDate(lastUpdatedRaw)}</span> </span>
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
                            <div className={styles.detailValue}>{ticket.dynamic_data?.device_type || ticket.deviceType || 'None'}</div>
                          </div>
                            {(ticket.issue_type || ticket.issueType || ticket.dynamic_data?.issueType || ticket.dynamic_data?.issue_type) ? (
                              <div className={styles.detailItem}>
                                <div className={styles.detailLabel}>Specify Issue</div>
                                <div className={styles.detailValue}>{ticket.issue_type || ticket.issueType || ticket.dynamic_data?.issueType || ticket.dynamic_data?.issue_type}</div>
                              </div>
                            ) : null}
                            <div className={styles.detailItem}>
                              <div className={styles.detailLabel}>Software Affected</div>
                              <div className={styles.detailValue}>{ticket.dynamic_data?.softwareAffected || ticket.softwareAffected || 'None'}</div>
                            </div>
                            {(ticket.dynamic_data?.notes || ticket.notes || ticket.note) ? (
                              <div className={styles.detailItem}>
                                <div className={styles.detailLabel}>Notes</div>
                                <div className={styles.detailValue}>{ticket.dynamic_data?.notes || ticket.notes || ticket.note}</div>
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
                          {(ticket.issue_type || ticket.issueType || ticket.dynamic_data?.issueType || ticket.dynamic_data?.issue_type) ? (
                            <div className={styles.detailItem}>
                              <div className={styles.detailLabel}>Specify Issue</div>
                              <div className={styles.detailValue}>{ticket.issue_type || ticket.issueType || ticket.dynamic_data?.issueType || ticket.dynamic_data?.issue_type}</div>
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
                            <div className={styles.detailLabel}>Performance Start</div>
                            <div className={styles.detailValue}>{ticket.performanceStartDate || ticket.performance_start_date || ticket.performanceStart || 'N/A'}</div>
                          </div>
                          <div className={styles.detailItem}>
                            <div className={styles.detailLabel}>Performance End</div>
                            <div className={styles.detailValue}>{ticket.performanceEndDate || ticket.performance_end_date || ticket.performanceEnd || 'N/A'}</div>
                          </div>
                          <div className={styles.detailItem}>
                            <div className={styles.detailLabel}>Prepared By</div>
                            <div className={styles.detailValue}>{preparedByField || 'N/A'}</div>
                          </div>
                          <div className={styles.detailItem}>
                            <div className={styles.detailLabel}>Total Budget</div>
                            <div className={styles.detailValue}>{formatMoney(totalBudgetField)}</div>
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
                    {!(category === 'IT Support' || category === 'Asset Check In' || category === 'Asset Check Out' || category === 'New Budget Proposal') && uiCategory !== 'Others' && ticket.dynamic_data && additionalDetailsEntries && additionalDetailsEntries.length > 0 && (
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
            <div ref={rightColRef} className={`${styles.rightColumn} ${detailStyles.rightColumnFill}`}>
              {/* Action Buttons */}
              {canPerformActions && ['New', 'Pending'].includes(status) && (
                <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
                  <Button
                    variant="primary"
                    className={`${styles.ticketActionButtonRow} ${styles.closeButton}`}
                    onClick={() => setShowOpenModal(true)}
                  >
                    Open Ticket
                  </Button>
                  <Button
                    variant="primary"
                    className={`${styles.ticketActionButtonRow} ${styles.rejectButton}`}
                    onClick={() => setShowRejectModal(true)}
                  >
                    Reject Ticket
                  </Button>
                </div>
              )}
              <Tabs
                tabs={[{ label: 'Details', value: 'details' }, { label: 'Logs', value: 'logs' }]}
                active={activeTab}
                onChange={setActiveTab}
                fullHeight={true}
                className={detailStyles.tabsFill}
              >
                {activeTab === 'details' && (
                  <CoordinatorAdminTicketDetails ticket={ticket} ticketLogs={ticketLogs} canSeeCoordinatorReview={canSeeCoordinatorReview} formatDate={formatDate} />
                )}

                {activeTab === 'logs' && (
                  <CoordinatorAdminTicketLogs ticketLogs={ticketLogs} />
                )}
              </Tabs>
            </div>
          </div>
        </ViewCard>
      </main>
      {showOpenModal && (
        <CoordinatorAdminOpenTicketModal
          ticket={ticket}
          onClose={() => setShowOpenModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
      {showRejectModal && (
        <CoordinatorAdminRejectTicketModal
          ticket={ticket}
          onClose={() => setShowRejectModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </>
  );
}
