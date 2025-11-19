import React from 'react';
import styles from './CoordinatorAdminTicketLogs.module.css';
import LogsPanel from '../../../shared/components/LogsPanel';

export default function CoordinatorAdminTicketLogs({ ticketLogs }) {
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
            <LogsPanel logs={ticketLogs} />
          ) : (
            <div className={styles.noLogs}>No logs available.</div>
          )}
        </div>
      </div>
    </div>
  );
}
