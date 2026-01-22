import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployeeTickets } from "../../../utilities/storages/ticketStorage";
import { toEmployeeStatus } from "../../../utilities/helpers/statusMapper";
import authService from "../../../utilities/service/authService";
import getTicketActions from "../../../shared/table/TicketActions";
import Table from "../../../shared/table/Table";
import tableStyles from "../../../shared/table/Table.module.css";
import EmployeeTicketFilter, { ACTIVE_TICKET_STATUS_OPTIONS } from "../../components/filters/EmployeeTicketFilter";
import EmployeeActiveTicketsWithdrawTicketModal from "../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal";
import EmployeeActiveTicketsCloseTicketModal from "../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal";

const headingMap = {
  "all-active-tickets": "All Active Tickets",
  "pending-tickets": "Pending Tickets",
  "in-progress-tickets": "In Progress Tickets",
  "on-hold-tickets": "On Hold Tickets",
  "resolved-tickets": "Resolved Tickets",
};

// Map employee filter URLs to actual ticket statuses (stored as admin statuses)
// Employee sees "Pending" for both "New" and "Open" admin statuses
const statusMap = {
  "all-active-tickets": ["New", "Open", "In Progress", "On Hold", "Resolved"],
  "pending-tickets": ["New", "Open"], // Employee "Pending" = Admin "New" or "Open"
  "in-progress-tickets": ["In Progress"],
  "on-hold-tickets": ["On Hold"],
  "resolved-tickets": ["Resolved"],
};

// TableHeader component
function TableHeader() {
  return (
    <tr>
      <th>Ticket No.</th>
      <th>Subject</th>
      <th>Status</th>
      <th>Priority</th>
      <th>Category</th>
      <th>Sub Category</th>
      <th>Date Created</th>
      <th>Actions</th>
    </tr>
  );
}

// TableItem component
function TableItem({ ticket, onView, onWithdraw, onClose }) {
  // Convert status to employee view for display
  const displayStatus = toEmployeeStatus(ticket.status);
  
  const isWithdrawAllowed = () => {
    const allowed = ["pending", "in progress", "on hold"];
    return allowed.includes(displayStatus.toLowerCase());
  };

  const isCloseAllowed = () => {
    return displayStatus.toLowerCase() === "resolved";
  };

  return (
    <tr>
      <td>{ticket.ticketNumber}</td>
      <td>
        <div className={styles.subjectCell} title={ticket.subject}>
          {ticket.subject}
        </div>
      </td>
      <td>
        <div className={`${styles.status} ${styles[`status-${displayStatus.replace(/\s+/g, "-").toLowerCase()}`]}`}>
          {displayStatus}
        </div>
      </td>
      <td>
        {ticket.priorityLevel ? (
          <div className={`${styles.priority} ${styles[`priority-${ticket.priorityLevel.toLowerCase()}`]}`}>
            {ticket.priorityLevel}
          </div>
        ) : (
          <div className={`${styles.priority} ${styles['priority-not-set']}`}>
            Not Set
          </div>
        )}
      </td>
      <td>{ticket.category}</td>
      <td>{ticket.subCategory}</td>
      <td>{ticket.dateCreated?.slice(0, 10)}</td>
      <td>
        <div className={tableStyles.actionsCell}>
          {getTicketActions("view", ticket, { onView })}
          {isWithdrawAllowed() && getTicketActions("withdraw", ticket, { onWithdraw })}
          {isCloseAllowed() && getTicketActions("delete", ticket, { onDelete: onClose })}
        </div>
      </td>
    </tr>
  );
}

