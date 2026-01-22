import { useState, useMemo } from "react";
import InputField from "../components/InputField";
import Skeleton from "../components/Skeleton/Skeleton";
import TablePagination from "./TablePagination";
import styles from './Table.module.css';

/**
 * Centralized Table Component
 * Provides a unified layout structure:
 * 1. Show Filter / Hide Filter button
 * 2. Filter Panel (conditionally rendered)
 * 3. Table with header
 * 4. TablePagination
 */
const Table = ({
  // Data
  data = [],
  columns = [],
  
  // Loading state
  isLoading = false,
  loadingRows = 5,
  
  // Header
  title = "Table",
  
  // Search
  searchable = false,
  searchPlaceholder = "Search...",
  searchValue = "",
  onSearchChange,
  
  // Filter
  filterComponent: FilterComponent = null,
  showFilter = false,
  onShowFilterChange,
  
  // Pagination
  currentPage = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  onPageSizeChange,
  
  // Table customization
  emptyMessage = "No data found",
  tableClassName = "",
  variant = "default", // activeTickets, ticketRecords, default
  
  // Additional props
  actions,
  ...rest
}) => {
  const [internalShowFilter, setInternalShowFilter] = useState(showFilter);
  
  // Use controlled or internal filter state
  const filterShown = onShowFilterChange ? showFilter : internalShowFilter;
  const handleFilterToggle = () => {
    if (onShowFilterChange) {
      onShowFilterChange(!showFilter);
    } else {
      setInternalShowFilter(!internalShowFilter);
    }
  };
  
  // Paginate data if totalItems not provided
  const paginatedData = useMemo(() => {
    if (totalItems !== undefined) {
      // External pagination
      return data;
    }
    // Internal pagination
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return data.slice(startIndex, endIndex);
  }, [data, currentPage, pageSize, totalItems]);
  
  const effectiveTotalItems = totalItems !== undefined ? totalItems : data.length;
  
  const renderTableHeader = () => {
    return (
      <tr>
        {columns.map((column, index) => (
          <th key={column.key || index}>
            {column.label}
          </th>
        ))}
      </tr>
    );
  };
  
  const renderTableRow = (item, rowIndex) => {
    return (
      <tr key={rowIndex}>
        {columns.map((column, colIndex) => {
          const value = item[column.key];
          const displayValue = column.render ? column.render(value, item) : value;
          // If this is the actions column, wrap the content in a left-aligned flex container
          if (column.key === 'actions' || column.key === 'action') {
            return (
              <td key={column.key || colIndex}>
                <div className={styles.actionsCell}>{displayValue}</div>
              </td>
            );
          }

          return (
            <td key={column.key || colIndex}>
              {displayValue}
            </td>
          );
        })}
      </tr>
    );
  };
  
  const renderLoadingRows = () => {
    return Array.from({ length: loadingRows }).map((_, index) => (
      <tr key={`loading-${index}`}>
        {columns.map((column, colIndex) => (
          <td key={colIndex}>
            <Skeleton width={column.skeletonWidth || "80px"} />
          </td>
        ))}
      </tr>
    ));
  };
  
  const renderEmptyRow = () => {
    return (
      <tr>
        <td colSpan={columns.length} className={styles.emptyMessage}>
          {emptyMessage}
        </td>
      </tr>
    );
  };
  
  return (
    <div className={styles.pageContainer}>
      {/* Top bar with Show Filter button */}
      {FilterComponent && (
        <div className={styles.topBar}>
          <button 
            className={styles.showFilterButton}
            onClick={handleFilterToggle}
          >
            {filterShown ? 'Hide Filter' : 'Show Filter'}
          </button>
        </div>
      )}
      
      {/* Filter Panel - outside table section */}
      {FilterComponent && filterShown && (
        <div className={styles.filterSection}>
          <FilterComponent key={filterShown ? "filter-shown" : "filter-hidden"} />
        </div>
      )}
      
      <div className={styles.tableSection}>
        {/* Table header - INSIDE bordered section */}
        <div className={`${styles.tableHeader} ${variant === 'ticketRecords' ? styles.ticketRecords : ''}`}>
          <h2>{title}</h2>
          <div className={styles.tableActions}>
            {searchable && (
              <InputField
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={onSearchChange}
                inputStyle={{ width: '260px' }}
              />
            )}
            {actions && actions}
          </div>
        </div>
        
        {/* Table wrapper */}
        <div className={styles.tableWrapper}>
          <table className={`${styles.table} ${tableClassName}`}>
            <thead>
              {renderTableHeader()}
            </thead>
            <tbody>
              {isLoading
                ? renderLoadingRows()
                : paginatedData.length > 0
                ? paginatedData.map((item, index) => renderTableRow(item, index))
                : renderEmptyRow()
              }
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!isLoading && (
          <div className={`${styles.tablePagination} ${variant === 'activeTickets' ? styles.activeTickets : ''}`}>
            <TablePagination
              currentPage={currentPage}
              totalItems={effectiveTotalItems}
              initialItemsPerPage={pageSize}
              onPageChange={onPageChange}
              onItemsPerPageChange={onPageSizeChange}
              alwaysShow={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Table;