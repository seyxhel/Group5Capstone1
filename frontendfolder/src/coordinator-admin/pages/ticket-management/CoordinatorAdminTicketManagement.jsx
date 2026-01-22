import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import Table from "../../../shared/table/Table";
import CoordinatorTicketFilter from "../../components/filters/CoordinatorAdminTicketManagementFilter";
import { getAllTickets } from "../../../utilities/storages/ticketStorage";
import authService from "../../../utilities/service/authService";
import getTicketActions from "../../../shared/table/TicketActions";

import CoordinatorAdminOpenTicketModal from "../../components/modals/ticket-management/CoordinatorOpenTicketModal";
import CoordinatorAdminRejectTicketModal from "../../components/modals/ticket-management/CoordinatorRejectTicketModal";
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
  const [isLoading, setIsLoading] = useState(true);

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
    // Simulate loading delay
    const timer = setTimeout(() => {
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
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
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
      key: '__effectiveStatus', 
      label: 'Status',
      skeletonWidth: '80px',
      render: (value, ticket) => {
        const status = value || ticket.status;
        const statusKey = status.replace(/\s+/g, "-").toLowerCase();
        return (
          <span className={`status-${statusKey}`}>
            {status}
          </span>
        );
      }
    },
    { key: 'category', label: 'Category', skeletonWidth: '100px' },
    { key: 'subCategory', label: 'Sub Category', skeletonWidth: '100px' },
    { 
      key: 'priorityLevel', 
      label: 'Priority',
      skeletonWidth: '80px',
      render: (value) => {
        if (!value) {
          return <span className="priority-not-set">Not Set</span>;
        }
        const priorityKey = value.toLowerCase();
        return <span className={`priority-${priorityKey}`}>{value}</span>;
      }
    },
    { 
      key: 'slaStatus', 
      label: 'SLA Status',
      skeletonWidth: '100px',
      render: (_, ticket) => {
        const slaStatus = calculateSLAStatus(ticket);
        const slaKey = slaStatus.replace(/\s+/g, "-").toLowerCase();
        return <span className={`sla-${slaKey}`}>{slaStatus}</span>;
      }
    },
    { 
      key: 'assignedTo', 
      label: 'Assigned Agent',
      skeletonWidth: '120px',
      render: (value) => value?.name || 'Unassigned'
    },
    {
      key: 'dateCreated',
      label: 'Date Created',
      skeletonWidth: '140px',
      render: (value, ticket) => ticket.dateCreated ? new Date(ticket.dateCreated).toLocaleString() : '—'
    },
    { 
      key: 'actions', 
      label: 'Actions',
      skeletonWidth: '80px',
      render: (_, ticket) => (
        <>
          {getTicketActions("view", ticket, { 
            onView: () => navigate(`/admin/ticket-tracker/${ticket.ticketNumber}`) 
          })}
          {isActionable(ticket.__effectiveStatus || ticket.status) && (
            <>
              {getTicketActions("edit", ticket, { 
                onEdit: () => openModal("open", ticket) 
              })}
              {getTicketActions("delete", ticket, { 
                onDelete: () => openModal("reject", ticket) 
              })}
            </>
          )}
        </>
      )
    }
  ];

  // Filter component wrapper
  const FilterComponent = () => (
    <CoordinatorTicketFilter
      key={showFilter ? "filter-shown" : "filter-hidden"}
      preset="ticketManagement"
      initialShow={showFilter}
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
      }}
      initialFilters={activeFilters}
    />
  );

  return (
    <>
      <ToastContainer />
      <Table
        variant="ticketManagement"
        data={paginatedTickets}
        columns={columns}
        title={headingMap[normalizedStatus] || "Ticket Management"}
        searchable
        searchPlaceholder="Search..."
        searchValue={searchTerm}
        onSearchChange={e => setSearchTerm(e.target.value)}
        filterComponent={FilterComponent}
        showFilter={showFilter}
        onShowFilterChange={setShowFilter}
        currentPage={currentPage}
        pageSize={itemsPerPage}
        totalItems={filteredTickets.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        isLoading={isLoading}
        emptyMessage="No tickets found for this status or search."
      />

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
    </>
  );
};

export default CoordinatorAdminTicketManagement;
