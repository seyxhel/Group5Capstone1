import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "../shared/protected/ProtectedRoute";
import CoordinatorAdminLayout from "../coordinator-admin/layouts/CoordinatorAdminLayout";
import CoordinatorAdminDashboard from "../coordinator-admin/pages/dashboard/CoordinatorAdminDashboard";
import CoordinatorAdminTicketManagement from "../coordinator-admin/pages/ticket-management/CoordinatorAdminTicketManagement";
import CoordinatorAdminTicketTracker from "../coordinator-admin/pages/ticket-tracker/CoordinatorAdminTicketTracker";
import CoordinatorAdminUserAccess from "../coordinator-admin/pages/user-management/CoordinatorAdminUserAccess";
import CoordinatorAdminSettings from "../coordinator-admin/pages/settings/CoordinatorAdminSettings";
import NotFoundPage from "../shared/not-found-page/NotFoundPage";

const CoordinatorAdminRoutes = () => (
  <Routes>
    <Route element={<ProtectedRoute role="admin" />}>
      <Route path="/admin" element={<CoordinatorAdminLayout />}>
        {/* Dashboard */}
        <Route path="dashboard" element={<CoordinatorAdminDashboard />} />

        {/* Ticket Management (Dynamic by Status) */}
        <Route path="ticket-management/:status" element={<CoordinatorAdminTicketManagement />} />

      {/* Ticket Tracker (Dynamic by Ticket ID) */}
      <Route path="ticket-tracker/:ticketNumber" element={<CoordinatorAdminTicketTracker />} />

      {/* User Access (Dynamic by Status) */}
      <Route path="user-access/:status" element={<CoordinatorAdminUserAccess />} />

        {/* Settings */}
        <Route path="settings" element={<CoordinatorAdminSettings />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </Routes>
);

export default CoordinatorAdminRoutes;
