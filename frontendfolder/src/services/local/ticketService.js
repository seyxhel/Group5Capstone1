// Local ticket service that replaces backend API calls
import { 
  STORAGE_KEYS, 
  getFromStorage, 
  setToStorage, 
  generateId 
} from '../../mock-data/localStorage.js';

// Simulate API delay
const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

export const localTicketService = {
  // Get all tickets
  getAllTickets: async () => {
    await delay();
    const tickets = getFromStorage(STORAGE_KEYS.TICKETS) || [];
    return {
      success: true,
      data: tickets
    };
  },

  // Get tickets by employee
  getEmployeeTickets: async (employeeId) => {
    await delay();
    const tickets = getFromStorage(STORAGE_KEYS.TICKETS) || [];
    const employeeTickets = tickets.filter(ticket => ticket.employee.id === employeeId);
    return {
      success: true,
      data: employeeTickets
    };
  },

  // Get ticket by ID
  getTicketById: async (ticketId) => {
    await delay();
    const tickets = getFromStorage(STORAGE_KEYS.TICKETS) || [];
    const ticket = tickets.find(t => t.id === parseInt(ticketId));
    
    if (ticket) {
      return {
        success: true,
        data: ticket
      };
    } else {
      return {
        success: false,
        error: 'Ticket not found'
      };
    }
  },

  // Create new ticket
  createTicket: async (ticketData, currentUser) => {
    await delay();
    const tickets = getFromStorage(STORAGE_KEYS.TICKETS) || [];
    
    const newTicket = {
      id: generateId(),
      ticket_number: `TKT-${new Date().getFullYear()}-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: ticketData.subject,
      description: ticketData.description,
      priority_level: ticketData.priority_level,
      department: ticketData.department,
      status: 'Open',
      date_created: new Date().toISOString(),
      date_updated: new Date().toISOString(),
      employee: {
        id: currentUser.id,
        first_name: currentUser.first_name,
        last_name: currentUser.last_name,
        email: currentUser.email
      },
      assigned_to: null,
      attachments: ticketData.attachments || [],
      comments: []
    };
    
    tickets.push(newTicket);
    setToStorage(STORAGE_KEYS.TICKETS, tickets);
    
    return {
      success: true,
      data: newTicket
    };
  },

  // Update ticket status
  updateTicketStatus: async (ticketId, status, comment = null) => {
    await delay();
    const tickets = getFromStorage(STORAGE_KEYS.TICKETS) || [];
    const ticketIndex = tickets.findIndex(t => t.id === parseInt(ticketId));
    
    if (ticketIndex === -1) {
      return {
        success: false,
        error: 'Ticket not found'
      };
    }
    
    tickets[ticketIndex].status = status;
    tickets[ticketIndex].date_updated = new Date().toISOString();
    
    // Add comment if provided
    if (comment) {
      const currentUser = getFromStorage(STORAGE_KEYS.CURRENT_USER);
      const newComment = {
        id: tickets[ticketIndex].comments.length + 1,
        comment: comment,
        date_created: new Date().toISOString(),
        created_by: {
          first_name: currentUser.first_name,
          last_name: currentUser.last_name
        }
      };
      tickets[ticketIndex].comments.push(newComment);
    }
    
    setToStorage(STORAGE_KEYS.TICKETS, tickets);
    
    return {
      success: true,
      data: tickets[ticketIndex]
    };
  },

  // Add comment to ticket
  addComment: async (ticketId, commentText) => {
    await delay();
    const tickets = getFromStorage(STORAGE_KEYS.TICKETS) || [];
    const ticketIndex = tickets.findIndex(t => t.id === parseInt(ticketId));
    
    if (ticketIndex === -1) {
      return {
        success: false,
        error: 'Ticket not found'
      };
    }
    
    const currentUser = getFromStorage(STORAGE_KEYS.CURRENT_USER);
    const newComment = {
      id: tickets[ticketIndex].comments.length + 1,
      comment: commentText,
      date_created: new Date().toISOString(),
      created_by: {
        first_name: currentUser.first_name,
        last_name: currentUser.last_name
      }
    };
    
    tickets[ticketIndex].comments.push(newComment);
    tickets[ticketIndex].date_updated = new Date().toISOString();
    setToStorage(STORAGE_KEYS.TICKETS, tickets);
    
    return {
      success: true,
      data: newComment
    };
  },

  // Get ticket statistics
  getTicketStats: async () => {
    await delay();
    const tickets = getFromStorage(STORAGE_KEYS.TICKETS) || [];
    
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'Open').length,
      in_progress: tickets.filter(t => t.status === 'In Progress').length,
      resolved: tickets.filter(t => t.status === 'Resolved').length,
      closed: tickets.filter(t => t.status === 'Closed').length,
      rejected: tickets.filter(t => t.status === 'Rejected').length
    };
    
    return {
      success: true,
      data: stats
    };
  }
};
