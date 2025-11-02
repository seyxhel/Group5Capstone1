import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { FaEdit, FaTimes, FaEye } from "react-icons/fa";

import styles from "./CoordinatorAdminTicketManagement.module.css";
import TablePagination from "../../../shared/table/TablePagination";
import CoordinatorTicketFilter from "../../components/filters/CoordinatorTicketFilter";
import { getAllTickets } from "../../../utilities/storages/ticketStorage";
import authService from "../../../utilities/service/authService";
import InputField from '../../../shared/components/InputField';

import CoordinatorAdminOpenTicketModal from "../../components/modals/CoordinatorAdminOpenTicketModal";
import CoordinatorAdminRejectTicketModal from "../../components/modals/CoordinatorAdminRejectTicketModal";
import "react-toastify/dist/ReactToastify.css";

const headingMap = {
  all: "All Tickets",
  new: "New Tickets",
  pending: "Pending Tickets",
  open: "Open Tickets",
  "In-progress": "In Progress Tickets",
  "on-hold": "On Hold Tickets",
  resolved: "Resolved Tickets",
  closed: "Closed Tickets",
  rejected: "Rejected Tickets",
  withdrawn: "Withdrawn Tickets",
};

// Helper function to calculate SLA status
const calculateSLAStatus = (ticket) => {
  if (!ticket.dateCreated) return "Unknown";
  
  const createdDate = new Date(ticket.dateCreated);
  const now = new Date();
  const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
  
  // SLA rules based on priority
  const slaHours = {
    'Critical': 4,
    'High': 8,
    'Medium': 24,
    'Low': 48
  };
  
  const slaLimit = slaHours[ticket.priorityLevel] || 24;
  
  if (hoursDiff > slaLimit) return "Overdue";
  if (hoursDiff > slaLimit * 0.8) return "Due Soon";
  return "On Time";
};

// If a ticket remains 'New' for more than 24 hours it becomes 'Pending' for coordinators/admins
const computeEffectiveStatus = (ticket) => {
  // Normalize input status - treat Submitted/Pending as New for aging purposes
  const rawStatus = (ticket.status || '').toString();
  const lower = rawStatus.toLowerCase();
  const baseIsNew = lower === 'new' || lower === 'submitted' || lower === 'pending';
  try {
    const created = new Date(ticket.createdAt || ticket.dateCreated || ticket.created_at || ticket.submit_date || ticket.submitDate);
    if (baseIsNew && created instanceof Date && !isNaN(created)) {
      const hours = (new Date() - created) / (1000 * 60 * 60);
      if (hours >= 24) return 'Pending';
      return 'New';
    }
  } catch (e) {
    // ignore parse errors
  }
  // For non-new statuses, preserve original casing where possible
  return rawStatus || '';
};

