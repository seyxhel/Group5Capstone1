import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer } from "react-toastify";

import TableWrapper from "../../../shared/table/TableWrapper";
import TableContent from "../../../shared/table/TableContent";
import getTicketActions from "../../../shared/table/TicketActions";

import CoordinatorAdminOpenTicketModal from "../../components/modals/CoordinatorAdminOpenTicketModal";
import CoordinatorAdminRejectTicketModal from "../../components/modals/CoordinatorAdminRejectTicketModal";
import "react-toastify/dist/ReactToastify.css";

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

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

const CoordinatorAdminTicketManagement = () => {
  const { status = "all-tickets" } = useParams();
  const navigate = useNavigate();

  const [allTickets, setAllTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalType, setModalType] = useState(null);

  const normalizedStatus = status.replace("-tickets", "").toLowerCase();
  const statusFilter = normalizedStatus === "new" ? "submitted" : normalizedStatus.replace(/-/g, " ");

  // Fetch real tickets from backend
  useEffect(() => {
    const fetched = [...getEmployeeTickets(), ...getEmployeeTicketsByRumi()];
    setAllTickets(fetched);
  }, []);

  // Filter tickets by status and search
  const filteredTickets = useMemo(() => {
    let result = normalizedStatus === "all"
      ? allTickets
      : allTickets.filter(ticket =>
          ticket.status?.toLowerCase() === statusFilter
        );

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(({ ticketNumber, subject }) =>
        ticketNumber?.toLowerCase().includes(term) || subject?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [allTickets, normalizedStatus, statusFilter, searchTerm]);

  const openModal = (type, ticket) => {
    setSelectedTicket(ticket);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalType(null);
  };

  const handleSuccess = (ticketNumber, newStatus) => {
    setAllTickets(prev =>
      prev.map(ticket =>
        ticket.ticketNumber === ticketNumber ? { ...ticket, status: newStatus } : ticket
      )
    );
    closeModal();
  };

  const isActionable = (status) => {
    const s = (status || "").toLowerCase();
    return s === "submitted" || s === "pending";
  };

  return (
    <>
      <ToastContainer />
      <TableWrapper
        title={headingMap[normalizedStatus] || "Ticket Management"}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={false}
        showActions={false}
      >
        <TableContent
          columns={[
            { key: "ticket_number", label: "Ticket Number" },
            { key: "subject", label: "Subject" },
            {
              key: "status",
              label: "Status",
              render: (val) => (val?.toLowerCase() === "submitted" ? "New" : val),
            },
            {
              key: "priorityLevel",
              label: "Priority Level",
              render: (val) => val || "—",
            },
            {
              key: "department",
              label: "Department",
              render: (val) => val || "—",
            },
            { key: "category", label: "Category" },
            { key: "sub_category", label: "Sub-Category", render: (val) => val || "—" },
            {
              key: "submit_date",
              label: "Date Created",
              render: (val) =>
                val
                  ? `${new Date(val).toLocaleDateString()} ${new Date(val).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}`
                  : "",
            },
            {
              key: "open",
              label: "Open",
              render: (_, row) =>
                isActionable(row.status)
                  ? getTicketActions("edit", row, { onEdit: () => openModal("open", row) })
                  : "—",
            },
            {
              key: "reject",
              label: "Reject",
              render: (_, row) =>
                isActionable(row.status)
                  ? getTicketActions("delete", row, { onDelete: () => openModal("reject", row) })
                  : "—",
            },
            {
              key: "view",
              label: "View",
              render: (_, row) =>
                getTicketActions("view", row, {
                  onView: () => navigate(`/admin/ticket-tracker/${row.ticketNumber}`),
                }),
            },
          ]}
          data={filteredTickets}
          showSelection={false}
          showFooter={false}
          emptyMessage="No tickets found for this status or search."
        />
      </TableWrapper>

      {modalType === "open" && selectedTicket && (
        <CoordinatorAdminOpenTicketModal
          ticket={selectedTicket}
          onClose={closeModal}
          onSuccess={(ticketNumber) => handleSuccess(ticketNumber, "Open")}
        />
      )}

      {modalType === "reject" && selectedTicket && (
        <CoordinatorAdminRejectTicketModal
          ticket={selectedTicket}
          onClose={closeModal}
          onSuccess={(ticketNumber) => handleSuccess(ticketNumber, "Rejected")}
        />
      )}
    </>
  );
};

export default CoordinatorAdminTicketManagement;
