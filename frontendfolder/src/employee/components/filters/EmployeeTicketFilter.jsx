import FilterPanel from "../../../shared/table/FilterPanel";

/**
 * EmployeeTicketFilter - Wrapper component for Employee ticket filtering
 * Used in: Active Tickets, Ticket Records pages
 * 
 * Filters (in order):
 * 1. Status
 * 2. Priority
 * 3. Category
 * 4. Sub-Category
 * 5. Start Date
 * 6. End Date
 */
export default function EmployeeTicketFilter({
  onApply,
  onReset,
  initialFilters = {},
  hideToggleButton = true,
  // Allow customization for Active Tickets vs Ticket Records
  statusOptions,
  // Can override other options if needed
  priorityOptions,
  categoryOptions,
  subCategoryOptions,
}) {
  // Default status options for Active Tickets
  const defaultActiveStatusOptions = [
    { label: "Pending", category: "Active" },
    { label: "In Progress", category: "Active" },
    { label: "On Hold", category: "Active" },
    { label: "Resolved", category: "Complete" },
  ];

  // Default status options for Ticket Records
  const defaultRecordStatusOptions = [
    { label: "Closed", category: "Completed" },
    { label: "Rejected", category: "Completed" },
    { label: "Withdrawn", category: "Completed" },
  ];

  // Default priority options (same for both pages)
  const defaultPriorityOptions = [
    { label: "Critical", category: "Urgent" },
    { label: "High", category: "Important" },
    { label: "Medium", category: "Normal" },
    { label: "Low", category: "Minor" },
  ];

  // Default category options (same for both pages)
  const defaultCategoryOptions = [
    { label: "Hardware", category: "IT" },
    { label: "Software", category: "IT" },
    { label: "Network", category: "IT" },
    { label: "Account", category: "Access" },
    { label: "Other", category: "General" },
  ];

  // Default sub-category options (same for both pages)
  const defaultSubCategoryOptions = [
    { label: "Desktop", category: "Hardware" },
    { label: "Laptop", category: "Hardware" },
    { label: "Printer", category: "Hardware" },
    { label: "Application", category: "Software" },
    { label: "Operating System", category: "Software" },
    { label: "WiFi", category: "Network" },
    { label: "VPN", category: "Network" },
    { label: "Password Reset", category: "Account" },
    { label: "Access Request", category: "Account" },
  ];

  return (
    <FilterPanel
      // Use base FilterPanel with custom configuration
      hideToggleButton={hideToggleButton}
      onApply={onApply}
      onReset={onReset}
      initialFilters={initialFilters}
      
      // Filter order: Status, Priority, Category, Sub-Category, Start Date, End Date
      statusLabel="Status"
      priorityLabel="Priority"
      categoryLabel="Category"
      subCategoryLabel="Sub-Category"
      
      // Options (can be overridden by props)
      statusOptions={statusOptions || defaultActiveStatusOptions}
      priorityOptions={priorityOptions || defaultPriorityOptions}
      categoryOptions={categoryOptions || defaultCategoryOptions}
      subCategoryOptions={subCategoryOptions || defaultSubCategoryOptions}
      
      // Show date filters (Employee needs Start Date and End Date)
      showDateFilters={true}
      
      // Hide SLA Status (Employee doesn't see this)
      showSLAStatus={false}
    />
  );
}

// Export preset status options for convenience
export const ACTIVE_TICKET_STATUS_OPTIONS = [
  { label: "Pending", category: "Active" },
  { label: "In Progress", category: "Active" },
  { label: "On Hold", category: "Active" },
  { label: "Resolved", category: "Complete" },
];

export const TICKET_RECORD_STATUS_OPTIONS = [
  { label: "Closed", category: "Completed" },
  { label: "Rejected", category: "Completed" },
  { label: "Withdrawn", category: "Completed" },
];
