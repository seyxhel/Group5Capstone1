import ModalWrapper from "../../../shared/modals/ModalWrapper";

const CoordinatorAdminRejectTicketModal = ({ ticket, onClose }) => {
  return (
    <ModalWrapper onClose={onClose}>
      <h1>Coordinator Admin Reject Ticket Modal</h1>
      <p>Ticket Number: {ticket.ticketNumber}</p>
    </ModalWrapper>
  );
};

export default CoordinatorAdminRejectTicketModal;
