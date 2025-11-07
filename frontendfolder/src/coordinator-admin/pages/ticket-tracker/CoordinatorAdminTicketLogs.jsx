import React from 'react';
import styles from './CoordinatorAdminTicketLogs.module.css';
import { FiUser, FiUsers, FiTag, FiCheckCircle, FiInbox, FiClock } from 'react-icons/fi';

export default function CoordinatorAdminTicketLogs({ ticketLogs }) {
  const renderUser = (u) => {
    if (!u && u !== 0) return 'System';
    if (typeof u === 'string') return u;
    if (typeof u === 'object') {
      // Try common name shapes
      const first = u.first_name || u.firstName || u.first || '';
      const last = u.last_name || u.lastName || u.last || '';
      const full = `${first} ${last}`.trim();
      if (full) return full;
      if (u.name) return u.name;
      if (u.role) return u.role;
      // as a last resort, return id or a placeholder
      if (u.id) return String(u.id);
      return 'User';
    }
    try { return String(u); } catch (e) { return 'User'; }
  };
  const renderLogText = (text, highlight) => {
    if (!text) return null;
    if (!highlight) return text;
    const hlStr = String(highlight);
    const lower = text.toLowerCase();
    const hl = hlStr.toLowerCase();
    const idx = lower.indexOf(hl);
    if (idx === -1) return text;
    const before = text.slice(0, idx);
    const matched = text.slice(idx, idx + hlStr.length);
    const after = text.slice(idx + hlStr.length);
    return (
      <>
        {before}
        <strong>{matched}</strong>
        {after}
      </>
    );
  };

  return (
    <div className={styles.panelRoot}>
      <div className={styles.panelContent}>
        <div className={styles.logsPanel}>
          {ticketLogs && ticketLogs.length > 0 ? (
            ticketLogs.map((log) => {
              const getLogIcon = (action) => {
                const a = (action || '').toLowerCase();
                if (a.includes('created')) return <FiInbox />;
                if (a.includes('assigned') || a.includes('assign')) return <FiUsers />;
                if (a.includes('status') || a.includes('updated') || a.includes('changed')) return <FiTag />;
                if (a.includes('resolved')) return <FiCheckCircle />;
                if (a.includes('closed')) return <FiClock />;
                return <FiUser />;
              };
              return (
                <div key={log.id} className={styles.logEntry}>
                  <div className={styles.logAvatar}>{getLogIcon(log.action || log.text)}</div>
                  <div className={styles.logBody}>
                    <div className={styles.logText}>
                      <strong className={styles.logUserLabel}>{renderUser(log.user)}</strong>
                      {': '}
                      {renderLogText(log.text || log.action, log.highlight)}
                    </div>
                    {log.timestamp ? (
                      <div className={styles.logTimestamp}>{log.timestamp}</div>
                    ) : null}
                  </div>
                </div>
              );
            })
          ) : (
            <div className={styles.noLogs}>No logs available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
