import { useParams } from 'react-router-dom';
import { useState } from 'react';
import styles from './EmployeeTicketTracker.module.css';
import { getEmployeeTickets } from '../../../utilities/storages/employeeTicketStorageBonjing';
import EmployeeActiveTicketsWithdrawTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal';
import EmployeeActiveTicketsCloseTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal';

const STATUS_COMPLETION = {
  1: ['Submitted', 'Pending', 'Open', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  2: ['Pending', 'Open', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  3: ['Open', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  4: ['In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  5: ['Resolved', 'Closed', 'Rejected', 'Withdrawn'],
};

const getStatusSteps = (status) =>
  [1, 2, 3, 4, 5].map((id) => ({
    id,
    completed: STATUS_COMPLETION[id].includes(status),
  }));

const DetailField = ({ label, value }) => (
  <fieldset>
    <label>{label}</label>
    <p>{value || 'N/A'}</p>
  </fieldset>
);

const formatDate = (date) =>
  date ? new Date(date).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : 'N/A';

export default function EmployeeTicketTracker() {
  const { ticketNumber } = useParams();
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  const tickets = getEmployeeTickets();

  const ticket = ticketNumber
    ? tickets.find((t) => String(t.ticketNumber) === String(ticketNumber))
    : tickets.at(-1);

  if (!ticket) return <p className={styles.notFound}>No ticket data available.</p>;

  const {
    ticketNumber: number,
    subject,
    category,
    subCategory,
    status,
    dateCreated,
    lastUpdated,
    description,
    fileUploaded,
    priorityLevel,
    department,
    assignedTo,
    scheduledRequest,
  } = ticket;

  const statusSteps = getStatusSteps(status);
  const isClosable = status === 'Resolved';

  return (
    <>
      <main className={styles.employeeTicketTrackerPage}>
        {/* Left Column */}
        <div className={styles.mainContent}>
          <section className={styles.ticketCard}>
            <header className={styles.header}>
              <h2 className={styles.title}>#{number}</h2>
              <div className={styles.statusBadge}>
                <span className={styles.statusDot}></span>
                <span className={styles.statusText}>{status}</span>
              </div>
            </header>

            <div className={styles.timestamp}>Created at: {formatDate(dateCreated)}</div>

            <div className={styles.ticketDetails}>
              <DetailField label="Priority" value={priorityLevel} />
              <DetailField label="Department" value={department} />
              <DetailField label="Assigned Agent" value={assignedTo?.name} />
              <DetailField label="Scheduled Request" value={scheduledRequest} />
              <DetailField label="Date Created" value={formatDate(dateCreated)} />
              <DetailField label="Last Updated" value={formatDate(lastUpdated)} />
              <DetailField label="Subject" value={subject} />
              <DetailField label="Category" value={category} />
              <DetailField label="Sub-Category" value={subCategory} />
            </div>

            <section className={styles.description}>
              <h3 className={styles.descriptionTitle}>Description</h3>
              <p className={styles.descriptionText}>
                {description || 'No description provided.'}
              </p>
            </section>

            <section className={styles.attachment}>
              <h3 className={styles.attachmentTitle}>Attachment</h3>
              <div className={styles.attachmentContent}>
                <span className={styles.attachmentIcon}>📎</span>
                <span className={styles.attachmentText}>
                  {fileUploaded?.name || 'No file attached.'}
                </span>
              </div>
            </section>
          </section>
        </div>

        {/* Right Column (Sidebar) */}
        <aside className={styles.sidebar}>
          <div className={styles.statusSection}>
            {!['Closed', 'Rejected', 'Withdrawn'].includes(status) && (
              <button
                className={styles.withdrawButton}
                onClick={() =>
                  isClosable ? setShowCloseModal(true) : setShowWithdrawModal(true)
                }
              >
                {isClosable ? 'Close Ticket' : 'Withdraw Ticket'}
              </button>
            )}

            <h3 className={styles.statusTitle}>Status</h3>

            <div className={styles.statusTimeline}>
              {statusSteps.map((step, index) => (
                <div key={step.id} className={styles.statusStep}>
                  <div className={`${styles.statusCircle} ${step.completed ? styles.completed : ''}`}>
                    {step.completed && <span className={styles.checkmark}>✓</span>}
                  </div>
                  {index < statusSteps.length - 1 && (
                    <div className={`${styles.statusLine} ${step.completed ? styles.completedLine : ''}`} />
                  )}
                </div>
              ))}
            </div>

            <div className={styles.currentStatus}>
              <h4 className={styles.currentStatusTitle}>Current Status</h4>
              <p className={styles.currentStatusText}>{status}</p>
            </div>
          </div>
        </aside>
      </main>

      {/* Modals */}
      {showWithdrawModal && (
        <EmployeeActiveTicketsWithdrawTicketModal
          ticket={ticket}
          onClose={() => setShowWithdrawModal(false)}
        />
      )}
      {showCloseModal && (
        <EmployeeActiveTicketsCloseTicketModal
          ticket={ticket}
          onClose={() => setShowCloseModal(false)}
        />
      )}
    </>
  );
}
