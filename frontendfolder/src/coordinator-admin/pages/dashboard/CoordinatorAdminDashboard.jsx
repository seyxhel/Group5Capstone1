import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './CoordinatorAdminDashboard.module.css';

// Reusable Stat Card Component
const StatCard = ({ label, count, isHighlight = false }) => (
  <div className={styles.statCard}>
    <div className={styles.statCardContent}>
      <div className={`${styles.statBadge} ${isHighlight ? styles.statBadgeRed : styles.statBadgeBlue}`}>
        {count}
      </div>
      <span className={styles.statLabel}>{label}</span>
    </div>
  </div>
);

// Reusable Table Component
const DataTable = ({ title, headers, data, buttonText, onButtonClick }) => (
  <div className={styles.tableContainer}>
    <div className={styles.tableHeader}>
      <h3 className={styles.tableTitle}>{title}</h3>
      <button className={styles.button} onClick={onButtonClick}>
        {buttonText}
      </button>
    </div>
    <div className={styles.tableOverflow}>
      <table className={styles.table}>
        <thead className={styles.tableHead}>
          <tr>
            {headers.map((header, i) => (
              <th key={i} className={styles.tableHeaderCell}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className={styles.tableRow}>
              {Object.values(row).map((cell, j) => (
                <td key={j} className={styles.tableCell}>
                  {typeof cell === 'object' ? (
                    <span className={`${styles.statusBadge} ${styles[cell.statusClass]}`}>
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

// Chart Components
const StatusPieChart = ({ data, title }) => (
  <div className={styles.chartContainer}>
    <h3 className={styles.chartTitle}>{title}</h3>
    <div className={styles.chartContent}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
    <button className={styles.browseButton}>
      Browse All
    </button>
  </div>
);

const TrendLineChart = ({ data, title }) => (
  <div className={styles.chartContainer}>
    <h3 className={styles.chartTitle}>{title}</h3>
    <div className={styles.chartContent}>
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

// Main Dashboard Component
const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CoordinatorAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('tickets');
  const [reviewTickets, setReviewTickets] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchReviewTickets = async () => {
      try {
        const token = localStorage.getItem("admin_access_token");
        const res = await fetch(`${API_URL}tickets/new/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReviewTickets(data);
        } else {
          setReviewTickets([]);
        }
      } catch (err) {
        setReviewTickets([]);
      }
    };
    fetchReviewTickets();
  }, []);

  useEffect(() => {
    const fetchAllTickets = async () => {
      try {
        const token = localStorage.getItem("admin_access_token");
        const res = await fetch(`${API_URL}tickets/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllTickets(data);
        } else {
          setAllTickets([]);
        }
      } catch (err) {
        setAllTickets([]);
      }
    };
    fetchAllTickets();
  }, []);

  // Define the colors for each status
  const statusColors = {
    New: '#6B7280',
    Open: '#3B82F6',
    Pending: '#F59E0B',
    Resolved: '#10B981',
    Closed: '#8B5CF6'
  };

  // Count tickets by status
  const statusCounts = allTickets.reduce((acc, ticket) => {
    acc[ticket.status] = (acc[ticket.status] || 0) + 1;
    return acc;
  }, {});

  const ticketStats = [
    { label: 'New Tickets', count: statusCounts['New'] || 0 },
    { label: 'Open Tickets', count: statusCounts['Open'] || 0 },
    { label: 'On Process Tickets', count: statusCounts['On Process'] || 0 },
    { label: 'On hold Tickets', count: statusCounts['On hold'] || 0 },
    { label: 'Pending Tickets', count: statusCounts['Pending'] || 0 },
    { label: 'Resolved Tickets', count: statusCounts['Resolved'] || 0 },
    { label: 'Closed Tickets', count: statusCounts['Closed'] || 0 },
    { label: 'Rejected Tickets', count: statusCounts['Rejected'] || 0, isHighlight: true },
    { label: 'Withdrawn Tickets', count: statusCounts['Withdrawn'] || 0, isHighlight: true },
    { label: 'Total Tickets', count: allTickets.length, isHighlight: true }
  ];

  // Sample Data
  const ticketData = {
    stats: [
      { label: 'New Tickets', count: 5 },
      { label: 'Open Tickets', count: 5 },
      { label: 'On Process Tickets', count: 5 },
      { label: 'On hold Tickets', count: 5 },
      { label: 'Pending Tickets', count: 5 },
      { label: 'Resolved Tickets', count: 5 },
      { label: 'Closed Tickets', count: 5 },
      { label: 'Rejected Tickets', count: 5, isHighlight: true },
      { label: 'Withdrawn Tickets', count: 5, isHighlight: true },
      { label: 'Total Tickets', count: 20, isHighlight: true }
    ],
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
      { label: 'Employees', count: 5 },
      { label: 'Ticket Coordinator', count: 5 },
      { label: 'System Administrators', count: 5 },
      { label: 'Pending Accounts', count: 5 },
      { label: 'Rejected Accounts', count: 5, isHighlight: true },
      { label: 'Total Users', count: 20, isHighlight: true }
    ],
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

  return (
    <div className={styles.container}>
      <div className={styles.maxWidth}>
        <h1 className={styles.title}>Dashboard</h1>
        
        {/* Tab Navigation */}
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

        {activeTab === 'tickets' ? (
          <div className={styles.tabContent}>
            {/* Stats Grid */}
            <div className={styles.statsGrid}>
              {ticketStats.map((stat, i) => (
                <StatCard key={i} {...stat} />
              ))}
            </div>

            {/* Tickets Table */}
            <DataTable
              title="Tickets to Review"
              buttonText="Manage Tickets"
              headers={['Ticket Number', 'Subject', 'Category', 'Sub-Category', 'Status', 'Date Created']}
              data={reviewTickets.map(ticket => {
                const dateObj = ticket.submit_date ? new Date(ticket.submit_date) : null;
                return {
                  ticketNumber: ticket.ticket_number,
                  subject: ticket.subject,
                  category: ticket.category,
                  subCategory: ticket.sub_category,
                  status: {
                    text: ticket.status === "Submitted" ? "New" : ticket.status,
                    statusClass: `status${ticket.status === "Submitted" ? "New" : ticket.status}`
                  },
                  dateCreated: dateObj
                    ? `${dateObj.toLocaleDateString()} ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                    : '',
                };
              })}
              onButtonClick={() => navigate('/admin/ticket-management/all-tickets')}
            />

            {/* Charts */}
            <div className={styles.chartsGrid}>
              <StatusPieChart data={pieData} title="Ticket Status" />
              <TrendLineChart data={ticketData.lineData} title="Status per month" />
            </div>
          </div>
        ) : (
          <div className={styles.tabContent}>
            {/* User Stats Grid */}
            <div className={styles.userGrid}>
              {userData.stats.map((stat, i) => (
                <StatCard key={i} {...stat} />
              ))}
            </div>

            {/* Account Approval Table */}
            <DataTable
              title="Account Approval"
              buttonText="Manage Accounts"
              headers={['Company ID', 'Last Name', 'First Name', 'Department', 'Role', 'Status']}
              data={userData.tableData}
            />

            {/* User Charts */}
            <div className={styles.chartsGrid}>
              <StatusPieChart data={userData.pieData} title="Accounts" />
              <TrendLineChart data={ticketData.lineData} title="Accounts per month" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CoordinatorAdminDashboard;