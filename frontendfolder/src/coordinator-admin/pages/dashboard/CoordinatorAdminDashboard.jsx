import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

import styles from './CoordinatorAdminDashboard.module.css';
import Tabs from '../../../shared/components/Tabs';
import statCardStyles from './CoordinatorAdminDashboardStatusCards.module.css';
import tableStyles from './CoordinatorAdminDashboardTable.module.css';
import chartStyles from './CoordinatorAdminDashboardCharts.module.css';
import Button from '../../../shared/components/Button';
import KnowledgeDashboard from '../knowledge/KnowledgeDashboard';
import authService from '../../../utilities/service/authService';
import { useAuth } from '../../../context/AuthContext';
import { getAllTickets } from '../../../utilities/storages/ticketStorage';
import { backendTicketService } from '../../../services/backend/ticketService';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import { backendArticleService } from '../../../services/backend/articleService';
import { authUserService } from '../../../services/auth/userService';
import kbService from '../../../services/kbService';

const ticketPaths = [
  { label: "New Tickets", path: "/admin/ticket-management/new-tickets" },
  { label: "Pending Tickets", path: "/admin/ticket-management/pending-tickets" },
  { label: "Open Tickets", path: "/admin/ticket-management/open-tickets" },
  { label: "In Progress Tickets", path: "/admin/ticket-management/in-progress-tickets" },
  { label: "On Hold Tickets", path: "/admin/ticket-management/on-hold-tickets" }
];


  const userPaths = [
    { label: 'All Users', path: '/admin/user-access/all-users' },
    { label: 'Employees', path: '/admin/user-access/employees' },
    { label: 'Ticket Coordinators', path: '/admin/user-access/ticket-coordinators' },
    { label: 'System Administrators', path: '/admin/user-access/system-admins' },
    { label: 'Pending Accounts', path: '/admin/user-access/pending-users' },
    { label: 'Rejected Accounts', path: '/admin/user-access/rejected-users' },
  ];

// === Reusable Components ===
const StatCard = ({ label, count, isHighlight, position, onClick, statusType }) => {
  // Map status labels to CSS class names
  const getStatusClass = (label) => {
    const statusMap = {
      'New Tickets': 'statBadgeNew',
      'Open Tickets': 'statBadgeOpen', 
      'In Progress Tickets': 'statBadgeInProgress',
      'On Hold Tickets': 'statBadgeOnHold',
      'Pending Tickets': 'statBadgePending',
      'Pending Users': 'statBadgePending'
    };
    return statusMap[label] || (isHighlight ? 'statBadgeRed' : 'statBadgeBlue');
  };

    return (
      <div className={`${styles.statusCard} ${statCardStyles.statusCard} ${statCardStyles[`card-position-${position}`]}`} onClick={onClick}>
        <div className={`${styles.statCardContent} ${statCardStyles.statCardContent}`}>
          <div className={`${styles.statBadge} ${statCardStyles.statBadge} ${statCardStyles[getStatusClass(label)]}`}>
            {count}
          </div>
          <span className={`${styles.statLabel} ${statCardStyles.statLabel}`}>{label}</span>
        </div>
      </div>
    );
  };

