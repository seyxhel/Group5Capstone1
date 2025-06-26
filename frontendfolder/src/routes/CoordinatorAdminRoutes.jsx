import { Routes, Route } from 'react-router-dom';
import CoordinatorAdminLayout from '../coordinator-admin/layouts/CoordinatorAdminLayout';
import CoordinatorAdminDashboard from '../coordinator-admin/pages/dashboard/CoordinatorAdminDashboard';
import CoordinatorAdminTicketManagement from '../coordinator-admin/pages/ticket-management/CoordinatorAdminTicketManagement';

const CoordinatorAdminRoutes = () => (
  <Routes>
    <Route path="/admin" element={<CoordinatorAdminLayout />}>
      <Route path="dashboard" element={<CoordinatorAdminDashboard />} />
      <Route path="ticket-management/:status" element={<CoordinatorAdminTicketManagement />} />
    </Route>
  </Routes>
);

export default CoordinatorAdminRoutes;
