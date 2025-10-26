// Backend ticket service
import { API_CONFIG } from '../../config/environment.js';
import { backendAuthService } from './authService.js';

const BASE_URL = API_CONFIG.BACKEND.BASE_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Helper to handle 401 errors by logging out immediately
const handleAuthError = (response) => {
  if (response.status === 401) {
    console.log('Session expired. Logging out...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('loggedInUser');
    localStorage.removeItem('user');
    window.location.href = '/';
    throw new Error('Session expired. Please log in again.');
  }
};

export const backendTicketService = {
  async getAllTickets() {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('No access token found');
        return []; // Return empty array instead of throwing to prevent infinite loop
      }

      const response = await fetch(`${BASE_URL}/api/tickets/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      handleAuthError(response);

      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tickets:', error);
      // Return empty array to prevent infinite retry loop
      return [];
    }
  },

  async getTicketById(ticketId) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      handleAuthError(response);

      if (!response.ok) {
        throw new Error('Failed to fetch ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  async getTicketByNumber(ticketNumber) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/number/${encodeURIComponent(ticketNumber)}/`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch ticket by number');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching ticket by number:', error);
      throw error;
    }
  },

  async createTicket(ticketData) {
    try {
      // Require an access token for backend requests
      const existingToken = localStorage.getItem('access_token');
      if (!existingToken) {
        throw new Error('No access token found. Are you logged in?');
      }

      let options;
      // If ticketData is FormData (contains files), we must not set Content-Type header
      if (ticketData instanceof FormData) {
        const token = existingToken;
        options = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: ticketData
        };
      } else {
        options = {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(ticketData),
        };
      }

      let response = await fetch(`${BASE_URL}/api/tickets/`, options);

      // If unauthorized, attempt a token refresh once then retry
      if (response.status === 401) {
        try {
          await backendAuthService.refreshToken();
          // Rebuild options with refreshed token
          if (ticketData instanceof FormData) {
            const token = localStorage.getItem('access_token');
            options.headers = { 'Authorization': token ? `Bearer ${token}` : '' };
          } else {
            options.headers = getAuthHeaders();
            options.body = JSON.stringify(ticketData);
          }
          response = await fetch(`${BASE_URL}/api/tickets/`, options);
        } catch (refreshErr) {
          console.error('Token refresh failed:', refreshErr);
          // proceed to error handling below
        }
      }

      if (!response.ok) {
        // Clone response so we can safely attempt different parsers
        const respClone = response.clone();
        let errorText = '';
        try {
          const errorData = await respClone.json();
          errorText = errorData.message || JSON.stringify(errorData);
        } catch (e) {
          try {
            errorText = await response.clone().text();
          } catch (e2) {
            errorText = '<unreadable response body>';
          }
        }
        throw new Error(`Failed to create ticket: ${response.status} ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  async updateTicket(ticketId, ticketData) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(ticketData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  },

  // Approve a ticket (admin action) - sets status to Open, priority, department and assigns to current user
  async approveTicket(ticketId, { priority = 'Low', department = '', approval_notes = '' } = {}) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/approve/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ priority, department, approval_notes }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.detail || 'Failed to approve ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('Error approving ticket:', error);
      throw error;
    }
  },

  async deleteTicket(ticketId) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete ticket');
      }

      return { success: true };
    } catch (error) {
      console.error('Error deleting ticket:', error);
      throw error;
    }
  },

  async getTicketsByEmployee(employeeId) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/?employee=${employeeId}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch employee tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching employee tickets:', error);
      throw error;
    }
  },

  async getTicketsByDepartment(department) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/?department=${department}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch department tickets');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching department tickets:', error);
      throw error;
    }
  },

  async updateTicketStatus(ticketId, status, comment = '') {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/update-status/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ status, comment }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.detail || 'Failed to update ticket status');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      throw error;
    }
  },

  // Reject a ticket (admin action) - sets status to Rejected and records rejection reason
  async rejectTicket(ticketId, rejection_reason = '') {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/reject/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ rejection_reason }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.detail || 'Failed to reject ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('Error rejecting ticket:', error);
      throw error;
    }
  },

  async assignTicket(ticketId, assigneeId) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ assigned_to: assigneeId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to assign ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw error;
    }
  }
  ,
  // Create a new comment on a ticket
  async createComment(ticketId, commentText, isInternal = false) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/comments/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ comment: commentText, is_internal: isInternal })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.detail || 'Failed to create comment');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  },

  // Withdraw a ticket (employee can withdraw their own tickets)
  async withdrawTicket(ticketId, reason) {
    try {
      const response = await fetch(`${BASE_URL}/api/tickets/${ticketId}/withdraw/`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });

      handleAuthError(response);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || err.detail || 'Failed to withdraw ticket');
      }

      return await response.json();
    } catch (error) {
      console.error('Error withdrawing ticket:', error);
      throw error;
    }
  }
};