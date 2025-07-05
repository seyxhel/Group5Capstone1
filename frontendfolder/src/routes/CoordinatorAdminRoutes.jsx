import { Route } from "react-router-dom";
import ProtectedRoute from "../shared/protected/ProtectedRoute";
import CoordinatorAdminLayout from "../coordinator-admin/layouts/CoordinatorAdminLayout";
import CoordinatorAdminDashboard from "../coordinator-admin/pages/dashboard/CoordinatorAdminDashboard";
import CoordinatorAdminTicketManagement from "../coordinator-admin/pages/ticket-management/CoordinatorAdminTicketManagement";
import CoordinatorAdminTicketTracker from "../coordinator-admin/pages/ticket-tracker/CoordinatorAdminTicketTracker";
import CoordinatorAdminUserAccess from "../coordinator-admin/pages/user-management/CoordinatorAdminUserAccess";
import CoordinatorAdminSettings from "../coordinator-admin/pages/settings/CoordinatorAdminSettings";
import NotFoundPage from "../shared/not-found-page/NotFoundPage";

const CoordinatorAdminRoutes = () => (
  <>
    <Route element={<ProtectedRoute role="admin" />}>
      <Route path="/admin" element={<CoordinatorAdminLayout />}>
        <Route path="dashboard" element={<CoordinatorAdminDashboard />} />
        <Route path="ticket-management/:status" element={<CoordinatorAdminTicketManagement />} />
        <Route path="ticket-tracker/:ticketNumber" element={<CoordinatorAdminTicketTracker />} />
        <Route path="user-access/:status" element={<CoordinatorAdminUserAccess />} />
        <Route path="settings" element={<CoordinatorAdminSettings />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Route>
  </>
);

export default CoordinatorAdminRoutes;
