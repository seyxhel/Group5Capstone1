import { useNavigate } from 'react-router-dom';
import styles from './CoordinatorAdminDashboard.module.css';
import tableStyles from './CoordinatorAdminDashboardTable.module.css';

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
                  <td key={j} className={tableStyles.tableCell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className={tableStyles.emptyState}>No articles yet.</div>
      )}
    </div>
  </div>
);

const KnowledgeBaseTab = () => {
  const navigate = useNavigate();

  const stats = [{ label: 'Articles', count: 42 }, { label: 'Categories', count: 8 }];

  const tableData = [
    { id: 'A-001', title: 'How to reset password', category: 'Account', updated: '06/10/2025' },
    { id: 'A-002', title: 'VPN setup guide', category: 'Networking', updated: '05/22/2025' }
  ];

  return (
    <>
      <div className={styles.statusCardsGrid} style={{ marginTop: 12 }}>
        {stats.map((stat, i) => (
          <div key={i} className={styles.statusCard} onClick={() => navigate('/admin/knowledge/view-articles')}>
            <div className={styles.statCardContent}>
              <div className={styles.statBadge}>{stat.count}</div>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      <DataTable
        title="Recent Articles"
        headers={['ID', 'Title', 'Category', 'Last Updated']}
        data={tableData}
      />

      <div style={{ position: 'relative', marginTop: 12 }}>
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <select style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}>
            <option value="all">All</option>
            <option value="drafts">Drafts</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#f9fafb', borderRadius: '8px', marginTop: '12px' }}>
          <h3 style={{ marginBottom: '12px', color: '#1f2937' }}>Knowledge Base</h3>
          <p style={{ color: '#6b7280', marginBottom: '16px' }}>Manage articles, categories, and knowledge content</p>
          <button
            onClick={() => navigate('/admin/knowledge/view-articles')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3B82F6',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              marginRight: '8px'
            }}
          >
            View Articles
          </button>
          <button
            onClick={() => navigate('/admin/knowledge/create')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#10B981',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            Create Article
          </button>
        </div>
      </div>
    </>
  );
};

export default KnowledgeBaseTab;
