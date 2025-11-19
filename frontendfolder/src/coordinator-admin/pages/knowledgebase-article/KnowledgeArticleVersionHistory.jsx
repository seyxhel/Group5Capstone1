import React from 'react';
import styles from './KnowledgeArticleVersionHistory.module.css';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d)) return 'N/A';
    const monthName = d.toLocaleString('en-US', { month: 'long' });
    const day = d.getDate();
    const year = d.getFullYear();
    return `${monthName} ${day}, ${year}`;
  } catch (e) {
    return 'N/A';
  }
};

const KnowledgeArticleVersionHistory = ({ article, category }) => {
  if (!article) return null;

  // If the article includes an explicit versions array, render that as a history list.
  const versions = Array.isArray(article.versions) ? article.versions : [];

  // Sort versions by modified date (newest first). Use common date fields and fall back to index.
  const sortedVersions = versions
    .slice()
    .sort((a, b) => {
      const getDate = (v) => {
        const d = v?.date || v?.updated_at || v?.dateModified || v?.modified || v?.updatedAt || null;
        const t = d ? Date.parse(d) : NaN;
        return Number.isFinite(t) ? t : -Infinity;
      };
      return getDate(b) - getDate(a);
    });

  return (
    <div className={styles.ticketList}>
      {sortedVersions.length > 0 ? (
        sortedVersions.map((v, idx) => {
          const versionNumber = v.number ?? v.version ?? idx + 1;
          const modifiedDate = v.date || v.updated_at || v.dateModified || v.modified || article.date_modified || article.dateModified;
          const author = v.author || v.editor || v.updatedBy || article.author || article.editor || 'System Admin';
          const changes = v.changes || v.summary || v.description || v.notes || '';

          // Determine role label. Prefer explicit visibility/role fields; otherwise infer from version number components.
          const inferRoleFromString = (s) => {
            if (!s) return null;
            const t = String(s).toLowerCase();
            if (t.includes('system')) return 'System Admin';
            if (t.includes('coordinator')) return 'Ticket Coordinator';
            if (t.includes('employee')) return 'Employee';
            return null;
          };

          let roleLabel = inferRoleFromString(v.visibility || v.role || v.target || v.scope || article.visibility);
          if (!roleLabel) {
            // parse version number like 1.1.3 and use middle digit as role code (1=Employee,2=Ticket Coordinator,3=System Admin)
            try {
              const parts = String(versionNumber).split('.');
              if (parts.length >= 2) {
                const code = parts[1];
                if (code === '1') roleLabel = 'Employee';
                else if (code === '2') roleLabel = 'Ticket Coordinator';
                else if (code === '3') roleLabel = 'System Admin';
              }
            } catch (e) {
              roleLabel = null;
            }
          }
          if (!roleLabel) roleLabel = inferRoleFromString(article.visibility) || 'Unknown';
          return (
            <div key={idx} className={styles.ticketItem}>
              <div className={styles.ticketInfo}>
                <div className={styles.ticketHeader}>
                  <div className={styles.ticketNumber}>Version {versionNumber}</div>
                  <div style={{ color: '#6b7280', fontSize: 13 }}>{formatDate(modifiedDate)}</div>
                </div>

                <div className={styles.ticketDetailsGrid}>
                  <div>
                    <div className={styles.ticketLabel}>Author / Editor</div>
                    <div className={styles.ticketValue}>{author}</div>
                  </div>
                  <div>
                    <div className={styles.ticketLabel}>Changes / Description</div>
                    <div className={styles.ticketValue}>{changes || 'No description provided.'}</div>
                  </div>
                </div>
              </div>

              <div className={styles.ticketActions}>
                <div className={styles.lastUpdated}>{formatDate(modifiedDate)}</div>
              </div>
            </div>
          );
        })
      ) : (
        <div className={styles.ticketItem}>
          <div className={styles.ticketInfo}>
            <div className={styles.ticketHeader}>
              <div className={styles.ticketNumber}>{article.title}</div>
              <div style={{ color: '#6b7280', fontSize: 13 }}>{formatDate(article.date_modified || article.dateModified || article.date_created || article.dateCreated)}</div>
            </div>

            <div className={styles.ticketDetailsGrid}>
              <div>
                <div className={styles.ticketLabel}>Created</div>
                <div className={styles.ticketValue}>{formatDate(article.date_created || article.dateCreated)}</div>
              </div>
              <div>
                <div className={styles.ticketLabel}>Category</div>
                <div className={styles.ticketValue}>{category ? category.name : 'Uncategorized'}</div>
              </div>
            </div>

            {article.tags && article.tags.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div className={styles.ticketLabel}>Tags</div>
                <div className={styles.ticketValue}>{article.tags.join(', ')}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeArticleVersionHistory;
