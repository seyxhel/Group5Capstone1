import { Routes, Route } from 'react-router-dom';
import EmployeeLayout from '../employee/layouts/EmployeeLayout';
import EmployeeHome from '../employee/pages/home/EmployeeHome';
import EmployeeActiveTickets from '../employee/pages/active-tickets/EmployeeActiveTickets';
import EmployeeTicketRecords from '../employee/pages/ticket-records/EmployeeTicketRecords';
import EmployeeTicketSubmissionForm from '../employee/pages/ticket-submission-form/EmployeeTicketSubmissionForm';

const EmployeeRoutes = () => (
  <Routes>
    <Route path="/employee" element={<EmployeeLayout />}>
      <Route path="home" element={<EmployeeHome />} />
      <Route path="active-tickets/:filter" element={<EmployeeActiveTickets />} />
      <Route path="ticket-records/:filter" element={<EmployeeTicketRecords />} />
      <Route path="submit-ticket" element={<EmployeeTicketSubmissionForm/>} />
      
    </Route>
  </Routes>
);

export default EmployeeRoutes;
