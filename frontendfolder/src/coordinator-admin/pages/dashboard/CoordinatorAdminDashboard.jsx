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

  const TrendLineChart = ({ data, title, isTicketChart = true, year, onPrevYear, onNextYear, showYearControls = false, yRange = 'auto', onYRangeChange = () => {} }) => {
    const chartData = {
      labels: data.map(item => item.month),
      datasets: [
        { label: isTicketChart ? 'Submitted Tickets' : 'New Users', data: data.map(item => item.dataset1), fill: false, borderColor: '#3e506cff', backgroundColor: '#3e506cff', tension: 0.4, borderWidth: 2, pointRadius: 4, pointHoverRadius: 6 },
        { label: isTicketChart ? 'Closed Tickets' : 'Active Users', data: data.map(item => item.dataset2), fill: false, borderColor: '#22C55E', backgroundColor: '#22C55E', tension: 0.4, borderWidth: 2, pointRadius: 4, pointHoverRadius: 6 }
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
          {showYearControls && (
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
    const [tickets, setTickets] = useState([]);
    const [ticketYear, setTicketYear] = useState(new Date().getFullYear());
    const [ticketYRange, setTicketYRange] = useState('auto');
    const [, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [kbStats, setKbStats] = useState({ totalArticles: 0, totalCategories: 0 });
    const [indicator, setIndicator] = useState({ left: 0, width: 0 });
    const containerRef = useRef(null);
    const tabRefs = useRef([]);
    const navigate = useNavigate();

    const tabs = ['tickets', 'users', 'kb'];

    const updateIndicator = () => {
      const idx = tabs.indexOf(activeTab);
      const container = containerRef.current;
      const btn = tabRefs.current[idx];
      if (!container || !btn) return;
      const containerRect = container.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      setIndicator({ left: btnRect.left - containerRect.left, width: btnRect.width });
    };

    useEffect(() => { updateIndicator(); const onResize = () => updateIndicator(); window.addEventListener('resize', onResize); return () => window.removeEventListener('resize', onResize); }, [activeTab]);

    useEffect(() => {
      let isMounted = true;
      const fetchTickets = async () => {
        try {
          setLoading(true);
          const all = await backendTicketService.getAllTickets();
          if (!isMounted) return;
          setTickets(all || []);
        } catch (err) { console.error('Error fetching tickets for dashboard:', err); if (isMounted) setTickets([]); }
        finally { if (isMounted) setLoading(false); }
      };
      fetchTickets();
      return () => { isMounted = false; };
    }, []);

    useEffect(() => {
      let isMounted = true;
      const fetchUsers = async () => {
        try { const all = await backendEmployeeService.getAllEmployees(); if (!isMounted) return; setUsers(all || []); } catch (err) { console.error('Error fetching employees for dashboard:', err); if (isMounted) setUsers([]); }
      };
      fetchUsers();
      return () => { isMounted = false; };
    }, []);

    useEffect(() => {
      let isMounted = true;
      const fetchKBStats = async () => {
        try {
          const [articles, categories] = await Promise.all([ kbService.listArticles({}), kbService.listCategories() ]);
          if (!isMounted) return;
          const totalArticles = (articles || []).filter(a => !a.archived).length;
          const totalCategories = (categories || []).length;
          setKbStats({ totalArticles, totalCategories });
        } catch (err) { console.error('Error fetching KB stats for dashboard:', err); if (isMounted) setKbStats({ totalArticles: 0, totalCategories: 0 }); }
      };
      fetchKBStats();
      return () => { isMounted = false; };
    }, []);

    const computeTicketStats = () => {
      const counts = { New: 0, Open: 0, 'In Progress': 0, 'On Hold': 0, Withdrawn: 0, Closed: 0, Rejected: 0 };
      const ticketsToReview = [];
      const latestLogs = [];
      tickets.forEach(t => {
        const status = t.status || t.ticket_status || '';
        if (Object.prototype.hasOwnProperty.call(counts, status)) counts[status] += 1;
        if (status === 'New') ticketsToReview.push({ ticketNumber: t.ticket_number || t.ticketNumber, subject: t.subject, category: t.category, subCategory: t.sub_category || t.subCategory, status: { text: 'New', statusClass: 'statusNew' }, dateCreatedRaw: t.submit_date || t.dateCreated || null, dateCreated: (t.submit_date || t.dateCreated) ? new Date(t.submit_date || t.dateCreated).toLocaleString() : '' });
        let latest = null;
        if (Array.isArray(t.comments) && t.comments.length > 0) {
          latest = t.comments.reduce((a, b) => { const ta = new Date(a.created_at || a.created || a.time_created || a.time || 0).getTime(); const tb = new Date(b.created_at || b.created || b.time_created || b.time || 0).getTime(); return ta > tb ? a : b; });
        } else if (Array.isArray(t.dynamic_data) && t.dynamic_data.length > 0) {
          latest = t.dynamic_data.reduce((a, b) => { const ta = new Date(a.time || a.created_at || 0).getTime(); const tb = new Date(b.time || b.created_at || 0).getTime(); return ta > tb ? a : b; });
        }
        if (latest) {
          const time = new Date(latest.created_at || latest.created || latest.time_created || latest.time || latest.timestamp || null);
          latestLogs.push({ ticketNumber: t.ticket_number || t.ticketNumber, time: isNaN(time.getTime()) ? '' : time.toLocaleString(), timestamp: isNaN(time.getTime()) ? 0 : time.getTime(), action: latest.comment || latest.text || latest.action || latest.summary || 'Updated' });
        } else if (t.time_closed || t.submit_date || t.dateCreated) {
          const time = new Date(t.time_closed || t.submit_date || t.dateCreated || null);
          latestLogs.push({ ticketNumber: t.ticket_number || t.ticketNumber, time: isNaN(time.getTime()) ? '' : time.toLocaleString(), timestamp: isNaN(time.getTime()) ? 0 : time.getTime(), action: `Ticket ${t.ticket_number || t.ticketNumber} (${t.status || ''})` });
        }
      });
      ticketsToReview.sort((a, b) => { const ta = a.dateCreatedRaw ? new Date(a.dateCreatedRaw).getTime() : 0; const tb = b.dateCreatedRaw ? new Date(b.dateCreatedRaw).getTime() : 0; return tb - ta; });
      const ticketsToReviewClean = ticketsToReview.map(obj => { const copy = { ...obj }; delete copy.dateCreatedRaw; return copy; });
      latestLogs.sort((a, b) => b.timestamp - a.timestamp);
      const formatShortTime = (timeStr, timestamp) => { const d = timestamp && timestamp > 0 ? new Date(timestamp) : new Date(timeStr); if (isNaN(d.getTime())) return ''; let hours = d.getHours(); const minutes = d.getMinutes(); const ampm = hours >= 12 ? 'PM' : 'AM'; hours = hours % 12; if (hours === 0) hours = 12; return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`; };
      const activities = latestLogs.slice(0, 4).map(l => ({ time: formatShortTime(l.time, l.timestamp), action: l.action }));
      const stats = ticketPaths.map(p => ({ label: p.label, count: p.label === 'New Tickets' ? counts['New'] : p.label === 'Open Tickets' ? counts['Open'] : p.label === 'In Progress Tickets' ? counts['In Progress'] : p.label === 'On Hold Tickets' ? counts['On Hold'] : 0, isHighlight: false, position: 0, path: p.path }));
      const pieData = [ { name: 'New', value: counts['New'], fill: '#1E90FF' }, { name: 'Open', value: counts['Open'], fill: '#14B8A6' }, { name: 'In Progress', value: counts['In Progress'], fill: '#FB923C' }, { name: 'On Hold', value: counts['On Hold'], fill: '#A855F7' }, { name: 'Withdrawn', value: counts['Withdrawn'], fill: '#9CA3AF' }, { name: 'Closed', value: counts['Closed'], fill: '#2563EB' }, { name: 'Rejected', value: counts['Rejected'], fill: '#EF4444' } ];

      // Build year->month buckets
      const yearMonthMap = {};
      tickets.forEach(t => { const d = new Date(t.submit_date || t.dateCreated || Date.now()); const y = d.getFullYear(); const m = d.getMonth(); yearMonthMap[y] = yearMonthMap[y] || {}; yearMonthMap[y][m] = yearMonthMap[y][m] || { submitted: 0, closed: 0 }; yearMonthMap[y][m].submitted += 1; if (t.status === 'Closed') yearMonthMap[y][m].closed += 1; });
      const months = {};
      Object.keys(yearMonthMap).forEach(y => { Object.keys(yearMonthMap[y]).forEach(mIdx => { const key = new Date(Number(y), Number(mIdx), 1).toLocaleString('en-US', { month: 'short', year: 'numeric' }); months[key] = yearMonthMap[y][mIdx]; }); });
      const lineData = Object.keys(months).map(m => ({ month: m, dataset1: months[m].submitted, dataset2: months[m].closed }));
      return { stats, tableData: ticketsToReviewClean, pieData, lineData, activities };
    };

    const ticketData = computeTicketStats();

    const buildMonthlyDataForYear = (year) => {
      const monthsArr = Array.from({ length: 12 }).map((_, i) => ({ month: new Date(year, i, 1).toLocaleString('en-US', { month: 'short' }), dataset1: 0, dataset2: 0 }));
      tickets.forEach(t => { const d = new Date(t.submit_date || t.dateCreated || Date.now()); const y = d.getFullYear(); if (y !== year) return; const m = d.getMonth(); monthsArr[m].dataset1 += 1; if (t.status === 'Closed') monthsArr[m].dataset2 += 1; });
      return monthsArr;
    };

    const computeUserData = () => {
      const fetched = Array.isArray(users) ? users : [];
      const pendingUsers = fetched.filter(u => (u.status || '').toLowerCase() === 'pending');
      const pendingEmployees = pendingUsers.filter(u => (u.role || '').toLowerCase() === 'employee');
      const stats = [{ label: 'Pending Users', count: pendingUsers.length, isHighlight: false, position: 0, path: userPaths.find(p => p.label === 'Pending Accounts')?.path }];
      const tableData = pendingEmployees.map(u => ({ companyId: u.company_id || u.companyId || u.id || '', lastName: u.last_name || u.lastName || '', firstName: u.first_name || u.firstName || '', department: u.department || '', role: u.role || '', status: { text: 'Pending', statusClass: 'statusPending' } }));
      const pieData = [ { name: 'Active Users', value: fetched.filter(u => (u.status || '').toLowerCase() === 'approved').length, fill: '#22C55E' }, { name: 'Pending', value: pendingUsers.length, fill: '#FBBF24' }, { name: 'Rejected', value: fetched.filter(u => (u.status || '').toLowerCase() === 'rejected').length, fill: '#EF4444' }, { name: 'Inactive', value: fetched.filter(u => (u.status || '').toLowerCase() === 'inactive').length, fill: '#9CA3AF' } ];
      const allLogs = [];
      fetched.forEach(u => { const logs = Array.isArray(u.recent_logs) ? u.recent_logs : []; logs.forEach(l => { const ts = l.timestamp || l.time || l.created_at || null; let numericTs = 0; try { if (ts) { const parsed = Date.parse(ts); numericTs = !isNaN(parsed) ? parsed : new Date(ts).getTime(); if (isNaN(numericTs)) numericTs = 0; } } catch (err) { void err; numericTs = 0; } allLogs.push({ employee: u, action: l.action || l.details || 'Updated', details: l.details || '', performed_by: l.performed_by || null, timestamp: numericTs }); }); });
      allLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      const formatShortTime = (ts) => { const d = ts ? new Date(ts) : null; if (!d || isNaN(d.getTime())) return ''; let hours = d.getHours(); const minutes = d.getMinutes(); const ampm = hours >= 12 ? 'PM' : 'AM'; hours = hours % 12; if (hours === 0) hours = 12; return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`; };
      const companyIdToUser = {}; fetched.forEach(u => { if (u.company_id) companyIdToUser[u.company_id] = u; if (u.companyId) companyIdToUser[u.companyId] = u; });
      const activities = allLogs.slice(0, 4).map(l => { const emp = l.employee || {}; const empCompanyId = emp.company_id || emp.companyId || emp.id || ''; let actionText = ''; const actionNormalized = (l.action || '').toString().toLowerCase(); if (actionNormalized === 'created' || actionNormalized === 'account created') { actionText = empCompanyId ? `User ${empCompanyId} account created` : 'Account created'; } else if (actionNormalized === 'approved' || actionNormalized === 'account approved') { actionText = empCompanyId ? `User ${empCompanyId} account approved` : 'Account approved'; } else if (actionNormalized === 'rejected' || actionNormalized === 'account rejected') { actionText = empCompanyId ? `User ${empCompanyId} account rejected` : 'Account rejected'; } else { actionText = l.action || l.details || 'Updated'; } return { time: formatShortTime(l.timestamp), action: actionText }; });
      const lineData = [ { month: 'Jan', dataset1: 12, dataset2: 8 }, { month: 'Feb', dataset1: 18, dataset2: 15 }, { month: 'Mar', dataset1: 22, dataset2: 18 }, { month: 'Apr', dataset1: 28, dataset2: 25 }, { month: 'May', dataset1: 35, dataset2: 30 }, { month: 'Jun', dataset1: 40, dataset2: 38 } ];
      return { stats, tableData, pieData, lineData, activities };
    };

    const userData = computeUserData();

    const activityTimeline = [ { time: '10:30 AM', action: 'Ticket TX0001 submitted', type: 'ticket' }, { time: '11:00 AM', action: 'User MAP0001 account created', type: 'user' }, { time: '02:15 PM', action: 'Ticket TX0002 resolved', type: 'ticket' }, { time: '04:20 PM', action: 'User MAP0001 approved by Admin', type: 'user' } ];

    const userActivityTimeline = [ { time: '09:15 AM', action: 'User MAP0002 account created', type: 'user' }, { time: '10:45 AM', action: 'User MAP0003 account rejected', type: 'user' }, { time: '01:20 PM', action: 'User MAP0004 approved by Admin', type: 'user' }, { time: '03:05 PM', action: 'User MAP0005 role updated', type: 'user' } ];

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
          <div className={styles.tabContainer} ref={containerRef} role="tablist" aria-label="Dashboard Tabs">
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab;
              return (<button key={tab} ref={(el) => (tabRefs.current[idx] = el)} role="tab" aria-selected={isActive} tabIndex={isActive ? 0 : -1} onClick={() => setActiveTab(tab)} className={`${styles.tab} ${isActive ? styles.tabActive : styles.tabInactive}`}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>);
            })}
            <div className={styles.tabIndicator} style={{ left: indicator.left, width: indicator.width }} aria-hidden="true" />
          </div>

          <div className={styles.tabContent}>
            <div className={styles.statusCardsGrid}>
              {activeTab === 'kb' ? [ { label: 'Articles', count: kbStats.totalArticles }, { label: 'Categories', count: kbStats.totalCategories } ].map((stat, i) => (<StatCard key={i} label={stat.label} count={stat.count} onClick={() => {}} />)) : (activeTab === 'tickets' ? ticketData.stats : userData.stats).map((stat, i) => (<StatCard key={i} {...stat} onClick={() => stat.path && navigate(stat.path)} />))}
            </div>

            {activeTab === 'kb' ? (<div style={{ padding: 12 }}><KnowledgeDashboard /></div>) : (<>
              <DataTable title={activeTab === 'tickets' ? 'Tickets to Review' : 'User Approval'} buttonText={activeTab === 'tickets' ? 'Manage Tickets' : 'Manage Users'} headers={activeTab === 'tickets' ? ['Ticket Number', 'Subject', 'Category', 'Sub-Category', 'Status', 'Date Created'] : ['Company ID', 'Last Name', 'First Name', 'Department', 'Role', 'Status']} data={activeTab === 'tickets' ? ticketData.tableData : userData.tableData} onButtonClick={() => navigate(activeTab === 'tickets' ? '/admin/ticket-management/all-tickets' : '/admin/user-access/all-users')} maxRows={activeTab === 'tickets' ? 5 : activeTab === 'users' ? 6 : undefined} lockLeftCount={activeTab === 'users' ? 6 : undefined} />

              <div className={chartStyles.chartsGrid}>
                <StatusPieChart data={activeTab === 'tickets' ? ticketData.pieData : userData.pieData} title={activeTab === 'tickets' ? 'Ticket Status' : 'User Status'} activities={activeTab === 'tickets' ? ticketData.activities || activityTimeline : (userData.activities || userActivityTimeline)} />
                <TrendLineChart data={activeTab === 'tickets' ? buildMonthlyDataForYear(ticketYear) : userData.lineData} title={activeTab === 'tickets' ? 'Tickets per Month' : 'Users per Month'} isTicketChart={activeTab === 'tickets'} showYearControls={activeTab === 'tickets'} year={ticketYear} onPrevYear={() => setTicketYear(y => y - 1)} onNextYear={() => setTicketYear(y => y + 1)} yRange={ticketYRange} onYRangeChange={(v) => setTicketYRange(v)} />
              </div>
            </>)}
          </div>
        </div>
      </div>
    );
  };

  export default CoordinatorAdminDashboard;
