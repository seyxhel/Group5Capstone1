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
  },
  // Additional tickets for John Doe
  {
    id: 4,
    ticket_number: "TX0004",
    subject: "Printer not working",
    description: "Office printer is not responding to print commands. Shows offline status.",
    priority_level: "Medium",
    department: "IT Department",
    status: "Pending",
    date_created: "2024-03-21T08:30:00Z",
    date_updated: "2024-03-21T08:30:00Z",
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
    id: 5,
    ticket_number: "TX0005",
    subject: "Software installation request",
    description: "Need Adobe Photoshop installed for design work. Current version is outdated.",
    priority_level: "Low",
    department: "IT Department",
    status: "Closed",
    date_created: "2024-03-15T10:00:00Z",
    date_updated: "2024-03-17T14:30:00Z",
    employee: {
      id: 1,
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@gmail.com"
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
        comment: "Software has been installed and updated to latest version.",
        date_created: "2024-03-17T14:30:00Z",
        created_by: {
          first_name: "System",
          last_name: "Administrator"
        }
      }
    ]
  },
  // Additional tickets for Jane Smith
  {
    id: 6,
    ticket_number: "TX0006",
    subject: "Asset tracking system error",
    description: "Getting database connection error when trying to update asset information.",
    priority_level: "High",
    department: "Asset Department",
    status: "In Progress",
    date_created: "2024-03-22T09:15:00Z",
    date_updated: "2024-03-22T11:00:00Z",
    employee: {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@gmail.com"
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
        comment: "Investigating database connectivity issues. Will update soon.",
        date_created: "2024-03-22T11:00:00Z",
        created_by: {
          first_name: "Ticket",
          last_name: "Coordinator"
        }
      }
    ]
  },
  {
    id: 7,
    ticket_number: "TX0007",
    subject: "New equipment request",
    description: "Need approval for new barcode scanner for inventory management.",
    priority_level: "Medium",
    department: "Asset Department",
    status: "Open",
    date_created: "2024-03-21T13:45:00Z",
    date_updated: "2024-03-21T13:45:00Z",
    employee: {
      id: 2,
      first_name: "Jane",
      last_name: "Smith",
      email: "jane.smith@gmail.com"
    },
    assigned_to: null,
    attachments: [],
    comments: []
  },
  // Additional tickets for Mike Wilson
  {
    id: 8,
    ticket_number: "TX0008",
    subject: "Budget report generation issue",
    description: "Monthly budget report is not generating properly. Shows incomplete data.",
    priority_level: "Critical",
    department: "Budget Department",
    status: "Open",
    date_created: "2024-03-22T07:00:00Z",
    date_updated: "2024-03-22T07:00:00Z",
    employee: {
      id: 3,
      first_name: "Mike",
      last_name: "Wilson",
      email: "mike.wilson@gmail.com"
    },
    assigned_to: null,
    attachments: [],
    comments: []
  },
  {
    id: 9,
    ticket_number: "TX0009",
    subject: "System performance slow",
    description: "Budget calculation system is running very slowly, affecting productivity.",
    priority_level: "Medium",
    department: "Budget Department",
    status: "On Hold",
    date_created: "2024-03-20T16:20:00Z",
    date_updated: "2024-03-21T09:10:00Z",
    employee: {
      id: 3,
      first_name: "Mike",
      last_name: "Wilson",
      email: "mike.wilson@gmail.com"
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
        comment: "Waiting for maintenance window to optimize database performance.",
        date_created: "2024-03-21T09:10:00Z",
        created_by: {
          first_name: "System",
          last_name: "Administrator"
        }
      }
    ]
  }
];

export const ticketStatuses = ["New", "Open", "In Progress", "On Hold", "Pending", "Resolved", "Rejected", "Closed", "Withdrawn"];
export const priorityLevels = ["Critical", "High", "Medium", "Low"];
export const departments = ["IT Department", "Asset Department", "Budget Department"];
