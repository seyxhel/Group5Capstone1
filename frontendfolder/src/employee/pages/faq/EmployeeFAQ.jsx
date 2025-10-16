import React, { useEffect, useState } from 'react';
import styles from './employee-faq.module.css';
import kbService from '../../../services/kbService';
import SearchBar from '../../../shared/kb/SearchBar';
import CategoryList from '../../../shared/kb/CategoryList';
import ArticleList from '../../../shared/kb/ArticleList';
import ArticlePreview from '../../../shared/kb/ArticlePreview';

const EmployeeFAQ = () => {
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState(null);
  const [previewArticle, setPreviewArticle] = useState(null);

  useEffect(() => {
    kbService.listCategories().then(setCategories);
  }, []);

  useEffect(() => {
    kbService.listPublishedArticles({ query, category_id: selectedCat?.id, visibility: 'employee' }).then(setArticles);
  }, [query, selectedCat]);

  return (
    <div className={styles.container}>
      <h1>Employee FAQ</h1>
      <p>Public-friendly FAQs and search for employees and coordinators.</p>

      <div style={{ marginTop: 12 }}>
        <SearchBar value={query} onChange={setQuery} />
      </div>

      <div style={{ marginTop: 12 }}>
        <CategoryList categories={categories.filter(c => c.visibility !== 'admin')} onSelect={setSelectedCat} />
      </div>

      <div style={{ marginTop: 12 }}>
        <ArticleList articles={articles} onOpen={setPreviewArticle} />
      </div>

      {previewArticle && (
        <ArticlePreview article={previewArticle} onClose={() => setPreviewArticle(null)} />
      )}
    </div>
  );
};

export default EmployeeFAQ;
