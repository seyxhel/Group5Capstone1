import { Routes, Route } from 'react-router-dom';
import EmployeeLayout from '../employee/layouts/EmployeeLayout';
import EmployeeHome from '../employee/pages/home/EmployeeHome';
import EmployeeActiveTickets from '../employee/pages/active-tickets/EmployeeActiveTickets';
import EmployeeTicketRecords from '../employee/pages/ticket-records/EmployeeTicketRecords';
import EmployeeTicketSubmissionForm from '../employee/pages/ticket-submission-form/EmployeeTicketSubmissionForm';
import EmployeeTicketTracker from '../employee/pages/ticket-tracker/EmployeeTicketTracker';
import EmployeeSettings from '../employee/pages/settings/EmployeeSettings';
import EmployeeFAQs from '../employee/pages/frequently-asked-questions/EmployeeFAQs';
import NotFoundPage from '../shared/not-found-page/NotFoundPage';

const EmployeeRoutes = () => (
  <Routes>
    <Route path="/employee" element={<EmployeeLayout />}>
      <Route path="home" element={<EmployeeHome />} />
      <Route path="active-tickets/:filter" element={<EmployeeActiveTickets />} />
      <Route path="ticket-records/:filter" element={<EmployeeTicketRecords />} />
      <Route path="submit-ticket" element={<EmployeeTicketSubmissionForm/>} />
      <Route path="ticket-tracker/:ticketNumber" element={<EmployeeTicketTracker />} />
      <Route path="settings" element={<EmployeeSettings />} />
      <Route path="frequently-asked-questions" element={<EmployeeFAQs />} />
      <Route path="*" element={<NotFoundPage />} />
    </Route>
  </Routes>
);

export default EmployeeRoutes;
