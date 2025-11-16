import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pie, Line } from 'react-chartjs-2';
import chartStyles from './CoordinatorAdminDashboardCharts.module.css';
import tableStyles from './CoordinatorAdminDashboardTable.module.css';
import statCardStyles from './CoordinatorAdminDashboardStatusCards.module.css';
import styles from './CoordinatorAdminDashboard.module.css';
import authService from '../../../utilities/service/authService';

const StatCard = ({ label, count, isHighlight, position, onClick, statusType }) => {
  const getStatusClass = (label) => {
    const statusMap = {};
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

const DataTable = ({ title, headers, data }) => (
  <div className={tableStyles.tableContainer}>
    <div className={tableStyles.tableHeader}>
      <h3 className={tableStyles.tableTitle}>{title}</h3>
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

        <div style={{ width: '340px', height: '340px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div className={chartStyles.chartContent} style={{ height: '300px' }}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
};

const CSATTab = ({ chartRange, setChartRange, pieRange, setPieRange }) => {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const csatData = {
    stats: [
      { label: 'Average Score', count: '4.5', path: null },
      { label: 'Total Responses', count: 328, path: null },
      { label: 'Excellent', count: 185, path: null },
      { label: 'Needs Improvement', count: 23, path: null }
    ],
    tableData: [
      {
        ticketNumber: 'TX0001',
        subject: 'Asset Replacement',
        rating: { text: '5 ⭐', statusClass: 'ratingExcellent' },
        feedback: 'Great service and fast resolution',
        submittedDate: '06/12/2025 2:30PM'
      },
      {
        ticketNumber: 'TX0002',
        subject: 'Network Problem',
        rating: { text: '4 ⭐', statusClass: 'ratingGood' },
        feedback: 'Good support but took longer than expected',
        submittedDate: '06/11/2025 4:45PM'
      },
      {
        ticketNumber: 'TX0003',
        subject: 'Software Installation',
        rating: { text: '5 ⭐', statusClass: 'ratingExcellent' },
        feedback: 'Excellent support team',
        submittedDate: '06/10/2025 10:15AM'
      },
      {
        ticketNumber: 'TX0004',
        subject: 'Email Issue',
        rating: { text: '3 ⭐', statusClass: 'ratingNeutral' },
        feedback: 'Could be improved',
        submittedDate: '06/09/2025 3:20PM'
      },
      {
        ticketNumber: 'TX0005',
        subject: 'Password Reset',
        rating: { text: '5 ⭐', statusClass: 'ratingExcellent' },
        feedback: 'Very satisfied',
        submittedDate: '06/08/2025 9:40AM'
      }
    ],
    pieData: [
      { name: 'Excellent (5★)', value: 185, fill: '#10B981' },
      { name: 'Good (4★)', value: 92, fill: '#3B82F6' },
      { name: 'Neutral (3★)', value: 35, fill: '#F59E0B' },
      { name: 'Poor (2★)', value: 12, fill: '#EF4444' },
      { name: 'Very Poor (1★)', value: 4, fill: '#7F1D1D' }
    ],
    lineData: [
      { month: 'Jan', dataset1: 4.2, dataset2: 285 },
      { month: 'Feb', dataset1: 4.3, dataset2: 312 },
      { month: 'Mar', dataset1: 4.4, dataset2: 298 },
      { month: 'Apr', dataset1: 4.5, dataset2: 315 },
      { month: 'May', dataset1: 4.6, dataset2: 328 },
      { month: 'Jun', dataset1: 4.5, dataset2: 328 }
    ]
  };

  const csatActivityTimeline = [
    { time: "02:30 PM", action: "CSAT TX0001 - 5★ Excellent feedback", type: "csat" },
    { time: "04:45 PM", action: "CSAT TX0002 - 4★ Good feedback", type: "csat" },
    { time: "10:15 AM", action: "CSAT TX0003 - 5★ Excellent feedback", type: "csat" },
    { time: "03:20 PM", action: "CSAT TX0004 - 3★ Neutral feedback", type: "csat" },
  ];

  return (
    <>
      <div className={styles.statusCardsGrid} style={{ marginTop: 12 }}>
        {csatData.stats.map((stat, i) => (
          <StatCard
            key={i}
            label={stat.label}
            count={stat.count}
            onClick={() => stat.path && navigate(stat.path)}
          />
        ))}
      </div>

      <DataTable
        title="Recent CSAT Feedback"
        headers={['Ticket Number', 'Subject', 'Rating', 'Feedback', 'Date Submitted']}
        data={csatData.tableData}
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
            {(currentUser?.role === 'System Admin' || currentUser?.role === 'Ticket Coordinator') && <option value="yearly">Yearly</option>}
          </select>
        </div>

        <div className={chartStyles.chartsGrid}>
          <StatusPieChart
            data={csatData.pieData}
            title="CSAT Rating Distribution"
            activities={csatActivityTimeline}
            pieRange={pieRange}
            setPieRange={setPieRange}
            isAdmin={currentUser?.role === 'System Admin' || currentUser?.role === 'Ticket Coordinator'}
            onBrowse={() => navigate('/admin/csat/all')}
          />
          <TrendLineChart
            data={(() => {
              const source = csatData.lineData;
              if (chartRange === 'days') return source.slice(-7);
              if (chartRange === 'week') return source.slice(-4);
              return source;
            })()}
            title="Average Score & Responses per Period"
            isTicketChart={false}
          />
        </div>
      </div>
    </>
  );
};

export default CSATTab;
