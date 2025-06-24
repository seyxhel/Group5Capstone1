import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { HiOutlineRefresh } from "react-icons/hi";
import { FiXCircle } from "react-icons/fi";
import styles from "./EmployeeActiveTickets.module.css";
import { getEmployeeTickets } from "../../../utilities/storages/employeeTicketStorageBonjing";

const EmployeeActiveTickets = () => {
  const { filter = "all-active-tickets" } = useParams();
  const navigate = useNavigate();
  const normalizedFilter = filter.replace("-tickets", "").toLowerCase();

  const [filteredTickets, setFilteredTickets] = useState([]);

  const headingMap = {
    "all-active": "All Active Tickets",
    submitted: "Submitted Tickets",
    open: "Open Tickets",
    "on-progress": "On Progress Tickets",
    "on-hold": "On Hold Tickets",
    pending: "Pending Tickets",
    resolved: "Resolved Tickets",
  };

  const activeStatuses = [
    "Submitted",
    "Pending",
    "Open",
    "On Progress",
    "On Hold",
    "Resolved",
  ];

  useEffect(() => {
    const allTickets = getEmployeeTickets();
    const activeTickets = allTickets.filter((ticket) =>
      activeStatuses.includes(ticket.status)
    );

    if (normalizedFilter === "all-active") {
      setFilteredTickets(activeTickets);
    } else {
      const statusMatch = normalizedFilter.replace(/-/g, " ").toLowerCase();
      setFilteredTickets(
        activeTickets.filter(
          (ticket) => ticket.status.toLowerCase() === statusMatch
        )
      );
    }
  }, [normalizedFilter]);

  return (
    <>
      <section className={styles.top}>
        <h1>{headingMap[normalizedFilter] || "All Active Tickets"}</h1>
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
              <th>Actions</th>
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
                  <td>{ticket.priorityLevel}</td>
                  <td>{ticket.category}</td>
                  <td>{ticket.subCategory}</td>
                  <td>{ticket.dateCreated?.slice(0, 10)}</td>
                  <td>
                    <div
                      className={styles.actionGroup}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {ticket.status === "Resolved" ? (
                        <button
                          className={`${styles.actionBtn} ${styles.delete}`}
                          title="Close"
                        >
                          <FiXCircle />
                        </button>
                      ) : (
                        <button
                          className={`${styles.actionBtn} ${styles.edit}`}
                          title="Withdraw"
                        >
                          <HiOutlineRefresh />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className={styles.noData}>
                  No tickets found for this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </>
  );
};

export default EmployeeActiveTickets;
