import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoAdd,
  IoList,
  IoFolderOpen,
  IoChevronForward
} from 'react-icons/io5';
import EmployeeHomeFloatingButtons from './EmployeeHomeFloatingButtons';
import { useUser } from '../../../shared/context/UserContext';
import styles from './EmployeeHome.module.css';

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const EmployeeHome = () => {
  const navigate = useNavigate();
  const { user, hdtsRole } = useUser();
  const [recentTickets, setRecentTickets] = useState([]);
  const [hasCreatedTicket, setHasCreatedTicket] = useState(false);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        // Use cookie-based authentication instead of token
        const res = await fetch(`${API_URL}tickets/`, {
          credentials: 'include' // Use cookies for authentication
        });
        if (res.ok) {
          const allTickets = await res.json();
          setHasCreatedTicket(Array.isArray(allTickets) && allTickets.length > 0);
          // Only active tickets
          const activeTickets = allTickets; // No filter, show all tickets
          // Sort and slice for recent
          const sorted = activeTickets
            .sort((a, b) =>
              new Date(b.last_updated || b.update_date || b.submit_date) -
              new Date(a.last_updated || a.update_date || a.submit_date)
            )
            .slice(0, 5);
          setRecentTickets(sorted);
        } else {
          setHasCreatedTicket(false);
          setRecentTickets([]);
        }
      } catch (err) {
        setHasCreatedTicket(false);
        setRecentTickets([]);
      }
    };
    fetchTickets();
  }, []);

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

  const firstName = user?.first_name || "Employee";

  return (
    <div className={styles.container}>
      <h1 className={styles.welcomeHeader}>
        Welcome <span className={styles.welcomeName}>{firstName}</span>,
      </h1>
      
      {/* Display user role and company info */}
      <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
        <p><strong>Role:</strong> {hdtsRole || 'User'}</p>
        <p><strong>Company:</strong> {user?.company_id}</p>
        <p><strong>Department:</strong> {user?.department}</p>
      </div>

      <div className={styles.topSection}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Quick Actions</h2>
          <div className={styles.actionGroupColumn}>
            <button className={`${styles.button} ${styles.primary}`} onClick={handleSubmitTicket}>
              <IoAdd />
              Submit a Ticket
            </button>
            <div className={styles.actionGroupRow}>
              <button className={`${styles.button} ${styles.outline}`} onClick={handleViewActiveTickets}>
                <IoList />
                View Active Tickets
              </button>
              <button className={`${styles.button} ${styles.outline}`} onClick={handleViewTicketRecords}>
                <IoFolderOpen />
                View Ticket Records
              </button>
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
              Tickets should be processed within <strong>1 business day</strong>
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
          {/* Removed Track Active Tickets button */}
        </div>

        {recentTickets.length === 0 ? (
          <div className={styles.noTickets}>
            <p>No active tickets to display.</p>
            {/* Only show Submit a Ticket if user has ever created a ticket */}
            {hasCreatedTicket && (
              <button className={`${styles.button} ${styles.primary}`} onClick={handleSubmitTicket}>
                Submit a Ticket
              </button>
            )}
          </div>
        ) : (
          <div className={styles.ticketList}>
            {recentTickets.map(ticket => {
              // Map "New" to "pending" for color and display
              const statusKey = ticket.status.toLowerCase() === "new"
                ? "pending"
                : ticket.status.replace(/\s/g, '').toLowerCase();

              return (
                <div key={ticket.ticket_number} className={styles.ticketItem}>
                  <div className={styles.ticketInfo}>
                    <div className={styles.ticketNumber}>#{ticket.ticket_number}</div>
                    <div className={styles.ticketDetailsGrid}>
                      <div>
                        <div className={styles.ticketLabel}>Assigned Agent</div>
                        <div className={styles.ticketValue}>
                          {ticket.assigned_to
                            ? `${ticket.assigned_to.first_name} ${ticket.assigned_to.last_name}`
                            : 'Unassigned'}
                        </div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Subject</div>
                        <div className={styles.ticketValue}>{ticket.subject}</div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Priority Level</div>
                        <div className={styles.ticketValue}>{ticket.priority || 'Not Set'}</div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Category & Sub-category</div>
                        <div className={styles.ticketValue}>
                          {ticket.category} &gt; {ticket.sub_category}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={styles.ticketStatus}>
                    <span
                      className={styles.statusBadge}
                      style={{
                        backgroundColor: `var(--${statusKey}-bg)`,
                        color: `var(--${statusKey}-text)`
                      }}
                    >
                      {ticket.status.toLowerCase() === "new"
                        ? "PENDING"
                        : ticket.status.toUpperCase()}
                    </span>
                    <div className={styles.lastUpdated}>
                      Last Updated {new Date(ticket.update_date || ticket.submit_date).toLocaleDateString()}
                    </div>
                    <button
                      className={styles.viewDetails}
                      onClick={() => handleViewDetails(ticket.ticket_number)}
                    >
                      View Details <IoChevronForward />
                    </button>
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
