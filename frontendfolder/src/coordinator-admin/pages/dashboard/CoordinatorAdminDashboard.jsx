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

const ticketPaths = [
  { label: "New Tickets", path: "/admin/ticket-management/new-tickets" },
  { label: "Open Tickets", path: "/admin/ticket-management/open-tickets" },
  { label: "In Progress Tickets", path: "/admin/ticket-management/in-progress-tickets" },
  { label: "On Hold Tickets", path: "/admin/ticket-management/on-hold-tickets" }
];

const userPaths = [
  { label: "All Users", path: "/admin/user-access/all-users" },
  { label: "Employees", path: "/admin/user-access/employees" },
  { label: "Ticket Coordinators", path: "/admin/user-access/ticket-coordinators" },
  { label: "System Administrators", path: "/admin/user-access/system-admins" },
  { label: "Pending Accounts", path: "/admin/user-access/pending-users" },
  { label: "Rejected Accounts", path: "/admin/user-access/rejected-users" },
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
      'Pending Users': 'statBadgePending'
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

const DataTable = ({ title, headers, data, buttonText, onButtonClick }) => (
  <div className={tableStyles.tableContainer}>
    <div className={tableStyles.tableHeader}>
      <h3 className={tableStyles.tableTitle}>{title}</h3>
      <button className={tableStyles.button} onClick={onButtonClick}>{buttonText}</button>
    </div>

    <div className={tableStyles.tableOverflow}>
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
          No records found. Click "{buttonText}" to add items.
        </div>
      )}
    </div>
  </div>
);

