import React from 'react';
import styles from './SearchBar.module.css';

const SearchBar = ({ value, onChange, placeholder='Search articles...' }) => (
  <div className={styles.searchWrap}>
    <input value={value} onChange={(e)=>onChange && onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

export default SearchBar;
