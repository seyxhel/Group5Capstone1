export const EMPLOYEE_TICKET_STORAGE_KEY_BY_RUMI = 'employeeTicketsByRumi';

// Status options visible to Employees
// Note: "New" and "Open" (admin side) are shown as "Pending" to employees
export const employeeTicketStatusesByRumi = [
  'Pending',
  'In Progress',
  'On Hold',
  'Withdrawn',
  'Resolved',
  'Closed',
  'Rejected',
];

// 🧪 Sample Tickets - all created by employee Rumi Kim
const sampleEmployeeTicketsByRumi = [
  {
    ticketNumber: 'TCK-101',
    subject: 'New printer installation',
    status: 'New', // Changed from 'Submitted' to 'New'
    priorityLevel: 'Medium',
    department: 'IT Department',
    category: 'Hardware',
    subCategory: 'Printers',
    dateCreated: '2025-06-10T09:00:00Z',
    lastUpdated: null,
    fileUploaded: null,
    description: 'Please install a new printer in the marketing room.',
    scheduledRequest: null,
    assignedTo: { id: 'A010', name: 'Kenneth Dela Rosa' },
    handledBy: { id: 'A010', role: 'Coordinator Admin', name: 'Kenneth Dela Rosa' },
    createdBy: { userId: 'U005', role: 'Employee', name: 'Rumi Kim' }
  },
  {
    ticketNumber: 'TCK-102',
    subject: 'Issue with shared drive',
    status: 'New', // Changed from 'Pending' to 'New'
    priorityLevel: 'High',
    department: 'IT Department',
    category: 'IT Services',
    subCategory: 'Storage',
    dateCreated: '2025-06-11T11:45:00Z',
    lastUpdated: '2025-06-11T14:00:00Z',
    fileUploaded: null,
    description: 'Cannot access shared drive folders from workstation.',
    scheduledRequest: null,
    assignedTo: { id: 'A010', name: 'Kenneth Dela Rosa' },
    handledBy: { id: 'A010', role: 'Coordinator Admin', name: 'Kenneth Dela Rosa' },
    createdBy: { userId: 'U005', role: 'Employee', name: 'Rumi Kim' }
  }
];

// === Core Storage Functions ===

export const getEmployeeTicketsByRumi = () => {
  const data = localStorage.getItem(EMPLOYEE_TICKET_STORAGE_KEY_BY_RUMI);
  return data ? JSON.parse(data) : [];
};

export const saveEmployeeTicketsByRumi = (tickets) => {
  localStorage.setItem(EMPLOYEE_TICKET_STORAGE_KEY_BY_RUMI, JSON.stringify(tickets));
};

export const getEmployeeTicketByNumberByRumi = (ticketNumber) => {
  return getEmployeeTicketsByRumi().find(ticket => ticket.ticketNumber === ticketNumber) || null;
};

export const generateTicketNumberByRumi = () => {
  const tickets = getEmployeeTicketsByRumi();
  const numbers = tickets.map(t => parseInt(t.ticketNumber.replace('TCK-', ''), 10)).filter(Boolean);
  const next = numbers.length ? Math.max(...numbers) + 1 : 101;
  return `TCK-${String(next).padStart(3, '0')}`;
};

export const addNewEmployeeTicketByRumi = ({
  subject,
  category,
  subCategory,
  description,
  createdBy,
  fileUploaded = null,
  scheduledRequest = null
}) => {
  const newTicket = {
    ticketNumber: generateTicketNumberByRumi(),
    subject,
    status: 'New', // Changed from 'Submitted' to 'New'
    priorityLevel: '',
    department: createdBy.department || '',
    category,
    subCategory,
    dateCreated: new Date().toISOString(),
    lastUpdated: null,
    fileUploaded,
    description,
    scheduledRequest,
    assignedTo: { id: null, name: null },
    handledBy: null,
    createdBy
  };

  const tickets = getEmployeeTicketsByRumi();
  tickets.push(newTicket);
  saveEmployeeTicketsByRumi(tickets);
  return newTicket;
};

// === Initialization (FOR DEV ONLY) ===
if (!localStorage.getItem(EMPLOYEE_TICKET_STORAGE_KEY_BY_RUMI)) {
  saveEmployeeTicketsByRumi(sampleEmployeeTicketsByRumi);
}

// Force reset (DEV ONLY)
localStorage.removeItem(EMPLOYEE_TICKET_STORAGE_KEY_BY_RUMI);
saveEmployeeTicketsByRumi(sampleEmployeeTicketsByRumi);
