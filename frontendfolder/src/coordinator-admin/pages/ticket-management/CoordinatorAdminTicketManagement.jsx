import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { FaEdit, FaTimes, FaEye } from "react-icons/fa";

import styles from "./CoordinatorAdminTicketManagement.module.css";
import TablePagination from "../../../shared/table/TablePagination";
import CoordinatorTicketFilter from "../../components/filters/CoordinatorTicketFilter";
import { backendTicketService } from '../../../services/backend/ticketService';
import authService from "../../../utilities/service/authService";

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
    let isMounted = true;

    const fetchTickets = async () => {
      try {
        setAllTickets([]);
        // Attempt to fetch from backend API
        const fetched = await backendTicketService.getAllTickets();
        if (!isMounted) return;

        // Debug: show fetched count and a small sample of statuses
        try { console.info('[TicketManagement] fetched count:', fetched.length, 'status sample:', fetched.slice(0,5).map(x=>x.status)); } catch (err) { void err; }

        // Allowed statuses for coordinator/admin views
        const allowedStatuses = new Set([
          'new', 'submitted', 'pending',
          'open', 'in progress', 'in-progress',
          'on hold', 'on-hold',
          'withdrawn', 'closed', 'rejected', 'resolved'
        ]);

        // Normalize and filter by allowed statuses. Use substring matching to
        // tolerate variants/extra words in the status field.
        let ticketsToShow = (Array.isArray(fetched) ? fetched : []).filter(t => {
          const s = (t.status || '').toString().toLowerCase();
          const normalized = s.replace(/_/g, ' ').replace(/-/g, ' ').trim();
          const allowedKeywords = [
            'new', 'submitted', 'pending',
            'open', 'in progress', 'on hold', 'withdrawn', 'closed', 'rejected', 'resolved'
          ];
          return allowedKeywords.some(k => normalized.includes(k));
        });

        // Filter tickets based on user role and department
        if (user) {
          if (user.role === 'Ticket Coordinator') {
            // Coordinators see tickets from their department.
            // If the page is the "all" status, show all tickets regardless of department.
            // Otherwise restrict to the coordinator's department.
            if (normalizedStatus !== 'all') {
              ticketsToShow = ticketsToShow.filter(ticket => {
                const ticketDept = (ticket.department || ticket.assignedDepartment || ticket.employeeDepartment || '').toString();
                const userDept = (user.department || '').toString();
                return ticketDept && userDept && ticketDept === userDept;
              });
            }
          } else if (user.role === 'System Admin') {
            // System Admins see all tickets
            ticketsToShow = fetched;
          }
        }

        try { console.info('[TicketManagement] after dept filter sample:', ticketsToShow.slice(0,3)); } catch(e) { void e; }

        // Normalize ticket identifier fields so UI can always render Ticket No.
        const normalizedTickets = ticketsToShow.map(t => ({
          ...t,
          ticketNumber: t.ticketNumber || t.ticket_number || t.ticket_id || t.ticketId || t.id,
          subCategory: t.subCategory || t.sub_category || t.subcategory || t.sub_cat || '',
          // Normalize priority for UI badge
          priorityLevel: t.priority || t.priorityLevel || t.priority_level || null,
          // Normalize assigned agent (leave null/unassigned if backend didn't set it)
          assignedAgent: (t.assigned_to && (typeof t.assigned_to === 'string' ? t.assigned_to : (t.assigned_to?.first_name ? `${t.assigned_to.first_name} ${t.assigned_to.last_name}` : String(t.assigned_to)))) || t.assignedAgent || null,
        }));

        setAllTickets(normalizedTickets);
      } catch (err) {
        console.error('[TicketManagement] error fetching tickets:', err);
        setAllTickets([]);
      }
    };

    fetchTickets();

    return () => { isMounted = false; };
  }, []);

  // Build dynamic category and sub-category options from the fetched tickets
  const categoryOptions = useMemo(() => {
    const setVals = new Set();
    (allTickets || []).forEach(t => {
      if (t.category) setVals.add(t.category);
    });
    return Array.from(setVals).map(label => ({ label, category: label }));
  }, [allTickets]);

  const subCategoryOptions = useMemo(() => {
    const map = new Map();
    (allTickets || []).forEach(t => {
      const cat = t.category || '';
      const sub = t.subCategory || t.sub_category || '';
      if (!sub) return;
      const key = `${cat}||${sub}`;
      if (!map.has(key)) map.set(key, { label: sub, category: cat });
    });
    return Array.from(map.values());
  }, [allTickets]);

  const filteredTickets = useMemo(() => {
    let result;
    
    if (normalizedStatus === "all") {
      result = allTickets;
    } else if (Array.isArray(statusFilter)) {
      // Handle array of statuses (e.g., ["new", "submitted", "pending"])
      result = allTickets.filter(
        (ticket) => statusFilter.includes(ticket.status?.toLowerCase())
      );
    } else if (statusFilter) {
      // Handle single status string
      result = allTickets.filter(
        (ticket) => ticket.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    } else {
      result = allTickets;
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
    // Only "New" tickets (including old "Submitted" or "Pending" statuses) can be opened/rejected
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
            // Provide dynamic options derived from ticket submissions
            categoryOptions={categoryOptions}
            subCategoryOptions={subCategoryOptions}
          />
        )}

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2>{headingMap[normalizedStatus] || "Ticket Management"}</h2>
            <div className={styles.tableActions}>
              <input
                className={styles.searchBar}
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
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
                  // Convert admin status display (Submitted/Pending -> New)
                  const displayStatus = ticket.status === 'Submitted' || ticket.status === 'Pending' ? 'New' : ticket.status;
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
