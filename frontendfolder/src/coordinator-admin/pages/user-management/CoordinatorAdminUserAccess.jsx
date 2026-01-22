import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaCheck, FaTimes, FaEye } from "react-icons/fa";

import styles from "./CoordinatorAdminUserAccess.module.css";
import Table from "../../../shared/table/Table";
import FilterPanel from "../../../shared/table/FilterPanel";
import authService from "../../../utilities/service/authService";
import { getEmployeeUsers } from "../../../utilities/storages/employeeUserStorage";

import CoordinatorAdminApproveUserModal from "../../components/modals/SysAdminApproveUserModal";
import CoordinatorAdminRejectUserModal from "../../components/modals/SysAdminRejectUserModal";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);

  const normalizedStatus = status.toLowerCase();
  const statusConfig = userAccessConfig.find((cfg) => cfg.key === normalizedStatus);
  const title = statusConfig?.label || "User Access";

  const FilterComponent = () => (
    <FilterPanel
      key={showFilter ? "filter-shown" : "filter-hidden"}
      preset="userManagement"
      initialShow={showFilter}
      onApply={setActiveFilters}
      onReset={() => {
        setActiveFilters({ category: null, status: null });
        setCurrentPage(1);
      }}
      initialFilters={activeFilters}
    />
  );

  // 👇 Fetch users and current user
  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => {
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
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const columns = [
    { key: 'companyId', label: 'Company ID', skeletonWidth: '120px' },
    { key: 'lastName', label: 'Last Name', skeletonWidth: '120px' },
    { key: 'firstName', label: 'First Name', skeletonWidth: '120px' },
    { key: 'department', label: 'Department', skeletonWidth: '120px' },
    { key: 'role', label: 'Role', skeletonWidth: '120px' },
    {
      key: 'status',
      label: 'Status',
      skeletonWidth: '100px',
      render: (val) => (
        <div className={styles[`status-${(val || 'active').replace(/\s+/g, '-').toLowerCase()}`]}>
          {val}
        </div>
      ),
    },
    {
      key: 'companyId',
      label: 'Actions',
      skeletonWidth: '120px',
      render: (val, user) => (
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
            onClick={() => navigate(`/admin/user-profile/${user.companyId}`)}
          >
            <FaEye />
          </button>
        </div>
      ),
    },
  ];

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
      <Table
        variant="default"
        data={filteredUsers
          .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
          .map((user) => ({
            ...user,
            status: user.status || "Active",
          }))}
        columns={columns}
        title={title}
        searchable
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filterComponent={FilterComponent}
        showFilter={showFilter}
        onShowFilterChange={setShowFilter}
        currentPage={currentPage}
        pageSize={itemsPerPage}
        totalItems={filteredUsers.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        isLoading={isLoading}
        emptyMessage="No users found."
      />

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
