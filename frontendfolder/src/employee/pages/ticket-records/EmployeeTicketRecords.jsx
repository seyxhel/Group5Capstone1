import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TableWrapper from "../../../shared/table/TableWrapper";
import TableContent from "../../../shared/table/TableContent";
import getTicketActions from "../../../shared/table/TicketActions";
import { USE_LOCAL_API } from '../../../config/environment.js';
import { apiService } from '../../../services/apiService.js';

const headingMap = {
  "all-ticket-records": "All Ticket Records",
  "closed-ticket-records": "Closed Tickets",
  "rejected-ticket-records": "Rejected Tickets",
  "withdrawn-ticket-records": "Withdrawn Tickets",
};

const statusMap = {
  "all-ticket-records": ["Closed", "Rejected", "Withdrawn"],
  "closed-ticket-records": ["Closed"],
  "rejected-ticket-records": ["Rejected"],
  "withdrawn-ticket-records": ["Withdrawn"],
};

const EmployeeTicketRecords = () => {
  const { filter = "all-ticket-records" } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [allTickets, setAllTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        let data = [];
        
        if (USE_LOCAL_API) {
          console.log('📋 Fetching ticket records locally...');
          const currentUser = JSON.parse(localStorage.getItem('hdts_current_user') || '{}');
          const result = await apiService.tickets.getEmployeeTickets(currentUser.id);
          if (result.success) {
            data = result.data;
            console.log('✅ Loaded ticket records:', data.length);
          }
        } else {
          // Original backend API logic
          const token = localStorage.getItem("employee_access_token");
          const res = await fetch(
            `${import.meta.env.VITE_REACT_APP_API_URL}tickets/`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.ok) {
            data = await res.json();
          }
        }
        
        setAllTickets(
          data.map((t) => ({
            ...t,
            ticketNumber: t.ticket_number,
            subCategory: t.sub_category,
            priorityLevel: t.priority,
            dateCreated: t.submit_date,
          }))
        );
      } catch (error) {
        console.log('❌ Error fetching ticket records:', error);
        setAllTickets([]);
      }
    };
    fetchTickets();
  }, []);

  const filteredTickets = useMemo(() => {
    const allowedStatuses = statusMap[filter] || [];

    let filtered = allTickets.filter(ticket =>
      allowedStatuses.includes(ticket.status)
    );

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        ({ ticketNumber, subject }) =>
          ticketNumber?.toLowerCase().includes(term) ||
          subject?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [allTickets, filter, searchTerm]);

  const handleView = (ticket) => {
    navigate(`/employee/ticket-tracker/${ticket.ticketNumber}`, {
      state: { from: "ticket-records" }
    });
  };

  return (
    <TableWrapper
      title={headingMap[filter] || "Ticket Records"}
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
            render: (val) => val || "-",
          },
          { key: "department", label: "Department" }, // <-- Added department column
          { key: "category", label: "Category" },
          { key: "subCategory", label: "Sub Category" },
          {
            key: "dateCreated",
            label: "Date Created",
            render: (val) => val?.slice(0, 10),
          },
          {
            key: "view",
            label: "View",
            render: (_, row) =>
              getTicketActions("view", row, { onView: handleView }),
          },
        ]}
        data={filteredTickets}
        showSelection={false}
        showFooter={false}
        emptyMessage="No ticket records found for this filter."
        onRowClick={(row) =>
          navigate(`/employee/ticket-tracker/${row.ticketNumber}`, {
            state: { from: "ticket-records" }
          })
        }
      />
    </TableWrapper>
  );
};

export default EmployeeTicketRecords;
