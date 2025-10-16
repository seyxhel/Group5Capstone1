import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoAdd,
  IoList,
  IoFolderOpen,
  IoChevronForward
} from 'react-icons/io5';
import EmployeeHomeFloatingButtons from './EmployeeHomeFloatingButtons';
import Button from '../../../shared/components/Button';
import styles from './EmployeeHome.module.css';
import { backendTicketService } from '../../../services/backend/ticketService';
import { toEmployeeStatus } from '../../../utilities/helpers/statusMapper';
import authService from '../../../utilities/service/authService';

const EmployeeHome = () => {
  const navigate = useNavigate();
  const [recentTickets, setRecentTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts

    const fetchRecentTickets = async () => {
      // Check if user is authenticated before making API calls
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found. User may need to log in again.');
        if (isMounted) {
          setRecentTickets([]);
          setLoading(false);
        }
        return;
      }
      
      try {
        if (isMounted) setLoading(true);
        
        // Fetch all tickets from backend (will filter by employee on backend)
        const allTickets = await backendTicketService.getAllTickets();
        
        if (!isMounted) return; // Don't update state if component unmounted

        console.log('Fetched tickets from backend:', allTickets);

        // Filter for active tickets (exclude only closed, include withdrawn and rejected)
        const activeTickets = allTickets.filter(ticket => {
          const status = (ticket.status || '').toLowerCase();
          return status !== 'closed';
        });

        // Sort by creation date (most recent first) and take top 5
        const sorted = activeTickets
          .sort((a, b) => new Date(b.submit_date || b.dateCreated) - new Date(a.submit_date || a.dateCreated))
          .slice(0, 5);

        console.log('Recent active tickets:', sorted);
        setRecentTickets(sorted);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        if (isMounted) setRecentTickets([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecentTickets();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - only fetch once on mount

  const handleSubmitTicket = () => {
    navigate('/employee/submit-ticket');
  };

  const handleViewActiveTickets = () => {
    navigate('/employee/active-tickets/all-active-tickets');
  };

  const handleViewTicketRecords = () => {
    navigate('/employee/ticket-records/all-ticket-records');
  };

  const handleTrackTickets = () => {
    navigate('/employee/active-tickets/all-active-tickets');
  };

  const handleViewDetails = (ticketNumber) => {
    navigate(`/employee/ticket-tracker/${ticketNumber}`);
  };

  // Normalize ticket data to handle both backend field names (snake_case) and frontend (camelCase)
  const normalizeTicket = (ticket) => {
    return {
      ticketNumber: ticket.ticket_number || ticket.ticketNumber,
      status: ticket.status,
      subject: ticket.subject,
      category: ticket.category,
      subCategory: ticket.sub_category || ticket.subCategory,
      priorityLevel: ticket.priority || ticket.priorityLevel,
      assignedTo: ticket.assigned_to || ticket.assignedTo,
      lastUpdated: ticket.update_date || ticket.lastUpdated,
      dateCreated: ticket.submit_date || ticket.dateCreated
    };
  };

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.welcomeHeader}>
        Welcome <span className={styles.welcomeName}>{currentUser?.firstName}</span>,
      </h1>

      <div className={styles.topSection}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Quick Actions</h2>
          <div className={styles.actionGroupColumn}>
            <Button variant="primary" onClick={handleSubmitTicket}>
              <IoAdd />
              Submit a Ticket
            </Button>
            <div className={styles.actionGroupRow}>
              <Button variant="outline" onClick={handleViewActiveTickets}>
                <IoList />
                View Active Tickets
              </Button>
              <Button variant="outline" onClick={handleViewTicketRecords}>
                <IoFolderOpen />
                View Ticket Records
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Notice</h2>
          <p className={styles.noticeText}>
            Our support team operates during <span className={styles.workingHours}>8:00 AM - 5:00 PM</span>.
          </p>
          <ul className={styles.noticeList}>
            <li className={styles.noticeItem}>
              Tickets will be processed within <strong>1 business day</strong>
            </li>
            <li className={styles.noticeItem}>
              Urgent requests? Call <span className={styles.phoneNumber}>+63 912 345 6789</span>
            </li>
          </ul>
        </div>
      </div>

      <div className={styles.recentTickets}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Tickets</h2>
          <Button variant="primary" onClick={handleTrackTickets}>
            Track Active Tickets
          </Button>
        </div>

        {recentTickets.length === 0 ? (
          <div className={styles.noTickets}>
            <p>{loading ? 'Loading tickets...' : 'No active tickets to display.'}</p>
            {!loading && (
              <Button variant="primary" onClick={handleSubmitTicket}>
                Submit a Ticket
              </Button>
            )}
          </div>
        ) : (
          <div className={styles.ticketList}>
            {recentTickets.map(ticket => {
              const normalized = normalizeTicket(ticket);
              // Convert status to employee view (New/Open -> Pending)
              const displayStatus = toEmployeeStatus(normalized.status);
              const statusKey = displayStatus.replace(/\s/g, '').toLowerCase();
              return (
                <div key={normalized.ticketNumber} className={styles.ticketItem}>
                  <div className={styles.ticketInfo}>
                    <div className={styles.ticketHeader}>
                      <div className={styles.ticketNumber}>#{normalized.ticketNumber}</div>
                      <span
                        className={styles.statusBadge}
                        style={{
                          backgroundColor: `var(--${statusKey}-bg)`,
                          color: `var(--${statusKey}-text)`
                        }}
                      >
                        {displayStatus.toUpperCase()}
                      </span>
                    </div>
                    <div className={styles.ticketDetailsGrid}>
                      <div>
                        <div className={styles.ticketLabel}>Assigned Agent</div>
                        <div className={styles.ticketValue}>
                          {normalized.assignedTo?.name || normalized.assignedTo || 'Unassigned'}
                        </div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Subject</div>
                        <div className={styles.ticketValue}>{normalized.subject}</div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Priority Level</div>
                        <div className={styles.ticketValue}>{normalized.priorityLevel || 'Not Set'}</div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Category & Sub-category</div>
                        <div className={styles.ticketValue}>
                          {normalized.category} {normalized.subCategory ? `> ${normalized.subCategory}` : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                 <div className={styles.ticketActions}>
                  <div className={styles.lastUpdated}>
                    Last Updated {new Date(normalized.lastUpdated || normalized.dateCreated).toLocaleDateString()}
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleViewDetails(normalized.ticketNumber)}
                  >
                    View Details <IoChevronForward />
                  </Button>
                </div>

              </div>
              );
            })}
          </div>
        )}
      </div>

      <EmployeeHomeFloatingButtons />
    </div>
  );
};

export default EmployeeHome;