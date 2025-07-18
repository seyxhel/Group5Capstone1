import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TableWrapper from "../../../shared/table/TableWrapper";
import TableContent from "../../../shared/table/TableContent";
import getTicketActions from "../../../shared/table/TicketActions";

import CoordinatorAdminOpenTicketModal from "../../components/modals/CoordinatorAdminOpenTicketModal";
import CoordinatorAdminRejectTicketModal from "../../components/modals/CoordinatorAdminRejectTicketModal";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const headingMap = {
  all: "All Tickets",
  new: "New Tickets",
  pending: "Pending Tickets",
  open: "Open Tickets",
  "in-progress": "In Progress Tickets",
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
  const [modalType, setModalType] = useState(null); // 'open' | 'reject'

  const normalizedStatus = status.replace("-tickets", "").toLowerCase();
  // Map "new" to "New" for filtering tickets
  const statusFilter = normalizedStatus === "new" ? "New" : normalizedStatus.replace(/-/g, " ");

  // Fetch real tickets from backend
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("admin_access_token");
        const res = await fetch(`${API_URL}tickets/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllTickets(data);
        } else {
          setAllTickets([]);
        }
      } catch (err) {
        setAllTickets([]);
      }
    };
    fetchTickets();
  }, []);

  // Filter tickets by status and search
  const filteredTickets = useMemo(() => {
    let result =
      normalizedStatus === "all"
        ? allTickets
        : allTickets.filter(ticket => {
            // For "new", match backend status "New"
            if (normalizedStatus === "new") {
              return ticket.status === "New";
            }
            return ticket.status && ticket.status.toLowerCase() === statusFilter;
          });

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        ({ ticket_number, subject }) =>
          ticket_number?.toLowerCase().includes(term) || subject?.toLowerCase().includes(term)
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
    navigate(`/admin/ticket-tracker/${ticket.ticket_number}`);
  };

  const closeModal = () => {
    setSelectedTicket(null);
    setModalType(null);
  };

  // Get user role from localStorage (or context)
  const userRole = localStorage.getItem("user_role"); // e.g., "System Admin" or "Ticket Coordinator"

  const baseColumns = [
    { key: "ticket_number", label: "Ticket Number" },
    { key: "subject", label: "Subject" },
    {
      key: "status",
      label: "Status",
      render: (val) => val,
    },
    { key: "priority", label: "Priority Level", render: (val) => val || "—" },
    { key: "department", label: "Department", render: (val) => val || "—" },
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
      key: "view",
      label: "View",
      render: (_, row) => getTicketActions("view", row, { onView: handleView }),
    },
  ];

  // Only Ticket Coordinator can see Open/Reject columns, but NOT in Rejected Tickets table
  const coordinatorColumns = [
    ...baseColumns.slice(0, 8),
    // Only show Open/Reject columns if NOT in "rejected" status table
    ...(normalizedStatus !== "rejected"
      ? [
          {
            key: "open",
            label: "Open",
            render: (_, row) =>
              userRole === "Ticket Coordinator" && ["New", "Pending"].includes(row.status)
                ? getTicketActions("edit", row, { onEdit: handleOpen })
                : "—",
          },
          {
            key: "reject",
            label: "Reject",
            render: (_, row) =>
              userRole === "Ticket Coordinator" && ["New", "Pending"].includes(row.status)
                ? getTicketActions("reject", row, { onReject: handleReject })
                : "—",
          },
        ]
      : []),
    baseColumns[8], // view column
  ];

  const columns = userRole === "Ticket Coordinator" ? coordinatorColumns : baseColumns;

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
          columns={columns}
          data={filteredTickets}
          showSelection={false}
          showFooter={false}
          emptyMessage="No tickets found."
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
