import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pie, Line } from 'react-chartjs-2';
import chartStyles from './CoordinatorAdminDashboardCharts.module.css';
import tableStyles from './CoordinatorAdminDashboardTable.module.css';
import statCardStyles from './CoordinatorAdminDashboardStatusCards.module.css';
import styles from './CoordinatorAdminDashboard.module.css';
import authService from '../../../utilities/service/authService';
import { getAllTickets } from '../../../utilities/storages/ticketStorage';

const ticketPaths = [
  { label: "New Tickets", path: "/admin/ticket-management/new-tickets" },
  { label: "Pending Tickets", path: "/admin/ticket-management/pending-tickets" },
  { label: "Open Tickets", path: "/admin/ticket-management/open-tickets" },
  { label: "In Progress Tickets", path: "/admin/ticket-management/in-progress-tickets" },
  { label: "On Hold Tickets", path: "/admin/ticket-management/on-hold-tickets" }
];

const StatCard = ({ label, count, isHighlight, position, onClick, statusType }) => {
  const getStatusClass = (label) => {
    const statusMap = {
      'New Tickets': 'statBadgeNew',
      'Open Tickets': 'statBadgeOpen', 
      'In Progress Tickets': 'statBadgeInProgress',
      'On Hold Tickets': 'statBadgeOnHold',
      'Pending Tickets': 'statBadgePending'
    };
    return statusMap[label] || (isHighlight ? 'statBadgeRed' : 'statBadgeBlue');
  };

  return (
    <div
      className={`${styles.statusCard} ${statCardStyles.statusCard} ${statCardStyles[`card-position-${position}`]}`}
      onClick={onClick}
    >
      <div className={`${styles.statCardContent} ${statCardStyles.statCardContent}`}>
        <div className={`${styles.statBadge} ${statCardStyles.statBadge} ${statCardStyles[getStatusClass(label)]}`}>
          {count}
        </div>
        <span className={`${styles.statLabel} ${statCardStyles.statLabel}`}>{label}</span>
      </div>
    </div>
  );
};

