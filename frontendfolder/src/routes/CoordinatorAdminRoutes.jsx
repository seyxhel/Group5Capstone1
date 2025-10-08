import { Routes, Route } from 'react-router-dom';
import CoordinatorAdminLayout from '../coordinator-admin/layouts/CoordinatorAdminLayout';
import CoordinatorAdminDashboard from '../coordinator-admin/pages/dashboard/CoordinatorAdminDashboard';
import CoordinatorAdminTicketManagement from '../coordinator-admin/pages/ticket-management/CoordinatorAdminTicketManagement';
import CoordinatorAdminTicketTracker from '../coordinator-admin/pages/ticket-tracker/CoordinatorAdminTicketTracker';
import CoordinatorAdminUserAccess from '../coordinator-admin/pages/user-management/CoordinatorAdminUserAccess';
import CoordinatorAdminSettings from '../coordinator-admin/pages/settings/CoordinatorAdminSettings';
import CoordinatorAdminAccountRegister from '../coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister';
import CoordinatorAdminTicketReports from '../coordinator-admin/pages/reports/CoordinatorAdminTicketReports';
import CoordinatorAdminSLAReports from '../coordinator-admin/pages/reports/CoordinatorAdminSLAReports';
import NotFoundPage from '../shared/not-found-page/NotFoundPage';

const CoordinatorAdminRoutes = () => (
  <Routes>
    <Route path="/admin" element={<CoordinatorAdminLayout />}>
      {/* Dashboard */}
      <Route path="dashboard" element={<CoordinatorAdminDashboard />} />

      {/* Ticket Management (Dynamic by Status) */}
      <Route path="ticket-management/:status" element={<CoordinatorAdminTicketManagement />} />

      {/* Ticket Tracker (Dynamic by Ticket ID) */}
      <Route path="ticket-tracker/:ticketNumber" element={<CoordinatorAdminTicketTracker />} />

      {/* User Access (Dynamic by Status) */}
      <Route path="user-access/:status" element={<CoordinatorAdminUserAccess />} />

      {/* Account Register */}
      <Route path="account-register" element={<CoordinatorAdminAccountRegister />} />

      {/* Reports */}
      <Route path="reports/tickets" element={<CoordinatorAdminTicketReports />} />
      <Route path="reports/sla" element={<CoordinatorAdminSLAReports />} />

      {/* Settings */}
      <Route path="settings" element={<CoordinatorAdminSettings />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default CoordinatorAdminRoutes;
