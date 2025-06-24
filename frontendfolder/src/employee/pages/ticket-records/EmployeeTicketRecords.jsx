import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./EmployeeTicketRecords.module.css";
import { getEmployeeTickets } from "../../../utilities/storages/employeeTicketStorageBonjing";

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
  const [filteredTickets, setFilteredTickets] = useState([]);

  useEffect(() => {
    const allTickets = getEmployeeTickets();
    const statuses = statusMap[filter] || [];

    const filtered = allTickets.filter((ticket) =>
      statuses.includes(ticket.status)
    );

    setFilteredTickets(filtered);
  }, [filter]);

  return (
    <>
      <section className={styles.top}>
        <h1>{headingMap[filter] || "Ticket Records"}</h1>
        <input
          type="text"
          placeholder="Search by Ticket # or Subject..."
          className={styles.searchInput}
        />
      </section>

      <section className={styles.middle}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Ticket Number</th>
              <th>Subject</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Category</th>
              <th>Sub Category</th>
              <th>Date Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <tr
                  key={ticket.ticketNumber}
                  className={styles.clickableRow}
                  onClick={() =>
                    navigate(`/employee/ticket-tracker/${ticket.ticketNumber}`)
                  }
                >
                  <td>{ticket.ticketNumber}</td>
                  <td>{ticket.subject}</td>
                  <td>{ticket.status}</td>
                  <td>{ticket.priorityLevel || "N/A"}</td>
                  <td>{ticket.category}</td>
                  <td>{ticket.subCategory}</td>
                  <td>{ticket.dateCreated?.slice(0, 10)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className={styles.noData}>
                  No ticket records found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
};

export default EmployeeTicketRecords;
