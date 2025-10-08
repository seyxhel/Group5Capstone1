import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingButton from '../../../shared/buttons/LoadingButton';
import TopPageSectionHeader from '../../../shared/section-header/TopPageSectionHeader';
import styles from './CoordinatorAdminAccountRegister.module.css';
import { getEmployeeUsers, addEmployeeUser } from '../../../utilities/storages/employeeUserStorage';

const departments = [
  'IT Support',
  'Budget Department',
  'Finance Department',
  'Admin Department',
  'HR Department',
  'Operations Department',
  'Sales Department',
  'Marketing Department'
];

const roles = [
  'Employee',
  'Ticket Coordinator',
  'System Admin'
];

const CoordinatorAdminAccountRegister = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    companyId: '',
    lastName: '',
    firstName: '',
    department: '',
    role: '',
    email: '',
    password: '',
    confirmPassword: '',
    profileImage: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'companyId':
        if (!value.trim()) {
          error = 'Company ID is required';
        } else if (value.trim().length < 3) {
          error = 'Company ID must be at least 3 characters';
        } else {
          // Check if Company ID already exists
          const existingUsers = getEmployeeUsers();
          if (existingUsers.some(user => user.companyId === value.trim())) {
            error = 'Company ID already exists';
          }
        }
        break;
      
      case 'lastName':
        if (!value.trim()) {
          error = 'Last Name is required';
        } else if (value.trim().length < 2) {
          error = 'Last Name must be at least 2 characters';
        }
        break;
      
      case 'firstName':
        if (!value.trim()) {
          error = 'First Name is required';
        } else if (value.trim().length < 2) {
          error = 'First Name must be at least 2 characters';
        }
        break;
      
      case 'department':
        if (!value) {
          error = 'Department is required';
        }
        break;
      
      case 'role':
        if (!value) {
          error = 'Role is required';
        }
        break;
      
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Invalid email format';
        } else {
          // Check if email already exists
          const existingUsers = getEmployeeUsers();
          if (existingUsers.some(user => user.email === value.trim())) {
            error = 'Email already exists';
          }
        }
        break;
      
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
      
      case 'confirmPassword':
        if (!value) {
          error = 'Please confirm password';
        } else if (value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
      
      case 'profileImage':
        if (value && !value.startsWith('http')) {
          error = 'Profile Image must be a valid URL';
        }
        break;
      
      default:
        break;
    }
    
    return error;
  };

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    
    setFormData({
      ...formData,
      [field]: value
    });

    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({
        ...errors,
        [field]: error
      });
    }

    // Also validate confirmPassword when password changes
    if (field === 'password' && touched.confirmPassword) {
      const confirmError = validateField('confirmPassword', formData.confirmPassword);
      setErrors({
        ...errors,
        password: validateField('password', value),
        confirmPassword: confirmError
      });
    }
  };

  const handleBlur = (field) => () => {
    setTouched({
      ...touched,
      [field]: true
    });

    const error = validateField(field, formData[field]);
    setErrors({
      ...errors,
      [field]: error
    });
  };

  const validateAllFields = () => {
    const newErrors = {};
    const newTouched = {};
    
    const fieldsToValidate = [
      'companyId',
      'lastName',
      'firstName',
      'department',
      'role',
      'email',
      'password',
      'confirmPassword'
    ];

    fieldsToValidate.forEach(field => {
      newTouched[field] = true;
      newErrors[field] = validateField(field, formData[field]);
    });

    // Validate profile image if provided
    if (formData.profileImage) {
      newTouched.profileImage = true;
      newErrors.profileImage = validateField('profileImage', formData.profileImage);
    }
    
    setTouched(newTouched);
    setErrors(newErrors);
    
    // Return true if no errors
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateAllFields()) {
      toast.error('Please fix the errors in the form before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new user object
      const newUserData = {
        companyId: formData.companyId.trim(),
        lastName: formData.lastName.trim(),
        firstName: formData.firstName.trim(),
        department: formData.department,
        role: formData.role,
        email: formData.email.trim(),
        profileImage: formData.profileImage || undefined,
        password: formData.password
      };

      // Add user using helper function
      addEmployeeUser(newUserData);

      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success('User account created successfully!');
      setTimeout(() => navigate('/admin/user-access/all-users'), 1500);
    } catch (error) {
      toast.error('Failed to create user account. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      companyId: '',
      lastName: '',
      firstName: '',
      department: '',
      role: '',
      email: '',
      password: '',
      confirmPassword: '',
      profileImage: ''
    });
    setErrors({});
    setTouched({});
  };

  return (
    <main className={styles.registration}>
      <TopPageSectionHeader
        root="User Management"
        currentPage="Create Account"
        rootNavigatePage="/admin/user-access/all-users"
        title="Create New User Account"
      />

      <section className={styles.registrationForm}>
        <form onSubmit={handleSubmit}>
          <FormField
            id="companyId"
            label="Company ID"
            required
            error={errors.companyId}
            render={() => (
              <input
                type="text"
                placeholder="e.g., IT0001"
                value={formData.companyId}
                onChange={handleInputChange('companyId')}
                onBlur={handleBlur('companyId')}
              />
            )}
          />

          <FormField
            id="firstName"
            label="First Name"
            required
            error={errors.firstName}
            render={() => (
              <input
                type="text"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={handleInputChange('firstName')}
                onBlur={handleBlur('firstName')}
              />
            )}
          />

          <FormField
            id="lastName"
            label="Last Name"
            required
            error={errors.lastName}
            render={() => (
              <input
                type="text"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={handleInputChange('lastName')}
                onBlur={handleBlur('lastName')}
              />
            )}
          />

          <FormField
            id="department"
            label="Department"
            required
            error={errors.department}
            render={() => (
              <select
                value={formData.department}
                onChange={handleInputChange('department')}
                onBlur={handleBlur('department')}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            )}
          />

          <FormField
            id="role"
            label="Role"
            required
            error={errors.role}
            render={() => (
              <select
                value={formData.role}
                onChange={handleInputChange('role')}
                onBlur={handleBlur('role')}
              >
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            )}
          />

          <FormField
            id="email"
            label="Email Address"
            required
            error={errors.email}
            render={() => (
              <input
                type="email"
                placeholder="e.g., user@example.com"
                value={formData.email}
                onChange={handleInputChange('email')}
                onBlur={handleBlur('email')}
              />
            )}
          />

          <FormField
            id="password"
            label="Password"
            required
            error={errors.password}
            render={() => (
              <input
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleInputChange('password')}
                onBlur={handleBlur('password')}
              />
            )}
          />

          <FormField
            id="confirmPassword"
            label="Confirm Password"
            required
            error={errors.confirmPassword}
            render={() => (
              <input
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                onBlur={handleBlur('confirmPassword')}
              />
            )}
          />

          <FormField
            id="profileImage"
            label="Profile Image URL (Optional)"
            error={errors.profileImage}
            render={() => (
              <input
                type="text"
                placeholder="https://example.com/image.jpg"
                value={formData.profileImage}
                onChange={handleInputChange('profileImage')}
                onBlur={handleBlur('profileImage')}
              />
            )}
          />

          <div className={styles.buttonGroup}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={() => navigate('/admin/user-access/all-users')}
            >
              Cancel
            </button>
            
            <button
              type="button"
              className={styles.resetBtn}
              onClick={resetForm}
            >
              Reset
            </button>

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting && <LoadingButton />}
              {isSubmitting ? 'Creating...' : 'Create Account'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

function FormField({ id, label, required = false, error, render }) {
  return (
    <fieldset>
      <label htmlFor={id}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {render()}
      {error && <span className={styles.errorMessage}>{error}</span>}
    </fieldset>
  );
}

export default CoordinatorAdminAccountRegister;