const CoordinatorAdminTicketManagement = () => {
  const { status = "all-tickets" } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [allTickets, setAllTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: null,
    priority: null,
    category: null,
    subCategory: null,
    slaStatus: null,
    startDate: "",
    endDate: "",
  });

  // 👇 New pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const normalizedStatus = status.replace("-tickets", "").toLowerCase();
  // Map URL status to actual ticket status
  // "new" in URL matches "New", "Submitted", or "Pending" statuses (all treated as New)
  // "open" matches "Open" status
  const statusFilter =
    normalizedStatus === "new"
      ? ["new", "submitted", "pending"]
      : normalizedStatus === "all"
      ? null
      : normalizedStatus.replace(/-/g, " ");

  useEffect(() => {
    // Get current user
    const user = authService.getCurrentUser();
    setCurrentUser(user);

  // Fetch all tickets
  // getEmployeeTicketsByRumi() was referenced but doesn't exist; use getAllTickets()
  const fetched = getAllTickets();
    
    // Filter tickets based on user role and department
    // Coordinators and System Admins see tickets from their department
    let ticketsToShow = fetched;
    if (user) {
      if (user.role === 'Ticket Coordinator') {
        // Coordinators should see tickets for their department, and also
        // tickets assigned directly to them. Seeded tickets may use
        // `assignedDepartment` or `department` - check both.
        ticketsToShow = fetched.filter(ticket => {
          const ticketDept = ticket.department || ticket.assignedDepartment || ticket.assigned_to_department || null;
          const assignedToId = typeof ticket.assignedTo === 'object' ? ticket.assignedTo?.id : ticket.assignedTo;
          const isAssignedToUser = assignedToId === user.id || ticket.assignedToId === user.id || ticket.assigned_to === user.id;
          return ticketDept === user.department || isAssignedToUser;
        });
      } else if (user.role === 'System Admin') {
        // System Admins see all tickets
        ticketsToShow = fetched;
      }
    }
    
    setAllTickets(ticketsToShow);
  }, []);

  const filteredTickets = useMemo(() => {
    let result;
      // decorate tickets with an effective status (New older than 24h -> Pending)
      const decorated = allTickets.map(t => ({ ...t, __effectiveStatus: computeEffectiveStatus(t) }));

      if (normalizedStatus === "all") {
        result = decorated;
      } else if (Array.isArray(statusFilter)) {
        // Handle array of statuses (e.g., ["new", "submitted", "pending"])
        result = decorated.filter(
          (ticket) => statusFilter.includes(ticket.__effectiveStatus?.toLowerCase())
        );
      } else if (statusFilter) {
        // Handle single status string
        result = decorated.filter(
          (ticket) => ticket.__effectiveStatus?.toLowerCase() === statusFilter.toLowerCase()
        );
      } else {
        result = decorated;
      }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        ({ ticketNumber, subject }) =>
          ticketNumber?.toLowerCase().includes(term) ||
          subject?.toLowerCase().includes(term)
      );
    }

    // Apply category filter
    if (activeFilters.category) {
      result = result.filter(
        ticket => ticket.category === activeFilters.category.label
      );
    }

    // Apply sub-category filter
    if (activeFilters.subCategory) {
      result = result.filter(
        ticket => ticket.subCategory === activeFilters.subCategory.label
      );
    }

    // Apply status filter
    if (activeFilters.status) {
      result = result.filter(
        ticket => ticket.status === activeFilters.status.label
      );
    }

    // Apply priority filter
    if (activeFilters.priority) {
      result = result.filter(
        ticket => ticket.priorityLevel === activeFilters.priority.label
      );
    }

    // Apply SLA status filter
    if (activeFilters.slaStatus) {
      result = result.filter(ticket => {
        const sla = calculateSLAStatus(ticket);
        return sla === activeFilters.slaStatus.label;
      });
    }

    // Apply date range filter
    if (activeFilters.startDate) {
      result = result.filter(
        ticket => ticket.dateCreated >= activeFilters.startDate
      );
    }
    if (activeFilters.endDate) {
      result = result.filter(
        ticket => ticket.dateCreated <= activeFilters.endDate
      );
    }

    return result;
  }, [allTickets, normalizedStatus, statusFilter, searchTerm, activeFilters]);

  // 👇 Slice tickets for the current page
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  // 👇 Reset to page 1 if filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, normalizedStatus]);

  const openModal = (type, ticket) => {
    setSelectedTicket(ticket);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalType(null);
  };

  const handleSuccess = (ticketNumber, newStatus) => {
    setAllTickets((prev) =>
      prev.map((ticket) =>
        ticket.ticketNumber === ticketNumber
          ? { ...ticket, status: newStatus }
          : ticket
      )
    );
    closeModal();
  };

  const isActionable = (status) => {
    const s = (status || "").toLowerCase();
    // Only Ticket Coordinators can perform open/reject actions. System Admins can only view.
    if (!currentUser) return false;
    if (currentUser.role !== 'Ticket Coordinator') return false;
    // Only "New" tickets (including Submitted/Pending) are actionable
    return s === "new" || s === "submitted" || s === "pending";
  };

  return (
    <>
      <ToastContainer />
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
          <CoordinatorTicketFilter
            onApply={setActiveFilters}
            onReset={() => {
              setActiveFilters({
                status: null,
                priority: null,
                category: null,
                subCategory: null,
                slaStatus: null,
                startDate: "",
                endDate: "",
              });
              setCurrentPage(1);
            }}
            initialFilters={activeFilters}
          />
        )}

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2>{headingMap[normalizedStatus] || "Ticket Management"}</h2>
            <div className={styles.tableActions}>
              <InputField
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                inputStyle={{ width: '260px' }}
              />
            </div>
        </div>
        
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Ticket No.</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Category</th>
                <th>Sub Category</th>
                <th>Priority</th>
                <th>SLA Status</th>
                <th>Assigned Agent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 40, color: "#6b7280", fontStyle: "italic" }}>
                    No tickets found for this status or search.
                  </td>
                </tr>
              ) : (
                paginatedTickets.map((ticket, idx) => {
                  // Use the computed effective status (e.g., New older than 24h -> Pending)
                  const effective = ticket.__effectiveStatus || ticket.status || '';
                  const displayStatus = effective;
                  const statusClass = displayStatus.replace(/\s+/g, '-').toLowerCase();
                  
                  return (
                    <tr key={ticket.ticketNumber || idx}>
                      <td>{ticket.ticketNumber}</td>
                      <td>
                        <div className={styles.subjectCell} title={ticket.subject}>
                          {ticket.subject}
                        </div>
                      </td>
                      <td>
                        <div className={styles[`status-${statusClass}`]}>
                          {displayStatus}
                        </div>
                      </td>
                      <td>{ticket.category}</td>
                      <td>{ticket.subCategory || "—"}</td>
                    <td>
                      {ticket.priorityLevel ? (
                        <div className={styles[`priority-${ticket.priorityLevel.toLowerCase()}`]}>
                          {ticket.priorityLevel}
                        </div>
                      ) : (
                        <div className={styles['priority-not-set']}>
                          Not Set
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles[`sla-${calculateSLAStatus(ticket).toLowerCase().replace(' ', '-')}`]}>
                        {calculateSLAStatus(ticket)}
                      </div>
                    </td>
                    <td>{ticket.assignedAgent || "Unassigned"}</td>
                    <td>
                      <div className={styles.actionButtonCont}>
                        <button
                          title="View"
                          className={styles.actionButton}
                          onClick={() => navigate(`/admin/ticket-tracker/${ticket.ticketNumber}`)}
                        >
                          <FaEye />
                        </button>
                        {isActionable(ticket.status) && (
                          <button
                            title="Edit"
                            className={styles.actionButton}
                            onClick={() => openModal("open", ticket)}
                          >
                            <FaEdit />
                          </button>
                        )}
                        {isActionable(ticket.status) && (
                          <button
                            title="Delete"
                            className={styles.actionButton}
                            onClick={() => openModal("reject", ticket)}
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tablePagination}>
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredTickets.length}
            initialItemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            alwaysShow={true}
          />
        </div>
      </div>

      {modalType === "open" && selectedTicket && (
        <CoordinatorAdminOpenTicketModal
          ticket={selectedTicket}
          onClose={closeModal}
          onSuccess={(ticketNumber) => handleSuccess(ticketNumber, "Open")}
        />
      )}

      {modalType === "open" && selectedTicket && (
        <CoordinatorAdminOpenTicketModal
          ticket={selectedTicket}
          onClose={closeModal}
          onSuccess={(ticketNumber) => handleSuccess(ticketNumber, "Open")}
        />
      )}

      {modalType === "reject" && selectedTicket && (
        <CoordinatorAdminRejectTicketModal
          ticket={selectedTicket}
          onClose={closeModal}
          onSuccess={(ticketNumber) => handleSuccess(ticketNumber, "Rejected")}
        />
      )}
      </div>
    </>
  );
};

export default CoordinatorAdminTicketManagement;
