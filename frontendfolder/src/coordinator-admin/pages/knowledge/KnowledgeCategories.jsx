import React, { useEffect, useState } from 'react';
import styles from './knowledge.module.css';
import kbService from '../../../services/kbService';
import CategoryList from '../../../shared/kb/CategoryList';

const KnowledgeCategories = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    kbService.listCategories().then(setCategories);
  }, []);

  return (
    <div className={styles.container}>
      <h1>Manage Categories</h1>
      <p>Create and organize categories and subcategories.</p>

      <div style={{ marginTop: 12 }}>
        <CategoryList categories={categories} onSelect={(c)=>console.log('selected cat', c)} />
      </div>
    </div>
  );
};

export default KnowledgeCategories;
