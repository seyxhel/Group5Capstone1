// Mock ticket data for local development
export const mockTickets = [
  {
    id: 1,
    ticket_number: "TKT-2024-001",
    subject: "Computer not starting",
    description: "My computer won't boot up this morning. The power light is on but the screen remains black.",
    priority_level: "High",
    department: "IT",
    status: "Open",
    date_created: "2024-03-20T09:00:00Z",
    date_updated: "2024-03-20T09:00:00Z",
    employee: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@company.com"
    },
    assigned_to: null,
    attachments: [],
    comments: []
  },
  {
    id: 2,
    ticket_number: "TKT-2024-002",
    subject: "Password reset request",
    description: "I forgot my password and need it reset. I can't access my email to reset it myself.",
    priority_level: "Medium",
    department: "IT",
    status: "In Progress",
    date_created: "2024-03-19T14:30:00Z",
    date_updated: "2024-03-20T10:15:00Z",
    employee: {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@company.com"
    },
    assigned_to: {
      id: 1,
      first_name: "Admin",
      last_name: "User"
    },
    attachments: [],
    comments: [
      {
        id: 1,
        comment: "Working on this now. Will have it resolved soon.",
        date_created: "2024-03-20T10:15:00Z",
        created_by: {
          first_name: "Admin",
          last_name: "User"
        }
      }
    ]
  },
  {
    id: 3,
    ticket_number: "TKT-2024-003",
    subject: "Office printer not working",
    description: "The printer in the main office is showing error messages and won't print documents.",
    priority_level: "Low",
    department: "Operations",
    status: "Resolved",
    date_created: "2024-03-18T11:00:00Z",
    date_updated: "2024-03-19T16:30:00Z",
    employee: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@company.com"
    },
    assigned_to: {
      id: 1,
      first_name: "Admin",
      last_name: "User"
    },
    attachments: [],
    comments: [
      {
        id: 1,
        comment: "Replaced ink cartridge and cleared paper jam. Printer is working normally now.",
        date_created: "2024-03-19T16:30:00Z",
        created_by: {
          first_name: "Admin",
          last_name: "User"
        }
      }
    ]
  }
];

export const ticketStatuses = ["Open", "In Progress", "Resolved", "Closed", "Rejected"];
export const priorityLevels = ["Low", "Medium", "High", "Critical"];
export const departments = ["IT", "HR", "Finance", "Operations", "Marketing", "Administration"];
