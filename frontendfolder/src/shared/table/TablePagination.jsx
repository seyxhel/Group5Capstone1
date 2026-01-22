import { useState, useEffect } from "react";
import styles from "./TablePagination.module.css";

const TablePagination = ({
  totalItems = 0,
  currentPage = 1,
  initialItemsPerPage = 10,
  onPageChange,
  onItemsPerPageChange,
  alwaysShow = false,
  pageSizeOptions = [5, 10, 20, 50, 100],
}) => {
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  useEffect(() => {
    onItemsPerPageChange?.(itemsPerPage);
  }, [itemsPerPage, onItemsPerPageChange]);

  // Ensure current page is valid when totalItems or itemsPerPage change.
  useEffect(() => {
    if (!onPageChange) return;
    // Recompute total pages and clamp current page if necessary
    const newTotalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    if (currentPage > newTotalPages) {
      onPageChange(newTotalPages);
    } else if (currentPage < 1) {
      onPageChange(1);
    }
  }, [totalItems, itemsPerPage, currentPage, onPageChange]);

  if (!alwaysShow && totalItems <= itemsPerPage) {
    return null; // hide if everything fits on one page
  }

  const handlePageClick = (page) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange?.(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setItemsPerPage(value);
    }
  };

  // When itemsPerPage changes, reset to first page for predictable UX
  useEffect(() => {
    if (onPageChange) onPageChange(1);
  }, [itemsPerPage, onPageChange]);

  const renderPageNumbers = () => {
    const pages = [];

    // For large number of pages, show a windowed range with ellipses
    const maxButtons = 13; // keep UI compact
    if (totalPages <= maxButtons) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(renderPageButton(i));
      }
      return pages;
    }

    // Always show first two and last two pages, and a sliding window around current
    const createRange = (start, end) => {
      for (let i = start; i <= end; i++) pages.push(renderPageButton(i));
    };

    const around = 2; // show current +/- around
    // first pages
    createRange(1, 2);

    // left ellipsis
    const left = Math.max(3, currentPage - around);
    if (left > 3) pages.push(<span key="l-ellipsis" className={styles.ellipsis}>…</span>);

    // middle range
    const midStart = Math.max(3, currentPage - around);
    const midEnd = Math.min(totalPages - 2, currentPage + around);
    createRange(midStart, midEnd);

    // right ellipsis
    const right = Math.min(totalPages - 2, currentPage + around);
    if (right < totalPages - 2) pages.push(<span key="r-ellipsis" className={styles.ellipsis}>…</span>);

    // last pages
    createRange(totalPages - 1, totalPages);

    return pages;
  };

  const renderPageButton = (i) => (
    <button
      key={i}
      className={`${styles.pageButton} ${i === currentPage ? styles.active : ""}`}
      onClick={() => handlePageClick(i)}
      type="button"
    >
      {i}
    </button>
  );

  return (
    <div className={styles.paginationContainer}>
      {/* Left Side: Page Size Selector */}
      <div className={styles.pageSizeSelector}>
        <label htmlFor="pageSize">Show</label>
        <select
          id="pageSize"
          value={itemsPerPage}
          onChange={handleItemsPerPageChange}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        <span>items per page</span>
      </div>

      {/* Right Side: Page Navigation */}
      <div className={styles.pageNavigation}>
        <button
          onClick={() => handlePageClick(currentPage - 1)}
          disabled={currentPage === 1}
          type="button"
          className={styles.navButton}
        >
          Prev
        </button>
        {renderPageNumbers()}
        <button
          onClick={() => handlePageClick(currentPage + 1)}
          disabled={currentPage === totalPages}
          type="button"
          className={styles.navButton}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default TablePagination;
