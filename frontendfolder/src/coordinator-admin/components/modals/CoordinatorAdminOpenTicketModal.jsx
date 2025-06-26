import ModalWrapper from "../../../shared/modals/ModalWrapper";

const CoordinatorAdminOpenTicketModal = ({ ticket, onClose }) => {
  return (
    <ModalWrapper onClose={onClose}>
      <h1>Coordinator Admin Open Ticket Modal</h1>
      <p>Ticket Number: {ticket.ticketNumber}</p>
    </ModalWrapper>
  );
};

export default CoordinatorAdminOpenTicketModal;
