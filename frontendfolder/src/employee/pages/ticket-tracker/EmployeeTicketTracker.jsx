import { useParams } from 'react-router-dom';
import styles from './EmployeeTicketTracker.module.css';
import { getEmployeeTickets } from '../../../utilities/storages/employeeTicketStorageBonjing';

const statusCompletion = {
  1: ['Submitted', 'Pending', 'Open', 'On Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  2: ['Pending', 'Open', 'On Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  3: ['Open', 'On Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  4: ['On Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
  5: ['Resolved', 'Closed', 'Rejected', 'Withdrawn'],
};

const getStatusSteps = (status) =>
  [1, 2, 3, 4, 5].map(id => ({
    id,
    completed: statusCompletion[id].includes(status),
  }));

const DetailRow = ({ label, value }) => (
  <div className={styles.detailRow}>
    <span className={styles.label}>{label}:</span>
    <span className={styles.value}>{value}</span>
  </div>
);

const EmployeeTicketTracker = () => {
  const { ticketNumber } = useParams();
  const tickets = getEmployeeTickets();

  const ticket = ticketNumber
    ? tickets.find(t => String(t.ticketNumber) === String(ticketNumber))
    : tickets[tickets.length - 1];

  if (!ticket) return <p>No ticket data available.</p>;

  const {
    ticketNumber: number,
    subject,
    category,
    subCategory,
    status,
    dateCreated,
    description,
    fileUploaded,
  } = ticket;

  const formattedDate = new Date(dateCreated).toLocaleString('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
  });

  const statusSteps = getStatusSteps(status);

  return (
    <div className={styles.container}>
      <div className={styles.ticketCard}>
        <div className={styles.header}>
          <h2 className={styles.title}>#{number}</h2>
          <div className={styles.statusBadge}>
            <span className={styles.statusDot}></span>
            <span className={styles.statusText}>{status}</span>
          </div>
        </div>

        <div className={styles.timestamp}>Created at: {formattedDate}</div>

        <div className={styles.ticketDetails}>
          <DetailRow label="Subject" value={subject} />
          <DetailRow label="Category" value={category} />
          <DetailRow label="Sub-Category" value={subCategory} />
        </div>

        <div className={styles.description}>
          <h3 className={styles.descriptionTitle}>Description:</h3>
          <p className={styles.descriptionText}>{description}</p>
        </div>

        <div className={styles.attachment}>
          <h3 className={styles.attachmentTitle}>Attachment</h3>
          <div className={styles.attachmentContent}>
            <span className={styles.attachmentIcon}>📎</span>
            <span className={styles.attachmentText}>
              {fileUploaded ? fileUploaded.name : 'No file attached.'}
            </span>
          </div>
        </div>
      </div>

      <div className={styles.sidebar}>
        <button className={styles.withdrawButton}>Withdraw Ticket</button>

        <div className={styles.statusSection}>
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
      </div>
    </div>
  );
};

export default EmployeeTicketTracker;