const StatusPieChart = ({ data, title, activities }) => {
  // Transform data for Chart.js
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
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };

  return (
    <div className={chartStyles.chartContainer}>
      <h3 className={chartStyles.chartTitle}>{title}</h3>

      <div className={chartStyles.chartContentRow}>
        {/* Pie Chart */}
        <div style={{ width: '300px', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Pie data={chartData} options={options} />
        </div>

        {/* Activity Timeline */}
        {activities && (
          <ul className={chartStyles.timelineList}>
            {activities.map((item, i) => (
              <li key={i} className={chartStyles.timelineItem}>
                <span className={chartStyles.timelineTime}>{item.time}</span>
                <span className={chartStyles.timelineAction}>{item.action}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button className={chartStyles.browseButton}>Browse All</button>
    </div>
  );
};

const TrendLineChart = ({ data, title, isTicketChart = true }) => {
  // Transform data for Chart.js
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
      <div className={chartStyles.chartContent} style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

// === Main Component ===
const CoordinatorAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const containerRef = useRef(null);
  const tabRefs = useRef([]);
  const navigate = useNavigate();

  const tabs = ['tickets', 'users'];

  // Measure and position the sliding indicator under the active tab
  const updateIndicator = () => {
    const idx = tabs.indexOf(activeTab);
    const container = containerRef.current;
    const btn = tabRefs.current[idx];
    if (!container || !btn) return;
    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - containerRect.left,
      width: btnRect.width
    });
  };

  useEffect(() => {
    updateIndicator();
    const onResize = () => updateIndicator();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const ticketData = {
    stats: ticketPaths.map((item, i) => ({
      label: item.label,
      count: 5,
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
    pieData: [
      { name: 'New', value: 15, fill: '#1E90FF' },           // Blue
      { name: 'Open', value: 25, fill: '#14B8A6' },          // Teal
      { name: 'In Progress', value: 20, fill: '#FB923C' },   // Orange
      { name: 'On Hold', value: 10, fill: '#A855F7' },       // Purple
      { name: 'Withdrawn', value: 8, fill: '#9CA3AF' },      // Gray
      { name: 'Closed', value: 12, fill: '#2563EB' },        // Dark Blue
      { name: 'Rejected', value: 5, fill: '#EF4444' }        // Red
    ],
    lineData: [
      { month: 'Jan', dataset1: 45, dataset2: 38 },
      { month: 'Feb', dataset1: 52, dataset2: 45 },
      { month: 'Mar', dataset1: 48, dataset2: 42 },
      { month: 'Apr', dataset1: 60, dataset2: 55 },
      { month: 'May', dataset1: 58, dataset2: 50 },
      { month: 'Jun', dataset1: 65, dataset2: 60 }
    ]
  };

  const userData = {
    // Only include Pending Users as requested
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

  const activityTimeline = [
    { time: "10:30 AM", action: "Ticket TX0001 submitted", type: "ticket" },
    { time: "11:00 AM", action: "User MAP0001 account created", type: "user" },
    { time: "02:15 PM", action: "Ticket TX0002 resolved", type: "ticket" },
    { time: "04:20 PM", action: "User MAP0001 approved by Admin", type: "user" },
  ];

  const userActivityTimeline = [
    { time: "09:15 AM", action: "User MAP0002 account created", type: "user" },
    { time: "10:45 AM", action: "User MAP0003 account rejected", type: "user" },
    { time: "01:20 PM", action: "User MAP0004 approved by Admin", type: "user" },
    { time: "03:05 PM", action: "User MAP0005 role updated", type: "user" },
  ];

  const ActivityTimeline = ({ activities }) => (
    <div className={chartStyles.timelineContainer}>
      <h3 className={chartStyles.chartTitle}>Activity Timeline</h3>
      <ul className={chartStyles.timelineList}>
        {activities.map((item, i) => (
          <li key={i} className={chartStyles.timelineItem}>
            <span className={chartStyles.timelineTime}>{item.time}</span>
            <span className={chartStyles.timelineAction}>{item.action}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        <h1 className={styles.title}>Dashboard</h1>

        {/* Tabs with sliding underline and keyboard navigation */}
        <div
          className={styles.tabContainer}
          ref={containerRef}
          role="tablist"
          aria-label="Dashboard Tabs"
        >
          {tabs.map((tab, idx) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                ref={(el) => (tabRefs.current[idx] = el)}
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => setActiveTab(tab)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowRight') {
                    const next = (idx + 1) % tabs.length;
                    tabRefs.current[next]?.focus();
                    setActiveTab(tabs[next]);
                  } else if (e.key === 'ArrowLeft') {
                    const prev = (idx - 1 + tabs.length) % tabs.length;
                    tabRefs.current[prev]?.focus();
                    setActiveTab(tabs[prev]);
                  } else if (e.key === 'Home') {
                    tabRefs.current[0]?.focus();
                    setActiveTab(tabs[0]);
                  } else if (e.key === 'End') {
                    tabRefs.current[tabs.length - 1]?.focus();
                    setActiveTab(tabs[tabs.length - 1]);
                  }
                }}
                className={`${styles.tab} ${isActive ? styles.tabActive : styles.tabInactive}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            );
          })}

          {/* Sliding underline indicator */}
          <div
            className={styles.tabIndicator}
            style={{ left: indicator.left, width: indicator.width }}
            aria-hidden="true"
          />
        </div>


        <div className={styles.tabContent}>
          <div className={styles.statusCardsGrid}>
            {(activeTab === 'tickets' ? ticketData.stats : userData.stats).map((stat, i) => (
              <StatCard
                key={i}
                {...stat}
                onClick={() => stat.path && navigate(stat.path)}
              />
            ))}
          </div>

          <DataTable
            title={activeTab === 'tickets' ? 'Tickets to Review' : 'User Approval'}
            buttonText={activeTab === 'tickets' ? 'Manage Tickets' : 'Manage Users'}
            headers={
              activeTab === 'tickets'
                ? ['Ticket Number', 'Subject', 'Category', 'Sub-Category', 'Status', 'Date Created']
                : ['Company ID', 'Last Name', 'First Name', 'Department', 'Role', 'Status']
            }
            data={activeTab === 'tickets' ? ticketData.tableData : userData.tableData}
            onButtonClick={() =>
              navigate(
                activeTab === 'tickets'
                  ? '/admin/ticket-management/all-tickets'
                  : '/admin/users/all-users'
              )
            }
          />

          <div className={chartStyles.chartsGrid}>
            <StatusPieChart
              data={activeTab === 'tickets' ? ticketData.pieData : userData.pieData}
              title={activeTab === 'tickets' ? 'Ticket Status' : 'User Status'}
              activities={activeTab === 'tickets' ? activityTimeline : userActivityTimeline}
            />
            <TrendLineChart
              data={activeTab === 'tickets' ? ticketData.lineData : userData.lineData}
              title={activeTab === 'tickets' ? 'Tickets per Month' : 'Users per Month'}
              isTicketChart={activeTab === 'tickets'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorAdminDashboard;
