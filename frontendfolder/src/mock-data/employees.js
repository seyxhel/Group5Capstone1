// Mock employee data for local development
export const mockEmployees = [
  {
    id: 1,
    email: "john.doe@company.com",
    company_id: "EMP001",
    first_name: "John",
    middle_name: "Michael",
    last_name: "Doe",
    suffix: "Jr.",
    department: "IT",
    role: "Developer",
    status: "approved",
    date_joined: "2024-01-15",
    profile_image: "/public/default-profile.png"
  },
  {
    id: 2,
    email: "jane.smith@company.com",
    company_id: "EMP002",
    first_name: "Jane",
    middle_name: "Anne",
    last_name: "Smith",
    suffix: "",
    department: "HR",
    role: "Manager",
    status: "approved",
    date_joined: "2024-02-20",
    profile_image: "/public/default-profile.png"
  },
  {
    id: 3,
    email: "mike.wilson@company.com",
    company_id: "EMP003",
    first_name: "Mike",
    middle_name: "",
    last_name: "Wilson",
    suffix: "",
    department: "Finance",
    role: "Analyst",
    status: "pending",
    date_joined: "2024-03-10",
    profile_image: "/public/default-profile.png"
  }
];

export const mockAdmins = [
  {
    id: 1,
    email: "admin@company.com",
    company_id: "ADM001",
    first_name: "Admin",
    middle_name: "",
    last_name: "User",
    suffix: "",
    department: "Administration",
    role: "Coordinator",
    status: "approved",
    date_joined: "2023-12-01",
    profile_image: "/public/default-profile.png"
  }
];

// Mock rejected employees audit
export const mockRejectedEmployees = [
  {
    id: 1,
    original_email: "rejected@company.com",
    original_company_id: "REJ001",
    first_name: "Rejected",
    last_name: "User",
    department: "Marketing",
    role: "Coordinator",
    reason: "Incomplete documentation",
    rejected_date: "2024-03-15"
  }
];