const DataTable = ({ title, headers, data, bodyStyle = {} }) => (
  <div className={tableStyles.tableContainer}>
    <div className={tableStyles.tableHeader}>
      <h3 className={tableStyles.tableTitle}>{title}</h3>
      {/* Manage buttons removed per design request */}
    </div>

    <div className={tableStyles.tableOverflow} style={bodyStyle}>
      {data.length > 0 ? (
        <table className={tableStyles.table}>
          <thead className={tableStyles.tableHead}>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx} className={tableStyles.tableHeaderCell}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className={tableStyles.tableRow}>
                {Object.values(row).map((cell, j) => (
                  <td key={j} className={tableStyles.tableCell}>
                    {typeof cell === 'object' ? (
                      <span className={`${tableStyles.statusBadge} ${tableStyles[cell.statusClass]}`}>
                        {cell.text}
                      </span>
                    ) : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={tableStyles.emptyState}>
          No records found.
        </div>
      )}
    </div>
  </div>
);

const StatusPieChart = ({ data, title, activities, pieRange, setPieRange, isAdmin, onBrowse, visibleNames = null }) => {
  // Transform data for Chart.js
  const chartSource = Array.isArray(visibleNames) ? data.filter(d => visibleNames.includes(d.name)) : data;
  const chartData = {
    labels: chartSource.map(item => item.name),
    datasets: [
      {
        label: title,
        data: chartSource.map(item => item.value),
        backgroundColor: chartSource.map(item => item.fill),
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      // We'll render a custom status list on the left; hide Chart.js legend
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = total ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className={chartStyles.chartContainer} style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 2 }}>
        <select
          value={pieRange}
          onChange={(e) => setPieRange(e.target.value)}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}
        >
          <option value="days">Days</option>
          <option value="week">Week</option>
          <option value="month">Month</option>
          {isAdmin && <option value="yearly">Yearly</option>}
        </select>
      </div>
      <h3 className={chartStyles.chartTitle}>{title}</h3>

      <div className={chartStyles.chartContentRow}>
        {/* Left: Statuses (single column) */}
        <div className={chartStyles.statusColumn}>
          {/* Always render full legend list from the full data set (so missing categories still show in legend) */}
          {data.map((d, idx) => (
            <div key={idx} className={chartStyles.statusItem}>
              <span className={chartStyles.statusSwatch} style={{ background: d.fill }} />
              <span>{d.name}</span>
            </div>
          ))}
        </div>

        {/* Middle: Pie Chart (centered) */}
        <div style={{ width: '340px', height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Pie data={chartData} options={options} />
        </div>

        {/* Right: Activity Timeline */}
        {activities && (
          <ul className={chartStyles.timelineList} style={{ width: '40%' }}>
            {activities.map((item, i) => (
              <li key={i} className={chartStyles.timelineItem}>
                <span className={chartStyles.timelineTime}>{item.time}</span>
                <span className={chartStyles.timelineAction}>{item.action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button variant="primary" className={chartStyles.browseButtonFull} onClick={onBrowse}>Browse All</Button>
    </div>
  );
};

  const TrendLineChart = ({ data, title, isTicketChart = true, year, onPrevYear, onNextYear, showYearControls = false, showYRangeSelect = true, yRange = 'auto', onYRangeChange = () => {} }) => {
    // Ensure numeric data is passed to Chart.js (coerce strings/nulls to numbers)
    const chartData = {
      labels: data.map(item => item.month),
      datasets: [
        { label: isTicketChart ? 'Submitted Tickets' : 'New Users', data: data.map(item => Number(item.dataset1) || 0), fill: false, borderColor: '#3e506cff', backgroundColor: '#3e506cff', tension: 0.4, borderWidth: 2, pointRadius: 4, pointHoverRadius: 6 },
        { label: isTicketChart ? 'Closed Tickets' : 'Active Users', data: data.map(item => Number(item.dataset2) || 0), fill: false, borderColor: '#22C55E', backgroundColor: '#22C55E', tension: 0.4, borderWidth: 2, pointRadius: 4, pointHoverRadius: 6 }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'top', labels: { padding: 15, font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' } }, title: { display: false }, tooltip: { mode: 'index', intersect: false } },
      scales: { x: { grid: { display: true, color: 'rgba(0,0,0,0.05)' } }, y: { beginAtZero: true, grid: { display: true, color: 'rgba(0,0,0,0.05)' } } },
      interaction: { mode: 'nearest', axis: 'x', intersect: false }
    };

    // Build chart options and Y-range handling
    // parse yRange prop locally
    const parseYRange = (val) => {
      if (!val || val === 'auto') return {};
      const parts = val.split('-').map(s => parseInt(s.replace(/,/g, ''), 10));
      if (parts.length === 2 && !isNaN(parts[1])) return { max: parts[1] };
      return {};
    };

    // Compute maximum data value across both datasets to decide which dropdown options make sense
    const safeNumberArray = (arr) => Array.isArray(arr) ? arr.map(v => Number(v) || 0) : [];
    const dataset1 = safeNumberArray(chartData.datasets[0]?.data);
    const dataset2 = safeNumberArray(chartData.datasets[1]?.data);
    const maxVal = Math.max(0, ...(dataset1.length ? dataset1 : [0]), ...(dataset2.length ? dataset2 : [0]));

    // canonical range choices (from reports)
    const rangeChoices = [
      { value: 'auto', label: 'Auto', max: Infinity },
      { value: '0-50', label: '0 - 50', max: 50 },
      { value: '50-100', label: '50 - 100', max: 100 },
      { value: '100-1000', label: '100 - 1,000', max: 1000 },
      { value: '1000-10000', label: '1,000 - 10,000', max: 10000 },
      { value: '10000-100000', label: '10,000 - 100,000', max: 100000 },
    ];

    // Only include choices where the choice's max is >= current max value (auto always present)
    const filteredChoices = rangeChoices.filter(c => c.value === 'auto' || (typeof c.max === 'number' && c.max >= maxVal));

    // If the currently selected yRange is no longer valid (e.g., maxVal exceeded it), fallback to 'auto'
    useEffect(() => {
      if (yRange && yRange !== 'auto' && !filteredChoices.find(c => c.value === yRange)) {
        // ask parent to switch to auto
        onYRangeChange('auto');
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [maxVal, yRange]);

    const yOverrides = parseYRange(yRange);
    const mergedOptions = { ...options, scales: { ...options.scales, y: { ...options.scales.y, ...(yOverrides || {}) } } };

    return (
      <div className={chartStyles.chartContainer}>
        <div className={chartStyles.chartHeaderRow}>
          <h3 className={chartStyles.chartTitle}>{title}</h3>
          {/* moved dropdown beside the title */}
          {showYearControls && showYRangeSelect && (
            <select value={yRange} onChange={(e) => onYRangeChange(e.target.value)} className={chartStyles.headerYRangeSelect} aria-label="Select Y axis range">
              {filteredChoices.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          )}
        </div>

        <div className={chartStyles.chartContent} style={{ height: 300 }}>
          <Line data={chartData} options={mergedOptions} />
        </div>

        {showYearControls && (
          <div className={chartStyles.yearControlsContainer}>
            <div className={chartStyles.yearNavRow}>
              <button aria-label="Previous year" onClick={onPrevYear} className={chartStyles.yearNavBtn}>&larr;</button>
              <div className={chartStyles.yearLabel}>{year}</div>
              <button aria-label="Next year" onClick={onNextYear} className={chartStyles.yearNavBtn}>&rarr;</button>
            </div>
          </div>
        )}
      </div>
    );
  };

// === Main Component ===
const CoordinatorAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [chartRange, setChartRange] = useState('month');
  const [pieRange, setPieRange] = useState('month');
  const navigate = useNavigate();
  
  // Use AuthContext for role-based access
  const { user, isAdmin, isTicketCoordinator } = useAuth();
  
  // Fallback to old authService if AuthContext doesn't have user yet
  const currentUser = useMemo(() => {
    if (user) {
      const derivedRole = user.role || (isAdmin ? 'Admin' : isTicketCoordinator ? 'Ticket Coordinator' : 'Employee');
      console.log('Dashboard - User from AuthContext:', user);
      console.log('Dashboard - isAdmin:', isAdmin);
      console.log('Dashboard - isTicketCoordinator:', isTicketCoordinator);
      console.log('Dashboard - Derived role:', derivedRole);
      return {
        ...user,
        role: derivedRole
      };
    }
    const fallbackUser = authService.getCurrentUser();
    console.log('Dashboard - Fallback to old authService:', fallbackUser);
    return fallbackUser;
  }, [user, isAdmin, isTicketCoordinator]);
  
  // Ticket Coordinators only see the Tickets tab on dashboard
  const dashboardTabs = useMemo(() => {
    const role = currentUser?.role || '';
    const isCoordinator = role === 'Ticket Coordinator' || isTicketCoordinator;
    
    return isCoordinator
      ? [{ label: 'Tickets', value: 'tickets' }]
      : [
          { label: 'Tickets', value: 'tickets' },
          { label: 'Users', value: 'users' },
          { label: 'KB', value: 'kb' },
        ];
  }, [currentUser?.role, isTicketCoordinator]);

  const [ticketDataState, setTicketDataState] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketError, setTicketError] = useState(null);
  const [kbDataState, setKbDataState] = useState(null);
  const [loadingKb, setLoadingKb] = useState(false);
  const [kbError, setKbError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yRange, setYRange] = useState('auto');
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [userActivityTimeline, setUserActivityTimeline] = useState([]);
  const [userDataState, setUserDataState] = useState(null);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userError, setUserError] = useState(null);

  const ticketData = ticketDataState || {
    stats: ticketPaths.map((item, i) => ({
      label: item.label,
      count: 0,
      isHighlight: i >= 7,
      position: i,
      path: item.path
    })),
    tableData: [],
    // Pie and line data for ticket charts (placeholder/demo values)
    pieData: [],
    lineData: [],
  };

  // Helper: compute effective display status (New -> Pending after 24h)
  const normalizeStatus = (raw) => {
    if (!raw) return 'New';
    const s = String(raw).toLowerCase();
    if (s.includes('new') || s.includes('submitted')) return 'New';
    if (s.includes('pending')) return 'Pending';
    if (s.includes('open')) return 'Open';
    if (s.includes('in progress') || s.includes('inprogress')) return 'In Progress';
    if (s.includes('on hold') || s.includes('on-hold')) return 'On Hold';
    if (s.includes('withdraw')) return 'Withdrawn';
    if (s.includes('rejected')) return 'Rejected';
    if (s.includes('closed') || s.includes('resolved')) return 'Closed';
    // default fallback - capitalize words
    return String(raw)
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const computeEffectiveStatus = (ticket) => {
    const base = normalizeStatus(ticket.status || 'New');
    if (base === 'New') {
      const created = ticket.createdAt ? new Date(ticket.createdAt) : null;
      if (created) {
        const ageHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
        if (ageHours >= 24) return 'Pending';
      }
      return 'New';
    }
    return base;
  };

  // Role filter: Ticket Coordinators only see tickets assigned to them (assignedTo or reviewedById)
  const filterByRole = (tickets) => {
    if (currentUser?.role === 'Ticket Coordinator') {
      return tickets.filter(t => t.assignedTo === currentUser.id || t.reviewedById === currentUser.id || t.assignedToName === currentUser?.name);
    }
    // Admin and System Admin see all tickets
    return tickets;
  };

  // Aggregation helpers for charts
  const aggregatePie = (tickets) => {
    // canonical statuses we care about
    const buckets = {
      New: 0,
      Pending: 0,
      Open: 0,
      'In Progress': 0,
      'On Hold': 0,
      Withdrawn: 0,
      Closed: 0,
      Rejected: 0,
    };
    tickets.forEach(t => {
      const s = computeEffectiveStatus(t);
      if (buckets[s] !== undefined) {
        buckets[s] += 1;
      } else {
        // map unexpected statuses to Closed as a safe fallback
        buckets.Closed += 1;
      }
    });
    const colorMap = {
      New: '#3B82F6',
      Pending: '#FBBF24',
      Open: '#06B6D4',
      'In Progress': '#F59E0B',
      'On Hold': '#EF4444',
      Rejected: '#DC2626',
      Closed: '#10B981'
    };
    // Provide display labels that match dashboard wording (e.g. "New Tickets")
    const displayMap = {
      New: 'New Tickets',
      Pending: 'Pending Tickets',
      Open: 'Open Tickets',
      'In Progress': 'In Progress Tickets',
      'On Hold': 'On Hold Tickets',
      Withdrawn: 'Withdrawn',
      Closed: 'Closed',
      Rejected: 'Rejected',
    };

    // Return all buckets (including zero-values) so legends always show, e.g. "New Tickets"
    return Object.keys(buckets).map(name => ({ name: displayMap[name] || name, value: buckets[name], fill: colorMap[name] || '#9CA3AF' }));
  };

  const formatMonthLabel = (d) => d.toLocaleString(undefined, { month: 'short' });

  const aggregateLine = (tickets, range = 'month') => {
    const now = new Date();
    if (range === 'days') {
      // last 7 days
      const days = Array.from({ length: 7 }).map((_, i) => {
        const day = new Date();
        day.setDate(now.getDate() - (6 - i));
        day.setHours(0,0,0,0);
        return day;
      });
      return days.map(d => {
        const next = new Date(d); next.setDate(d.getDate()+1);
        const submitted = tickets.filter(t => {
          const c = t.createdAt ? new Date(t.createdAt) : null; return c && c >= d && c < next;
        }).length;
        const closed = tickets.filter(t => {
          const c = t.closedAt ? new Date(t.closedAt) : null; return c && c >= d && c < next;
        }).length;
        return { month: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), dataset1: submitted, dataset2: closed };
      });
    }
    if (range === 'week') {
      // last 4 weeks
      const weeks = Array.from({ length: 4 }).map((_, i) => {
        const start = new Date(now);
        start.setDate(now.getDate() - (27 - i*7));
        start.setHours(0,0,0,0);
        const end = new Date(start); end.setDate(start.getDate()+7);
        return { start, end };
      });
      return weeks.map((w, idx) => {
        const submitted = tickets.filter(t => { const c = t.createdAt ? new Date(t.createdAt) : null; return c && c >= w.start && c < w.end; }).length;
        const closed = tickets.filter(t => { const c = t.closedAt ? new Date(t.closedAt) : null; return c && c >= w.start && c < w.end; }).length;
        return { month: `W${idx+1}`, dataset1: submitted, dataset2: closed };
      });
    }
    // month/yearly: monthly buckets
    const monthsCount = range === 'yearly' ? 12 : 6;
    const months = Array.from({ length: monthsCount }).map((_, i) => {
      const m = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1 - i), 1);
      return m;
    });
    return months.map(m => {
      const start = new Date(m.getFullYear(), m.getMonth(), 1);
      const end = new Date(m.getFullYear(), m.getMonth()+1, 1);
      const submitted = tickets.filter(t => { const c = t.createdAt ? new Date(t.createdAt) : null; return c && c >= start && c < end; }).length;
      const closed = tickets.filter(t => { const c = t.closedAt ? new Date(t.closedAt) : null; return c && c >= start && c < end; }).length;
      return { month: formatMonthLabel(m), dataset1: submitted, dataset2: closed };
    });
  };

  // Effect: load tickets and compute dashboard data based on role and selected ranges
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingTickets(true);
      setTicketError(null);
      try {
        // Prefer backend tickets when available
        let all = [];
        try {
          all = await backendTicketService.getAllTickets();
          console.log('📊 Admin Dashboard: Fetched tickets from backend:', all.length, 'tickets');
          console.log('📊 Sample ticket:', all[0]);
        } catch (e) {
          console.warn('Backend ticket fetch failed, falling back to local tickets', e);
          all = [];
        }

        // If backend returned no tickets (for example when no token) fall back to local seeded tickets
        if ((!Array.isArray(all) || all.length === 0) && typeof getAllTickets === 'function') {
          console.log('⚠️ Admin Dashboard: No backend tickets, using local seeded data');
          const local = getAllTickets();
          if (Array.isArray(local) && local.length) all = local;
        }

        const filtered = filterByRole(Array.isArray(all) ? all : []);

        // stats per ticketPaths
        const stats = ticketPaths.map(p => ({ label: p.label, count: 0, path: p.path }));
        filtered.forEach(t => {
          const s = computeEffectiveStatus(t);
          // only increment if status maps to one of the ticketPaths labels
          const mapLabel = ticketPaths.find(p => p.label.toLowerCase().startsWith(s.toLowerCase()));
          if (mapLabel) {
            const target = stats.find(st => st.label === mapLabel.label);
            if (target) target.count += 1;
          }
        });

        const pie = aggregatePie(filtered.concat());
        const line = aggregateLine(
          filtered.concat(), 
          (currentUser?.role === 'Admin' || isAdmin) && chartRange === 'yearly' ? 'yearly' : chartRange
        );
        // Build a compact activity timeline: pick latest timestamp from each ticket and a short action
        // Choose timestamp fields according to action (submitted vs resolved/rejected)
        const buildTimestampFor = (t, verb) => {
          if (verb === 'resolved') {
            return new Date(t.closedAt || t.time_closed || t.lastUpdated || t.updatedAt || t.update_date || t.createdAt || 0);
          }
          if (verb === 'rejected') {
            return new Date(t.rejectedAt || t.rejected_at || t.lastUpdated || t.updatedAt || t.update_date || t.createdAt || 0);
          }
          if (verb === 'withdrawn') {
            return new Date(t.withdrawnAt || t.withdrawn_at || t.lastUpdated || t.updatedAt || t.update_date || t.createdAt || 0);
          }
          // default: submitted — use creation timestamps
          return new Date(t.createdAt || t.dateCreated || t.submit_date || t.submitDate || t.created_at || t.update_date || 0);
        };

        const timeline = (Array.isArray(filtered) ? filtered : []).map((t) => {
          // Prefer explicit ticket number fields (these come from backend payloads).
          const numberRaw = t.ticketNumber || t.ticket_no || t.ticketNumber || t.ticketNo || t.ticket_number || t.number || t.reference || t.ref || t.tx || t.tx_number || null;
          let number = numberRaw || null;
          // If we still don't have a ticket number, try other nested fields
          if (!number) {
            if (t.meta && (t.meta.ticketNumber || t.meta.ticket_number)) number = t.meta.ticketNumber || t.meta.ticket_number;
            else if (t.dynamic_data && (t.dynamic_data.ticketNumber || t.dynamic_data.ticket_number)) number = t.dynamic_data.ticketNumber || t.dynamic_data.ticket_number;
          }
          // If still missing, synthesize a readable ticket id: TX + YYYYMMDD + zero-padded internal id
          if (!number) {
            const created = new Date(t.createdAt || t.dateCreated || t.submit_date || t.created_at || 0);
            const y = String(created.getFullYear() || new Date().getFullYear());
            const m = String((created.getMonth() + 1)).padStart(2, '0');
            const d = String(created.getDate()).padStart(2, '0');
            const rawId = (t.id || t.pk || t.ticket_id || t.internal_id || '') + '';
            const padded = rawId ? rawId.padStart(6, '0') : Math.floor(Math.random() * 900000 + 100000).toString();
            number = `TX${y}${m}${d}${padded}`;
          }
          const rawStatus = (t.status || computeEffectiveStatus(t) || '').toString().toLowerCase();
          // Map status to a simple verb
          let verb = 'submitted';
          if (rawStatus.includes('closed') || rawStatus.includes('resolved')) verb = 'resolved';
          else if (rawStatus.includes('rejected')) verb = 'rejected';
          else if (rawStatus.includes('withdraw')) verb = 'withdrawn';
          else verb = 'submitted';

          // Use lastUpdated (or fallbacks) as the canonical sort key so the timeline is latest->oldest by update
          const sortDate = new Date(t.lastUpdated || t.update_date || t.updatedAt || t.updated_at || t.time_closed || t.closedAt || t.rejectedAt || t.rejected_at || t.submit_date || t.dateCreated || t.createdAt || 0);
          const timeLabel = sortDate && !isNaN(sortDate.getTime()) ? sortDate.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }) : '';
          const action = `Ticket ${number} ${verb}`;
          return { time: timeLabel, action, rawTime: sortDate.getTime() };
        })
          .filter(i => i && Number.isFinite(i.rawTime))
          .sort((a, b) => b.rawTime - a.rawTime) // Sort by timestamp: newest to oldest (latest activities first)
          .slice(0, 4);

        // For user timeline, show items where a creator/employee field exists; fallback to the same timeline
        const userTimeline = timeline.filter(item => {
          // crude heuristic: include if ticket subject mentions employee or if any filtered ticket has employee info
          return true;
        }).slice(0, 4);

        if (mounted) {
          setActivityTimeline(timeline.map(i => ({ time: i.time, action: i.action })));
          setUserActivityTimeline(userTimeline.map(i => ({ time: i.time, action: i.action })));

          // Build table data from filtered tickets (limit to 5 rows for scrollable display)
          const tableData = filtered.slice(0, 5).map(t => {
            // Get ticket number with fallback
            const numberRaw = t.ticketNumber || t.ticket_no || t.ticket_number || t.number || t.reference || t.ref || t.tx || t.tx_number || null;
            let number = numberRaw || null;
            if (!number) {
              const created = new Date(t.createdAt || t.dateCreated || t.submit_date || t.created_at || 0);
              const y = String(created.getFullYear() || new Date().getFullYear());
              const m = String((created.getMonth() + 1)).padStart(2, '0');
              const d = String(created.getDate()).padStart(2, '0');
              const rawId = (t.id || t.pk || t.ticket_id || t.internal_id || '') + '';
              const padded = rawId ? rawId.padStart(6, '0') : Math.floor(Math.random() * 900000 + 100000).toString();
              number = `TX${y}${m}${d}${padded}`;
            }

            return {
              ticketNumber: number,
              subject: t.subject || t.title || t.issue || 'No subject',
              category: t.category || t.category_name || 'Uncategorized',
              subCategory: t.subCategory || t.sub_category || t.subcategory || '-',
              status: {
                text: computeEffectiveStatus(t),
                statusClass: 'status' + computeEffectiveStatus(t).replace(/\s+/g, '')
              },
              dateCreated: new Date(t.createdAt || t.dateCreated || t.submit_date || t.created_at || 0).toLocaleDateString()
            };
          });

          setTicketDataState({
            stats,
            tableData,
            pieData: pie,
            lineData: line
          });
        }
        // Fetch all users from auth service for Users tab
        try {
          setLoadingUsers(true);
          setUserError(null);
          let allUsers = [];
          try {
            // Fetch all HDTS users from auth service
            allUsers = await authUserService.getAllHdtsUsers();
            console.log('📋 Admin Dashboard: Fetched all HDTS users from auth service:', allUsers.length, 'users');
          } catch (e) {
            console.warn('Failed to fetch HDTS users from auth service:', e);
            allUsers = [];
          }

          // Normalize to array
          allUsers = Array.isArray(allUsers) ? allUsers : [];

          // Fetch pending HDTS employees from auth service (pending employees only)
          let pendingEmployees = [];
          try {
            pendingEmployees = await authUserService.getPendingHdtsUsers();
            console.log('📋 Admin Dashboard: Fetched pending HDTS employees from auth service:', pendingEmployees.length, 'users');
          } catch (e) {
            console.warn('Failed to fetch pending HDTS employees from auth service, falling back to client-side filter:', e);

            // Fallback: Filter pending employees from the all-users list
            pendingEmployees = allUsers.filter(u => {
              const status = (u.status || '').toLowerCase();
              const roles = u.system_roles || u.systemRoles || [];
              const hasEmployeeRole = roles.some(r => {
                const roleName = (r.role_name || r.role || '').toLowerCase();
                return roleName === 'employee';
              });
              return status === 'pending' && hasEmployeeRole;
            });
            console.log('📋 Admin Dashboard: Pending employees (fallback filter):', pendingEmployees.length, 'from', allUsers.length, 'total users');
          }

          // Build table rows for User Approval table (pending employees only)
          // Columns: Company ID, Last Name, First Name, Department, Status
          const tableRows = pendingEmployees.map(u => {
            return {
              companyId: u.company_id || u.companyId || u.username || `USER-${u.id}`,
              lastName: u.last_name || '',
              firstName: u.first_name || '',
              department: u.department || '',
              status: { 
                text: 'Pending', 
                statusClass: 'statusPending' 
              }
            };
          });

          // Count users by status
          // Active: All HDTS users EXCEPT Employee role with status=Pending or Rejected
          //         (Admin/Ticket Coordinator with Pending status still count as Active)
          // Pending: Employee role only + status=Pending
          // Rejected: Employee role only + status=Rejected
          const activeCount = allUsers.filter(u => {
            const status = (u.status || '').toLowerCase();
            const roles = u.system_roles || u.systemRoles || [];
            const hasEmployeeRole = roles.some(r => {
              const roleName = (r.role_name || r.role || '').toLowerCase();
              return roleName === 'employee';
            });
            // Exclude only if Employee role AND (Pending OR Rejected)
            const isExcluded = hasEmployeeRole && (status === 'pending' || status === 'rejected');
            return !isExcluded;
          }).length;
          const pendingCount = allUsers.filter(u => {
            const status = (u.status || '').toLowerCase();
            const roles = u.system_roles || u.systemRoles || [];
            const hasEmployeeRole = roles.some(r => {
              const roleName = (r.role_name || r.role || '').toLowerCase();
              return roleName === 'employee';
            });
            return status === 'pending' && hasEmployeeRole;
          }).length;
          const rejectedCount = allUsers.filter(u => {
            const status = (u.status || '').toLowerCase();
            const roles = u.system_roles || u.systemRoles || [];
            const hasEmployeeRole = roles.some(r => {
              const roleName = (r.role_name || r.role || '').toLowerCase();
              return roleName === 'employee';
            });
            return status === 'rejected' && hasEmployeeRole;
          }).length;

          // Stats for users tab - show pending employees count
          const userStats = [
            {
              label: 'Pending Users',
              count: pendingEmployees.length,
              isHighlight: true,
              position: 0,
              path: userPaths.find(p => p.label === 'Pending Accounts')?.path
            }
          ];

          // Build user activity logs: one action per user based on current status
          const userActions = allUsers.map(u => {
            const labelId = u.company_id || u.companyId || u.username || `USER-${u.id}`;
            const status = (u.status || '').toLowerCase();
            
            if (status === 'pending') {
              // Show account creation time for pending users
              const created = new Date(u.date_joined || u.created_at || 0);
              return { 
                time: created.getTime(), 
                displayTime: created, 
                action: `User ${labelId} account created` 
              };
            } else if (status === 'approved') {
              // Show approval time - use approved_at if available
              const approved = new Date(u.approved_at || u.last_login || u.updated_at || u.date_joined || 0);
              return { 
                time: approved.getTime(), 
                displayTime: approved, 
                action: `User ${labelId} approved by Admin` 
              };
            } else if (status === 'rejected') {
              // Show rejection time - use rejected_at if available
              const rejected = new Date(u.rejected_at || u.updated_at || u.date_joined || 0);
              return { 
                time: rejected.getTime(), 
                displayTime: rejected, 
                action: `User ${labelId} rejected by Admin` 
              };
            }
            return null;
          }).filter(a => a && Number.isFinite(a.time));

          // Sort by timestamp: newest to oldest (latest activities first)
          userActions.sort((a, b) => b.time - a.time);

          // Build pie data - showing Active (all HDTS users), Pending (Employees), and Rejected (Employees)
          const pie = [
            { name: 'Active', value: activeCount, fill: '#10B981' },
            { name: 'Pending', value: pendingCount, fill: '#FBBF24' },
            { name: 'Rejected', value: rejectedCount, fill: '#EF4444' }
          ];

          if (mounted) {
            setUserDataState({ stats: userStats, tableData: tableRows, pieData: pie, lineData: [] });
            setUserActivityTimeline(userActions.slice(0, 4).map(a => ({ time: a.displayTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true }), action: a.action })));
          }
        } catch (e) {
          console.error('Error processing users for dashboard', e);
          if (mounted) setUserError(e?.message || String(e));
        } finally {
          if (mounted) setLoadingUsers(false);
        }
      } catch (err) {
        console.error('Error loading tickets for dashboard', err);
        if (mounted) setTicketError(err?.message || String(err));
      } finally {
        if (mounted) setLoadingTickets(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [currentUser, chartRange, pieRange]);

  // Effect: load KB (articles) for KB tab cards
  useEffect(() => {
    let mounted = true;
    const loadKb = async () => {
      setLoadingKb(true);
      setKbError(null);
      try {
        // Fetch articles and the canonical categories list from kbService.
        // kbService.listCategories() will try backend choices endpoint and fall back to static list.
        const [articles, categories] = await Promise.all([
          kbService.listArticles().catch(() => []),
          kbService.listCategories().catch(() => [])
        ]);

        const totalArticles = Array.isArray(articles) ? articles.length : 0;
        const categoriesCount = Array.isArray(categories) ? categories.length : 0;

        const kbStats = [
          { label: 'Articles', count: totalArticles, isHighlight: false, position: 0, path: '/admin/kb/articles' },
          { label: 'Categories', count: categoriesCount, isHighlight: false, position: 1, path: '/admin/kb/categories' }
        ];

        if (mounted) setKbDataState({ stats: kbStats, rawArticles: articles, rawCategories: categories });
      } catch (err) {
        console.error('Error loading KB data for dashboard', err);
        if (mounted) setKbError(err?.message || String(err));
      } finally {
        if (mounted) setLoadingKb(false);
      }
    };

    // load KB once (or when switching to KB tab)
    if (activeTab === 'kb') loadKb();
    return () => { mounted = false; };
  }, [activeTab]);

  const userData = {
    // allow override from userDataState (populated from backend)
    stats: userDataState?.stats || [
      "Pending Users"
    ].map((label, i) => ({
      label,
      count: 5,
      isHighlight: false,
      position: i,
      path: userPaths.find(p => p.label === label)?.path
    })),
    tableData: userDataState?.tableData || [
      {
        companyId: 'MAP0001',
        lastName: 'Park',
        firstName: 'Sunghoon',
        department: 'Finance Department',
        role: 'Accountant',
        status: { text: 'Pending', statusClass: 'statusPending' }
      }
    ],
    pieData: userDataState?.pieData || [
      { name: 'Active Users', value: 120, fill: '#22C55E' },      // Green
      { name: 'Pending', value: 15, fill: '#FBBF24' },            // Amber
      { name: 'Rejected', value: 8, fill: '#EF4444' },            // Red
      { name: 'Inactive', value: 5, fill: '#9CA3AF' }             // Gray
    ],
    lineData: userDataState?.lineData || [
      { month: 'Jan', dataset1: 12, dataset2: 8 },
      { month: 'Feb', dataset1: 18, dataset2: 15 },
      { month: 'Mar', dataset1: 22, dataset2: 18 },
      { month: 'Apr', dataset1: 28, dataset2: 25 },
      { month: 'May', dataset1: 35, dataset2: 30 },
      { month: 'Jun', dataset1: 40, dataset2: 38 }
    ]
  };
  

  // activityTimeline and userActivityTimeline are populated from real data in useEffect

    const ActivityTimeline = ({ activities }) => (
      <div className={chartStyles.timelineContainer}>
        <h3 className={chartStyles.chartTitle}>Activity Timeline</h3>
        <ul className={chartStyles.timelineList}>{activities.map((item, i) => (<li key={i} className={chartStyles.timelineItem}><span className={chartStyles.timelineTime}>{item.time}</span><span className={chartStyles.timelineAction}>{item.action}</span></li>))}</ul>
      </div>
    );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        <h1 className={styles.title}>Dashboard</h1>

        <Tabs
          tabs={dashboardTabs}
          active={activeTab}
          onChange={setActiveTab}
        />
        <div className={styles.tabContent}>
          <div className={styles.statusCardsGrid} style={{ marginTop: 12 }}>
            {activeTab === 'kb' ? (
              // KB tab: show real KB stats when available
              (kbDataState?.stats || [{ label: 'Articles', count: 0 }, { label: 'Categories', count: 0 }]).map((stat, i) => (
                <StatCard key={i} {...stat} onClick={() => stat.path && navigate(stat.path)} />
              ))
            ) : (
              (activeTab === 'tickets' ? ticketData.stats : userData.stats).map((stat, i) => (
                <StatCard
                  key={i}
                  {...stat}
                  onClick={() => stat.path && navigate(stat.path)}
                />
              ))
            )}
          </div>
            {activeTab === 'kb' ? (
              <div style={{ padding: 12 }}>
                <KnowledgeDashboard />
              </div>
            ) : (
              <>
            {/* Hide Tickets to Review for Admin and System Admin roles */}
            {!((currentUser?.role === 'System Admin' || currentUser?.role === 'Admin' || isAdmin) && activeTab === 'tickets') && (
              activeTab === 'tickets' ? (
                <DataTable
                  title={'Tickets to Review'}
                  headers={['Ticket Number', 'Subject', 'Category', 'Sub-Category', 'Status', 'Date Created']}
                  data={ticketData.tableData}
                  bodyStyle={{ maxHeight: '320px', overflowY: 'auto' }}
                />
              ) : (
                // Users tab: show Pending Users table with locked columns and max 5 rows scrollable (rows area only)
                <DataTable
                  title={'User Approval'}
                  headers={['Company ID', 'Last Name', 'First Name', 'Department', 'Status']}
                  data={userData.tableData}
                  bodyStyle={{ maxHeight: '320px', overflowY: 'auto' }}
                />
              )
            )}                <div style={{ position: 'relative', marginTop: 12 }}>
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <select
                      value={chartRange}
                      onChange={(e) => setChartRange(e.target.value)}
                      style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}
                    >
                      <option value="days">Days</option>
                      <option value="week">Week</option>
                      <option value="month">Month</option>
                      {(currentUser?.role === 'System Admin' || currentUser?.role === 'Admin' || isAdmin) && <option value="yearly">Yearly</option>}
                    </select>
                  </div>

                  <div className={chartStyles.chartsGrid}>
                  <StatusPieChart
                    data={activeTab === 'tickets' ? ticketData.pieData : userData.pieData}
                    title={activeTab === 'tickets' ? 'Ticket Status' : 'User Status'}
                    activities={activeTab === 'tickets' ? activityTimeline : userActivityTimeline}
                    pieRange={pieRange}
                    setPieRange={setPieRange}
                    isAdmin={currentUser?.role === 'System Admin' || currentUser?.role === 'Admin' || isAdmin}
                    // Browse All should lead to the appropriate admin list pages
                    onBrowse={() => navigate(activeTab === 'tickets' ? '/admin/ticket-management/all-tickets' : '/admin/user-access/all-users')}
                    // For Users tab show Active, Pending, and Rejected slices
                    visibleNames={activeTab === 'tickets' ? null : ['Active', 'Pending', 'Rejected']}
                  />
                  <TrendLineChart
                    data={(() => {
                      const source = activeTab === 'tickets' ? ticketData.lineData : userData.lineData;
                      if (chartRange === 'days') return source.slice(-7);
                      if (chartRange === 'week') return source.slice(-4);
                      return source;
                    })()}
                    title={activeTab === 'tickets' ? 'Tickets per Period' : 'Users per Period'}
                    isTicketChart={activeTab === 'tickets'}
                    /* Temporarily hide year controls and Y-range select for Tickets per Period */
                    showYearControls={false}
                    showYRangeSelect={false}
                    yRange={yRange}
                    onYRangeChange={setYRange}
                  />
                </div>
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
  };

  export default CoordinatorAdminDashboard;

