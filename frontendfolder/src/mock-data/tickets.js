// Mock ticket data for local development
export const mockTickets = [
  {
    id: 1,
    ticket_number: "TX0001",
    employee: 1,
    subject: "Computer not starting",
    category: "IT Category",
    sub_category: "IT Infrastructure Management",
    description: "My computer won't boot up this morning. The power light is on but the screen remains black.",
    scheduled_date: null,
    priority: "High",
    department: "IT Department",
    status: "Open",
    submit_date: "2024-03-20T09:00:00Z",
    update_date: "2024-03-20T09:00:00Z",
    date_created: "2024-03-20T09:00:00Z",
    date_updated: "2024-03-20T09:00:00Z",
    employee_details: {
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
    employee: 2,
    subject: "Password reset request",
    category: "IT Category",
    sub_category: "Technical Support & Troubleshooting",
    description: "I forgot my password and need it reset. I can't access my email to reset it myself.",
    scheduled_date: null,
    priority: "Medium",
    department: "IT Department",
    status: "In Progress",
    submit_date: "2024-03-19T14:30:00Z",
    update_date: "2024-03-20T10:15:00Z",
    date_created: "2024-03-19T14:30:00Z",
    date_updated: "2024-03-20T10:15:00Z",
    employee_details: {
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
    employee: 3,
    subject: "Budget system access issue",
    category: "Budget Category",
    sub_category: "Project Proposal",
    description: "Unable to access the budget system. Getting error message when trying to log in.",
    scheduled_date: null,
    priority: "Low",
    department: "Budget Department",
    status: "Resolved",
    submit_date: "2024-03-18T11:00:00Z",
    update_date: "2024-03-19T16:30:00Z",
    date_created: "2024-03-18T11:00:00Z",
    date_updated: "2024-03-19T16:30:00Z",
    employee_details: {
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
    employee: 1,
    subject: "Printer not working",
    category: "IT Category",
    sub_category: "IT Infrastructure Management",
    description: "Office printer is not responding to print commands. Shows offline status.",
    scheduled_date: null,
    status: "Pending",
    submit_date: "2024-03-21T08:30:00Z",
    update_date: "2024-03-21T08:30:00Z",
    date_created: "2024-03-21T08:30:00Z",
    date_updated: "2024-03-21T08:30:00Z",
    employee_details: {
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
    employee: 1,
    subject: "Software installation request",
    category: "IT Category",
    sub_category: "Software & Applications Deployment",
    description: "Need Adobe Photoshop installed for design work. Current version is outdated.",
    scheduled_date: null,
    priority: "Low",
    department: "IT Department",
    status: "Closed",
    submit_date: "2024-03-15T10:00:00Z",
    update_date: "2024-03-17T14:30:00Z",
    date_created: "2024-03-15T10:00:00Z",
    date_updated: "2024-03-17T14:30:00Z",
    employee_details: {
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
    employee: 2,
    subject: "Asset tracking system error",
    category: "Asset Category",
    sub_category: "Asset Check-out",
    description: "Getting database connection error when trying to update asset information.",
    scheduled_date: null,
    priority: "High",
    department: "Asset Department",
    status: "In Progress",
    submit_date: "2024-03-22T09:15:00Z",
    update_date: "2024-03-22T11:00:00Z",
    date_created: "2024-03-22T09:15:00Z",
    date_updated: "2024-03-22T11:00:00Z",
    employee_details: {
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
    employee: 2,
    subject: "New equipment request",
    category: "Asset Category",
    sub_category: "Asset Check-out",
    description: "Need approval for new barcode scanner for inventory management.",
    scheduled_date: null,
    priority: "Medium",
    department: "Asset Department",
    status: "Open",
    submit_date: "2024-03-21T13:45:00Z",
    update_date: "2024-03-21T13:45:00Z",
    date_created: "2024-03-21T13:45:00Z",
    date_updated: "2024-03-21T13:45:00Z",
    employee_details: {
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
    employee: 3,
    subject: "Budget report generation issue",
    category: "Budget Category",
    sub_category: "Project Proposal",
    description: "Monthly budget report is not generating properly. Shows incomplete data.",
    scheduled_date: null,
    priority: "Critical",
    department: "Budget Department",
    status: "Open",
    submit_date: "2024-03-22T07:00:00Z",
    update_date: "2024-03-22T07:00:00Z",
    date_created: "2024-03-22T07:00:00Z",
    date_updated: "2024-03-22T07:00:00Z",
    employee_details: {
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
    employee: 3,
    subject: "System performance slow",
    category: "Budget Category",
    sub_category: "Project Proposal",
    description: "Budget calculation system is running very slowly, affecting productivity.",
    scheduled_date: null,
    priority: "Medium",
    department: "Budget Department",
    status: "On Hold",
    submit_date: "2024-03-20T16:20:00Z",
    update_date: "2024-03-21T09:10:00Z",
    date_created: "2024-03-20T16:20:00Z",
    date_updated: "2024-03-21T09:10:00Z",
    employee_details: {
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
  },
  // Additional tickets for better testing - John Doe
  {
    id: 10,
    ticket_number: "TX0010",
    employee: 1,
    subject: "Software installation request",
    category: "IT Category",
    sub_category: "Software & Applications Deployment",
    description: "Need Adobe Photoshop installed on my workstation for design work.",
    scheduled_date: null,
    status: "Pending",
    date_created: "2024-03-18T11:20:00Z",
    date_updated: "2024-03-18T11:20:00Z",
    submit_date: "2024-03-18T11:20:00Z",
    update_date: "2024-03-18T11:20:00Z",
    employee_details: {
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
    id: 11,
    ticket_number: "TX0011",
    employee: 1,
    subject: "Keyboard replacement",
    category: "IT Category",
    sub_category: "IT Infrastructure Management",
    description: "Several keys on my keyboard are not working properly. Need a replacement.",
    scheduled_date: null,
    priority: "Low",
    department: "IT Department",
    status: "Resolved",
    date_created: "2024-03-15T13:45:00Z",
    date_updated: "2024-03-17T16:30:00Z",
    submit_date: "2024-03-15T13:45:00Z",
    update_date: "2024-03-17T16:30:00Z",
    employee_details: {
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
        comment: "Keyboard has been replaced. Please test and confirm.",
        date_created: "2024-03-17T16:30:00Z",
        created_by: {
          first_name: "System",
          last_name: "Administrator"
        }
      }
    ]
  },
  // Additional tickets for Jane Smith
  {
    id: 12,
    ticket_number: "TX0012",
    employee: 2,
    subject: "Database access request",
    category: "Asset Category",
    sub_category: "Asset Check-out",
    description: "Need access to the inventory database for quarterly reporting.",
    scheduled_date: null,
    priority: "High",
    department: "Asset Department",
    status: "Open",
    date_created: "2024-03-19T09:30:00Z",
    date_updated: "2024-03-19T09:30:00Z",
    submit_date: "2024-03-19T09:30:00Z",
    update_date: "2024-03-19T09:30:00Z",
    employee_details: {
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
    comments: []
  },
  {
    id: 13,
    ticket_number: "TX0013",
    employee: 2,
    subject: "Office chair repair",
    category: "Asset Category",
    sub_category: "Asset Check-in",
    description: "My office chair's wheel is broken and needs repair or replacement.",
    scheduled_date: null,
    priority: "Low",
    department: "Asset Department",
    status: "Closed",
    date_created: "2024-03-10T14:15:00Z",
    date_updated: "2024-03-12T10:45:00Z",
    submit_date: "2024-03-10T14:15:00Z",
    update_date: "2024-03-12T10:45:00Z",
    employee_details: {
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
        comment: "Chair has been repaired. Issue resolved.",
        date_created: "2024-03-12T10:45:00Z",
        created_by: {
          first_name: "Ticket",
          last_name: "Coordinator"
        }
      }
    ]
  },
  // Additional tickets for Mike Wilson
  {
    id: 14,
    ticket_number: "TX0014",
    employee: 3,
    subject: "Budget software training",
    category: "Budget Category",
    sub_category: "Project Proposal",
    description: "Need training on the new budget management software that was recently installed.",
    scheduled_date: null,
    priority: "Medium",
    department: "Budget Department",
    status: "In Progress",
    date_created: "2024-03-21T08:00:00Z",
    date_updated: "2024-03-21T14:20:00Z",
    submit_date: "2024-03-21T08:00:00Z",
    update_date: "2024-03-21T14:20:00Z",
    employee_details: {
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
        comment: "Training session scheduled for next week. Details will be sent via email.",
        date_created: "2024-03-21T14:20:00Z",
        created_by: {
          first_name: "Ticket",
          last_name: "Coordinator"
        }
      }
    ]
  },
  {
    id: 15,
    ticket_number: "TX0015",
    employee: 3,
    subject: "Network drive access",
    category: "Budget Category",
    sub_category: "Project Proposal",
    description: "Cannot access the shared network drive where budget files are stored.",
    scheduled_date: null,
    priority: "High",
    department: "Budget Department",
    status: "On Hold",
    date_created: "2024-03-22T10:30:00Z",
    date_updated: "2024-03-22T15:45:00Z",
    submit_date: "2024-03-22T10:30:00Z",
    update_date: "2024-03-22T15:45:00Z",
    employee_details: {
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
        comment: "Waiting for network administrator to resolve server issues.",
        date_created: "2024-03-22T15:45:00Z",
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

// Categories matching ticketStaticData.js
export const categories = ["IT Category", "Asset Category", "Budget Category"];
export const subCategories = {
  'IT Category': [
    'IT Infrastructure Management',
    'Software & Applications Deployment',
    'Network & Security Administration',
    'Technical Support & Troubleshooting',
    'System Maintenance'
  ],
  'Asset Category': [
    'Asset Check-out',
    'Asset Check-in'
  ],
  'Budget Category': [
    'Project Proposal'
  ]
};