const DataTable = ({ title, headers, data, onRowClick }) => (
  <div className={tableStyles.tableSection}>
    <div className={tableStyles.tableHeader}>
      <h2>{title}</h2>
    </div>

    {/* Single table with sticky header inside scrollable wrapper (keeps columns perfectly aligned) */}
    <div className={tableStyles.tableWrapper}>
      {data.length > 0 ? (
        <table className={tableStyles.table}>
          <thead>
            <tr>
              {headers.map((header, idx) => (
                <th key={idx}>{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={i}
                onClick={() => onRowClick && onRowClick(row)}
                style={{ cursor: onRowClick ? 'pointer' : 'default' }}
              >
                {Object.values(row).map((cell, j) => (
                  <td key={j}>
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

const StatusPieChart = ({ data, title, activities, pieRange, setPieRange, isAdmin, onBrowse }) => {
  const Button = ({ variant, className, onClick, children }) => (
    <button
      className={className}
      onClick={onClick}
      style={{
        padding: '8px 16px',
        backgroundColor: variant === 'primary' ? '#3B82F6' : '#fff',
        color: variant === 'primary' ? '#fff' : '#000',
        border: '1px solid #e5e7eb',
        borderRadius: '6px',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );

  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: title,
        data: data.map(item => item.value),
        backgroundColor: data.map(item => item.fill),
        borderWidth: 1,
        borderColor: '#fff',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
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
        <div className={chartStyles.statusColumn}>
          {data.map((d, idx) => (
            <div key={idx} className={chartStyles.statusItem}>
              <span className={chartStyles.statusSwatch} style={{ background: d.fill }} />
              <span>{d.name}</span>
            </div>
          ))}
        </div>

        <div data-pie-area style={{ width: '320px', height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center', maxWidth: '100%' }}>
          <Pie data={chartData} options={options} />
        </div>

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

const TrendLineChart = ({ data, title, isTicketChart = true }) => {
  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: isTicketChart ? 'Submitted Tickets' : 'New Users',
        data: data.map(item => item.dataset1),
        fill: false,
        borderColor: '#3e506cff',
        backgroundColor: '#3e506cff',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: isTicketChart ? 'Closed Tickets' : 'Active Users',
        data: data.map(item => item.dataset2),
        fill: false,
        borderColor: '#22C55E',
        backgroundColor: '#22C55E',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className={chartStyles.chartContainer}>
      <h3 className={chartStyles.chartTitle}>{title}</h3>
      <div className={chartStyles.chartContent} style={{ height: '220px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

const TicketsTab = ({ chartRange, setChartRange, pieRange, setPieRange, initialTickets = null, visibleStatLabels = null, allowedPieStatuses = null, tableTitle = null }) => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const [ticketDataState, setTicketDataState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const activeTicketPaths = visibleStatLabels && Array.isArray(visibleStatLabels)
    ? visibleStatLabels.map((label, i) => ({ label, path: null, position: i }))
    : ticketPaths;

  const ticketData = ticketDataState || {
    stats: activeTicketPaths.map((item, i) => ({
      label: item.label,
      count: 0,
      isHighlight: i >= 7,
      position: i,
      path: item.path
    })),
    tableData: [
      {
        ticketNumber: 'TX0001',
        subject: 'Asset Replacement',
        category: 'IT Support',
        subCategory: 'Hardware',
        status: { text: 'Open', statusClass: 'statusOpen' },
        dateCreated: '06/12/2025 11:00AM'
      },
      {
        ticketNumber: 'TX0002',
        subject: 'Network Problem',
        category: 'IT Support',
        subCategory: 'Network Issue',
        status: { text: 'New', statusClass: 'statusNew' },
        dateCreated: '06/11/2025 1:05PM'
      },
      {
        ticketNumber: 'TX0003',
        subject: 'Software License Request',
        category: 'IT Support',
        subCategory: 'Software',
        status: { text: 'In Progress', statusClass: 'statusInProgress' },
        dateCreated: '06/10/2025 9:20AM'
      },
      {
        ticketNumber: 'TX0004',
        subject: 'Email Issue',
        category: 'IT Support',
        subCategory: 'Email',
        status: { text: 'On Hold', statusClass: 'statusOnHold' },
        dateCreated: '06/09/2025 2:45PM'
      },
      {
        ticketNumber: 'TX0005',
        subject: 'Password Reset',
        category: 'IT Support',
        subCategory: 'Account',
        status: { text: 'New', statusClass: 'statusNew' },
        dateCreated: '06/08/2025 8:15AM'
      }
    ],
    pieData: [],
    lineData: [],
  };

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
    if (s.includes('resolved')) return 'Resolved';
    if (s.includes('closed')) return 'Closed';
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

  const filterByRole = (tickets) => {
    if (currentUser?.role === 'Ticket Coordinator') {
      return tickets.filter(t => t.assignedTo === currentUser.id || t.reviewedById === currentUser.id || t.assignedToName === currentUser?.name);
    }
    return tickets;
  };

  const aggregatePie = (tickets) => {
    const buckets = {
      New: 0,
      Pending: 0,
      Open: 0,
      'In Progress': 0,
      'On Hold': 0,
      Withdrawn: 0,
      Resolved: 0,
      Closed: 0,
      Rejected: 0,
    };
    tickets.forEach(t => {
      const s = computeEffectiveStatus(t);
      if (buckets[s] !== undefined) {
        buckets[s] += 1;
      } else {
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
      Resolved: '#8B5CF6',
      Closed: '#10B981'
    };
    const displayMap = {
      New: 'New Tickets',
      Pending: 'Pending Tickets',
      Open: 'Open Tickets',
      'In Progress': 'In Progress Tickets',
      'On Hold': 'On Hold Tickets',
      Withdrawn: 'Withdrawn',
      Resolved: 'Resolved',
      Closed: 'Closed',
      Rejected: 'Rejected',
    };

    const full = Object.keys(buckets).map(name => ({ key: name, name: displayMap[name] || name, value: buckets[name], fill: colorMap[name] || '#9CA3AF' }));
    if (Array.isArray(allowedPieStatuses) && allowedPieStatuses.length > 0) {
      return full.filter(item => allowedPieStatuses.includes(item.key));
    }
    return full;
  };

  const formatMonthLabel = (d) => d.toLocaleString(undefined, { month: 'short' });

  const aggregateLine = (tickets, range = 'month') => {
    const now = new Date();
    if (range === 'days') {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const all = initialTickets || getAllTickets();
        const filtered = filterByRole(all);

        // Build stats from the active ticket paths (respect visibleStatLabels when provided)
        const stats = activeTicketPaths.map((p, i) => ({ label: p.label, count: 0, path: p.path || null, position: i }));
        filtered.forEach(t => {
          const s = computeEffectiveStatus(t);
          const mapLabel = activeTicketPaths.find(p => p.label.toLowerCase().startsWith(s.toLowerCase()));
          if (mapLabel) {
            const target = stats.find(st => st.label === mapLabel.label);
            if (target) target.count += 1;
          }
        });

            const pie = aggregatePie(filtered.concat());
            const line = aggregateLine(filtered.concat(), currentUser?.role === 'System Admin' && chartRange === 'yearly' ? 'yearly' : chartRange);

            // Derive activity timeline from the filtered tickets so each tab shows its own logs
            const deriveActivities = (tickets) => {
              const rows = (tickets || []).slice().map(t => ({
                ticketNumber: t.ticketNumber || t.ticket_number || t.id || '',
                status: computeEffectiveStatus(t),
                time: t.createdAt || t.dateCreated || t.created_on || t.createdAtTimestamp || null
              }));
              rows.sort((a, b) => {
                const da = a.time ? new Date(a.time).getTime() : 0;
                const db = b.time ? new Date(b.time).getTime() : 0;
                return db - da;
              });
              return rows.slice(0, 5).map(r => ({ time: r.time ? new Date(r.time).toLocaleString() : '', action: `Ticket ${r.ticketNumber} ${r.status}`, type: 'ticket' }));
            };

            const activities = deriveActivities(filtered);

        const mapStatusClass = (status) => {
          const s = (status || '').toString().toLowerCase();
          if (s.includes('new')) return 'statusNew';
          if (s.includes('pending')) return 'statusPending';
          if (s.includes('open')) return 'statusOpen';
          if (s.includes('in progress') || s.includes('inprogress')) return 'statusInProgress';
          if (s.includes('on hold') || s.includes('on-hold')) return 'statusOnHold';
          if (s.includes('withdraw')) return 'statusWithdrawn';
          if (s.includes('resolved')) return 'statusResolved';
          if (s.includes('closed')) return 'statusClosed';
          if (s.includes('rejected')) return 'statusRejected';
          return 'statusDefault';
        };

        const toTableRow = (t) => {
          const statusText = computeEffectiveStatus(t);
          const date = t.createdAt || t.dateCreated || t.date_created || t.createdOn || null;
          let dateStr = '';
          try {
            const d = date ? new Date(date) : null;
            dateStr = d && !isNaN(d.getTime()) ? d.toLocaleString() : (date || '');
          } catch (e) {
            dateStr = date || '';
          }
          return {
            ticketNumber: t.ticketNumber || t.ticket_number || t.id || '',
            subject: t.subject || t.title || '',
            category: t.category || t.ticketCategory || '',
            subCategory: t.subCategory || t.sub_category || '',
            status: { text: statusText, statusClass: mapStatusClass(statusText) },
            dateCreated: dateStr
          };
        };

        const onRowClick = (row) => {
          const id = row.ticketNumber || row.ticket_number || row.id || '';
          if (!id) return;
          // If this instance was given initialTickets, assume it's My Tickets and use owned route
          if (initialTickets) {
            navigate(`/admin/owned-tickets/${id}`);
          } else {
            // Default to ticket tracker/detail route
            navigate(`/admin/ticket-tracker/${id}`);
          }
        };

        setTicketDataState({
          stats,
          tableData: filtered.map(toTableRow),
          pieData: pie,
          lineData: line,
          activityTimeline: activities,
          onRowClick
        });
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading tickets for dashboard', err);
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [currentUser, chartRange, pieRange, initialTickets, visibleStatLabels]);

  // activityTimeline is generated per-data and stored in ticketDataState.activityTimeline
  const activityTimeline = ticketData.activityTimeline || [];

  return (
    <>
      <div className={styles.statusCardsGrid} style={{ marginTop: 12 }}>
        {ticketData.stats.map((stat, i) => (
          <StatCard
            key={i}
            {...stat}
            onClick={() => stat.path && navigate(stat.path)}
          />
        ))}
      </div>

      <DataTable
        title={tableTitle || 'Tickets to Review'}
        headers={['Ticket Number', 'Subject', 'Category', 'Sub-Category', 'Status', 'Date Created']}
        data={ticketData.tableData}
        onRowClick={ticketData.onRowClick}
      />

      <div style={{ position: 'relative', marginTop: 12 }}>
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <select
            value={chartRange}
            onChange={(e) => setChartRange(e.target.value)}
            style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}
          >
            <option value="days">Days</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            {currentUser?.role === 'System Admin' && <option value="yearly">Yearly</option>}
          </select>
        </div>

        <div className={chartStyles.chartsGrid}>
          <StatusPieChart
            data={ticketData.pieData}
            title="Ticket Status"
            activities={activityTimeline}
            pieRange={pieRange}
            setPieRange={setPieRange}
            isAdmin={currentUser?.role === 'System Admin'}
            onBrowse={() => navigate('/admin/ticket-management/all-tickets')}
          />
          <TrendLineChart
            data={(() => {
              const source = ticketData.lineData;
              if (chartRange === 'days') return source.slice(-7);
              if (chartRange === 'week') return source.slice(-4);
              return source;
            })()}
            title="Tickets per Period"
            isTicketChart={true}
          />
        </div>
      </div>
    </>
  );
};

export default TicketsTab;
