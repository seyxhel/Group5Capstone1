import { useState, useMemo, useEffect } from 'react';
import { Pie, Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import styles from './CoordinatorAdminReports.module.css';
import { getAllTickets } from '../../../utilities/storages/ticketStorage';
import Skeleton from '../../../shared/components/Skeleton/Skeleton';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const CoordinatorAdminTicketReports = () => {
  const [dateRange, setDateRange] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Get tickets data
  const allTickets = getAllTickets();

  // Filter tickets by date range
  const filteredTickets = useMemo(() => {
    let tickets = [...allTickets];
    const now = new Date();

    if (dateRange === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      tickets = tickets.filter(t => new Date(t.dateCreated) >= weekAgo);
    } else if (dateRange === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      tickets = tickets.filter(t => new Date(t.dateCreated) >= monthAgo);
    } else if (dateRange === 'quarter') {
      const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      tickets = tickets.filter(t => new Date(t.dateCreated) >= quarterAgo);
    }

    if (selectedCategory !== 'all') {
      tickets = tickets.filter(t => t.category === selectedCategory);
    }

    return tickets;
  }, [allTickets, dateRange, selectedCategory]);

  // Status Distribution
  const statusData = useMemo(() => {
    const statusCount = {};
    filteredTickets.forEach(ticket => {
      const status = ticket.status || 'Unknown';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    return {
      labels: Object.keys(statusCount),
      datasets: [{
        data: Object.values(statusCount),
        backgroundColor: [
          '#2563eb', // New
          '#0284c7', // Open
          '#7c3aed', // In Progress
          '#b35000', // On Hold
          '#059669', // Resolved
          '#16a34a', // Closed
          '#dc2626', // Rejected
          '#6b7280', // Withdrawn
        ],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    };
  }, [filteredTickets]);

  // Priority Distribution
  const priorityData = useMemo(() => {
    const priorityCount = { Critical: 0, High: 0, Medium: 0, Low: 0, 'Not Set': 0 };
    filteredTickets.forEach(ticket => {
      const priority = ticket.priorityLevel || 'Not Set';
      priorityCount[priority] = (priorityCount[priority] || 0) + 1;
    });

    return {
      labels: Object.keys(priorityCount),
      datasets: [{
        label: 'Tickets',
        data: Object.values(priorityCount),
        backgroundColor: [
          '#991b1b', // Critical
          '#dc2626', // High
          '#d97706', // Medium
          '#16a34a', // Low
          '#6b7280', // Not Set
        ],
        borderRadius: 6,
      }]
    };
  }, [filteredTickets]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const categoryCount = {};
    filteredTickets.forEach(ticket => {
      const category = ticket.category || 'Unknown';
      categoryCount[category] = (categoryCount[category] || 0) + 1;
    });

    return {
      labels: Object.keys(categoryCount),
      datasets: [{
        label: 'Tickets by Category',
        data: Object.values(categoryCount),
        backgroundColor: '#3b82f6',
        borderRadius: 6,
      }]
    };
  }, [filteredTickets]);

  // Tickets over time (mock data for demonstration)
  const timelineData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Created',
        data: [12, 19, 15, 22],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
      },
      {
        label: 'Resolved',
        data: [8, 14, 12, 18],
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        tension: 0.4,
      }
    ]
  };

  // Chart options
  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: { size: 12 },
          usePointStyle: true,
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `Tickets: ${context.parsed.y}`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 5 }
      }
    }
  };

  // Get unique categories
  const categories = ['all', ...new Set(allTickets.map(t => t.category).filter(Boolean))];

  // Summary stats
  const stats = useMemo(() => {
    const total = filteredTickets.length;
    const open = filteredTickets.filter(t => ['New', 'Open', 'In Progress'].includes(t.status)).length;
    const resolved = filteredTickets.filter(t => t.status === 'Resolved').length;
    const closed = filteredTickets.filter(t => t.status === 'Closed').length;

    return { total, open, resolved, closed };
  }, [filteredTickets]);

  if (isLoading) {
    return (
      <div className={styles.reportsPage}>
        <div className={styles.pageHeader}>
          <Skeleton width="300px" height="40px" style={{ marginBottom: '12px' }} />
          <Skeleton width="500px" height="20px" />
        </div>

        <div className={styles.filtersSection}>
          <Skeleton width="200px" height="36px" style={{ marginBottom: '12px' }} />
          <Skeleton width="200px" height="36px" />
        </div>

        <div className={styles.statsContainer} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '24px' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ padding: '12px', borderRadius: '8px', background: '#f9fafb' }}>
              <Skeleton width="80px" height="24px" style={{ marginBottom: '8px' }} />
              <Skeleton width="100px" height="32px" />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginTop: '24px' }}>
          {[1, 2].map(i => (
            <Skeleton key={i} width="100%" height="400px" borderRadius="8px" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reportsPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>📊 Ticket Reports</h1>
        <p className={styles.pageSubtitle}>Comprehensive ticket analytics and performance metrics</p>
      </div>

      {/* Filters */}
      <div className={styles.filtersSection}>
        <div className={styles.filterGroup}>
          <label>Date Range:</label>
          <select 
            value={dateRange} 
            onChange={(e) => setDateRange(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Time</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 90 Days</option>
          </select>
        </div>
        <div className={styles.filterGroup}>
          <label>Category:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={styles.filterSelect}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Tickets</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🔄</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.open}</div>
            <div className={styles.statLabel}>Open Tickets</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.resolved}</div>
            <div className={styles.statLabel}>Resolved</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🎯</div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.closed}</div>
            <div className={styles.statLabel}>Closed</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className={styles.section}>
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Status Distribution</h3>
            <div className={styles.chartContainer}>
              <Pie data={statusData} options={pieOptions} />
            </div>
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Priority Breakdown</h3>
            <div className={styles.chartContainer}>
              <Bar data={priorityData} options={barOptions} />
            </div>
          </div>
        </div>
        
        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Tickets by Category</h3>
            <div className={styles.chartContainer}>
              <Bar data={categoryData} options={barOptions} />
            </div>
          </div>
          <div className={styles.chartCard}>
            <h3 className={styles.chartTitle}>Ticket Trends Over Time</h3>
            <div className={styles.chartContainer}>
              <Line data={timelineData} options={lineOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoordinatorAdminTicketReports;
