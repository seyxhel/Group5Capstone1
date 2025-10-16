import { useMemo } from 'react';
import { getActivityLogsByTicket } from '../../../utilities/storages/userActivityLog';
import styles from './ActivityLog.module.css';

const ActivityLog = ({ ticketNumber }) => {
  const activityLogs = useMemo(() => {
    if (!ticketNumber) return [];
    return getActivityLogsByTicket(ticketNumber);
  }, [ticketNumber]);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionIcon = (action) => {
    switch (action) {
      case 'ticket_created':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14m-7-7h14" />
          </svg>
        );
      case 'ticket_assigned':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <path d="M20 8v6m3-3h-6" />
          </svg>
        );
      case 'status_changed':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        );
      case 'comment_added':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        );
      case 'csat_submitted':
        return (
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        );
      case 'priority_changed':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 19V6M5 12l7-7 7 7" />
          </svg>
        );
      case 'file_attached':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
    }
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'ticket_created':
        return 'blue';
      case 'ticket_assigned':
        return 'purple';
      case 'status_changed':
        return 'green';
      case 'comment_added':
        return 'gray';
      case 'csat_submitted':
        return 'yellow';
      case 'priority_changed':
        return 'orange';
      case 'file_attached':
        return 'teal';
      default:
        return 'gray';
    }
  };

  if (!ticketNumber) {
    return (
      <div className={styles.emptyState}>
        <p>No ticket selected</p>
      </div>
    );
  }

  if (activityLogs.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No activity recorded for this ticket</p>
      </div>
    );
  }

  return (
    <div className={styles.activityLog}>
      <h3 className={styles.title}>Activity Log</h3>
      <div className={styles.timeline}>
        {activityLogs.map((log, index) => (
          <div key={log.id} className={styles.activityItem}>
            <div className={`${styles.iconWrapper} ${styles[getActionColor(log.action)]}`}>
              {getActionIcon(log.action)}
            </div>
            <div className={styles.content}>
              <div className={styles.header}>
                <span className={styles.userName}>{log.userName}</span>
                <span className={styles.timestamp}>{formatTimestamp(log.timestamp)}</span>
              </div>
              <p className={styles.details}>{log.details}</p>
            </div>
            {index < activityLogs.length - 1 && <div className={styles.connector} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityLog;
