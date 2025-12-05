import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaSearch } from 'react-icons/fa';
import styles from './CoordinatorOwnedTickets.module.css';
import { backendTicketService } from '../../../services/backend/ticketService';
import { useAuth } from '../../../context/AuthContext';
import TablePagination from '../../../shared/table/TablePagination';
import Skeleton from '../../../shared/components/Skeleton/Skeleton';
import CoordinatorTicketFilter from '../../components/filters/CoordinatorTicketFilter';
import InputField from '../../../shared/components/InputField';
import { mockOwnedTickets } from '../../../mock-data/ownedTickets';

const CoordinatorOwnedTickets = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [allTickets, setAllTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    status: null,
    priority: null,
    category: null,
    subCategory: null,
    slaStatus: null,
    startDate: '',
    endDate: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to calculate SLA status
  const calculateSLAStatus = (ticket) => {
    if (!ticket.dateCreated) return 'Unknown';
    
    const createdDate = new Date(ticket.dateCreated);
    const now = new Date();
    const hoursDiff = (now - createdDate) / (1000 * 60 * 60);
    
    const slaHours = {
      'Critical': 4,
      'High': 8,
      'Medium': 24,
      'Low': 48
    };
    
    const slaLimit = slaHours[ticket.priorityLevel] || 24;
    
    if (hoursDiff > slaLimit) return 'Overdue';
    if (hoursDiff > slaLimit * 0.8) return 'Due Soon';
    return 'On Time';
  };

  const formatDate = (date) => {
    if (!date) return 'None';
    try {
      const d = new Date(date);
      if (Number.isNaN(d.getTime())) return String(date);
      return d.toLocaleString();
    } catch (e) {
      return String(date);
    }
  };

  useEffect(() => {
    setIsLoading(true);

    const loadTickets = async () => {
      try {
        let ticketList = [];
        try {
          const fetched = await backendTicketService.getAllTickets();
          ticketList = Array.isArray(fetched) ? fetched : (fetched?.results || []);
        } catch (err) {
          console.warn('Failed to fetch from backend, using mock data:', err);
          ticketList = mockOwnedTickets;
        }
        
        // Show all tickets (no filtering by current user since mock data is for display)
        const ownedTickets = ticketList.length > 0 ? ticketList : mockOwnedTickets;

        // Normalize tickets
        const normalized = ownedTickets.map((t) => {
          const dateCreated = t.submit_date || t.submitDate || t.dateCreated || t.created_at || t.createdAt || null;
          const lastUpdated = t.update_date || t.lastUpdated || t.updatedAt || t.updated_at || t.time_closed || t.closedAt || t.submit_date || t.dateCreated || t.createdAt || null;
          return {
            ...t,
            ticketNumber: t.ticket_number || t.ticket_id || t.ticketNumber || t.id,
            subCategory: t.sub_category || t.subCategory || t.subcategory || '',
            priorityLevel: t.priority || t.priorityLevel || '',
            dateCreated,
            lastUpdated,
            assignedAgent: t.assigned_to || t.assignedTo || currentUser?.first_name || '',
            assignedDepartment: t.department || t.assignedDepartment || '',
            slaStatus: calculateSLAStatus(t),
          };
        })
        .sort((a, b) => {
          const da = a.lastUpdated ? new Date(a.lastUpdated).getTime() : 0;
          const db = b.lastUpdated ? new Date(b.lastUpdated).getTime() : 0;
          return db - da;
        });

        setAllTickets(normalized);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to fetch tickets:', err);
        setAllTickets([]);
        setIsLoading(false);
      }
    };

    const timer = setTimeout(() => loadTickets(), 300);
    return () => clearTimeout(timer);
  }, [currentUser]);

  // Build dynamic filter options
  const categoryOptions = useMemo(() => {
    const set = new Set(allTickets.map(t => t.category).filter(Boolean));
    return Array.from(set).map(v => ({ label: v, value: v }));
  }, [allTickets]);

  const subCategoryOptions = useMemo(() => {
    const set = new Set(allTickets.map(t => t.subCategory).filter(Boolean));
    return Array.from(set).map(v => ({ label: v, value: v }));
  }, [allTickets]);

  // Apply filters and search
  const filteredTickets = useMemo(() => {
    return allTickets.filter(ticket => {
      // Search filter
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        ticket.ticketNumber?.toLowerCase().includes(searchLower) ||
        ticket.subject?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower);

      if (!matchesSearch) return false;

      // Status filter
      if (activeFilters.status && ticket.status !== activeFilters.status) return false;

      // Priority filter
      if (activeFilters.priority && ticket.priorityLevel !== activeFilters.priority) return false;

      // Category filter
      if (activeFilters.category && ticket.category !== activeFilters.category) return false;

      // Sub-category filter
      if (activeFilters.subCategory && ticket.subCategory !== activeFilters.subCategory) return false;

      // SLA Status filter
      if (activeFilters.slaStatus && ticket.slaStatus !== activeFilters.slaStatus) return false;

      // Date range filters
      if (activeFilters.startDate) {
        const startDate = new Date(activeFilters.startDate);
        const ticketDate = new Date(ticket.dateCreated);
        if (ticketDate < startDate) return false;
      }

      if (activeFilters.endDate) {
        const endDate = new Date(activeFilters.endDate);
        const ticketDate = new Date(ticket.dateCreated);
        if (ticketDate > endDate) return false;
      }

      return true;
    });
  }, [allTickets, searchTerm, activeFilters]);

  // Pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleViewDetails = (ticketNumber) => {
    navigate(`/admin/owned-tickets/${ticketNumber}`);
  };

  const handleFilterChange = (newFilters) => {
    setActiveFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <div className={styles['owned-tickets-container']}>
      <div className={styles['page-header']}>
        <h1>Owned Tickets</h1>
        <p>Manage and track your assigned tickets</p>
      </div>

      <div className={styles['filters-section']}>
        <div className={styles['search-bar']}>
          <FaSearch className={styles['search-icon']} />
          <InputField
            type="text"
            placeholder="Search by ticket number, subject..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={styles['search-input']}
          />
        </div>

        <button
          className={styles['filter-btn']}
          onClick={() => setShowFilter(!showFilter)}
        >
          Filters
        </button>
      </div>

      {showFilter && (
        <CoordinatorTicketFilter
          onFilterChange={handleFilterChange}
          categoryOptions={categoryOptions}
          subCategoryOptions={subCategoryOptions}
          currentFilters={activeFilters}
        />
      )}

      {isLoading ? (
        <div className={styles['skeleton-container']}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} height={50} />
          ))}
        </div>
      ) : (
        <>
          <div className={styles['table-container']}>
            <table className={styles['tickets-table']}>
              <thead>
                <tr>
                  <th>Ticket Number</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  <th>SLA Status</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTickets.length > 0 ? (
                  paginatedTickets.map((ticket) => (
                    <tr key={ticket.id || ticket.ticketNumber}>
                      <td className={styles['ticket-number']}>
                        {ticket.ticketNumber}
                      </td>
                      <td>{ticket.subject || 'N/A'}</td>
                      <td>
                        <span className={`${styles['status-badge']} ${styles[`status-${(ticket.status || 'unknown').toLowerCase().replace(/\s+/g, '-')}`]}`}>
                          {ticket.status || 'Unknown'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles['priority-badge']} ${styles[`priority-${(ticket.priorityLevel || 'low').toLowerCase()}`]}`}>
                          {ticket.priorityLevel || 'N/A'}
                        </span>
                      </td>
                      <td>{ticket.category || 'N/A'}</td>
                      <td>
                        <span className={`${styles['sla-badge']} ${styles[`sla-${(ticket.slaStatus || 'unknown').toLowerCase()}`]}`}>
                          {ticket.slaStatus || 'Unknown'}
                        </span>
                      </td>
                      <td>{formatDate(ticket.dateCreated)}</td>
                      <td>
                        <button
                          className={styles['view-btn']}
                          onClick={() => handleViewDetails(ticket.ticketNumber)}
                          title="View Details"
                        >
                          <FaEye /> View
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className={styles['no-data']}>
                      No owned tickets found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredTickets.length > 0 && (
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTickets.length}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          )}
        </>
      )}
    </div>
  );
};

export default CoordinatorOwnedTickets;
