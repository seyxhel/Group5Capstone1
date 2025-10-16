import React from 'react';
import styles from './CategoryList.module.css';

const CategoryList = ({ categories = [], onSelect }) => (
  <div className={styles.container}>
    {categories.map(c => (
      <button key={c.id} className={styles.categoryBtn} onClick={() => onSelect && onSelect(c)}>
        {c.name}
      </button>
    ))}
  </div>
);

export default CategoryList;
