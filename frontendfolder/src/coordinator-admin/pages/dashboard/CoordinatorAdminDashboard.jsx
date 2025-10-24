import { useState, useRef, useEffect } from 'react';
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
import KnowledgeDashboard from '../knowledge/KnowledgeDashboard';
import { backendTicketService } from '../../../services/backend/ticketService';
import { backendEmployeeService } from '../../../services/backend/employeeService';
import kbService from '../../../services/kbService';

  const ticketPaths = [
    { label: 'New Tickets', path: '/admin/ticket-management/new-tickets' },
    { label: 'Open Tickets', path: '/admin/ticket-management/open-tickets' },
    { label: 'In Progress Tickets', path: '/admin/ticket-management/in-progress-tickets' },
    { label: 'On Hold Tickets', path: '/admin/ticket-management/on-hold-tickets' }
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
  const StatCard = ({ label, count, isHighlight, position, onClick }) => {
    const getStatusClass = (label) => {
      const statusMap = {
        'New Tickets': 'statBadgeNew',
        'Open Tickets': 'statBadgeOpen',
        'In Progress Tickets': 'statBadgeInProgress',
        'On Hold Tickets': 'statBadgeOnHold',
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

  const DataTable = ({ title, headers, data, buttonText, onButtonClick, maxRows, lockLeftCount }) => {
    const approximateRowHeight = 52;
    const overflowStyle = maxRows ? { maxHeight: `${approximateRowHeight * maxRows}px`, overflowY: 'auto' } : undefined;

    return (
      <div className={`${tableStyles.tableContainer} ${lockLeftCount ? tableStyles[`lockLeft${lockLeftCount}`] : ''}`}>
        <div className={tableStyles.tableHeader}>
          <h3 className={tableStyles.tableTitle}>{title}</h3>
          <button className={tableStyles.button} onClick={onButtonClick}>{buttonText}</button>
        </div>

        <div className={tableStyles.tableOverflow} style={overflowStyle}>
          {data && data.length > 0 ? (
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
                          <span className={`${tableStyles.statusBadge} ${tableStyles[cell.statusClass]}`}>{cell.text}</span>
                        ) : cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className={tableStyles.emptyState}>No records found. Click "{buttonText}" to add items.</div>
          )}
        </div>
      </div>
    );
  };

  const StatusPieChart = ({ data, title, activities }) => {
    const navigate = useNavigate();
    const chartData = {
      labels: data.map(item => item.name),
      datasets: [{ label: title, data: data.map(item => item.value), backgroundColor: data.map(item => item.fill), borderWidth: 1, borderColor: '#fff' }]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { padding: 15, font: { size: 12 }, usePointStyle: true, pointStyle: 'circle' } },
        tooltip: { callbacks: { label: function (context) { const label = context.label || ''; const value = context.parsed || 0; const total = context.dataset.data.reduce((a, b) => a + b, 0); const percentage = ((value / total) * 100).toFixed(1); return `${label}: ${value} (${percentage}%)`; } } }
      }
    };

    let browsePath = null;
    if (title && title.toLowerCase().includes('ticket')) browsePath = '/admin/ticket-management/all-tickets';
    else if (title && title.toLowerCase().includes('user')) browsePath = '/admin/user-access/all-users';

    return (
      <div className={chartStyles.chartContainer}>
        <h3 className={chartStyles.chartTitle}>{title}</h3>
        <div className={chartStyles.chartContentRow}>
          <div style={{ width: 300, height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Pie data={chartData} options={options} />
          </div>
          {activities && (
            <ul className={chartStyles.timelineList}>
              {activities.map((item, i) => (
                <li key={i} className={chartStyles.timelineItem}><span className={chartStyles.timelineTime}>{item.time}</span><span className={chartStyles.timelineAction}>{item.action}</span></li>
              ))}
            </ul>
          )}
        </div>
        <button className={chartStyles.browseButton} onClick={browsePath ? () => navigate(browsePath) : undefined} disabled={!browsePath}>Browse All</button>
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
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [lineData, setLineData] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [yRange, setYRange] = useState('auto');
  const [activityTimeline, setActivityTimeline] = useState([]);
  const [userActivityTimeline, setUserActivityTimeline] = useState([]);
  // Derived user dashboard data
  const [userStats, setUserStats] = useState([]);
  const [userTableData, setUserTableData] = useState([]);
  const [userPieData, setUserPieData] = useState([]);
  const [userLineData, setUserLineData] = useState([]);

  // Helper: map ticket status to css class used by status badges
  const mapStatusToClass = (status) => {
    if (!status) return 'statusSubmitted';
    const s = String(status).trim().toLowerCase();
    if (s === 'new') return 'statusNew';
    if (s === 'open') return 'statusOpen';
    if (s === 'in progress' || s === 'in_progress' || s === 'inprogress') return 'statusInProgress';
    if (s === 'on hold' || s === 'on_hold' || s === 'onhold') return 'statusOnHold';
    if (s === 'pending' || s === 'submitted') return 'statusPending';
    if (s === 'closed') return 'statusClosed';
    if (s === 'rejected') return 'statusRejected';
    if (s === 'withdrawn') return 'statusWithdrawn';
    return 'statusSubmitted';
  };

  // Format timestamp for activity logs: YYYY-MM-DD hh:mm AM/PM
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

  // Format time only for user timeline entries: hh:mm AM/PM
  const formatTimeOnly = (date) => {
    if (!date) return 'None';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return 'Invalid Date';
      let hours = d.getHours();
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours === 0 ? 12 : hours;
      const hourStr = String(hours).padStart(2, '0');
      return `${hourStr}:${minutes} ${ampm}`;
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Fetch tickets and employees and compute dashboard data
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const [allTickets, allEmployees] = await Promise.all([
          backendTicketService.getAllTickets(),
          backendEmployeeService.getAllEmployees().catch(() => []),
        ]);

        if (!mounted) return;
        setTickets(allTickets || []);
        setEmployees(allEmployees || []);
        // DEBUG: log employees fetch summary to help troubleshoot chart data
        try {
          console.log('[Dashboard] fetched employees count:', (allEmployees || []).length);
          if ((allEmployees || []).length > 0) {
            console.log('[Dashboard] sample employee:', (allEmployees || [])[0]);
          }
        } catch (e) {
          // ignore logging errors
        }

        // Stats for stat cards (New/Open/In Progress/On Hold)
        const counts = {
          'New Tickets': 0,
          'Open Tickets': 0,
          'In Progress Tickets': 0,
          'On Hold Tickets': 0,
        };
        (allTickets || []).forEach(t => {
          const s = (t.status || '').toString().toLowerCase();
          if (s === 'new') counts['New Tickets'] += 1;
          else if (s === 'open') counts['Open Tickets'] += 1;
          else if (s === 'in progress' || s === 'in_progress' || s === 'inprogress') counts['In Progress Tickets'] += 1;
          else if (s === 'on hold' || s === 'on_hold' || s === 'onhold') counts['On Hold Tickets'] += 1;
        });

        const statsArr = ticketPaths.map((item) => ({
          label: item.label,
          count: counts[item.label] || 0,
          isHighlight: false,
          position: 0,
          path: item.path,
        }));
        setStats(statsArr);

        // Tickets to Review = New tickets
        const newTickets = (allTickets || []).filter(t => (t.status || '').toString().toLowerCase() === 'new');
        const tableRows = newTickets.map(t => ({
          ticketNumber: t.ticket_number || t.ticketNumber || `TX${t.id}`,
          subject: t.subject || t.title || 'No subject',
          category: t.category || 'General',
          subCategory: t.sub_category || t.subCategory || t.subcategory || '',
          status: { text: t.status || 'New', statusClass: mapStatusToClass(t.status) },
          // Format Date Created to a short human-friendly string (YYYY-MM-DD hh:mm AM/PM)
          dateCreated: formatLogTimestamp(t.submit_date || t.dateCreated || t.created_at || t.createdAt),
        }));
        setTableData(tableRows);

        // Pie data: aggregate by status
        const statusCounts = {};
        (allTickets || []).forEach(t => {
          const key = (t.status || 'Unknown').toString();
          statusCounts[key] = (statusCounts[key] || 0) + 1;
        });
        const palette = ['#3B82F6', '#06B6D4', '#F59E0B', '#EF4444', '#22C55E', '#9CA3AF', '#8B5CF6'];
        const pie = Object.keys(statusCounts).map((k, i) => ({ name: k, value: statusCounts[k], fill: palette[i % palette.length] }));
        setPieData(pie);

        // Line data will be computed separately based on selectedYear

        // Build activity timeline (ticket events)
        const events = [];
        (allTickets || []).forEach(t => {
          // creation
          if (t.submit_date) {
            events.push({
              time: t.submit_date,
              action: `Ticket ${t.ticket_number || t.ticketNumber || `TX${t.id}`} submitted`,
              type: 'ticket',
            });
          }

          // closed / withdrawn / resolved
          const closedTime = t.time_closed || t.closed_at || t.timeClosed || t.closedAt || null;
          if (closedTime) {
            events.push({
              time: closedTime,
              action: `Ticket ${t.ticket_number || t.ticketNumber || `TX${t.id}`} ${t.status || 'updated'}`,
              type: 'ticket',
            });
          }
        });

        // Sort events newest-first and take top 5
        events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
        const topEvents = events.slice(0, 5).map(e => ({ time: formatLogTimestamp(e.time), action: e.action, type: e.type }));
        setActivityTimeline(topEvents);

        // Build a richer user activity timeline: created, approved/activated, rejected — exclude superusers
        try {
          const rawUserEvents = [];
          (allEmployees || []).forEach(emp => {
            if (!emp) return;
            if (emp.is_superuser) return; // skip admin/superuser accounts
            const idLabel = emp.company_id || emp.employee_id || emp.id || 'User';

            const createdAt = emp.created_at || emp.date_joined || emp.createdAt || null;
            if (createdAt) rawUserEvents.push({ time: createdAt, action: `User ${idLabel} account created`, type: 'user' });

            const approvedAt = emp.approved_at || emp.approvedAt || emp.activated_at || emp.activatedAt || null;
            if (approvedAt) rawUserEvents.push({ time: approvedAt, action: `User ${idLabel} approved by Admin`, type: 'user' });

            const updatedAt = emp.update_date || emp.updated_at || emp.updatedAt || null;
            const statusVal = (emp.status || emp.account_status || '').toString().toLowerCase();
            // If an account is active/approved but there's no explicit approvedAt, use update_date as a best-effort timestamp
            if ((statusVal === 'active' || statusVal === 'approved') && !approvedAt && updatedAt) rawUserEvents.push({ time: updatedAt, action: `User ${idLabel} approved by Admin`, type: 'user' });

            // Rejected/denied events
            if ((statusVal === 'rejected' || statusVal === 'denied') && updatedAt) rawUserEvents.push({ time: updatedAt, action: `User ${idLabel} rejected by Admin`, type: 'user' });
          });

          // Sort newest-first and take top 5. If no explicit events, fall back to recent employees as "account created" events.
          rawUserEvents.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          let topUserEvents = rawUserEvents.slice(0, 5).map(e => ({ time: formatTimeOnly(e.time), action: e.action, type: e.type }));

          if (!topUserEvents.length) {
            // fallback: use most recent employees (reverse order) and create 'account created' events
            const fallback = (allEmployees || []).slice().reverse().filter(emp => emp && !emp.is_superuser).slice(0, 5).map(emp => {
              const idLabel = emp.company_id || emp.employee_id || emp.id || 'User';
              const t = emp.created_at || emp.date_joined || emp.update_date || emp.updated_at || new Date().toISOString();
              return { time: formatTimeOnly(t), action: `User ${idLabel} account created`, type: 'user' };
            });
            topUserEvents = fallback;
          }
          setUserActivityTimeline(topUserEvents);
        } catch (e) {
          console.error('Failed to build user activity timeline', e);
          setUserActivityTimeline([]);
        }

        // --- Build user derived data: pending users table, pie counts, stats ---
        try {
          const statusCounts = {};
          (allEmployees || []).forEach(emp => {
            // exclude superusers from user-facing counts
            if (emp && emp.is_superuser) return;
            const key = (emp.status || emp.account_status || emp.user_status || 'Unknown').toString();
            statusCounts[key] = (statusCounts[key] || 0) + 1;
          });

          // Pending users table (only pending status)
          const pending = (allEmployees || []).filter(emp => {
            if (!emp) return false;
            // exclude superusers
            if (emp.is_superuser) return false;
            const statusVal = (emp.status || emp.account_status || '').toString().toLowerCase();
            if (statusVal !== 'pending') return false;
            // Determine role; accept common field names and match 'employee'
            const roleVal = (emp.role || emp.user_role || emp.position || emp.job_title || '').toString().toLowerCase();
            return roleVal === 'employee';
          });
          const pendingRows = pending.map(emp => ({
            companyId: emp.company_id || emp.employee_id || emp.id || 'N/A',
            lastName: emp.last_name || emp.lastname || emp.lastName || emp.surname || '',
            firstName: emp.first_name || emp.firstname || emp.firstName || emp.given_name || '',
            department: emp.department_name || (emp.department && emp.department.name) || emp.department || 'N/A',
            role: emp.role || emp.job_title || emp.position || 'User',
            status: { text: emp.status || emp.account_status || 'Pending', statusClass: ((emp.status || emp.account_status || '').toString().toLowerCase() === 'pending' ? 'statusPending' : mapStatusToClass(emp.status)) }
          }));

          // pie data for users
          const palette = ['#22C55E', '#FBBF24', '#EF4444', '#9CA3AF', '#3B82F6', '#8B5CF6'];
          const userPie = Object.keys(statusCounts).map((k, i) => ({ name: k, value: statusCounts[k], fill: palette[i % palette.length] }));

          // user stats (Pending Users) - use the same filtered pending rows (employee role, not superuser)
          const pendingCount = (pendingRows || []).length;
          const uStats = [
            { label: 'Pending Users', count: pendingCount, isHighlight: false, position: 0, path: userPaths.find(p => p.label === 'Pending Accounts')?.path }
          ];

          setUserStats(uStats);
          setUserTableData(pendingRows);
          setUserPieData(userPie);
        } catch (e) {
          console.error('Failed to compute user derived data', e);
        }

  // Ensure lineData recalculation after initial fetch
  // (lineData is computed in a separate effect depending on selectedYear and tickets)

      } catch (e) {
        console.error('Failed to load dashboard data', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, []);

  // Recompute line data (tickets per month) when tickets or selectedYear changes
  useEffect(() => {
    try {
      const year = Number(selectedYear) || new Date().getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => ({ monthIndex: i, month: new Date(year, i, 1).toLocaleString('en-US', { month: 'short' }), dataset1: 0, dataset2: 0 }));
      (tickets || []).forEach(t => {
        const sd = t.submit_date ? new Date(t.submit_date) : null;
        if (sd && sd.getFullYear() === year) {
          months[sd.getMonth()].dataset1 += 1;
        }

        // Determine closed/resolved timestamp. Prefer explicit time_closed if present.
        // Fallback to update_date when status is Closed and time_closed is not set.
        let td = null;
        if (t.time_closed) td = t.time_closed;
        else if (t.closed_at) td = t.closed_at;
        else if (t.timeClosed) td = t.timeClosed;
        else if (t.closedAt) td = t.closedAt;
        else if ((t.status || '').toString().toLowerCase() === 'closed' && t.update_date) td = t.update_date;

        const cd = td ? new Date(td) : null;
        if (cd && cd.getFullYear() === year) months[cd.getMonth()].dataset2 += 1;
      });
      setLineData(months.map(m => ({ month: m.month, dataset1: m.dataset1, dataset2: m.dataset2 })));
    } catch (e) {
      console.error('Failed to compute line data', e);
    }
  }, [tickets, selectedYear]);

  // Recompute users per month when employees or selectedYear changes
  useEffect(() => {
    try {
      const year = Number(selectedYear) || new Date().getFullYear();
      const months = Array.from({ length: 12 }, (_, i) => ({ monthIndex: i, month: new Date(year, i, 1).toLocaleString('en-US', { month: 'short' }), dataset1: 0, dataset2: 0 }));

      // Pre-filter employees (exclude superusers)
      const emps = (employees || []).filter(emp => emp && !emp.is_superuser);

      // Count new users per month (dataset1): include users created in the month whose status is 'pending' or 'approved'
      emps.forEach(emp => {
        // Backend uses `date_created` on Employee (see serializer), check several variants
        const created = emp.date_created || emp.dateCreated || emp.created_at || emp.date_created || emp.dateCreated || emp.createdAt || emp.date_joined || null;
        // As a fallback the serializer provides recent_logs which may include a 'created' entry
        let createdFromLogs = null;
        try {
          if (emp.recent_logs && Array.isArray(emp.recent_logs)) {
            const cLog = emp.recent_logs.find(l => l && (l.action === 'created' || (l.action || '').toString().toLowerCase() === 'created'));
            if (cLog && cLog.timestamp) createdFromLogs = cLog.timestamp;
          }
        } catch (e) {}

        const cd = created ? new Date(created) : (createdFromLogs ? new Date(createdFromLogs) : null);
        const statusVal = (emp.status || emp.account_status || emp.user_status || '').toString().toLowerCase();
        if (cd && cd.getFullYear() === year && (statusVal === 'pending' || statusVal === 'approved' || statusVal === 'approved')) {
          months[cd.getMonth()].dataset1 += 1;
        }
      });

      // For dataset2, compute active users snapshot at the end of each month
      // Active users = union of is_active === true OR status in ['approved','active']
      months.forEach(m => {
        const monthEnd = new Date(year, m.monthIndex + 1, 0, 23, 59, 59, 999);
          let activeCount = 0;
        emps.forEach(emp => {
          const statusVal = (emp.status || emp.account_status || '').toString().toLowerCase();
          // Employee model may not include is_active; treat status 'approved' as active
          const isActiveFlag = !!(emp.is_active || emp.isActive || (statusVal === 'approved'));

          // candidate activation timestamps
          // Look for activation/approval timestamps in common fields and in recent_logs
          let act = emp.approved_at || emp.approvedAt || emp.activated_at || emp.activatedAt || null;
          const created = emp.date_created || emp.dateCreated || emp.created_at || emp.createdAt || emp.date_joined || null;
          const updated = emp.update_date || emp.updated_at || emp.updatedAt || null;
          try {
            if (!act && emp.recent_logs && Array.isArray(emp.recent_logs)) {
              const aLog = emp.recent_logs.find(l => l && (l.action === 'approved' || (l.action || '').toString().toLowerCase() === 'approved'));
              if (aLog && aLog.timestamp) act = aLog.timestamp;
            }
          } catch (e) {}

          // If no explicit activation time and user is currently active/approved, use updated or created as best-effort
          if (!act && (isActiveFlag || statusVal === 'active' || statusVal === 'approved')) act = updated || created || null;

          // If activation/creation happened on or before month end and user qualifies as active, count them
          if (act) {
            const aDate = new Date(act);
            if (!isNaN(aDate.getTime()) && aDate.getTime() <= monthEnd.getTime() && (isActiveFlag || statusVal === 'active' || statusVal === 'approved')) {
              activeCount += 1;
            }
          } else {
            // fallback: if created on or before month end and user currently active/approved, count
            if (created) {
              const cDate = new Date(created);
              if (!isNaN(cDate.getTime()) && cDate.getTime() <= monthEnd.getTime() && (isActiveFlag || statusVal === 'active' || statusVal === 'approved')) {
                activeCount += 1;
              }
            }
          }
        });
        m.dataset2 = activeCount;
      });

      const result = months.map(m => ({ month: m.month, dataset1: m.dataset1, dataset2: m.dataset2 }));

      // DEBUG: log computed user line data to help diagnose empty chart
      try {
        console.log('[Dashboard] computed userLineData for', year, result);
      } catch (e) {}

      // Extra debug: log numeric arrays and a compact sample of employee fields used in computation
      try {
        const newArr = result.map(r => r.dataset1);
        const actArr = result.map(r => r.dataset2);
        console.log('[Dashboard] users per month arrays - newUsers:', newArr, 'activeUsers:', actArr);
  const sample = (employees || []).slice(0, 5).map(emp => ({ id: emp?.id, date_created: emp?.date_created || emp?.dateCreated || emp?.created_at || emp?.createdAt || null, status: emp?.status || emp?.account_status, is_active: emp?.is_active, approved_at: emp?.approved_at || null, update_date: emp?.update_date || emp?.updated_at || null, recent_logs: emp?.recent_logs || null }));
        console.log('[Dashboard] sample employees (compact):', sample);
      } catch (e) {}

      setUserLineData(result);
    } catch (e) {
      console.error('Failed to compute users line data', e);
    }
  }, [employees, selectedYear]);
  const navigate = useNavigate();
  const dashboardTabs = [
    { label: 'Tickets', value: 'tickets' },
    { label: 'Users', value: 'users' },
    { label: 'KB', value: 'kb' },
  ];

  const ticketData = {
    stats: ticketPaths.map((item, i) => ({
      label: item.label,
      count: 0,
      isHighlight: i >= 7,
      position: i,
      path: item.path
    })),
    tableData: tableData,
    // Pie and line data for ticket charts (placeholder/demo values)
    pieData: pieData,
    lineData: lineData,
  };

  const userData = {
    stats: [
      "Pending Users"
    ].map((label, i) => ({
      label,
      count: 5,
      isHighlight: false,
      position: i,
      path: userPaths.find(p => p.label === label)?.path
    })),
    tableData: [
      {
        companyId: 'MAP0001',
        lastName: 'Park',
        firstName: 'Sunghoon',
        department: 'Finance Department',
        role: 'Accountant',
        status: { text: 'Pending', statusClass: 'statusPending' }
      }
    ],
    pieData: [
      { name: 'Active Users', value: 120, fill: '#22C55E' },      // Green
      { name: 'Pending', value: 15, fill: '#FBBF24' },            // Amber
      { name: 'Rejected', value: 8, fill: '#EF4444' },            // Red
      { name: 'Inactive', value: 5, fill: '#9CA3AF' }             // Gray
    ],
    lineData: [
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
          <div className={styles.statusCardsGrid}>
              {activeTab === 'kb' ? (
                // KB tab could show quick KB stats; reuse placeholder stat cards
                [{ label: 'Articles', count: 42 }, { label: 'Categories', count: 8 }].map((stat, i) => (
                  <StatCard key={i} label={stat.label} count={stat.count} onClick={() => {}} />
                ))
              ) : (
                (activeTab === 'tickets' ? (stats.length ? stats : ticketData.stats) : (userStats.length ? userStats : userData.stats)).map((stat, i) => (
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
                <DataTable
                  title={activeTab === 'tickets' ? 'Tickets to Review' : 'User Approval'}
                  buttonText={activeTab === 'tickets' ? 'Manage Tickets' : 'Manage Users'}
                  headers={
                    activeTab === 'tickets'
                      ? ['Ticket Number', 'Subject', 'Category', 'Sub-Category', 'Status', 'Date Created']
                      : ['Company ID', 'Last Name', 'First Name', 'Department', 'Role', 'Status']
                  }
                  data={activeTab === 'tickets' ? ticketData.tableData : (userTableData.length ? userTableData : userData.tableData)}
                  onButtonClick={() =>
                    navigate(
                      activeTab === 'tickets'
                        ? '/admin/ticket-management/all-tickets'
                        : '/admin/user-access/all-users'
                    )
                  }
                  maxRows={6}
                  lockLeftCount={activeTab === 'tickets' ? 1 : 6}
                />

                <div className={chartStyles.chartsGrid}>
                  <StatusPieChart
                      data={activeTab === 'tickets' ? ticketData.pieData : (userPieData.length ? userPieData : userData.pieData)}
                      title={activeTab === 'tickets' ? 'Ticket Status' : 'User Status'}
                      activities={activeTab === 'tickets' ? activityTimeline : userActivityTimeline}
                  />
                  <TrendLineChart
                      data={activeTab === 'tickets' ? lineData : (userLineData.length ? userLineData : userData.lineData)}
                    title={activeTab === 'tickets' ? 'Tickets per Month' : 'Users per Month'}
                    isTicketChart={activeTab === 'tickets'}
                    year={selectedYear}
                    onPrevYear={() => setSelectedYear((y) => Number(y) - 1)}
                    onNextYear={() => setSelectedYear((y) => Number(y) + 1)}
                      showYearControls={activeTab === 'tickets' || activeTab === 'users'}
                      showYRangeSelect={activeTab === 'tickets'}
                      yRange={yRange}
                      onYRangeChange={setYRange}
                  />
                </div>
              </>
            )}
        </div>
      </div>
    </div>
  );
  };

  export default CoordinatorAdminDashboard;

