import styles from './CoordinatorAdminNotifications.module.css';

const notifications = [
  {
    title: "New Ticket Submitted",
    message: "A new support ticket was submitted by an employee.",
    time: "2 minutes ago",
  },
  {
    title: "User Approval Needed",
    message: "You have pending user requests that need review.",
    time: "1 hour ago",
  },
  {
    title: "System Maintenance",
    message: "Scheduled maintenance will begin tonight at 10 PM.",
    time: "3 hours ago",
  },
];

export const notificationCount = notifications.length;

const CoordinatorAdminNotifications = () => {
  return (
    <div className={styles['notification-container']}>
      <div className={styles['notification-header']}>
        <h2>Notifications</h2>
        <button className={styles['clear-all-btn']}>Clear All</button>
      </div>

      {notifications.length > 0 ? (
        <div className={styles['notification-list']}>
          {notifications.map((notif, index) => (
            <div key={index} className={styles['notification-item']}>
              <div className={styles['notification-icon']}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 00-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className={styles['notification-content']}>
                <h3>{notif.title}</h3>
                <p>{notif.message}</p>
                <span className={styles['notification-time']}>{notif.time}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles['no-notifications']}>You're all caught up!</div>
      )}
    </div>
  );
};

export default CoordinatorAdminNotifications;
