import React from 'react';
import styles from './CoordinatorAdminTicketLogs.module.css';

export default function CoordinatorAdminTicketLogs({ ticketLogs }) {
  return (
    <div className={styles.panelRoot}>
      <div className={styles.panelContent}>
        <div className={styles.logsPanel}>
          {ticketLogs && ticketLogs.length > 0 ? (
            ticketLogs.map((log) => (
              <div key={log.id} className={styles.logEntry}>
                <div className={styles.logUser}>{log.user}</div>
                <div className={styles.logAction}>{log.action}</div>
                <div className={styles.logTimestamp}>{log.timestamp}</div>
              </div>
            ))
          ) : (
            <div className={styles.noLogs}>No logs available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
