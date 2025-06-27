import { useState, useEffect } from 'react';
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

const DataTable = ({ title, headers, data, buttonText, onButtonClick, maxRows = 5 }) => (
  <div className={tableStyles.tableContainer}>
    <div className={tableStyles.tableHeader}>
      <h3 className={tableStyles.tableTitle}>{title}</h3>
      <button className={tableStyles.button} onClick={onButtonClick}>{buttonText}</button>
    </div>
    <div className={tableStyles.tableOverflowLimited}>
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
              {Object.entries(row).map(([key, cell], j) => (
                <td
                  key={j}
                  className={
                    key === 'status'
                      ? `${tableStyles.tableCell} ${tableStyles.statusCellLeft}`
                      : tableStyles.tableCell
                  }
                >
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
const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CoordinatorAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [tickets, setTickets] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch tickets and users from backend
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('admin_access_token');
        if (!token) {
          setTickets([]);
          setUsers([]);
          setLoading(false);
          return;
        }
        const [ticketsRes, usersRes] = await Promise.all([
          fetch(`${API_URL}tickets/`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          fetch(`${API_URL}employees/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        const ticketsData = await ticketsRes.json();
        const usersData = await usersRes.json();
        setTickets(Array.isArray(ticketsData) ? ticketsData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (e) {
        setTickets([]);
        setUsers([]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Filter tickets for "Tickets to Review" (only New and Pending)
  const ticketsToReview = tickets.filter(
    t => t.status === "New" || t.status === "Pending"
  ).map(ticket => ({
    ticketNumber: ticket.ticket_number,
    subject: ticket.subject,
    category: ticket.category,
    subCategory: ticket.sub_category,
    status: { 
      text: ticket.status, 
      statusClass: ticket.status === "New" ? "statusNew" : `status${ticket.status.replace(/\s/g, '')}` 
    },
    dateCreated: ticket.submit_date
      ? new Date(ticket.submit_date).toLocaleString().replace(',', '')
      : ''
  }));

  // Filter users for "Account Approval" (only Pending)
  const usersToApprove = users
    .filter(user => user.status === "Pending")
    .map(user => ({
      companyId: user.company_id,
      lastName: user.last_name,
      firstName: user.first_name,
      department: user.department,
      role: user.role,
      status: { text: user.status, statusClass: "statusPending" }
    }));

  // --- Ticket Card Counts ---
  const ticketCounts = {};
  tickets.forEach(ticket => {
    const status = ticket.status || "Unknown";
    ticketCounts[status] = (ticketCounts[status] || 0) + 1;
  });
  ticketCounts["ALL"] = tickets.length;

  // --- User Card Counts ---
  const userCounts = {};
  users.forEach(user => {
    const role = user.role || "Unknown";
    const status = user.status || "Unknown";
    userCounts[role] = (userCounts[role] || 0) + 1;
    userCounts[status] = (userCounts[status] || 0) + 1;
  });
  userCounts["ALL"] = users.length;

  // --- Cards Data ---
  const ticketStats = ticketPaths.map((item, i) => {
    let count = 0;
    if (item.label === "Total Tickets") {
      count = ticketCounts["ALL"];
    } else if (item.label === "New Tickets") {
      count = ticketCounts["New"] || 0;
    } else if (item.label === "On Process Tickets") {
      count = ticketCounts["On Process"] || 0;
    } else if (item.label === "On hold Tickets") {
      count = ticketCounts["On Hold"] || 0;
    } else if (item.label === "Withdrawn Tickets") {
      count = ticketCounts["Withdrawn"] || 0;
    } else {
      // For other statuses, remove " Tickets" and match the status
      const status = item.label.replace(" Tickets", "").replace("Open", "Open").replace("Pending", "Pending").replace("Resolved", "Resolved").replace("Closed", "Closed").replace("Rejected", "Rejected");
      count = ticketCounts[status] || 0;
    }
    return {
      label: item.label,
      count,
      isHighlight: i >= 7,
      position: i,
      path: item.path
    };
  });

  const userStats = userPaths.map((item, i) => {
    let count = 0;
    if (item.label === "All Users") {
      count = userCounts["ALL"];
    } else if (item.label === "Employees") {
      count = userCounts["Employee"] || 0;
    } else if (item.label === "Ticket Coordinators") {
      count = userCounts["Ticket Coordinator"] || 0;
    } else if (item.label === "System Administrators") {
      count = userCounts["System Admin"] || 0;
    } else if (item.label === "Pending Accounts") {
      count = userCounts["Pending"] || 0;
    } else if (item.label === "Rejected Accounts") {
      count = userCounts["Denied"] || 0;
    }
    return {
      label: item.label,
      count,
      isHighlight: i >= 4,
      position: i,
      path: item.path
    };
  });

  // --- Keep your existing mock data for table and charts ---
  const ticketData = {
    stats: ticketStats,
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
    stats: userStats,
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

  // Define the statuses and colors you want to show in the pie
  const pieStatuses = [
    { name: 'New', key: 'New', fill: '#6B7280' },
    { name: 'Open', key: 'Open', fill: '#3B82F6' },
    { name: 'Pending', key: 'Pending', fill: '#F59E0B' },
    { name: 'Resolved', key: 'Resolved', fill: '#10B981' },
    { name: 'Closed', key: 'Closed', fill: '#8B5CF6' },
    { name: 'Rejected', key: 'Rejected', fill: '#EF4444' },
    { name: 'Withdrawn', key: 'Withdrawn', fill: '#6366F1' }
  ];

  // Count tickets by status
  const ticketStatusCounts = {};
  tickets.forEach(ticket => {
    const status = ticket.status || 'Unknown';
    ticketStatusCounts[status] = (ticketStatusCounts[status] || 0) + 1;
  });

  // Build pie data from actual counts
  const dynamicPieData = pieStatuses
    .map(({ name, key, fill }) => ({
      name,
      value: ticketStatusCounts[key] || 0,
      fill
    }))
    .filter(item => item.value > 0); // Only show statuses that exist

  // Define the statuses and colors for the user pie chart
  const userPieStatuses = [
    { name: 'Employees', key: 'Employee', fill: '#3B82F6' },
    { name: 'Ticket Coordinators', key: 'Ticket Coordinator', fill: '#F59E0B' },
    { name: 'System Admins', key: 'System Admin', fill: '#10B981' },
    { name: 'Pending', key: 'Pending', fill: '#EF4444' },
    { name: 'Rejected', key: 'Denied', fill: '#8B5CF6' }
  ];

  // Count users by role and status for pie chart
  const userStatusCounts = {};
  users.forEach(user => {
    const role = user.role || 'Unknown';
    const status = user.status || 'Unknown';
    userStatusCounts[role] = (userStatusCounts[role] || 0) + 1;
    userStatusCounts[status] = (userStatusCounts[status] || 0) + 1;
  });

  // Build user pie data from actual counts
  const dynamicUserPieData = userPieStatuses
    .map(({ name, key, fill }) => ({
      name,
      value: userStatusCounts[key] || 0,
      fill
    }))
    .filter(item => item.value > 0); // Only show roles/statuses that exist

  if (loading) return <div>Loading...</div>;

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
            data={activeTab === 'tickets' ? ticketsToReview : usersToApprove}
            onButtonClick={() =>
              navigate(
                activeTab === 'tickets'
                  ? '/admin/ticket-management/all-tickets'
                  : '/admin/users/all-users'
              )
            }
            maxRows={5}
          />

          <div className={chartStyles.chartsGrid}>
            <StatusPieChart
              data={activeTab === 'tickets' ? dynamicPieData : dynamicUserPieData}
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
