import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import styles from './TablePagination.module.css';

const TablePagination = () => {
  return (
    <div className={styles.paginationContainer}>
      {/* Items Per Page Selector */}
      <div className={styles.itemsPerPage}>
        <label htmlFor="itemsPerPageInput" className={styles.label}>
          Show
        </label>
        <input
          id="itemsPerPageInput"
          type="number"
          min="1"
          max="100"
          defaultValue="10"
          className={styles.itemsPerPageInput}
          aria-label="Items per page"
        />
        <span className={styles.label}>items per page</span>
      </div>

      {/* Page Navigation Controls */}
      <div className={styles.paginationControls}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Previous page"
          disabled
        >
          <FaChevronLeft />
        </button>

        <div className={styles.pageInfo}>
          Page{' '}
          <input
            type="text"
            defaultValue="1"
            className={styles.pageInput}
            aria-label="Current page"
          />{' '}
          of 5
        </div>

        <button
          type="button"
          className={styles.navBtn}
          aria-label="Next page"
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
