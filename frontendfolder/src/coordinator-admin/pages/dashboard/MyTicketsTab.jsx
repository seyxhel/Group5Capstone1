import React from 'react';
import TicketsTab from './TicketsTab';
import { COORDINATOR_MOCK_TICKETS } from '../../mocks/coordinatorTicketsMock';

// Render the TicketsTab UI but feed it the coordinator mock tickets so
// the cards, charts and tables reflect the coordinator dataset.
const MyTickets = () => {
  // Only include tickets whose status is one of the allowed coordinator statuses.
  const allowedStatuses = [
    'pending',
    'pending tickets',
    'pending ticket',
    'in progress',
    'on hold',
    'resolved',
    'closed',
    'withdrawn',
  ];
  const filteredTickets = COORDINATOR_MOCK_TICKETS.filter((t) => {
    const s = (t.status || '').toString().toLowerCase();
    return allowedStatuses.includes(s);
  });

  // Normalize status and compute effective status similar to TicketsTab
  const normalizeStatus = (raw) => {
    if (!raw) return 'New';
    const s = String(raw).toLowerCase();
    if (s.includes('new') || s.includes('submitted')) return 'New';
    if (s.includes('pending')) return 'Pending';
    if (s.includes('open')) return 'Open';
    if (s.includes('in progress') || s.includes('inprogress')) return 'In Progress';
    if (s.includes('on hold') || s.includes('on-hold')) return 'On Hold';
    if (s.includes('withdraw')) return 'Withdrawn';
    if (s.includes('resolved')) return 'Resolved';
    if (s.includes('closed')) return 'Closed';
    if (s.includes('rejected')) return 'Rejected';
    return String(raw)
      .split(/\s+/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const computeEffectiveStatus = (ticket) => {
    const base = normalizeStatus(ticket.status || ticket.statusText || ticket.state || 'New');
    if (base === 'New') {
      const created = ticket.createdAt ? new Date(ticket.createdAt) : (ticket.dateCreated ? new Date(ticket.dateCreated) : null);
      if (created && !isNaN(created.getTime())) {
        const ageHours = (Date.now() - created.getTime()) / (1000 * 60 * 60);
        if (ageHours >= 24) return 'Pending';
      }
      return 'New';
    }
    return base;
  };

  // Compute counts for the My Tickets cards
  const cardLabels = ['Pending Tickets', 'In Progress Tickets', 'On Hold Tickets', 'Resolved', 'Closed', 'Withdrawn'];
  const statusKeyForLabel = {
    'Pending Tickets': 'Pending',
    'In Progress Tickets': 'In Progress',
    'On Hold Tickets': 'On Hold',
    'Resolved': 'Resolved',
    'Closed': 'Closed',
    'Withdrawn': 'Withdrawn'
  };

  const counts = filteredTickets.reduce((acc, t) => {
    const s = computeEffectiveStatus(t);
    const key = Object.keys(statusKeyForLabel).find(k => statusKeyForLabel[k] === s);
    if (key) acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return (
    <TicketsTab
      chartRange={'month'}
      setChartRange={() => {}}
      pieRange={'month'}
      setPieRange={() => {}}
      initialTickets={filteredTickets}
      tableTitle={'My Tickets'}
      visibleStatLabels={[
        'Pending Tickets',
        'In Progress Tickets',
        'On Hold Tickets',
      ]}
      allowedPieStatuses={['Pending','In Progress','On Hold','Resolved','Closed','Withdrawn']}
    />
  );
};

export default MyTickets;
