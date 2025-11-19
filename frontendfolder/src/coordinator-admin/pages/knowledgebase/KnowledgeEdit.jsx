import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import FormCard from '../../../shared/components/FormCard';
import FormActions from '../../../shared/components/FormActions';
// Editor fields will be inlined below (previously ArticleEditor)
import InputField from '../../../shared/components/InputField';
import { FiX } from 'react-icons/fi';
import styles from './KnowledgeEdit.module.css';
import kbService from '../../../services/kbService';


const KnowledgeEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [editorData, setEditorData] = useState({ title: '', content: '', category_id: null, visibility: 'employee', status: 'active', tags: [] });
  const [validationErrors, setValidationErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([kbService.listCategories(), kbService.getArticle(id)])
      .then(([cats, article]) => {
        if (!mounted) return;
        setCategories(cats || []);
        if (article) {
          setEditorData({
            title: article.title || '',
            content: article.content || '',
            category_id: article.category_id || null,
            visibility: article.visibility || 'employee',
            status: article.archived ? 'archived' : (article.status || 'active'),
            tags: article.tags || []
          });
        }
      })
      .catch((err) => console.error('Failed to load edit data:', err))
      .finally(() => setLoading(false));

    return () => { mounted = false; };
  }, [id]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      const updated = await kbService.updateArticle(id, {
        title: data.title,
        content: data.content,
        category_id: data.category_id || null,
        visibility: data.visibility || 'employee',
        archived: data.status === 'archived',
        tags: data.tags || []
      });
      window.dispatchEvent(new CustomEvent('kb:articleUpdated', { detail: updated }));
      navigate('/admin/knowledge/articles');
    } catch (err) {
      console.error('Failed to save article:', err);
      alert('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <FormCard>
          <div style={{ padding: 24 }}>Loading article for edit…</div>
        </FormCard>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Breadcrumb root="Knowledge Base" currentPage="Edit Article" rootNavigatePage="/admin/knowledge/articles" title="Edit Knowledge Article" />
      <section>
        <FormCard>
          <form onSubmit={(e) => { e.preventDefault(); /* parent FormActions handles save */ }}>
            <EditorFields
              data={editorData}
              setData={setEditorData}
              categories={categories}
              disabled={saving}
              externalErrors={validationErrors}
              showStatus={true}
            />

            <FormActions
              onCancel={() => navigate('/admin/knowledge/articles')}
              cancelLabel="Cancel"
              submitLabel={saving ? 'Saving…' : 'Save Changes'}
              submitDisabled={saving}
              submitVariant="primary"
              // trigger handleSave with current editorData
              onSubmit={() => handleSave(editorData)}
            />
          </form>
        </FormCard>
      </section>
    </div>
  );
};

export default KnowledgeEdit;

// Local editor fields (same structure as used in KnowledgeCreate)
function EditorFields({ data, setData, categories = [], disabled = false, externalErrors = {}, showStatus = false }) {
  const [tagInput, setTagInput] = useState('');

  const setField = (field, value) => setData(prev => ({ ...prev, [field]: value }));

  const addTag = (t) => {
    const tag = (t || tagInput || '').trim();
    if (!tag) return;
    const exists = (data.tags || []).some(x => String(x).toLowerCase() === tag.toLowerCase());
    if (exists) {
      setTagInput('');
      return;
    }
    setData(prev => ({ ...prev, tags: [...(prev.tags || []), tag] }));
    setTagInput('');
  };

  const removeTag = (idx) => setData(prev => ({ ...prev, tags: prev.tags.filter((_, i) => i !== idx) }));

  const onTagKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && (tagInput || '') === '') {
      const tags = data.tags || [];
      if (tags.length > 0) removeTag(tags.length - 1);
    }
  };

  return (
    <>
      <InputField
        label="Title"
        placeholder="Enter article title"
        value={data.title}
        onChange={(e) => setField('title', e.target.value)}
        required
        error={externalErrors.title}
        disabled={disabled}
      />

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>Category</label>
        <select value={data.category_id ?? ''} onChange={(e) => setField('category_id', e.target.value ? (isNaN(e.target.value) ? e.target.value : Number(e.target.value)) : null)} disabled={disabled} style={{ width: '100%', padding: 8 }}>
          <option value="">-- Select category --</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.title || c.name || c.id}</option>)}
        </select>
        {externalErrors.category && <div style={{ color: 'crimson' }}>{externalErrors.category}</div>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>Visibility</label>
        <select value={data.visibility} onChange={(e) => setField('visibility', e.target.value)} disabled={disabled} style={{ width: '100%', padding: 8 }}>
          <option value="employee">Employee</option>
          <option value="ticket_coordinator">Ticket Coordinator</option>
          <option value="system_admin">System Admin</option>
        </select>
        {externalErrors.visibility && <div style={{ color: 'crimson' }}>{externalErrors.visibility}</div>}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>Tags</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          {(data.tags || []).map((t, i) => (
            <div key={i} className={styles.tagPill}>
              <span>{t}</span>
              <button
                type="button"
                onClick={() => removeTag(i)}
                disabled={disabled}
                className={styles.tagRemove}
                aria-label={`Remove tag ${t}`}
              >
                <FiX size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <InputField
          placeholder="Type tag then press Enter"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={onTagKeyDown}
          disabled={disabled}
          inputStyle={{ width: '100%', padding: 8 }}
        />
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>Article Content</label>
        <textarea value={data.content} onChange={(e) => setField('content', e.target.value)} disabled={disabled} rows={12} style={{ width: '100%', padding: 8 }} />
        {externalErrors.content && <div style={{ color: 'crimson' }}>{externalErrors.content}</div>}
      </div>

      {showStatus && (
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontWeight: 600 }}>Status</label>
          <select value={data.status} onChange={(e) => setField('status', e.target.value)} disabled={disabled} style={{ width: '100%', padding: 8 }}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      )}
    </>
  );
}
