import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";

import styles from "./CoordinatorAdminUserAccess.module.css";
import TablePagination from "../../../shared/table/TablePagination";
import FilterPanel from "../../../shared/table/FilterPanel";
import authService from "../../../utilities/service/authService";

import { getEmployeeUsers } from "../../../utilities/storages/employeeUserStorage";

import CoordinatorAdminApproveUserModal from "../../components/modals/CoordinatorAdminApproveUserModal";
import CoordinatorAdminRejectUserModal from "../../components/modals/CoordinatorAdminRejectUserModal";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const userAccessConfig = [
  { key: "all-users", label: "All Users" },
  { key: "employees", label: "Employees", filter: (u) => u.role?.toLowerCase() === "employee" },
  { key: "ticket-coordinators", label: "Ticket Coordinators", filter: (u) => u.role?.toLowerCase() === "ticket coordinator" },
  { key: "system-admins", label: "System Admins", filter: (u) => u.role?.toLowerCase() === "system admin" },
  { key: "pending-users", label: "Pending Users", filter: (u) => u.status?.toLowerCase() === "pending" },
  { key: "rejected-users", label: "Rejected Users", filter: (u) => u.status?.toLowerCase() === "rejected" },
];

const CoordinatorAdminUserAccess = () => {
  const { status = "all-users" } = useParams();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    category: null,
    status: null,
  });

  // 👇 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const normalizedStatus = status.toLowerCase();
  const statusConfig = userAccessConfig.find((cfg) => cfg.key === normalizedStatus);
  const title = statusConfig?.label || "User Access";

  useEffect(() => {
    // Get current user
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    // Fetch all users
    const fetchedUsers = getEmployeeUsers();
    
    // Filter users based on current user role and department
    let usersToShow = fetchedUsers;
    if (user) {
      if (user.role === 'Ticket Coordinator') {
        // Coordinators see users from their department
        usersToShow = fetchedUsers.filter(u => u.department === user.department);
      } else if (user.role === 'System Admin') {
        // System Admins see all users
        usersToShow = fetchedUsers;
      }
    }
    
    setAllUsers(usersToShow);
  }, []);

  const filteredUsers = useMemo(() => {
    let users = [...allUsers];

    // Apply URL-based filter
    if (statusConfig?.filter) {
      users = users.filter(statusConfig.filter);
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      users = users.filter(({ firstName, lastName, companyId }) =>
        [firstName, lastName, companyId].some((val) =>
          val?.toLowerCase().includes(term)
        )
      );
    }

    // Apply advanced filters from FilterPanel
    if (activeFilters.category) {
      users = users.filter(
        user => user.department === activeFilters.category.label
      );
    }

    if (activeFilters.status) {
      users = users.filter(
        user => user.status === activeFilters.status.label
      );
    }

    return users;
  }, [allUsers, statusConfig, searchTerm, activeFilters]);

  // 👇 Slice based on page
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // 👇 Reset page when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, normalizedStatus]);

  const openModal = (type, user) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  const isActionable = (status) => status?.toLowerCase() === "pending";




  return (
    <>
      <div className={styles.pageContainer}>
        {/* Top bar with Show Filter button */}
        <div className={styles.topBar}>
          <button 
            className={styles.showFilterButton}
            onClick={() => setShowFilter(!showFilter)}
          >
            {showFilter ? 'Hide Filter' : 'Show Filter'}
          </button>
        </div>

        {/* Filter Panel - outside table section */}
        {showFilter && (
          <FilterPanel
            hideToggleButton={true}
            showDateFilters={false}
            categoryLabel="Department"
            statusLabel="Status"
            onApply={setActiveFilters}
            onReset={() => {
              setActiveFilters({
                category: null,
                status: null,
              });
              setCurrentPage(1);
            }}
            categoryOptions={[
              { label: "Human Resources", category: "Department" },
              { label: "Information Technology", category: "Department" },
              { label: "Finance", category: "Department" },
              { label: "Operations", category: "Department" },
              { label: "Marketing", category: "Department" },
            ]}
            statusOptions={[
              { label: "Active", category: "Status" },
              { label: "Pending", category: "Status" },
              { label: "Rejected", category: "Status" },
              { label: "Inactive", category: "Status" },
            ]}
            priorityOptions={[]}
            slaStatusOptions={[]}
            assignedAgentOptions={[]}
            initialFilters={activeFilters}
          />
        )}

        <div className={styles.tableSection}>
          <div className={styles.tableHeader}>
            <h2>{title}</h2>
            <div className={styles.tableActions}>
              <input
                className={styles.searchBar}
                type="search"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <button
                className={styles.registerButton}
                onClick={() => navigate('/admin/account-register')}
              >
                Register User
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
            <thead>
              <tr>
                <th>Company ID</th>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Department</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#6b7280", fontStyle: "italic" }}>
                    No users found for this category or search.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, idx) => (
                  <tr key={user.companyId || idx}>
                    <td>{user.companyId}</td>
                    <td>{user.lastName}</td>
                    <td>{user.firstName}</td>
                    <td>{user.department}</td>
                    <td>{user.role}</td>
                    <td>
                      <div className={
                        styles[`status-${(user.status || "active").replace(/\s+/g, "-").toLowerCase()}`]
                      }>
                        {user.status}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actionButtonCont}>
                        {user.status?.toLowerCase() === "pending" && (
                          <button
                            title="Approve"
                            className={styles.actionButton}
                            onClick={() => openModal("approve", user)}
                          >
                            <FaCheck />
                          </button>
                        )}
                        {user.status?.toLowerCase() === "pending" && (
                          <button
                            title="Reject"
                            className={styles.actionButton}
                            onClick={() => openModal("reject", user)}
                          >
                            <FaTimes />
                          </button>
                        )}
                        <button
                          title="View"
                          className={styles.actionButton}
                          onClick={() => navigate(`/admin/user-profile/${user.companyId}`)}
                        >
                          <FaEye />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className={styles.tablePagination}>
          <TablePagination
            currentPage={currentPage}
            totalItems={filteredUsers.length}
            initialItemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
            alwaysShow={true}
          />
        </div>
      </div>
      </div>

      {modalType === "approve" && selectedUser && (
        <ModalWrapper onClose={closeModal}>
          <CoordinatorAdminApproveUserModal user={selectedUser} onClose={closeModal} />
        </ModalWrapper>
      )}

      {modalType === "reject" && selectedUser && (
        <ModalWrapper onClose={closeModal}>
          <CoordinatorAdminRejectUserModal user={selectedUser} onClose={closeModal} />
        </ModalWrapper>
      )}
    </>
  );
};

export default CoordinatorAdminUserAccess;
