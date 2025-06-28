import { useParams } from 'react-router-dom';
import styles from './CoordinatorAdminTicketTracker.module.css';
import { getEmployeeTickets } from '../../../utilities/storages/employeeTicketStorageBonjing';

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

export default function CoordinatorAdminTicketTracker() {
  const { ticketId } = useParams();
  const tickets = getEmployeeTickets();
  const ticket = tickets.find((t) => String(t.id) === String(ticketId));

  if (!ticket) return <p className={styles.notFound}>Ticket #{ticketId} not found.</p>;

  const {
    ticketNumber,
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
    <main className={styles.coordinatorTicketTrackerPage}>
      <div className={styles.mainContent}>
        <section className={styles.ticketCard}>
          <header className={styles.header}>
            <div>
              <h2 className={styles.heading}>#{ticketNumber || ticketId}</h2>
              <p className={styles.subheading}>{subject || 'No subject provided'}</p>
            </div>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot}></span>
              <span className={styles.statusText}>{status}</span>
            </div>
          </header>

          <div className={styles.timestamp}>Created at: {formatDate(dateCreated)}</div>

          <div className={styles.ticketInfo}>
            <DetailField label="Priority" value={priorityLevel} />
            <DetailField label="Department" value={department} />
            <DetailField label="Assigned Agent" value={assignedTo?.name} />
            <DetailField label="Scheduled Request" value={scheduledRequest} />
            <DetailField label="Date Created" value={formatDate(dateCreated)} />
            <DetailField label="Last Updated" value={formatDate(lastUpdated)} />
            <DetailField label="Category" value={category} />
            <DetailField label="Sub-Category" value={subCategory} />
          </div>

          <section className={styles.descriptionBlock}>
            <h3 className={styles.descriptionTitle}>Description</h3>
            <p className={styles.descriptionBox}>
              {description || 'No description provided.'}
            </p>
          </section>

          <section className={styles.attachment}>
            <h3 className={styles.descriptionTitle}>Attachment</h3>
            <div className={styles.attachmentContent}>
              <span className={styles.attachmentIcon}>📎</span>
              <span className={styles.attachmentText}>
                {fileUploaded?.name || 'No file attached.'}
              </span>
            </div>
          </section>
        </section>
      </div>

      <aside className={styles.sidebar}>
        <div className={styles.statusSection}>
          {!['Closed', 'Rejected', 'Withdrawn'].includes(status) && (
            <button className={styles.withdrawButton}>
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
  );
}
