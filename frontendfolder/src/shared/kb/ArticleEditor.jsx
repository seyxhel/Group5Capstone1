import React, { useState, useEffect } from 'react';
import styles from './ArticleEditor.module.css';
import InputField from '../components/InputField';
import inputStyles from '../components/InputField.module.css';

// Status is managed by sysadmin logic; editor does not expose it


const ArticleEditor = ({
  initial = { title: '', content: '', category_id: null, visibility: 'Employee' },
  categories = [],
  onSave,
  disabled = false,
  onChangeData,
  externalErrors = {}
}) => {
  const [title, setTitle] = useState(initial.title);
  const [content, setContent] = useState(initial.content);
  const [categoryId, setCategoryId] = useState(initial.category_id || '');
  const [visibility, setVisibility] = useState(initial.visibility || 'Employee');
  const [errors, setErrors] = useState({});

  // sync when parent provides a new initial prop
  useEffect(() => {
    setTitle(initial.title || '');
    setContent(initial.content || '');
    setCategoryId(initial.category_id || '');
  }, [initial]);

  // accept external validation results from parent
  useEffect(() => {
    if (externalErrors && Object.keys(externalErrors).length > 0) {
      setErrors(externalErrors);
    }
  }, [externalErrors]);

  // emit current data upwards for form-based parent usage
  useEffect(() => {
    if (typeof onChangeData === 'function') {
      onChangeData({ title, content, category_id: categoryId || null, visibility });
    }
  }, [title, content, categoryId, visibility, onChangeData]);

  const validate = () => {
    const e = {};
    if (!title || title.trim().length === 0) e.title = 'Subject is required';
    if (!categoryId) e.category = 'Category is required';
    if (!visibility) e.visibility = 'Visibility is required';
    if (!content || content.trim().length < 20) e.content = 'Description must be at least 20 characters';
    // ensure selected category exists
    if (categoryId && !categories.find(c => String(c.id) === String(categoryId))) e.category = 'Invalid category';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Note: saving / submit button is provided by parent FormActions
  // ArticleEditor is now a single-column form control and emits data via onChangeData

  return (
    <>
      {/* Title (styled like Subject) */}
      {/* Render in required order: Subject, Category, Visibility, Description */}
      <InputField
        label="Subject"
        placeholder="Enter article title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        error={errors.title}
      />

      <div className={inputStyles.inputFieldContainer}>
        <label className={inputStyles.label}>
          Category
          <span className={inputStyles.required}> *</span>
        </label>
        <select
          className={`${inputStyles.input} ${errors.category ? inputStyles.inputError : ''}`}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          aria-required="true"
        >
          <option value="">— Select category —</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        {errors.category && <div className={inputStyles.errorMessage}>{errors.category}</div>}
      </div>

      <div className={inputStyles.inputFieldContainer}>
        <label className={inputStyles.label}>
          Visibility
          <span className={inputStyles.required}> *</span>
        </label>
        <select
          className={`${inputStyles.input} ${errors.visibility ? inputStyles.inputError : ''}`}
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          aria-required="true"
        >
          <option value="">— Select visibility —</option>
          <option value="Employee">Employee</option>
          <option value="Ticket Coordinator">Ticket Coordinator</option>
          <option value="System Admin">System Admin</option>
        </select>
        {errors.visibility && <div className={inputStyles.errorMessage}>{errors.visibility}</div>}
      </div>

      {/* Description */}
      <div className={inputStyles.inputFieldContainer}>
        <label className={inputStyles.label}>
          Description
          <span className={inputStyles.required}> *</span>
        </label>
        <textarea
          className={`${inputStyles.input} ${errors.content ? inputStyles.inputError : ''}`}
          placeholder="Enter article content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          aria-invalid={!!errors.content}
          aria-required="true"
          style={{ minHeight: 140, paddingTop: 14, paddingBottom: 14 }}
        />
        {errors.content && <div className={inputStyles.errorMessage}>{errors.content}</div>}
      </div>

      {/* Save button removed: parent form (FormActions) handles submit */}
    </>
  );
};

export default ArticleEditor;
