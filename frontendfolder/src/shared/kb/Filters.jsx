import React from 'react';
import styles from './Filters.module.css';

// Simplified filters: status & visibility removed (managed by sysadmin).
// Provide a basic search input for article query filtering.
const Filters = ({ query = '', onQueryChange, visibility = '', onVisibilityChange }) => (
  <div className={styles.filters}>
    <input
      type="search"
      placeholder="Search articles..."
      value={query}
      onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
      aria-label="Search articles"
    />
    <select value={visibility} onChange={(e)=>onVisibilityChange && onVisibilityChange(e.target.value)}>
      <option value="">All visibility</option>
      <option value="employee">Employee</option>
      <option value="coordinator">Coordinator</option>
      <option value="admin">Admin</option>
    </select>
  </div>
);

export default Filters;
