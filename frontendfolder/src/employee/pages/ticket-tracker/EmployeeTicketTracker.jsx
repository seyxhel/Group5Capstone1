import { useEffect, useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import styles from './EmployeeTicketTracker.module.css';
import EmployeeActiveTicketsWithdrawTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal';
import EmployeeActiveTicketsCloseTicketModal from '../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal';

const STATUS_COMPLETION = {
  1: ['Pending', 'Open', 'In Progress', 'Resolved', 'Closed', 'Rejected', 'Withdrawn', 'On Hold'],
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

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const getDisplayStatus = (status) => {
  if (!status) return '';
  if (status === "New") return "Pending";
  return status;
};

export default function EmployeeTicketTracker() {
  const { ticketNumber } = useParams();
  const location = useLocation();
  const from = location.state?.from || "ticket-records"; // fallback
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("employee_access_token");
        const res = await fetch(`${API_URL}tickets/${ticketNumber}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTicket(data);
        } else {
          setTicket(null);
        }
      } catch {
        setTicket(null);
      }
      setLoading(false);
    };
    if (ticketNumber) fetchTicket();
  }, [ticketNumber]);

  if (loading) return <p>Loading...</p>;
  if (!ticket) return <p className={styles.notFound}>No ticket data available.</p>;

  const {
    ticket_number: number,
    subject,
    category,
    sub_category,
    status,
    submit_date,
    update_date,
    description,
    attachments,
    priority,
    department,
    assigned_to,
    scheduled_date,
  } = ticket;

  const fileUploaded = attachments && attachments.length > 0 ? attachments[0] : null;
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
                <span className={styles.statusText}>{getDisplayStatus(status)}</span>
              </div>
            </header>

            <div className={styles.timestamp}>Created at: {formatDate(submit_date)}</div>

            <div className={styles.ticketDetails}>
              <DetailField label="Priority" value={priority} />
              <DetailField label="Department" value={department} />
              <DetailField label="Assigned Agent" value={assigned_to?.name} />
              <DetailField label="Scheduled Request" value={scheduled_date} />
              <DetailField label="Date Created" value={formatDate(submit_date)} />
              <DetailField label="Last Updated" value={formatDate(update_date)} />
              <DetailField label="Subject" value={subject} />
              <DetailField label="Category" value={category} />
              <DetailField label="Sub-Category" value={sub_category} />
            </div>

            <section className={styles.description}>
              <h3 className={styles.descriptionTitle}>Description</h3>
              <p className={styles.descriptionText}>
                {description || 'No description provided.'}
              </p>
            </section>

            <section className={styles.attachment}>
              <h3 className={styles.attachmentTitle}>Attachment{attachments && attachments.length > 1 ? 's' : ''}</h3>
              <div className={styles.attachmentContent}>
                <span className={styles.attachmentIcon}>📎</span>
                {attachments && attachments.length > 0 ? (
                  attachments.map((file, idx) => (
                    <a
                      key={file.id || idx}
                      href={file.file}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.attachmentText}
                      download={file.file_name}
                      style={{ display: "block" }}
                    >
                      {file.file_name}
                    </a>
                  ))
                ) : (
                  <span className={styles.attachmentText}>No file attached.</span>
                )}
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
              <p className={styles.currentStatusText}>{getDisplayStatus(status)}</p>
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
