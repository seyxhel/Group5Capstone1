import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TableWrapper from "../../../shared/table/TableWrapper";
import TableContent from "../../../shared/table/TableContent";
import getTicketActions from "../../../shared/table/TicketActions";
import { getEmployeeTickets } from "../../../utilities/storages/employeeTicketStorageBonjing";
import { getEmployeeTicketsByRumi } from "../../../utilities/storages/employeeTicketStorageRumi";

import CoordinatorAdminOpenTicketModal from "../../components/modals/CoordinatorAdminOpenTicketModal";
import CoordinatorAdminRejectTicketModal from "../../components/modals/CoordinatorAdminRejectTicketModal";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const headingMap = {
  all: "All Tickets",
  new: "New Tickets",
  pending: "Pending Tickets",
  open: "Open Tickets",
  "on-progress": "On Progress Tickets",
  "on-hold": "On Hold Tickets",
  resolved: "Resolved Tickets",
  closed: "Closed Tickets",
  rejected: "Rejected Tickets",
  withdrawn: "Withdrawn Tickets",
};

const CoordinatorAdminTicketManagement = () => {
  const { status = "all-tickets" } = useParams();
  const navigate = useNavigate();

  const [allTickets, setAllTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalType, setModalType] = useState(null); // 'open' | 'reject'

  const normalizedStatus = status.replace("-tickets", "").toLowerCase();
  const statusFilter = normalizedStatus.replace(/-/g, " ");

  useEffect(() => {
    const fetchedTickets = [...getEmployeeTickets(), ...getEmployeeTicketsByRumi()];
    setAllTickets(fetchedTickets);
  }, []);

  const filteredTickets = useMemo(() => {
    let result = normalizedStatus === "all"
      ? allTickets
      : allTickets.filter(ticket => ticket.status.toLowerCase() === statusFilter);

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(({ ticketNumber, subject }) =>
        ticketNumber.toLowerCase().includes(term) ||
        subject.toLowerCase().includes(term)
      );
    }

    return result;
  }, [allTickets, normalizedStatus, statusFilter, searchTerm]);

  const handleOpen = (ticket) => {
    setSelectedTicket(ticket);
    setModalType("open");
  };

  const handleReject = (ticket) => {
    setSelectedTicket(ticket);
    setModalType("reject");
  };

  const handleView = (ticket) => {
    navigate(`/employee/ticket-tracking/${ticket.ticketNumber}`);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalType(null);
  };

  return (
    <>
      <TableWrapper
        title={headingMap[normalizedStatus] || "Ticket Management"}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={false}
        showActions={false}
      >
        <TableContent
          columns={[
            { key: "ticketNumber", label: "Ticket Number" },
            { key: "subject", label: "Subject" },
            { key: "status", label: "Status" },
            { key: "priorityLevel", label: "Priority Level", render: val => val || "—" },
            { key: "category", label: "Category" },
            {
              key: "createdBy",
              label: "Created By",
              render: (_, row) => row.createdBy?.name || "Unknown",
            },
            {
              key: "dateCreated",
              label: "Date Created",
              render: val => val?.slice(0, 10),
            },
            {
              key: "open",
              label: "Open",
              render: (_, row) =>
                ["Submitted", "Pending"].includes(row.status)
                  ? getTicketActions("edit", row, { onEdit: handleOpen })
                  : "—",
            },
            {
              key: "reject",
              label: "Reject",
              render: (_, row) =>
                ["Submitted", "Pending"].includes(row.status)
                  ? getTicketActions("delete", row, { onDelete: handleReject })
                  : "—",
            },
            {
              key: "view",
              label: "View",
              render: (_, row) => getTicketActions("view", row, { onView: handleView }),
            },
          ]}
          data={filteredTickets}
          showSelection={false}
          showFooter={false}
          emptyMessage="No tickets found for this status or search."
        />
      </TableWrapper>

      {modalType === "open" && selectedTicket && (
        <ModalWrapper onClose={closeModal}>
          <CoordinatorAdminOpenTicketModal ticket={selectedTicket} onClose={closeModal} />
        </ModalWrapper>
      )}

      {modalType === "reject" && selectedTicket && (
        <ModalWrapper onClose={closeModal}>
          <CoordinatorAdminRejectTicketModal ticket={selectedTicket} onClose={closeModal} />
        </ModalWrapper>
      )}
    </>
  );
};

export default CoordinatorAdminTicketManagement;
