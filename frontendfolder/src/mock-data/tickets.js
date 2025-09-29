// Mock ticket data for local development
export const mockTickets = [
  {
    id: 1,
    ticket_number: "TX0001",
    subject: "Computer not starting",
    description: "My computer won't boot up this morning. The power light is on but the screen remains black.",
    priority_level: "High",
    department: "IT Department",
    status: "Open",
    date_created: "2024-03-20T09:00:00Z",
    date_updated: "2024-03-20T09:00:00Z",
    employee: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@gmail.com"
    },
    assigned_to: null,
    attachments: [],
    comments: []
  },
  {
    id: 2,
    ticket_number: "TX0002",
    subject: "Password reset request",
    description: "I forgot my password and need it reset. I can't access my email to reset it myself.",
    priority_level: "Medium",
    department: "IT Department",
    status: "In Progress",
    date_created: "2024-03-19T14:30:00Z",
    date_updated: "2024-03-20T10:15:00Z",
    employee: {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@gmail.com"
    },
    assigned_to: {
      id: 4,
      first_name: "System",
      last_name: "Administrator"
    },
    attachments: [],
    comments: [
      {
        id: 1,
        comment: "Working on this now. Will have it resolved soon.",
        date_created: "2024-03-20T10:15:00Z",
        created_by: {
          first_name: "System",
          last_name: "Administrator"
        }
      }
    ]
  },
  {
    id: 3,
    ticket_number: "TX0003",
    subject: "Budget system access issue",
    description: "Unable to access the budget system. Getting error message when trying to log in.",
    priority_level: "Low",
    department: "Budget Department",
    status: "Resolved",
    date_created: "2024-03-18T11:00:00Z",
    date_updated: "2024-03-19T16:30:00Z",
    employee: {
      id: 3,
      first_name: "Mike",
      last_name: "Wilson",
      email: "mike.wilson@gmail.com"
    },
    assigned_to: {
      id: 5,
      first_name: "Ticket",
      last_name: "Coordinator"
    },
    attachments: [],
    comments: [
      {
        id: 1,
        comment: "Reset user account credentials. Access has been restored.",
        date_created: "2024-03-19T16:30:00Z",
        created_by: {
          first_name: "Ticket",
          last_name: "Coordinator"
        }
      }
    ]
  }
];

export const ticketStatuses = ["New", "Open", "In Progress", "On Hold", "Pending", "Resolved", "Rejected", "Closed", "Withdrawn"];
export const priorityLevels = ["Critical", "High", "Medium", "Low"];
export const departments = ["IT Department", "Asset Department", "Budget Department"];
