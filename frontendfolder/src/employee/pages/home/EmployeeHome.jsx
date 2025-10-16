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
import { getEmployeeTickets } from '../../../utilities/storages/ticketStorage';
import { toEmployeeStatus } from '../../../utilities/helpers/statusMapper';
import authService from '../../../utilities/service/authService';

const EmployeeHome = () => {
  const navigate = useNavigate();
  const [recentTickets, setRecentTickets] = useState([]);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    if (!currentUser) return;
    
    const allTickets = getEmployeeTickets(currentUser.id);

    const activeTickets = allTickets.filter(ticket => {
      const status = ticket.status.toLowerCase();
      return !['closed', 'rejected', 'withdrawn'].includes(status);
    });

    const sorted = activeTickets
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);

    setRecentTickets(sorted);
  }, [currentUser]);

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
            <p>No active tickets to display.</p>
            <Button variant="primary" onClick={handleSubmitTicket}>
              Submit a Ticket
            </Button>
          </div>
        ) : (
          <div className={styles.ticketList}>
            {recentTickets.map(ticket => {
              // Convert status to employee view (New/Open -> Pending)
              const displayStatus = toEmployeeStatus(ticket.status);
              const statusKey = displayStatus.replace(/\s/g, '').toLowerCase();
              return (
                <div key={ticket.ticketNumber} className={styles.ticketItem}>
                  <div className={styles.ticketInfo}>
                    <div className={styles.ticketHeader}>
                      <div className={styles.ticketNumber}>#{ticket.ticketNumber}</div>
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
                          {ticket.assignedTo?.name || 'Unassigned'}
                        </div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Subject</div>
                        <div className={styles.ticketValue}>{ticket.subject}</div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Priority Level</div>
                        <div className={styles.ticketValue}>{ticket.priorityLevel || 'Not Set'}</div>
                      </div>
                      <div>
                        <div className={styles.ticketLabel}>Category & Sub-category</div>
                        <div className={styles.ticketValue}>
                          {ticket.category} &gt; {ticket.subCategory}
                        </div>
                      </div>
                    </div>
                  </div>

                 <div className={styles.ticketActions}>
                  <div className={styles.lastUpdated}>
                    Last Updated {new Date(ticket.lastUpdated || ticket.dateCreated).toLocaleDateString()}
                  </div>
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => handleViewDetails(ticket.ticketNumber)}
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