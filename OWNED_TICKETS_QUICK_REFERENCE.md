# Owned Tickets Feature - Quick Reference

## File Structure

```
src/coordinator-admin/pages/owned-tickets/
├── CoordinatorOwnedTickets.jsx              (List component)
├── CoordinatorOwnedTickets.module.css       (List styles)
├── CoordinatorOwnedTicketDetail.jsx         (Detail component)
└── CoordinatorOwnedTicketDetail.module.css  (Detail styles)

Updated Files:
├── src/coordinator-admin/components/header/CoordinatorAdminNavigationBar.jsx
└── src/routes/CoordinatorAdminRoutes.jsx
```

## Routes

```
/admin/owned-tickets                    → List of coordinator's own tickets
/admin/owned-tickets/:ticketNumber      → Detail view with editor & messaging
```

## Components

### CoordinatorOwnedTickets
- **Purpose**: List all tickets assigned to the current coordinator
- **Props**: None (uses auth context for current user)
- **State**: tickets, search, filters, pagination, loading
- **Features**: Search, advanced filters, pagination, view action

### CoordinatorOwnedTicketDetail
- **Purpose**: Show ticket details with editing and messaging
- **Params**: ticketNumber (from URL)
- **State**: ticket data, edit states, messages, action log
- **Features**: Edit fields, lifecycle control, messaging, priority selector

## Key Features

1. **Ticket List**
   - Filter by status, priority, category, SLA
   - Search by ticket number, subject
   - Pagination (10 items per page default)
   - Sorting by last updated (newest first)

2. **Ticket Details**
   - View full ticket information
   - Edit subject & description
   - Communicate with requester
   - Send messages to TTS agents
   - Change lifecycle status
   - Update priority level
   - View complete action log

3. **Messaging**
   - Separate threads for requester and TTS agents
   - Message history with timestamps
   - Reply functionality

4. **Status Management**
   - Lifecycle: Triage → Resolve → Finalize
   - Priority: Low, Medium, High, Critical
   - Status badges with color coding

## Color Coding

### Status Badges
- **New/Submitted**: Blue (`--new-text/bg`)
- **Pending**: Amber (`--pending-text/bg`)
- **Open**: Teal (`--open-text/bg`)
- **In Progress**: Orange (`--inprogress-text/bg`)
- **On Hold**: Purple (`--onhold-text/bg`)
- **Resolved**: Green (`--resolved-text/bg`)
- **Closed**: Dark Blue (`--closed-text/bg`)
- **Rejected**: Red (`--rejected-text/bg`)
- **Withdrawn**: Gray (`--withdrawn-text/bg`)

### Priority Badges
- **Critical**: Red
- **High**: Orange
- **Medium**: Gray
- **Low**: Blue

### SLA Badges
- **Overdue**: Red
- **Due Soon**: Yellow/Amber
- **On Time**: Green

## API Interactions

```javascript
// Get all tickets (filters applied on frontend)
backendTicketService.getAllTickets()

// Filter logic
const ownedTickets = allTickets.filter(t => t.assignedTo === currentUser.id)
```

## Styling Approach

- Uses CSS modules for scoped styling
- Imports from global `index.css` variables
- Mobile-first responsive design
- Consistent with existing coordinator-admin styling
- Supports both light and accessible color contrasts

## Error Handling

- Shows skeleton loaders while fetching
- Displays "No tickets found" when list is empty
- Shows "Ticket not found" if detail page ticket doesn't exist
- Graceful fallbacks for missing data fields

## Performance Considerations

- Pagination prevents rendering all tickets at once
- Memoized filter options to prevent unnecessary recalculations
- Debounced search to prevent rapid API calls
- Lazy filtering applied on frontend (single API call, client-side filtering)

## Accessibility Features

- Semantic HTML structure
- Clear button labels with icons
- Proper heading hierarchy
- Color-coded badges with text labels
- Keyboard navigation support
- Focus states on interactive elements
- ARIA labels where appropriate

## Future Enhancements

1. Bulk actions (change status for multiple tickets)
2. Export tickets to CSV/PDF
3. Advanced sorting options
4. Save filter presets
5. Real-time notifications for message updates
6. Attachment upload support
7. Comments/notes on tickets
8. Ticket assignment workflow
9. SLA countdown timer display
10. Custom ticket fields display
