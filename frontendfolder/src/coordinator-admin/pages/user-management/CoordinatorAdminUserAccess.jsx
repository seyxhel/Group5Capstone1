import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TableWrapper from "../../../shared/table/TableWrapper";
import TableContent from "../../../shared/table/TableContent";
import getUserActions from "../../../shared/table/UserActions";

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

  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null);

  const normalizedStatus = status.toLowerCase();
  const statusConfig = userAccessConfig.find((cfg) => cfg.key === normalizedStatus);
  const title = statusConfig?.label || "User Access";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("admin_access_token");
        let url = `${import.meta.env.VITE_REACT_APP_API_URL}employees/`;
        if (normalizedStatus === "rejected-users") {
          url = `${import.meta.env.VITE_REACT_APP_API_URL}rejected-employees/`;
        }
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllUsers(data);
        } else {
          setAllUsers([]);
        }
      } catch (err) {
        setAllUsers([]);
      }
    };
    fetchUsers();
  }, [normalizedStatus]);

  const mappedUsers = allUsers.map(u => ({
    companyId: u.company_id,
    lastName: u.last_name,
    firstName: u.first_name,
    department: u.department,
    role: u.role,
    status: normalizedStatus === "rejected-users" ? "Rejected" : u.status,
    id: u.employee_id || u.id,
    email: u.email,
    reason: u.reason, // for rejected users
    timestamp: u.timestamp, // for rejected users
    rejectedBy: u.rejected_by, // for rejected users
  }));

  const filteredUsers = useMemo(() => {
    let users = [...mappedUsers];

    if (statusConfig?.filter) {
      users = users.filter(statusConfig.filter);
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      users = users.filter(({ firstName, lastName, companyId }) =>
        [firstName, lastName, companyId].some((val) => val?.toLowerCase().includes(term))
      );
    }

    return users;
  }, [mappedUsers, statusConfig, searchTerm]);

  const openModal = (type, user) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  const isActionable = (status) => status?.toLowerCase() === "pending";

  const columns = [
    { key: "companyId", label: "Company ID" },
    { key: "lastName", label: "Last Name" },
    { key: "firstName", label: "First Name" },
    { key: "department", label: "Department" },
    { key: "role", label: "Role" }, // <-- Add this back for all views
    { key: "status", label: "Status" },
  ];

  if (normalizedStatus === "rejected-users") {
    columns.push(
      { key: "timestamp", label: "Rejected At" },
      { key: "rejectedBy", label: "Rejected By" }
    );
  }

  if (
    normalizedStatus !== "rejected-users" &&
    normalizedStatus !== "system-admins" &&
    normalizedStatus !== "ticket-coordinators"
  ) {
    columns.push(
      {
        key: "approve",
        label: "Approve",
        render: (_, row) =>
          isActionable(row.status)
            ? getUserActions("approve", row, { onApprove: () => openModal("approve", row) })
            : "—",
      },
      {
        key: "reject",
        label: "Reject",
        render: (_, row) =>
          isActionable(row.status)
            ? getUserActions("reject", row, { onReject: () => openModal("reject", row) })
            : "—",
      }
    );
  }

  columns.push({
    key: "view",
    label: "View",
    render: (_, row) =>
      getUserActions("view", row, {
        onView: () => navigate(`/admin/user-profile/${row.companyId}`),
      }),
  });

  return (
    <>
      <TableWrapper
        title={title}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={false}
        showActions={false}
      >
        <TableContent
          columns={columns}
          data={filteredUsers}
          showSelection={false}
          showFooter={false}
          emptyMessage="No users found for this category or search."
        />
      </TableWrapper>

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
