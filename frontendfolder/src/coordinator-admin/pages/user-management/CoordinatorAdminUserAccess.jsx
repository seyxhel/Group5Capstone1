import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import TableWrapper from "../../../shared/table/TableWrapper";
import TableContent from "../../../shared/table/TableContent";
import getUserActions from "../../../shared/table/UserActions";

import { getEmployeeUsers } from "../../../utilities/storages/employeeUserStorage";

import CoordinatorAdminApproveUserModal from "../../components/modals/CoordinatorAdminApproveUserModal";
import CoordinatorAdminRejectUserModal from "../../components/modals/CoordinatorAdminRejectUserModal";
import ModalWrapper from "../../../shared/modals/ModalWrapper";

const headingMap = {
  "all-users": "All Users",
  employees: "Employees",
  "ticket-coordinators": "Ticket Coordinators",
  "system-admins": "System Admins",
  "pending-users": "Pending Users",
  "rejected-users": "Rejected Users",
};

const filterByStatusOrRole = (users, status) => {
  switch (status) {
    case "employees":
      return users.filter(u => u.role.toLowerCase() === "employee");
    case "ticket-coordinators":
      return users.filter(u => u.role.toLowerCase() === "ticket coordinator");
    case "system-admins":
      return users.filter(u => u.role.toLowerCase() === "system admin");
    case "pending-users":
      return users.filter(u => u.status.toLowerCase() === "pending");
    case "rejected-users":
      return users.filter(u => u.status.toLowerCase() === "rejected");
    default:
      return users;
  }
};

const CoordinatorAdminUserAccess = () => {
  const { status = "all-users" } = useParams();
  const navigate = useNavigate();

  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject'

  const normalizedStatus = status.toLowerCase();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("admin_access_token");
        const res = await fetch(`${import.meta.env.VITE_REACT_APP_API_URL}employees/`, {
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
  }, []);

  const mappedUsers = allUsers.map(u => ({
    companyId: u.company_id,
    lastName: u.last_name,
    firstName: u.first_name,
    department: u.department,
    role: u.role,
    status: u.status,
    id: u.id,
    email: u.email,
  }));

  const filteredUsers = useMemo(() => {
    const filtered = filterByStatusOrRole(mappedUsers, normalizedStatus);

    if (!searchTerm.trim()) return filtered;

    const term = searchTerm.toLowerCase();
    return filtered.filter(({ firstName, lastName, companyId }) =>
      [firstName, lastName, companyId].some(field =>
        field && field.toLowerCase().includes(term)
      )
    );
  }, [allUsers, normalizedStatus, searchTerm]);

  const handleModal = (type, user) => {
    setSelectedUser(user);
    setModalType(type);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setModalType(null);
  };

  return (
    <>
      <TableWrapper
        title={headingMap[normalizedStatus] || "User Access"}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showFilters={false}
        showActions={false}
      >
        <TableContent
          columns={[
            { key: "companyId", label: "Company ID" },
            { key: "lastName", label: "Last Name" },
            { key: "firstName", label: "First Name" },
            { key: "department", label: "Department" },
            { key: "role", label: "Role" },
            { key: "status", label: "Status" },
            {
              key: "approve",
              label: "Approve",
              render: (_, row) =>
                row.status === "Pending"
                  ? getUserActions("approve", row, { onApprove: () => handleModal("approve", row) })
                  : "—",
            },
            {
              key: "reject",
              label: "Reject",
              render: (_, row) =>
                row.status === "Pending"
                  ? getUserActions("reject", row, { onReject: () => handleModal("reject", row) })
                  : "—",
            },
            {
              key: "view",
              label: "View",
              render: (_, row) => getUserActions("view", row, { onView: () => navigate(`/admin/user-profile/${row.companyId}`) }),
            },
          ]}
          data={filteredUsers}
          showSelection={false}
          showFooter={false}
          emptyMessage="No users found for this category or search."
        />
      </TableWrapper>

      {modalType && selectedUser && (
        <ModalWrapper onClose={closeModal}>
          {modalType === "approve" ? (
            <CoordinatorAdminApproveUserModal user={selectedUser} onClose={closeModal} />
          ) : (
            <CoordinatorAdminRejectUserModal user={selectedUser} onClose={closeModal} />
          )}
        </ModalWrapper>
      )}
    </>
  );
};

export default CoordinatorAdminUserAccess;
