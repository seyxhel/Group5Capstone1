import { useNavigate } from 'react-router-dom';
import styles from './CoordinatorAdminDashboard.module.css';

const KnowledgeBaseTab = () => {
  const navigate = useNavigate();

  return (
    <>
      <div className={styles.statusCardsGrid} style={{ marginTop: 12 }}>
        {[{ label: 'Articles', count: 42 }, { label: 'Categories', count: 8 }].map((stat, i) => (
          <div key={i} className={styles.statusCard} onClick={() => navigate('/admin/knowledge/view-articles')}>
            <div className={styles.statCardContent}>
              <div className={styles.statBadge}>{stat.count}</div>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          </div>
        ))}
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
    </>
  );
};

export default KnowledgeBaseTab;
