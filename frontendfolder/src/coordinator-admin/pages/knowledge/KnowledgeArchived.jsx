import React, { useEffect, useMemo, useState } from 'react';
import userStyles from '../user-management/CoordinatorAdminUserAccess.module.css';
import fpStyles from '../../../shared/table/FilterPanel.module.css';
import FilterPanel from '../../../shared/table/FilterPanel';
import Button from '../../../shared/components/Button';
import TablePagination from '../../../shared/table/TablePagination';
import kbService from '../../../services/kbService';

const KnowledgeArchived = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState({});
  const [localFilters, setLocalFilters] = useState({ category: null, startDate: '', endDate: '' });
  const [showFilter, setShowFilter] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const [cats, arts] = await Promise.all([kbService.listCategories(), kbService.listArticles({})]);
        setCategories(cats || []);
        setArticles((arts || []).filter(a => a.archived));
      } catch (e) {}
      setLoading(false);
    };
    fetch();
  }, []);

  useEffect(() => {
    setLocalFilters({ category: appliedFilters?.category || null, startDate: appliedFilters?.startDate || '', endDate: appliedFilters?.endDate || '' });
  }, [appliedFilters]);

  const getCategoryName = (id) => {
    const c = categories.find(x => String(x.id) === String(id));
    return c ? c.name : 'Uncategorized';
  };

  const formatArticleDate = (a) => {
    const dateStr = a.date_created || a.date_modified || '';
    if (!dateStr) return '';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch (e) {
      return dateStr;
    }
  };

  const filtered = useMemo(() => {
    const start = appliedFilters?.startDate || '';
    const end = appliedFilters?.endDate || '';
    const catLabel = appliedFilters?.category?.label || '';
    const statusLabel = appliedFilters?.status?.label || '';
    const startTs = start ? new Date(start).setHours(0,0,0,0) : null;
    const endTs = end ? new Date(end).setHours(23,59,59,999) : null;

    return (articles || []).filter(a => {
      if (catLabel) {
        const name = getCategoryName(a.category_id);
        if (name !== catLabel) return false;
      }
      if (startTs || endTs) {
        const dateStr = a.date_modified || a.date_created || '';
        const artTs = dateStr ? new Date(dateStr).getTime() : null;
        if (startTs && artTs !== null && artTs < startTs) return false;
        if (endTs && artTs !== null && artTs > endTs) return false;
      }
      if (statusLabel) {
        if (((a.visibility || '').toLowerCase()) !== (statusLabel || '').toLowerCase()) return false;
      }
      return true;
    });
  }, [articles, appliedFilters, categories]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const handleRestore = async (article) => {
    if (!window.confirm(`Restore "${article.title}"?`)) return;
    await kbService.updateArticle(article.id, { archived: false });
    window.dispatchEvent(new CustomEvent('kb:articleUpdated', { detail: { id: article.id } }));
    setArticles(prev => prev.filter(p => p.id !== article.id));
  };

  const handleDelete = async (article) => {
    if (!window.confirm(`Delete "${article.title}" permanently? This cannot be undone.`)) return;
    await kbService.updateArticle(article.id, { deleted: true });
    window.dispatchEvent(new CustomEvent('kb:articleUpdated', { detail: { id: article.id } }));
    setArticles(prev => prev.filter(p => p.id !== article.id));
  };

  return (
    <div className={userStyles.pageContainer}>
      {/* Filter panel (outside the table) — use shared FilterPanel for consistent spacing */}
      <FilterPanel
        onApply={(filters) => { setAppliedFilters(filters); setCurrentPage(1); }}
        onReset={(filters) => { setAppliedFilters(filters); setCurrentPage(1); }}
        initialFilters={appliedFilters}
        categoryFirst={true}
        categoryLabel="Category"
        showDateFilters={true}
  // expose Visibility via status dropdown
  statusLabel="Visibility"
  statusOptions={[{ label: 'Employee' }, { label: 'Ticket Coordinator' }, { label: 'System Admin' }]}
        showStatus={true}
        priorityOptions={[]}
        subCategoryOptions={[]}
        categoryOptions={(categories || []).map(c => ({ label: c.name }))}
      />

      <div className={userStyles.tableSection}>
        <div className={userStyles.tableHeader}>
          <h2>Archived Articles</h2>
        </div>

        <div className={userStyles.tableWrapper}>
          <table className={userStyles.table}>
            <thead>
              <tr>
                <th style={{ width: 260 }}>Article</th>
                <th>Category</th>
                <th style={{ width: 120, textAlign: 'center' }}>Visibility</th>
                <th style={{ width: 140, textAlign: 'center' }}>Created</th>
                <th style={{ width: 180, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#6b7280', fontStyle: 'italic' }}>
                    {loading ? 'Loading…' : 'No archived articles found.'}
                  </td>
                </tr>
              ) : (
                paginated.map((a, idx) => (
                  <tr key={a.id || idx}>
                    <td>
                      <div className={userStyles.subjectCell}>
                        <div style={{ fontWeight: 600 }}>{a.title}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{a.author} • {formatArticleDate(a)}</div>
                      </div>
                    </td>
                    <td>{getCategoryName(a.category_id)}</td>
                    <td style={{ textAlign: 'center' }}>{a.visibility}</td>
                    <td style={{ textAlign: 'center' }}>{formatArticleDate(a)}</td>
                    <td>
                      <div className={userStyles.actionButtonCont}>
                        <button title="Restore" className={userStyles.actionButton} onClick={() => handleRestore(a)}>Restore</button>
                        <button title="Delete" className={userStyles.actionButton} onClick={() => handleDelete(a)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className={userStyles.tablePagination}>
          <TablePagination
            currentPage={currentPage}
            totalItems={filtered.length}
            initialItemsPerPage={itemsPerPage}
            onPageChange={(p) => setCurrentPage(p)}
            onItemsPerPageChange={(n) => { setItemsPerPage(n); setCurrentPage(1); }}
            alwaysShow={true}
          />
        </div>
      </div>
    </div>
  );
};

export default KnowledgeArchived;
