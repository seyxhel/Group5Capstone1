// employeeUserStorage.js

export const EMPLOYEE_USER_STORAGE_KEY = 'employeeUsers';

export const employeeUserStatuses = [
  'Active',
  'Pending',
  'Rejected'
];

const sampleEmployeeUsers = [
  {
    id: 'U001',
    companyId: 'IT0001',
    lastName: 'Pernes',
    firstName: 'Liann Kristine',
    department: 'Budget Department',
    role: 'Employee',
    status: 'Active',
    dateCreated: '2025-05-23',
    email: 'liann.pernes@gmail.com',
    profileImage: 'https://images.unsplash.com/photo-1502767089025-6572583495b0?w=150&h=150&fit=crop&crop=face',
    password: 'liann123'
  },
  {
    id: 'U002',
    companyId: 'IT0002',
    lastName: 'Salonga',
    firstName: 'Iana Mae',
    department: 'IT Support',
    role: 'Ticket Coordinator',
    status: 'Pending',
    dateCreated: '2025-05-20',
    email: 'iana.salonga@gmail.com',
    profileImage: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=150&h=150&fit=crop&crop=face',
    password: 'iana123'
  },
  {
    id: 'U003',
    companyId: 'IT0003',
    lastName: 'Cruz',
    firstName: 'Lance Anthony',
    department: 'Admin Department',
    role: 'System Admin',
    status: 'Rejected',
    dateCreated: '2025-05-18',
    email: 'lance.cruz@gmail.com',
    profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    password: 'lance123'
  },
  {
    id: 'U004',
    companyId: 'IT0004',
    lastName: 'Oraba',
    firstName: 'Angel Rose',
    department: 'Finance Department',
    role: 'Employee',
    status: 'Active',
    dateCreated: '2025-05-25',
    email: 'angel.oraba@gmail.com',
    profileImage: 'https://images.unsplash.com/photo-1502767089025-6572583495b0?w=150&h=150&fit=crop&crop=face',
    password: 'angel123'
  }
];

export const getEmployeeUsers = () => {
  const data = localStorage.getItem(EMPLOYEE_USER_STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveEmployeeUsers = (users) => {
  localStorage.setItem(EMPLOYEE_USER_STORAGE_KEY, JSON.stringify(users));
};

export const getEmployeeUserById = (id) => {
  return getEmployeeUsers().find(user => user.id === id) || null;
};

if (!localStorage.getItem(EMPLOYEE_USER_STORAGE_KEY)) {
  saveEmployeeUsers(sampleEmployeeUsers);
}

// FORCE RESET — Remove after testing
localStorage.removeItem(EMPLOYEE_USER_STORAGE_KEY);
saveEmployeeUsers(sampleEmployeeUsers);
