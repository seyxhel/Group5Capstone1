import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import FormCard from '../../../shared/components/FormCard';
import FormActions from '../../../shared/components/FormActions';
import ArticleEditor from '../kb/ArticleEditor';
import styles from './knowledge.module.css';
import kbService from '../../../services/kbService';

const KnowledgeCreate = () => {
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    kbService.listCategories().then(setCategories).catch(()=>{});
  }, []);

  // detect ?edit=ID
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editId = params.get('edit');
    if (editId) {
      setIsEdit(true);
      setEditingId(editId);
      // load article
      kbService.getArticle(editId).then(a => {
        if (a) {
          setEditorData({ title: a.title || '', content: a.content || '', category_id: a.category_id || null, visibility: a.visibility || 'employee' });
        }
      }).catch(()=>{});
    }
  }, [location.search]);

  const handleSave = async (data) => {
    setSaving(true);
    try {
      if (isEdit && editingId) {
        const updated = await kbService.updateArticle(editingId, {
          title: data.title,
          content: data.content,
          category_id: data.category_id || null,
        });
        window.dispatchEvent(new CustomEvent('kb:articleUpdated', { detail: updated }));
      } else {
        const newArticle = await kbService.submitArticle({
          title: data.title,
          content: data.content,
          category_id: data.category_id || null,
          visibility: data.visibility || 'employee',
          author: 'Current Admin',
          date_modified: new Date().toISOString().slice(0,10)
        });
        window.dispatchEvent(new CustomEvent('kb:articleCreated', { detail: newArticle }));
      }

      navigate('/admin/knowledge/articles');
    } catch (err) {
      console.error('Failed to save article', err);
      alert('Failed to save article');
    } finally {
      setSaving(false);
    }
  };

  const [editorData, setEditorData] = useState({ title: '', content: '', category_id: null, visibility: 'employee' });
  const [validationErrors, setValidationErrors] = useState({});

  const onCancel = () => navigate('/admin/knowledge/articles');

  const handleSubmit = async (e) => {
    e.preventDefault();
    // validate required fields in order: Subject, Category, Visibility, Description
    const errs = {};
    if (!editorData.title || editorData.title.trim().length === 0) errs.title = 'Subject is required';
    if (!editorData.category_id) errs.category = 'Category is required';
    if (!editorData.visibility) errs.visibility = 'Visibility is required';
    if (!editorData.content || editorData.content.trim().length < 20) errs.content = 'Description must be at least 20 characters';

    setValidationErrors(errs);
    if (Object.keys(errs).length > 0) {
      // focus first error field could be added here
      return;
    }

    // delegate to handleSave with validated editor data
    await handleSave(editorData);
  };

  return (
    <div className={styles.container}>
      <Breadcrumb root="Knowledge Base" currentPage={isEdit ? 'Edit Article' : 'Create Article'} rootNavigatePage="/admin/knowledge/articles" title={isEdit ? 'Edit Knowledge Article' : 'Create Knowledge Article'} />

      <section>
        <FormCard>
          <form onSubmit={handleSubmit}>
            <ArticleEditor
              initial={editorData}
              categories={categories}
              onChangeData={setEditorData}
              onSave={handleSave}
              disabled={saving}
              externalErrors={validationErrors}
            />

            <FormActions
              onCancel={onCancel}
              cancelLabel="Cancel"
              submitLabel={saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Save Article')}
              submitDisabled={saving}
              submitVariant="primary"
            />
          </form>
        </FormCard>
      </section>
    </div>
  );
};

export default KnowledgeCreate;
