import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TableWrapper from "../../../shared/table/TableWrapper";
import TableContent from "../../../shared/table/TableContent";
import getTicketActions from "../../../shared/table/TicketActions";
import EmployeeActiveTicketsWithdrawTicketModal from "../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal";
import EmployeeActiveTicketsCloseTicketModal from "../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal";

const headingMap = {
  "all-active": "All Active Tickets",
  open: "Open Tickets",
  "in-progress": "In Progress Tickets",
  "on-hold": "On Hold Tickets",
  pending: "Pending Tickets",
  resolved: "Resolved Tickets",
};

const EmployeeActiveTickets = () => {
  const { filter = "all-active-tickets" } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [allActiveTickets, setAllActiveTickets] = useState([]);
  const [selectedWithdraw, setSelectedWithdraw] = useState(null);
  const [selectedClose, setSelectedClose] = useState(null);

  const normalizedFilter = filter.replace("-tickets", "").toLowerCase();
  const statusFilter =
    normalizedFilter === "all-active"
      ? null
      : normalizedFilter.replace(/-/g, " ").toLowerCase();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const token = localStorage.getItem("employee_access_token");
        const res = await fetch(
          `${import.meta.env.VITE_REACT_APP_API_URL}tickets/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setAllActiveTickets(
            data.map((t) => ({
              ...t,
              ticketNumber: t.ticket_number, // for navigation/search
              subCategory: t.sub_category,   // for table display
            }))
          );
        } else {
          setAllActiveTickets([]);
        }
      } catch {
        setAllActiveTickets([]);
      }
    };
    fetchTickets();
  }, []);

  const displayedTickets = useMemo(() => {
    let result = [...allActiveTickets];

    // Exclude rejected, withdrawn, and closed tickets from active tickets
    result = result.filter(
      (ticket) => {
        const status = ticket.status.toLowerCase();
        return status !== "rejected" && status !== "withdrawn" && status !== "closed";
      }
    );

    if (statusFilter) {
      if (statusFilter === "pending") {
        // Show both "Pending" and "New" tickets under Pending
        result = result.filter(
          (ticket) =>
            ticket.status.toLowerCase() === "pending" ||
            ticket.status.toLowerCase() === "new"
        );
      } else {
        result = result.filter(
          (ticket) => ticket.status.toLowerCase() === statusFilter
        );
      }
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        ({ ticketNumber, subject }) =>
          ticketNumber?.toLowerCase().includes(term) ||
          subject?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [allActiveTickets, statusFilter, searchTerm]);

  const handleWithdraw = (ticket) => {
    setSelectedWithdraw(ticket);
  };

  const handleClose = (ticket) => {
    setSelectedClose(ticket);
  };

  const handleView = (ticket) => {
    navigate(`/employee/ticket-tracker/${ticket.ticketNumber}`);
  };

  return (
    <>
      <TableWrapper
        title={headingMap[normalizedFilter] || "Active Tickets"}
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
              render: (val) => (val === "New" ? "Pending" : val),
            },
            { key: "priority", label: "Priority", render: (val) => val || "—" },
            { key: "department", label: "Department" }, // <-- Add this line
            { key: "category", label: "Category" },
            { key: "sub_category", label: "Sub Category" },
            {
              key: "submit_date",
              label: "Date Created",
              render: (val) => val?.slice(0, 10),
            },
            {
              key: "withdraw",
              label: "Withdraw",
              render: (_, row) =>
                getTicketActions("withdraw", row, {
                  onWithdraw: handleWithdraw,
                }),
            },
            {
              key: "close",
              label: "Close",
              render: (_, row) =>
                getTicketActions("delete", row, {
                  onDelete: handleClose,
                }),
            },
            {
              key: "view",
              label: "View",
              render: (_, row) =>
                getTicketActions("view", row, {
                  onView: handleView,
                }),
            },
          ]}
          data={displayedTickets}
          showSelection={false}
          showFooter={false}
          emptyMessage="No tickets found for this filter."
          onRowClick={(row) =>
            navigate(`/employee/ticket-tracker/${row.ticketNumber}`)
          }
        />
      </TableWrapper>

      {selectedWithdraw && (
        <EmployeeActiveTicketsWithdrawTicketModal
          ticket={selectedWithdraw}
          onClose={() => setSelectedWithdraw(null)}
          onSuccess={(ticketNumber) => {
            setAllActiveTickets((prev) =>
              prev.filter((t) => t.ticketNumber !== ticketNumber)
            );
          }}
        />
      )}

      {selectedClose && (
        <EmployeeActiveTicketsCloseTicketModal
          ticket={selectedClose}
          onClose={() => setSelectedClose(null)}
          onSuccess={(ticketNumber) => {
            setAllActiveTickets((prev) =>
              prev.map((t) =>
                t.ticketNumber === ticketNumber
                  ? { ...t, status: "Closed" }
                  : t
              )
            );
          }}
        />
      )}
    </>
  );
};

export default EmployeeActiveTickets;
