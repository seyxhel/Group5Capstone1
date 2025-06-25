import { Routes, Route } from 'react-router-dom';
import CoordinatorAdminLayout from '../coordinator-admin/layouts/CoordinatorAdminLayout';
import CoordinatorAdminDashboard from '../coordinator-admin/pages/dashboard/CoordinatorAdminDashboard';

const CoordinatorAdminRoutes = () => (
  <Routes>
    <Route path="/admin" element={<CoordinatorAdminLayout />}>
      <Route path="dashboard" element={<CoordinatorAdminDashboard />} />
    </Route>
  </Routes>
);

export default CoordinatorAdminRoutes;
