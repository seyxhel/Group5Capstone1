import { useNavigate } from 'react-router-dom';
import styles from './CoordinatorAdminDashboard.module.css';
import tableStyles from './CoordinatorAdminDashboardTable.module.css';
import kbService from '../../../services/kbService';
import { useEffect, useState } from 'react';

const DataTable = ({ title, headers, data, maxVisibleRows }) => (
  <div className={tableStyles.tableContainer}>
    <div className={tableStyles.tableHeader}>
      <h3 className={tableStyles.tableTitle}>{title}</h3>
    </div>

    <div className={`${tableStyles.tableOverflow} ${maxVisibleRows ? tableStyles.scrollableRows : ''}`} style={ maxVisibleRows ? { ['--visible-rows']: maxVisibleRows } : {} }>
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

  const [stats, setStats] = useState([{ label: 'Articles', count: 0 }, { label: 'Categories', count: 0 }]);
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    let mounted = true;

    // Fetch published articles and categories concurrently
    Promise.allSettled([kbService.listPublishedArticles(), kbService.listCategories()])
      .then(([articlesRes, categoriesRes]) => {
        if (!mounted) return;

        const articles = (articlesRes.status === 'fulfilled' && Array.isArray(articlesRes.value)) ? articlesRes.value : (Array.isArray(articlesRes.value) ? articlesRes.value : []);
        const categories = (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value)) ? categoriesRes.value : (Array.isArray(categoriesRes.value) ? categoriesRes.value : []);

        const formatDate = (d) => {
          if (!d) return '';
          try {
            const dt = new Date(d);
            if (Number.isNaN(dt.getTime())) return String(d);
            // enforce MM/DD/YYYY
            const mm = String(dt.getMonth() + 1).padStart(2, '0');
            const dd = String(dt.getDate()).padStart(2, '0');
            const yyyy = dt.getFullYear();
            return `${mm}/${dd}/${yyyy}`;
          } catch (e) {
            return String(d);
          }
        };

        // Sort articles by latest update (date_modified > date_created) and map all results
        const sorted = (articles || []).slice().sort((x, y) => {
          const dx = new Date(x.date_modified || x.updated_at || x.dateModified || x.date_created || x.created_at || 0).getTime() || 0;
          const dy = new Date(y.date_modified || y.updated_at || y.dateModified || y.date_created || y.created_at || 0).getTime() || 0;
          return dy - dx;
        });

        const mapped = sorted.map(a => ({
          id: `A-${String(a.id || a.articleId || '').padStart(3, '0')}`,
          title: a.title || a.subject || a.name || '',
          category: (a.category && (a.category.name || a.category.title)) || a.category || a.category_id || a.categoryId || '',
          updated: formatDate(a.date_modified || a.updated_at || a.dateModified || a.date_created || a.created_at || '')
        }));

        setTableData(mapped);
        setStats([
          { label: 'Articles', count: (articles || []).length },
          { label: 'Categories', count: (categories || []).length }
        ]);
      })
      .catch((e) => {
        console.warn('[KB] Failed to fetch articles/categories for dashboard', e);
      });

    return () => { mounted = false; };
  }, []);

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
        maxVisibleRows={5}
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
