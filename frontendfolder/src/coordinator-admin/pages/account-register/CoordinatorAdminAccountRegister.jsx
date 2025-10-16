import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Breadcrumb from '../../../shared/components/Breadcrumb';
import FormCard from '../../../shared/components/FormCard';
import InputField from '../../../shared/components/InputField';
import ProfileImageUpload from '../../../shared/components/ProfileImageUpload';
import Button from '../../../shared/components/Button';
import styles from './CoordinatorAdminAccountRegister.module.css';
import formActions from '../../../shared/styles/formActions.module.css';
import FormActions from '../../../shared/components/FormActions';
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
          // Profile image is required for this page
          if (!value) {
            error = 'Profile image is required';
          } else if (value && value.error) {
            error = value.error;
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
      'confirmPassword',
      'profileImage'
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
      <Breadcrumb
        root="User Management"
        currentPage="Create Account"
        rootNavigatePage="/admin/user-access/all-users"
        title="Create New User Account"
      />

      <section>
  <FormCard>
          <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <fieldset>
            <legend className={styles.fieldsetLegend}>
              Personal Information
            </legend>
            
            <InputField
              label="Company ID"
              placeholder="e.g., IT0001"
              value={formData.companyId}
              onChange={handleInputChange('companyId')}
              onBlur={handleBlur('companyId')}
              required
              error={errors.companyId}
            />
            
            <InputField
              label="First Name"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={handleInputChange('firstName')}
              onBlur={handleBlur('firstName')}
              required
              error={errors.firstName}
            />

            <InputField
              label="Last Name"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={handleInputChange('lastName')}
              onBlur={handleBlur('lastName')}
              required
              error={errors.lastName}
            />
          </fieldset>

          {/* Department and Role */}
          <fieldset>
            <legend className={styles.fieldsetLegend}>
              Department & Role
            </legend>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Department <span className={styles.required}>*</span>
              </label>
              <select
                value={formData.department}
                onChange={handleInputChange('department')}
                onBlur={handleBlur('department')}
                className={errors.department ? styles.inputError : ''}
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
              {errors.department && (
                <div className={styles.errorMessage}>
                  {errors.department}
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Role <span className={styles.required}>*</span>
              </label>
              <select
                value={formData.role}
                onChange={handleInputChange('role')}
                onBlur={handleBlur('role')}
                className={errors.role ? styles.inputError : ''}
              >
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              {errors.role && (
                <div className={styles.errorMessage}>
                  {errors.role}
                </div>
              )}
            </div>
          </fieldset>

          {/* Account Information */}
          <fieldset>
            <legend className={styles.fieldsetLegend}>
              Account Information
            </legend>
            
            <InputField
              type="email"
              label="Email Address"
              placeholder="e.g., user@example.com"
              value={formData.email}
              onChange={handleInputChange('email')}
              onBlur={handleBlur('email')}
              required
              error={errors.email}
            />

            <InputField
              type="password"
              label="Password"
              placeholder="Enter password (min 6 characters)"
              value={formData.password}
              onChange={handleInputChange('password')}
              onBlur={handleBlur('password')}
              required
              error={errors.password}
            />

            <InputField
              type="password"
              label="Confirm Password"
              placeholder="Re-enter password"
              value={formData.confirmPassword}
              onChange={handleInputChange('confirmPassword')}
              onBlur={handleBlur('confirmPassword')}
              required
              error={errors.confirmPassword}
            />
          </fieldset>

          {/* Optional Profile Image */}
          <fieldset>
            <legend className={styles.fieldsetLegend}>
              Profile 
            </legend>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>
                Profile Picture <span className={styles.required}>*</span>
              </label>
              <ProfileImageUpload
                value={formData.profileImage}
                onChange={handleInputChange('profileImage')}
                error={errors.profileImage}
              />
            </div>
          </fieldset>

          {/* Action Buttons */}
          <FormActions
            onCancel={() => navigate('/admin/user-access/all-users')}
            cancelLabel="Cancel"
            submitLabel={isSubmitting ? 'Creating...' : 'Create Account'}
            submitDisabled={isSubmitting}
            submitVariant="primary"
          />
          </form>
        </FormCard>
      </section>
    </main>
  );
};

export default CoordinatorAdminAccountRegister;
