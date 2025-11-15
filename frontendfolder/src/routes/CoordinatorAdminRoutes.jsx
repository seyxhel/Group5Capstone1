import { Routes, Route } from 'react-router-dom';
import CoordinatorAdminLayout from '../coordinator-admin/layouts/CoordinatorAdminLayout';
import CoordinatorAdminDashboard from '../coordinator-admin/pages/dashboard/CoordinatorAdminDashboard';
import CoordinatorAdminTicketManagement from '../coordinator-admin/pages/ticket-management/CoordinatorAdminTicketManagement';
import CoordinatorAdminTicketTracker from '../coordinator-admin/pages/ticket-tracker/CoordinatorAdminTicketTracker';
import CoordinatorAdminUserAccess from '../coordinator-admin/pages/user-management/CoordinatorAdminUserAccess';
import CoordinatorAdminUserProfileView from '../coordinator-admin/pages/user-management/CoordinatorAdminUserProfileView';
import CoordinatorAdminSettings from '../coordinator-admin/pages/settings/CoordinatorAdminSettings';
import CoordinatorAdminAccountRegister from '../coordinator-admin/pages/account-register/CoordinatorAdminAccountRegister';
import CoordinatorAdminTicketReports from '../coordinator-admin/pages/reports/CoordinatorAdminTicketReports';
import CoordinatorAdminSLAReports from '../coordinator-admin/pages/reports/CoordinatorAdminSLAReports';
// Knowledgebase admin pages
import KnowledgeCreate from '../coordinator-admin/pages/knowledge/KnowledgeCreate';
import KnowledgeArticles from '../coordinator-admin/pages/knowledge/KnowledgeArticles';
import KnowledgeArchived from '../coordinator-admin/pages/knowledge/KnowledgeArchived';
import KnowledgeArticleView from '../coordinator-admin/pages/knowledge/KnowledgeArticleView';
import KnowledgeViewArticles from '../coordinator-admin/pages/knowledge/KnowledgeViewArticles';
import CoordinatorAdminCSATPage from '../coordinator-admin/pages/dashboard/CoordinatorAdminCSATPage';
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
  {/* User Profile View */}
  <Route path="user-profile/:companyId" element={<CoordinatorAdminUserProfileView />} />

      {/* Reports */}
      <Route path="reports/tickets" element={<CoordinatorAdminTicketReports />} />
      <Route path="reports/sla" element={<CoordinatorAdminSLAReports />} />

      {/* Settings */}
      <Route path="settings" element={<CoordinatorAdminSettings />} />
      {/* Knowledgebase */}
      <Route path="knowledge">
        <Route path="articles" element={<KnowledgeArticles />} />
        <Route path="view/:id" element={<KnowledgeArticleView />} />
        <Route path="view-articles" element={<KnowledgeViewArticles />} />
        <Route path="archived" element={<KnowledgeArchived />} />
        <Route path="create" element={<KnowledgeCreate />} />
      </Route>
      {/* CSAT single page */}
      <Route path="csat">
        <Route path="all" element={<CoordinatorAdminCSATPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default CoordinatorAdminRoutes;
