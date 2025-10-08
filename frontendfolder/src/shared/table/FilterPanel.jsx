import { useState } from "react";
import styles from "./FilterPanel.module.css";

const defaultCategoryOptions = [
  { label: "Hardware", category: "IT" },
  { label: "Software", category: "IT" },
  { label: "Network", category: "IT" },
  { label: "Account", category: "Access" },
  { label: "Other", category: "General" },
];

const defaultStatusOptions = [
  { label: "New", category: "Active" },
  { label: "Open", category: "Active" },
  { label: "In Progress", category: "Active" },
  { label: "On Hold", category: "Active" },
  { label: "Resolved", category: "Completed" },
  { label: "Closed", category: "Completed" },
  { label: "Rejected", category: "Completed" },
  { label: "Withdrawn", category: "Completed" },
];

const defaultPriorityOptions = [
  { label: "Critical", category: "Urgent" },
  { label: "High", category: "Important" },
  { label: "Medium", category: "Normal" },
  { label: "Low", category: "Minor" },
];

const defaultSLAStatusOptions = [
  { label: "On Time", category: "Good" },
  { label: "Due Soon", category: "Warning" },
  { label: "Overdue", category: "Critical" },
];

const defaultAssignedAgentOptions = [
  { label: "Unassigned", category: "None" },
];

export default function FilterPanel({
  onApply,
  onReset,
  categoryOptions = defaultCategoryOptions,
  statusOptions = defaultStatusOptions,
  priorityOptions = defaultPriorityOptions,
  slaStatusOptions = defaultSLAStatusOptions,
  assignedAgentOptions = defaultAssignedAgentOptions,
  initialFilters = {},
  hideToggleButton = false, // New prop to hide the built-in toggle
  categoryLabel = "Category", // Custom label for category filter
  statusLabel = "Status", // Custom label for status filter
  priorityLabel = "Priority", // Custom label for priority filter
  showDateFilters = true, // New prop to show/hide date range filters
}) {
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    category: initialFilters.category || null,
    status: initialFilters.status || null,
    priority: initialFilters.priority || null,
    slaStatus: initialFilters.slaStatus || null,
    assignedAgent: initialFilters.assignedAgent || null,
    startDate: initialFilters.startDate || "",
    endDate: initialFilters.endDate || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleDropdownChange = (name, option) => {
    setFilters((prev) => ({ ...prev, [name]: option }));
  };

  const handleApply = () => {
    if (onApply) onApply(filters);
    setShowFilter(false); // Auto-close after applying
  };

  const handleReset = () => {
    const resetFilters = {
      category: null,
      status: null,
      priority: null,
      slaStatus: null,
      assignedAgent: null,
      startDate: "",
      endDate: "",
    };
    setFilters(resetFilters);
    if (onReset) onReset(resetFilters);
  };

  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== null && value !== ""
  ).length;

  return (
    <div className={styles.filterPanel}>
      {!hideToggleButton && (
        <div className={styles.fpShowFilter} onClick={() => setShowFilter(!showFilter)}>
          <span>{showFilter ? "Hide Filter" : "Show Filter"}</span>
        </div>
      )}

      {(hideToggleButton || showFilter) && (
        <div className={styles.filterPanelCont}>
          {/* Category Dropdown */}
          <div className={styles.filterGroup}>
            <label htmlFor="category">{categoryLabel}</label>
            <select
              name="category"
              className={styles.dropdown}
              value={filters.category?.label || ""}
              onChange={(e) => {
                const selected = categoryOptions.find(opt => opt.label === e.target.value);
                handleDropdownChange("category", selected);
              }}
            >
              <option value="">Select {categoryLabel.toLowerCase()}</option>
              {categoryOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div className={styles.filterGroup}>
            <label htmlFor="status">{statusLabel}</label>
            <select
              name="status"
              className={styles.dropdown}
              value={filters.status?.label || ""}
              onChange={(e) => {
                const selected = statusOptions.find(opt => opt.label === e.target.value);
                handleDropdownChange("status", selected);
              }}
            >
              <option value="">Select {statusLabel.toLowerCase()}</option>
              {statusOptions.map((option) => (
                <option key={option.label} value={option.label}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Dropdown - only show if priorityOptions provided */}
          {priorityOptions && priorityOptions.length > 0 && (
            <div className={styles.filterGroup}>
              <label htmlFor="priority">{priorityLabel}</label>
              <select
                name="priority"
                className={styles.dropdown}
                value={filters.priority?.label || ""}
                onChange={(e) => {
                  const selected = priorityOptions.find(opt => opt.label === e.target.value);
                  handleDropdownChange("priority", selected);
                }}
              >
                <option value="">Select {priorityLabel.toLowerCase()}</option>
                {priorityOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* SLA Status Dropdown */}
          {slaStatusOptions && slaStatusOptions.length > 0 && (
            <div className={styles.filterGroup}>
              <label htmlFor="slaStatus">SLA Status</label>
              <select
                name="slaStatus"
                className={styles.dropdown}
                value={filters.slaStatus?.label || ""}
                onChange={(e) => {
                  const selected = slaStatusOptions.find(opt => opt.label === e.target.value);
                  handleDropdownChange("slaStatus", selected);
                }}
              >
                <option value="">Select SLA status</option>
                {slaStatusOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Assigned Agent Dropdown */}
          {assignedAgentOptions && assignedAgentOptions.length > 0 && (
            <div className={styles.filterGroup}>
              <label htmlFor="assignedAgent">Assigned Agent</label>
              <select
                name="assignedAgent"
                className={styles.dropdown}
                value={filters.assignedAgent?.label || ""}
                onChange={(e) => {
                  const selected = assignedAgentOptions.find(opt => opt.label === e.target.value);
                  handleDropdownChange("assignedAgent", selected);
                }}
              >
                <option value="">Select agent</option>
                {assignedAgentOptions.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Start Date - only show if showDateFilters is true */}
          {showDateFilters && (
            <div className={styles.filterGroup}>
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                className={styles.dateTime}
                value={filters.startDate}
                onChange={handleChange}
              />
            </div>
          )}

          {/* End Date - only show if showDateFilters is true */}
          {showDateFilters && (
            <div className={styles.filterGroup}>
              <label htmlFor="endDate">End Date</label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                className={styles.dateTime}
                value={filters.endDate}
                onChange={handleChange}
              />
            </div>
          )}

          {/* Actions */}
          <div className={styles.filterActions}>
            <button
              type="button"
              className={styles.applyButton}
              onClick={handleApply}
            >
              Apply
            </button>
            <button
              type="button"
              className={styles.resetButton}
              onClick={handleReset}
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
