import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEmployeeTickets } from "../../../utilities/storages/employeeTicketStorageBonjing";

import TableWrapper from "../../../shared/table/TableWrapper";
import TableContent from "../../../shared/table/TableContent";
import getTicketActions from "../../../shared/table/TicketActions";

import EmployeeActiveTicketsWithdrawTicketModal from "../../components/modals/active-tickets/EmployeeActiveTicketsWithdrawTicketModal";
import EmployeeActiveTicketsCloseTicketModal from "../../components/modals/active-tickets/EmployeeActiveTicketsCloseTicketModal";

const headingMap = {
  "all-active": "All Active Tickets",
  submitted: "Submitted Tickets",
  open: "Open Tickets",
  "in-progress": "In Progress Tickets",
  "on-hold": "On Hold Tickets",
  pending: "Pending Tickets",
  resolved: "Resolved Tickets",
};

const activeStatuses = [
  "Submitted",
  "Pending",
  "Open",
  "In Progress",
  "On Hold",
  "Resolved",
];

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
    const all = getEmployeeTickets();
    const filtered = all.filter((ticket) =>
      activeStatuses.includes(ticket.status)
    );
    setAllActiveTickets(filtered);
  }, []);

  const displayedTickets = useMemo(() => {
    let result = [...allActiveTickets];

    if (statusFilter) {
      result = result.filter(
        (ticket) => ticket.status.toLowerCase() === statusFilter
      );
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
            { key: "ticketNumber", label: "Ticket Number" },
            { key: "subject", label: "Subject" },
            { key: "status", label: "Status" },
            {
              key: "priorityLevel",
              label: "Priority",
              render: (val) => val || "—",
            },
            { key: "category", label: "Category" },
            { key: "subCategory", label: "Sub Category" },
            {
              key: "dateCreated",
              label: "Date Created",
              render: (val) => val?.slice(0, 10),
            },
            {
              key: "actions",
              label: "Actions",
              render: (_, row) => (
                <div className="action-wrapper">
                  {getTicketActions("withdraw", row, {
                    onWithdraw: handleWithdraw,
                  })}
                  {getTicketActions("delete", row, {
                    onDelete: handleClose,
                  })}
                  {getTicketActions("view", row, {
                    onView: handleView,
                  })}
                </div>
              ),
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
            // Optionally remove ticket from view
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
