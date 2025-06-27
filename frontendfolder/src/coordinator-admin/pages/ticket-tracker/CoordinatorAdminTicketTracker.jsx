import { useParams } from 'react-router-dom';

const CoordinatorAdminTicketTracker = () => {
  const { ticketId } = useParams();

  return (
    <div>
      <h1>Ticket Tracker</h1>
      <p>Tracking ticket: <strong>{ticketId}</strong></p>
    </div>
  );
};

export default CoordinatorAdminTicketTracker;
