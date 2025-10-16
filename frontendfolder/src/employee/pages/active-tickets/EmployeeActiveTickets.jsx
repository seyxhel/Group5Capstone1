import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { backendTicketService } from "../../../services/backend/ticketService";
import { toEmployeeStatus } from "../../../utilities/helpers/statusMapper";
import authService from "../../../utilities/service/authService";
import getTicketActions from "../../../shared/table/TicketActions";

import TablePagination from "../../../shared/table/TablePagination";
import EmployeeTicketFilter, { ACTIVE_TICKET_STATUS_OPTIONS } from "../../components/filters/EmployeeTicketFilter";
import EmployeeActiveTicketsWithdrawTicketModal from "../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal";
import EmployeeActiveTicketsCloseTicketModal from "../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal";
import styles from './EmployeeActiveTickets.module.css';

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
  "all-active-tickets": ["New", "Open", "In Progress", "Pending", "On Hold", "Resolved"],
  "pending-tickets": ["New", "Open", "Pending"], // Employee "Pending" = Admin "New", "Open" or "Pending"
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
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
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
  const [loading, setLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Modals
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [selectedClose, setSelectedClose] = useState(null);

  // Fetch tickets from backend
  useEffect(() => {
    let isMounted = true;

    const fetchTickets = async () => {
      try {
        setLoading(true);
        // Fetch all tickets from backend (will be filtered by employee on backend)
        const tickets = await backendTicketService.getAllTickets();
        
        if (!isMounted) return;

        // Normalize ticket data to handle backend field names
        const normalizedTickets = tickets.map(ticket => ({
          id: ticket.id,
          ticketNumber: ticket.ticket_number || ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status,
          priorityLevel: ticket.priority || ticket.priorityLevel,
          category: ticket.category,
          subCategory: ticket.sub_category || ticket.subCategory,
          dateCreated: ticket.submit_date || ticket.dateCreated,
          lastUpdated: ticket.update_date || ticket.lastUpdated,
          description: ticket.description,
          assignedTo: ticket.assigned_to || ticket.assignedTo,
          department: ticket.department
        }));

        setAllActiveTickets(normalizedTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        if (isMounted) setAllActiveTickets([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchTickets();

    return () => {
      isMounted = false;
    };
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

  // Paginate tickets
  const displayedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, currentPage, pageSize]);

  const handleWithdraw = (ticket) => {
    setSelectedWithdraw(ticket);
  };

  const handleClose = (ticket) => {
    setSelectedClose(ticket);
  };

  const handleView = (ticket) => {
    navigate(`/employee/ticket-tracker/${ticket.ticketNumber}`);
  };

  const [showFilter, setShowFilter] = useState(false);

  if (loading) {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.loadingMessage}>Loading tickets...</div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Top bar with Show Filter button */}
      <div className={styles.topBar}>
        <button 
          className={styles.showFilterButton}
          onClick={() => setShowFilter(!showFilter)}
        >
          {showFilter ? 'Hide Filter' : 'Show Filter'}
        </button>
      </div>

      {/* Filter Panel - outside table section */}
      {showFilter && (
        <EmployeeTicketFilter
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
      )}

      <div className={styles.tableSection}>

        {/* Table header */}
        <div className={styles.tableHeader}>
          <h2>{headingMap[filter] || "Active Tickets"}</h2>
          <div className={styles.tableActions}>
            <input
              className={styles.searchBar}
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Table wrapper */}
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <TableHeader />
            </thead>
            <tbody>
              {displayedTickets.length > 0 ? (
                displayedTickets.map((ticket, index) => (
                  <TableItem 
                    key={index} 
                    ticket={ticket}
                    onView={handleView}
                    onWithdraw={handleWithdraw}
                    onClose={handleClose}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan="8" className={styles.emptyMessage}>
                    No active tickets found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className={styles.tablePagination}>
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredTickets.length}
            initialItemsPerPage={pageSize}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setPageSize}
            alwaysShow={true}
          />
        </div>

      </div>

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
    </div>
  );
};

export default EmployeeActiveTickets;