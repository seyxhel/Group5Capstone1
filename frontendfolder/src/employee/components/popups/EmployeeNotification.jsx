import React, { useEffect, useState } from 'react';
import styles from './EmployeeNotification.module.css';

import { HiOutlineDocumentAdd } from 'react-icons/hi';
import { MdUpdate, MdDeleteOutline } from 'react-icons/md';

const EmployeeNotification = ({ show, onClose, onCountChange }) => {
  const [notifications, setNotifications] = useState([
    {
      icon: <HiOutlineDocumentAdd size={20} />,
      title: 'New ticket submitted',
      message: 'Your request has been received.',
      time: '2 minutes ago',
    },
    {
      icon: <MdUpdate size={20} />,
      title: 'Ticket updated',
      message: 'Status changed to "On Progress".',
      time: '1 hour ago',
    },
  ]);

  // Notify parent about the count
  useEffect(() => {
    if (onCountChange) {
      onCountChange(notifications.length);
    }
  }, [notifications, onCountChange]);

  return (
    <>
      {show && (
        <div className={styles['notification-overlay']} onClick={onClose}>
          <div className={styles['notification-container']}>
            <div className={styles['notification-header']}>
              <h2>Notifications</h2>
              <button
                className={styles['clear-all-btn']}
                onClick={() => setNotifications([])}
              >
                Clear All
              </button>
            </div>

            <div className={styles['notification-list']}>
              {notifications.length === 0 ? (
                <div className={styles['no-notifications']}>
                  No new notifications
                </div>
              ) : (
                notifications.map((notif, index) => (
                  <div key={index} className={styles['notification-item']}>
                    <div className={styles['notification-icon']}>
                      {notif.icon}
                    </div>
                    <div className={styles['notification-content']}>
                      <h3>{notif.title}</h3>
                      <p>{notif.message}</p>
                      <span className={styles['notification-time']}>{notif.time}</span>
                    </div>
                    <button
                      className={styles['delete-notification-btn']}
                      onClick={() => {
                        const updated = notifications.filter((_, i) => i !== index);
                        setNotifications(updated);
                      }}
                    >
                      <MdDeleteOutline size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeNotification;
