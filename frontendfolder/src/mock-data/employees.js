// Mock employee data for local development
export const mockEmployees = [
  {
    id: 1,
    email: "john.doe@gmail.com",
    password: "employee123",
    company_id: "MA0001",
    first_name: "John",
    middle_name: "Michael",
    last_name: "Doe",
    suffix: "Jr.",
    department: "IT Department",
    role: "Employee",
    status: "Approved",
    date_joined: "2024-01-15",
    profile_image: "/public/default-profile.png"
  },
  {
    id: 2,
    email: "jane.smith@gmail.com",
    password: "manager123",
    company_id: "MA0002",
    first_name: "Jane",
    middle_name: "Anne",
    last_name: "Smith",
    suffix: "",
    department: "Asset Department",
    role: "Employee",
    status: "Approved",
    date_joined: "2024-02-20",
    profile_image: "/public/default-profile.png"
  },
  {
    id: 3,
    email: "mike.wilson@gmail.com",
    password: "analyst123",
    company_id: "MA0003",
    first_name: "Mike",
    middle_name: "",
    last_name: "Wilson",
    suffix: "",
    department: "Budget Department",
    role: "Employee",
    status: "Pending",
    date_joined: "2024-03-10",
    profile_image: "/public/default-profile.png"
  }
];

export const mockAdmins = [
  {
    id: 4,
    email: "sysadmin@gmail.com",
    password: "sysadmin123",
    company_id: "MA9001",
    first_name: "System",
    middle_name: "",
    last_name: "Administrator",
    suffix: "",
    department: "IT Department",
    role: "System Admin",
    admin_type: "sysad",
    status: "Approved",
    date_joined: "2023-12-01",
    profile_image: "/public/default-profile.png"
  },
  {
    id: 5,
    email: "coordinator@gmail.com",
    password: "coordinator123",
    company_id: "MA9002",
    first_name: "Ticket",
    middle_name: "",
    last_name: "Coordinator",
    suffix: "",
    department: "IT Department",
    role: "Ticket Coordinator",
    admin_type: "coordinator",
    status: "Approved",
    date_joined: "2023-12-01",
    profile_image: "/public/default-profile.png"
  }
];

// Mock rejected employees audit
export const mockRejectedEmployees = [
  {
    id: 1,
    original_email: "rejected@gmail.com",
    original_company_id: "MA0099",
    first_name: "Rejected",
    last_name: "User",
    department: "Asset Department",
    role: "Employee",
    reason: "Incomplete documentation",
    rejected_date: "2024-03-15"
  }
];
