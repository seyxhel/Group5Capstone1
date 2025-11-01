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
import { authUserService } from '../../../services/auth/userService';

import CoordinatorAdminApproveUserModal from "../../components/modals/CoordinatorAdminApproveUserModal";
import CoordinatorAdminRejectUserModal from "../../components/modals/CoordinatorAdminRejectUserModal";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

// 👇 Configuration for tab filtering
const userAccessConfig = [
  { key: "all-users", label: "All Users" },
  { key: "employees", label: "Employees", filter: (u) => u.role?.toLowerCase() === "employee" },
  { key: "ticket-coordinators", label: "Ticket Coordinators", filter: (u) => u.role?.toLowerCase() === "ticket coordinator" },
  { key: "system-admins", label: "System Admins", filter: (u) => {
    const role = u.role?.toLowerCase();
    return role === "system admin" || role === "admin";
  }},
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
    // Fetch users from auth service (http://localhost:8003/api/v1/hdts/user-management/users/api/)
    (async () => {
      try {
        const list = await authUserService.getAllHdtsUsers().catch(() => null);
        let fetchedUsers = null;
        if (Array.isArray(list) && list.length) {
          // Normalize auth service user objects to the shape used by this component
          fetchedUsers = list
            // hide superusers entirely
            .filter((e) => !e.is_superuser)
            .map((e) => {
              // Extract role from system_roles array
              const hdtsRole = (e.system_roles || []).find(r => r.system_slug === 'hdts' || r.system === 'hdts');
              const roleName = hdtsRole?.role_name || hdtsRole?.role || 'Employee';
              
              return {
                id: e.id,
                companyId: e.company_id || e.companyId || null,
                firstName: e.first_name || e.firstName || '',
                lastName: e.last_name || e.lastName || '',
                department: e.department || '',
                role: roleName,
                status: e.status || 'Active',
                email: e.email || null,
                image: e.profile_picture || e.image || null,
              };
            });
        }

        if (!fetchedUsers) {
          const local = getEmployeeUsers() || [];
          fetchedUsers = local;
        }

        let usersToShow = fetchedUsers;

        // Hide only explicit superuser accounts (is_superuser flag). Do not
        // filter by company id here — that may legitimately belong to a
        // non-superuser in some deployments.
        usersToShow = (usersToShow || []).filter((u) => {
          const isSuper = !!(u.is_superuser || u.isSuperuser || u.isSuperUser || u.is_super);
          return !isSuper;
        });

        // Apply role-scoped visibility (Ticket Coordinators only see their dept)
        if (user) {
          if (user.role === "Ticket Coordinator") {
            usersToShow = usersToShow.filter((u) => u.department === user.department);
          } else if (user.role === "System Admin") {
            usersToShow = usersToShow;
          }
        }

        setAllUsers(usersToShow || []);
      } catch (e) {
        // fallback to local store if backend request fails
        const fetchedUsers = getEmployeeUsers() || [];
        let usersToShow = fetchedUsers;

        // Ensure local fallback hides any entries explicitly marked as superuser
        usersToShow = (usersToShow || []).filter((u) => {
          const isSuper = !!(u.is_superuser || u.isSuperuser || u.isSuperUser || u.is_super);
          return !isSuper;
        });
        if (user) {
          if (user.role === "Ticket Coordinator") {
            usersToShow = usersToShow.filter((u) => u.department === user.department);
          } else if (user.role === "System Admin") {
            usersToShow = usersToShow;
          }
        }
        setAllUsers(usersToShow);
      }
    })();
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
      const selected = (activeFilters.status.label || '').toString().toLowerCase();
      // Map UI-facing label 'Active' to backend 'Approved' (and accept 'Active')
      const accepted = selected === 'active' ? ['active', 'approved'] : [selected];
      users = users.filter((user) => accepted.includes((user.status || '').toLowerCase()));
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

  const closeModal = (shouldRefresh) => {
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
              { label: "IT Department" },
              { label: "Asset Department" },
              { label: "Budget Department" },
            ]}
            // No sub-categories for User Access filters
            subCategoryOptions={[]}
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
