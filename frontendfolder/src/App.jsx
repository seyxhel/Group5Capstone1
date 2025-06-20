import { BrowserRouter } from 'react-router-dom';

import EmployeeRoutes from './routes/EmployeeRoutes';

function App() {
  return (
    <BrowserRouter>
      <EmployeeRoutes />
    </BrowserRouter>
  );
}

export default App;
