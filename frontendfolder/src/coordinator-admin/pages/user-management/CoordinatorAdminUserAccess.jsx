import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";

import styles from "./CoordinatorAdminUserAccess.module.css";
import ViewCard from "../../../shared/components/ViewCard";
import Button from "../../../shared/components/Button";
import TablePagination from "../../../shared/table/TablePagination";
import FilterPanel from "../../../shared/table/FilterPanel";
import authService from "../../../utilities/service/authService";
import { getEmployeeUsers } from "../../../utilities/storages/employeeUserStorage";

import CoordinatorAdminApproveUserModal from "../../components/modals/CoordinatorAdminApproveUserModal";
import CoordinatorAdminRejectUserModal from "../../components/modals/CoordinatorAdminRejectUserModal";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

// 👇 Configuration for tab filtering
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

  // 👇 Fetch users and current user
  useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);

    const fetchedUsers = getEmployeeUsers() || [];

    let usersToShow = fetchedUsers;
    if (user) {
      if (user.role === "Ticket Coordinator") {
        usersToShow = fetchedUsers.filter((u) => u.department === user.department);
      } else if (user.role === "System Admin") {
        usersToShow = fetchedUsers;
      }
    }

    setAllUsers(usersToShow);
  }, []);

  // 👇 Combined filtering logic
  const filteredUsers = useMemo(() => {
    let users = [...allUsers];

    // Apply role/status filter from URL
    if (statusConfig?.filter) {
      users = users.filter(statusConfig.filter);
    }

    // Search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      users = users.filter(({ firstName, lastName, companyId }) =>
        [firstName, lastName, companyId].some((val) => val?.toLowerCase().includes(term))
      );
    }

    // Advanced filters
    if (activeFilters.category) {
      users = users.filter(
        (user) => user.department?.toLowerCase() === activeFilters.category.label.toLowerCase()
      );
    }

    if (activeFilters.status) {
      users = users.filter(
        (user) => user.status?.toLowerCase() === activeFilters.status.label.toLowerCase()
      );
    }

    return users;
  }, [allUsers, statusConfig, searchTerm, activeFilters]);

  // 👇 Paginate
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(start, start + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // 👇 Reset pagination on filter/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, normalizedStatus, activeFilters]);

  const openModal = (type, user) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  return (
    <>
      <div className={styles.pageContainer}>
        {/* Header Section */}
        <div className={styles.topBar}>
          <button
            className={styles.showFilterButton}
            onClick={() => setShowFilter((prev) => !prev)}
          >
            {showFilter ? "Hide Filter" : "Show Filter"}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <FilterPanel
            hideToggleButton
            showDateFilters={false}
            categoryLabel="Department"
            statusLabel="Status"
            onApply={setActiveFilters}
            onReset={() => {
              setActiveFilters({ category: null, status: null });
              setCurrentPage(1);
            }}
            categoryOptions={[
              { label: "Human Resources" },
              { label: "Information Technology" },
              { label: "Finance" },
              { label: "Operations" },
              { label: "Marketing" },
            ]}
            statusOptions={[
              { label: "Active" },
              { label: "Pending" },
              { label: "Rejected" },
              { label: "Inactive" },
            ]}
            priorityOptions={[]}
            slaStatusOptions={[]}
            assignedAgentOptions={[]}
            initialFilters={activeFilters}
          />
        )}

        {/* Table Section */}
        <ViewCard>
          <div className={styles.tableSection}>
            <div className={styles.tableHeader}>
              <h2>{title}</h2>
              <div className={styles.tableActions}>
                <input
                  className={styles.searchBar}
                  type="search"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Button
                  variant="primary"
                  onClick={() => navigate("/admin/account-register")}
                  className={styles.registerButton}
                >
                  Register User
                </Button>
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
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          padding: 40,
                          color: "#6b7280",
                          fontStyle: "italic",
                        }}
                      >
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
                          <div
                            className={
                              styles[
                                `status-${(user.status || "active")
                                  .replace(/\s+/g, "-")
                                  .toLowerCase()}`
                              ]
                            }
                          >
                            {user.status}
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionButtonCont}>
                            {user.status?.toLowerCase() === "pending" && (
                              <>
                                <button
                                  title="Approve"
                                  className={styles.actionButton}
                                  onClick={() => openModal("approve", user)}
                                >
                                  <FaCheck />
                                </button>
                                <button
                                  title="Reject"
                                  className={styles.actionButton}
                                  onClick={() => openModal("reject", user)}
                                >
                                  <FaTimes />
                                </button>
                              </>
                            )}
                            <button
                              title="View"
                              className={styles.actionButton}
                              onClick={() =>
                                navigate(`/admin/user-profile/${user.companyId}`)
                              }
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
                alwaysShow
              />
            </div>
          </div>
        </ViewCard>
      </div>

      {/* Modals */}
      {modalType === "approve" && selectedUser && (
        <ModalWrapper onClose={closeModal}>
          <CoordinatorAdminApproveUserModal
            user={selectedUser}
            onClose={closeModal}
          />
        </ModalWrapper>
      )}

      {modalType === "reject" && selectedUser && (
        <ModalWrapper onClose={closeModal}>
          <CoordinatorAdminRejectUserModal
            user={selectedUser}
            onClose={closeModal}
          />
        </ModalWrapper>
      )}
    </>
  );
};

export default CoordinatorAdminUserAccess;
