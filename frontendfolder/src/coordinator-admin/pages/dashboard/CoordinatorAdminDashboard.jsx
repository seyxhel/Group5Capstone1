import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

import styles from './CoordinatorAdminDashboard.module.css';
import statCardStyles from './CoordinatorAdminDashboardStatusCards.module.css';
import tableStyles from './CoordinatorAdminDashboardTable.module.css';
import chartStyles from './CoordinatorAdminDashboardCharts.module.css';

const ticketPaths = [
  { label: "New Tickets", path: "/admin/ticket-management/new-tickets" },
  { label: "Open Tickets", path: "/admin/ticket-management/open-tickets" },
  { label: "On Process Tickets", path: "/admin/ticket-management/on-progress-tickets" },
  { label: "On hold Tickets", path: "/admin/ticket-management/on-hold-tickets" },
  { label: "Pending Tickets", path: "/admin/ticket-management/pending-tickets" },
  { label: "Resolved Tickets", path: "/admin/ticket-management/resolved-tickets" },
  { label: "Closed Tickets", path: "/admin/ticket-management/closed-tickets" },
  { label: "Rejected Tickets", path: "/admin/ticket-management/rejected-tickets" },
  { label: "Withdrawn Tickets", path: "/admin/ticket-management/withdrawn-tickets" },
  { label: "Total Tickets", path: "/admin/ticket-management/all-tickets" }
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
const StatCard = ({ label, count, isHighlight, position, onClick }) => (
  <div
    className={`${styles.statusCard} ${statCardStyles.statusCard} ${statCardStyles[`card-position-${position}`]}`}
    onClick={onClick}
  >
    <div className={`${styles.statCardContent} ${statCardStyles.statCardContent}`}>
      <div className={`${styles.statBadge} ${statCardStyles.statBadge} ${isHighlight ? statCardStyles.statBadgeRed : statCardStyles.statBadgeBlue}`}>
        {count}
      </div>
      <span className={`${styles.statLabel} ${statCardStyles.statLabel}`}>{label}</span>
    </div>
  </div>
);

const DataTable = ({ title, headers, data, buttonText, onButtonClick }) => (
  <div className={tableStyles.tableContainer}>
    <div className={tableStyles.tableHeader}>
      <h3 className={tableStyles.tableTitle}>{title}</h3>
      <button className={tableStyles.button} onClick={onButtonClick}>{buttonText}</button>
    </div>
    <div className={tableStyles.tableOverflow}>
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
    </div>
  </div>
);

const StatusPieChart = ({ data, title }) => (
  <div className={chartStyles.chartContainer}>
    <h3 className={chartStyles.chartTitle}>{title}</h3>
    <div className={chartStyles.chartContent}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" cx="50%" cy="50%" outerRadius={80}>
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <button className={chartStyles.browseButton}>Browse All</button>
  </div>
);

const TrendLineChart = ({ data, title }) => (
  <div className={chartStyles.chartContainer}>
    <h3 className={chartStyles.chartTitle}>{title}</h3>
    <div className={chartStyles.chartContent}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="dataset1" stroke="#3B82F6" strokeWidth={2} />
          <Line type="monotone" dataKey="dataset2" stroke="#EF4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// === Main Component ===
const CoordinatorAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const navigate = useNavigate();

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
        status: { text: 'Submitted', statusClass: 'statusSubmitted' },
        dateCreated: '06/11/2025 1:05PM'
      }
    ],
    pieData: [
      { name: 'Submitted', value: 15, fill: '#6B7280' },
      { name: 'Open', value: 25, fill: '#3B82F6' },
      { name: 'Pending', value: 20, fill: '#F59E0B' },
      { name: 'Resolved', value: 18, fill: '#10B981' },
      { name: 'Closed', value: 12, fill: '#8B5CF6' }
    ],
    lineData: [
      { month: 'Jan', dataset1: 800, dataset2: 600 },
      { month: 'Feb', dataset1: 600, dataset2: 400 },
      { month: 'Mar', dataset1: 700, dataset2: 500 },
      { month: 'Apr', dataset1: 500, dataset2: 800 },
      { month: 'May', dataset1: 900, dataset2: 700 },
      { month: 'Jun', dataset1: 400, dataset2: 300 }
    ]
  };

  const userData = {
    stats: [
      "All Users", "Employees", "Ticket Coordinators", "System Administrators",
      "Pending Accounts", "Rejected Accounts"
    ].map((label, i) => ({
      label,
      count: 5,
      isHighlight: i >= 4,
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
      { name: 'Employees', value: 30, fill: '#3B82F6' },
      { name: 'Coordinator', value: 25, fill: '#F59E0B' },
      { name: 'Admin', value: 20, fill: '#10B981' },
      { name: 'Pending', value: 15, fill: '#EF4444' },
      { name: 'Rejected', value: 10, fill: '#8B5CF6' }
    ]
  };

  // Compute stats from allUsers
  const employees = allUsers.filter(u => u.role === "Employee");
  const coordinators = allUsers.filter(u => u.role === "Ticket Coordinator");
  const admins = allUsers.filter(u => u.role === "System Admin");
  const pendingAccounts = allUsers.filter(u => u.status === "Pending");
  const rejectedAccounts = allUsers.filter(u => u.status === "Denied");

  const accountsPieData = [
    { name: 'Employees', value: employees.length, fill: '#3B82F6' },
    { name: 'Coordinator', value: coordinators.length, fill: '#F59E0B' },
    { name: 'Admin', value: admins.length, fill: '#10B981' },
    { name: 'Pending', value: pendingAccounts.length, fill: '#EF4444' },
    { name: 'Rejected', value: rejectedAccounts.length, fill: '#8B5CF6' }
  ];

  // Build pieData dynamically, mapping "Submitted" to "New" if needed (but your backend uses "New")
  const pieStatusCounts = allTickets.reduce((acc, ticket) => {
    const displayStatus = ticket.status === "Submitted" ? "New" : ticket.status;
    acc[displayStatus] = (acc[displayStatus] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.keys(statusColors).map(status => ({
    name: status,
    value: pieStatusCounts[status] || 0,
    fill: statusColors[status]
  }));

  const userStats = [
    { label: 'Employees', count: employees.length },
    { label: 'Ticket Coordinator', count: coordinators.length },
    { label: 'System Administrators', count: admins.length },
    { label: 'Pending Accounts', count: pendingAccounts.length },
    { label: 'Rejected Accounts', count: rejectedAccounts.length, isHighlight: true },
    { label: 'Total Users', count: allUsers.length, isHighlight: true }
  ];

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.dashboardContent}>
        <h1>Dashboard</h1>

        <div className={styles.tabContainer}>
          {['tickets', 'users'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : styles.tabInactive}`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
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
            title={activeTab === 'tickets' ? 'Tickets to Review' : 'Account Approval'}
            buttonText={activeTab === 'tickets' ? 'Manage Tickets' : 'Manage Accounts'}
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
              title={activeTab === 'tickets' ? 'Ticket Status' : 'Accounts'}
            />
            <TrendLineChart
              data={ticketData.lineData}
              title={activeTab === 'tickets' ? 'Status per month' : 'Accounts per month'}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorAdminDashboard;
