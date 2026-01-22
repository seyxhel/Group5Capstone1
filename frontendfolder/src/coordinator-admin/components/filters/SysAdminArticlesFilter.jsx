import FilterPanel from "../../../shared/table/FilterPanel";

export default function SysAdminArticlesFilter({
  onApply,
  onReset,
  initialFilters = {},
  hideToggleButton = true,
  // Whether the filter should be visible by default when toggle is shown
  initialShow = false,
  categoryOptions,
  visibilityOptions,
  sortOptions,
}) {
  const defaultVisibilityOptions = [
    { label: "Employee" },
    { label: "Ticket Coordinator" },
    { label: "System Admin" },
  ];

  const defaultSortOptions = [
    { label: "Sort Likes", value: "likes_desc" },
    { label: "Most Dislikes", value: "dislikes_desc" },
    { label: "Newest", value: "date_desc" },
  ];

  return (
    <FilterPanel
      hideToggleButton={hideToggleButton}
      initialShow={initialShow}
      fields={[
        'category',
        'status',
        'sort',
        'startDate',
        'endDate',
      ]}
      sortOptions={sortOptions || defaultSortOptions}
      onApply={onApply}
      onReset={onReset}
      initialFilters={initialFilters}
      categoryLabel="Category"
      statusLabel="Visibility"
      categoryOptions={categoryOptions || []}
      statusOptions={visibilityOptions || defaultVisibilityOptions}
      showDateFilters={true}
      showStatus={true}
      categoryFirst={true}
      priorityOptions={[]}
      subCategoryOptions={[]}
    />
  );
}

// Export visibility options for convenience
export const ARTICLES_VISIBILITY_OPTIONS = [
  { label: "Employee" },
  { label: "Ticket Coordinator" },
  { label: "System Admin" },
];
