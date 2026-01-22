import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployeeTickets } from "../../../utilities/storages/ticketStorage";
import { toEmployeeStatus } from "../../../utilities/helpers/statusMapper";
import authService from "../../../utilities/service/authService";
import getTicketActions from "../../../shared/table/TicketActions";
import Table from "../../../shared/table/Table";
import tableStyles from "../../../shared/table/Table.module.css";
import EmployeeTicketFilter, { TICKET_RECORD_STATUS_OPTIONS } from "../../components/filters/EmployeeTicketFilter";

const headingMap = {
  "all-ticket-records": "All Ticket Records",
  "closed-ticket-records": "Closed Tickets",
  "rejected-ticket-records": "Rejected Tickets",
  "withdrawn-ticket-records": "Withdrawn Tickets",
};

const statusMap = {
  "all-ticket-records": ["Closed", "Rejected", "Withdrawn"],
  "closed-ticket-records": ["Closed"],
  "rejected-ticket-records": ["Rejected"],
  "withdrawn-ticket-records": ["Withdrawn"],
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
function TableItem({ ticket, onView }) {
  // Convert status to employee view for display (though Closed/Rejected/Withdrawn are same for both)
  const displayStatus = toEmployeeStatus(ticket.status);
  
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
        </div>
      </td>
    </tr>
  );
}

const EmployeeTicketRecords = () => {
  const { filter = "all-ticket-records" } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [allTickets, setAllTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const normalizedFilter = filter.replace("-ticket-records", "").toLowerCase();

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
      // Get current logged-in user and only fetch their tickets
      const currentUser = authService.getCurrentUser();
      const tickets = getEmployeeTickets(currentUser?.id);
      setAllTickets(tickets);
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
    
    let filtered = allTickets.filter(ticket =>
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

    // Apply status filter
    if (activeFilters.status) {
      filtered = filtered.filter(
        ticket => ticket.status === activeFilters.status.label
      );
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
  }, [allTickets, filter, searchTerm, activeFilters]);

  // Paginate tickets
  const displayedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, currentPage, pageSize]);

  const handleView = (ticket) => {
    navigate(`/employee/ticket-tracker/${ticket.ticketNumber}`);
  };

  const [showFilter, setShowFilter] = useState(true);

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
        </>
      )
    }
  ];

  // Filter component wrapper
  const FilterComponent = () => (
    <EmployeeTicketFilter
      preset="ticketRecords"
      initialShow={showFilter}
      statusOptions={TICKET_RECORD_STATUS_OPTIONS}
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
    <Table
      variant="ticketRecords"
      data={displayedTickets}
      columns={columns}
      title={headingMap[filter] || "Ticket Records"}
      searchable
      searchPlaceholder="Search..."
      searchValue={searchTerm}
      onSearchChange={(e) => setSearchTerm(e.target.value)}
      filterComponent={FilterComponent}
      showFilter={showFilter}
      onShowFilterChange={setShowFilter}
      currentPage={currentPage}
      pageSize={pageSize}
      totalItems={filteredTickets.length}
      onPageChange={setCurrentPage}
      onPageSizeChange={setPageSize}
      isLoading={isLoading}
      emptyMessage="No ticket records found for this filter."
    />
  );
};

export default EmployeeTicketRecords;