const EmployeeActiveTickets = () => {
  const { filter = "all-active-tickets" } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [allActiveTickets, setAllActiveTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [selectedClose, setSelectedClose] = useState(null);

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      // Get current logged-in user and only fetch their tickets
      const currentUser = authService.getCurrentUser();
      const tickets = getEmployeeTickets(currentUser?.id);
      setAllActiveTickets(tickets);
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const [activeFilters, setActiveFilters] = useState({
    status: null,
    priority: null,
    category: null,
    subCategory: null,
    startDate: "",
    endDate: "",
  });

  const filteredTickets = useMemo(() => {
    const allowedStatuses = statusMap[filter] || [];
    
    let filtered = allActiveTickets.filter(ticket =>
      allowedStatuses.includes(ticket.status)
    );

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ({ ticketNumber, subject }) =>
          ticketNumber?.toLowerCase().includes(term) ||
          subject?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (activeFilters.category) {
      filtered = filtered.filter(
        ticket => ticket.category === activeFilters.category.label
      );
    }

    // Apply sub-category filter
    if (activeFilters.subCategory) {
      filtered = filtered.filter(
        ticket => ticket.subCategory === activeFilters.subCategory.label
      );
    }

    // Apply status filter (need to map employee status back to admin statuses)
    if (activeFilters.status) {
      const employeeStatus = activeFilters.status.label;
      filtered = filtered.filter(ticket => {
        const displayStatus = toEmployeeStatus(ticket.status);
        return displayStatus === employeeStatus;
      });
    }

    // Apply priority filter
    if (activeFilters.priority) {
      filtered = filtered.filter(
        ticket => ticket.priorityLevel === activeFilters.priority.label
      );
    }

    // Apply date range filter
    if (activeFilters.startDate) {
      filtered = filtered.filter(
        ticket => ticket.dateCreated >= activeFilters.startDate
      );
    }
    if (activeFilters.endDate) {
      filtered = filtered.filter(
        ticket => ticket.dateCreated <= activeFilters.endDate
      );
    }

    return filtered;
  }, [allActiveTickets, filter, searchTerm, activeFilters]);

  const handleWithdraw = (ticket) => {
    setSelectedWithdraw(ticket);
  };

  const handleClose = (ticket) => {
    setSelectedClose(ticket);
  };

  const handleView = (ticket) => {
    navigate(`/employee/ticket-tracker/${ticket.ticketNumber}`);
  };

  const [showFilter, setShowFilter] = useState(true);

  // Helper functions for actions
  const isWithdrawAllowed = (ticket) => {
    const displayStatus = toEmployeeStatus(ticket.status);
    const allowed = ["pending", "in progress", "on hold"];
    return allowed.includes(displayStatus.toLowerCase());
  };

  const isCloseAllowed = (ticket) => {
    const displayStatus = toEmployeeStatus(ticket.status);
    return displayStatus.toLowerCase() === "resolved";
  };

  // Define table columns
  const columns = [
    { 
      key: 'ticketNumber', 
      label: 'Ticket No.',
      skeletonWidth: '100px',
      render: (value) => value
    },
    { 
      key: 'subject', 
      label: 'Subject',
      skeletonWidth: '200px',
      render: (value) => (
        <div className="subjectCell" title={value}>
          {value}
        </div>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      skeletonWidth: '80px',
      render: (value) => {
        const displayStatus = toEmployeeStatus(value);
        return (
          <div className={`status-${displayStatus.replace(/\s+/g, "-").toLowerCase()}`}>
            {displayStatus}
          </div>
        );
      }
    },
    { 
      key: 'priorityLevel', 
      label: 'Priority',
      skeletonWidth: '80px',
      render: (value) => {
        return value ? (
          <div className={`priority-${value.toLowerCase()}`}>
            {value}
          </div>
        ) : (
          <div className="priority-not-set">
            Not Set
          </div>
        );
      }
    },
    { key: 'category', label: 'Category', skeletonWidth: '100px' },
    { key: 'subCategory', label: 'Sub Category', skeletonWidth: '100px' },
    { 
      key: 'dateCreated', 
      label: 'Date Created',
      skeletonWidth: '100px',
      render: (value) => value?.slice(0, 10)
    },
    { 
      key: 'actions', 
      label: 'Actions',
      skeletonWidth: '80px',
      render: (_, ticket) => (
        <>
          {getTicketActions("view", ticket, { onView: handleView })}
          {isWithdrawAllowed(ticket) && getTicketActions("withdraw", ticket, { onWithdraw: handleWithdraw })}
          {isCloseAllowed(ticket) && getTicketActions("delete", ticket, { onDelete: handleClose })}
        </>
      )
    }
  ];

  // Filter component wrapper
  const FilterComponent = () => (
    <EmployeeTicketFilter
      preset="activeTickets"
      initialShow={showFilter}
      statusOptions={ACTIVE_TICKET_STATUS_OPTIONS}
      onApply={setActiveFilters}
      onReset={() => {
        setActiveFilters({
          status: null,
          priority: null,
          category: null,
          subCategory: null,
          startDate: "",
          endDate: "",
        });
        setCurrentPage(1);
      }}
      initialFilters={activeFilters}
    />
  );

  return (
    <>
      <Table
        variant="activeTickets"
        data={filteredTickets}
        columns={columns}
        title={headingMap[filter] || "Active Tickets"}
        searchable
        searchPlaceholder="Search..."
        searchValue={searchTerm}
        onSearchChange={(e) => setSearchTerm(e.target.value)}
        filterComponent={FilterComponent}
        showFilter={showFilter}
        onShowFilterChange={setShowFilter}
        currentPage={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        isLoading={isLoading}
        emptyMessage="No active tickets found for this filter."
      />

      {/* Modals */}
      {selectedWithdraw && (
        <EmployeeActiveTicketsWithdrawTicketModal
          ticket={selectedWithdraw}
          onClose={() => setSelectedWithdraw(null)}
          onSuccess={(ticketNumber) => {
            setAllActiveTickets((prev) =>
              prev.filter((t) => t.ticketNumber !== ticketNumber)
            );
          }}
        />
      )}

      {selectedClose && (
        <EmployeeActiveTicketsCloseTicketModal
          ticket={selectedClose}
          onClose={() => setSelectedClose(null)}
          onSuccess={(ticketNumber) => {
            setAllActiveTickets((prev) =>
              prev.map((t) =>
                t.ticketNumber === ticketNumber
                  ? { ...t, status: "Closed" }
                  : t
              )
            );
          }}
        />
      )}
    </>
  );
};

export default EmployeeActiveTickets;