import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import LoadingButton from '../../../shared/buttons/LoadingButton';
import styles from './EmployeeTicketSubmissionForm.module.css';
import { addNewEmployeeTicket, getEmployeeTickets, saveEmployeeTickets } from '../../../utilities/storages/employeeTicketStorageBonjing';
import { auth, tickets as backendTickets } from '../../../services/apiService.js';
import { isUsingLocalAPI } from '../../../services/apiService.js';

const ALLOWED_FILE_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
];

// Main ticket categories
const ticketCategories = [
  'Asset Check In',
  'Asset Check Out',
  'Capital Expenses (CapEx)',
  'Operational Expenses (OpeEx)',
  'Reimbursement Claim (Liabilities)',
  'Charging Department (Cost Center)'
];

// Asset sub-categories (Type of Product)
const assetSubCategories = [
  'Laptop',
  'Tablet',
  'Printer',
  'Projector',
  'Mouse',
  'Keyboard',
  'Monitor',
  'Other'
];

// BMS Sub-categories based on category
const bmsSubCategories = {
  'Capital Expenses (CapEx)': [
    'Equipment',
    'Software (Long-term value like MS Office, Adobe Suite, Antivirus)',
    'Furniture'
  ],
  'Operational Expenses (OpeEx)': [
    'Utilities',
    'Supplies',
    'IT Services',
    'Software Subscriptions'
  ],
  'Reimbursement Claim (Liabilities)': [
    'Payable',
    'Loans'
  ],
  'Charging Department (Cost Center)': [
    'IT Operations (Day-to-day support)',
    'System Development (In-house software projects)',
    'Infrastructure & Equipment (Hardware, network, servers)',
    'Training and Seminars (Employee development)'
  ]
};

// Mock asset data
const mockAssets = {
  'Laptop': [
    { name: 'Dell Latitude 5420', serialNumber: 'DL5420001' },
    { name: 'HP ProBook 450 G9', serialNumber: 'HP450002' },
    { name: 'Lenovo ThinkPad X1', serialNumber: 'LTX1003' }
  ],
  'Tablet': [
    { name: 'iPad Pro 12.9"', serialNumber: 'IPAD001' },
    { name: 'Samsung Galaxy Tab S8', serialNumber: 'SGTAB002' }
  ],
  'Printer': [
    { name: 'Canon ImageRunner 2625i', serialNumber: 'CI2625001' },
    { name: 'HP LaserJet Pro 404dn', serialNumber: 'HP404002' }
  ],
  'Projector': [
    { name: 'Epson PowerLite 1795F', serialNumber: 'EP1795001' },
    { name: 'BenQ MH535FHD', serialNumber: 'BQ535002' }
  ],
  'Mouse': [
    { name: 'Logitech MX Master 3', serialNumber: 'LMX3001' },
    { name: 'Dell Wireless Mouse WM126', serialNumber: 'DWM126002' }
  ],
  'Keyboard': [
    { name: 'Logitech K380', serialNumber: 'LK380001' },
    { name: 'Dell KB216', serialNumber: 'DKB216002' }
  ],
  'Monitor': [
    { name: 'Dell UltraSharp U2422H', serialNumber: 'DU2422001' },
    { name: 'LG 27UK850-W 4K', serialNumber: 'LG27UK002' }
  ],
  'Other': [
    { name: 'Webcam Logitech C920', serialNumber: 'WC920001' },
    { name: 'USB Hub Anker 7-Port', serialNumber: 'USBH7P002' }
  ]
};

// Locations
const locations = [
  'Manila Office - Floor 1',
  'Manila Office - Floor 2', 
  'Manila Office - Floor 3',
  'Cebu Branch',
  'Davao Branch',
  'Work From Home'
];

// Issue types for Asset Check In
const assetIssueTypes = [
  'Not Functioning',
  'Missing Accessories (e.g., charger, case)',
  'Other'
];

// Type of Proposal - removed as not in requirements
const proposalTypes = [
  'New Proposal',
  'Continuing Proposal'
];

// Cost ranges for Estimated Cost dropdown
const costRanges = [
  '₱0 - ₱10,000',
  '₱10,001 - ₱50,000',
  '₱50,001 - ₱100,000',
  '₱100,001 - ₱500,000',
  '₱500,001 - ₱1,000,000',
  '₱1,000,001 and above'
];

const mockEmployee = {
  userId: 'U001',
  role: 'User',
  name: 'Bonjing San Jose',
  department: 'IT Department',
};

export default function EmployeeTicketSubmissionForm() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    subCategory: '',
    description: '',
    assetName: '',
    serialNumber: '',
    location: '',
    expectedReturnDate: '',
    issueType: '',
    otherIssue: '',
    performanceStartDate: '',
    performanceEndDate: '',
    approvedBy: '',
    schedule: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [costItems, setCostItems] = useState([{ costElement: '', estimatedCost: '' }]);

  // Category checks
  const isAssetCheckIn = formData.category === 'Asset Check In';
  const isAssetCheckOut = formData.category === 'Asset Check Out';
  const isBMSCategory = [
    'Capital Expenses (CapEx)',
    'Operational Expenses (OpeEx)',
    'Reimbursement Claim (Liabilities)',
    'Charging Department (Cost Center)'
  ].includes(formData.category);
  const isAnyAssetCategory = isAssetCheckIn || isAssetCheckOut;

  const validateField = (field, value) => {
    let error = '';
    
    switch (field) {
      case 'subject':
        if (!value.trim()) {
          error = 'Subject is required';
        } else if (value.trim().length < 5) {
          error = 'Subject must be at least 5 characters long';
        }
        break;
      
      case 'category':
        if (!value) {
          error = 'Category is required';
        }
        break;
      
      case 'subCategory':
        if ((isAnyAssetCategory || isBMSCategory) && !value) {
          error = 'Sub-Category is required';
        }
        break;
      
      case 'description':
        if (!value.trim()) {
          error = 'Description is required';
        } else if (value.trim().length < 10) {
          error = 'Description must be at least 10 characters long';
        }
        break;
      
      case 'assetName':
        if (isAnyAssetCategory && !value) {
          error = 'Asset Name is required';
        }
        break;
      
      case 'location':
        if (isAnyAssetCategory && !value) {
          error = 'Location is required';
        }
        break;
      
      case 'issueType':
        if (isAssetCheckIn && !value) {
          error = 'Issue Type is required';
        }
        break;
      
      case 'performanceStartDate':
        if (isBMSCategory && !value) {
          error = 'Performance Start Date is required';
        }
        break;
      
      case 'performanceEndDate':
        if (isBMSCategory && !value) {
          error = 'Performance End Date is required';
        } else if (isBMSCategory && formData.performanceStartDate && value && new Date(value) < new Date(formData.performanceStartDate)) {
          error = 'End date must be after start date';
        }
        break;

      case 'expectedReturnDate':
        if (isAssetCheckOut && !value) {
          error = 'Expected Return Date is required';
        }
        break;
      
      case 'approvedBy':
        if (isBMSCategory && !value.trim()) {
          error = 'Approved By is required';
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

    // Reset dependent fields when category changes
    if (field === 'category') {
      setFormData(prev => ({
        ...prev,
        category: value,
        subCategory: '',
        assetName: '',
        serialNumber: '',
        location: '',
        expectedReturnDate: '',
        issueType: '',
        otherIssue: '',
        performanceStartDate: '',
        performanceEndDate: '',
        approvedBy: ''
      }));
    }

    // Reset asset name and serial number when sub-category changes
    if (field === 'subCategory') {
      setFormData(prev => ({
        ...prev,
        subCategory: value,
        assetName: '',
        serialNumber: ''
      }));
    }

    // Auto-populate serial number when asset name is selected
    if (field === 'assetName' && value && formData.subCategory) {
      const asset = mockAssets[formData.subCategory]?.find(a => a.name === value);
      if (asset) {
        setFormData(prev => ({
          ...prev,
          assetName: value,
          serialNumber: asset.serialNumber
        }));
      }
    }

    // Validate field if it has been touched
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors({
        ...errors,
        [field]: error
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

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validFiles = newFiles.filter(file => ALLOWED_FILE_TYPES.includes(file.type));
    setFileError(validFiles.length !== newFiles.length
      ? 'Only PNG, JPG, PDF, Word, Excel, and CSV files are allowed.'
      : ''
    );

    const updated = [...selectedFiles, ...validFiles];
    setSelectedFiles(updated);
    e.target.value = '';
  };

  const removeFile = (index) => {
    const updated = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(updated);
  };

  // Handle cost items for BMS
  const addCostItem = () => {
    setCostItems([...costItems, { costElement: '', estimatedCost: '' }]);
  };

  const removeCostItem = (index) => {
    if (costItems.length > 1) {
      const updated = costItems.filter((_, i) => i !== index);
      setCostItems(updated);
    }
  };

  const updateCostItem = (index, field, value) => {
    const updated = costItems.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    );
    setCostItems(updated);
  };

  // Calculate total budget
  const calculateTotalBudget = () => {
    return costItems.reduce((total, item) => {
      if (item.estimatedCost) {
        // Extract numeric value from cost range
        const match = item.estimatedCost.match(/₱([\d,]+)/);
        if (match) {
          const value = parseInt(match[1].replace(/,/g, ''));
          return total + value;
        }
      }
      return total;
    }, 0);
  };

  const validateAllFields = () => {
    const newErrors = {};
    const newTouched = {};
    
    const fieldsToValidate = ['subject', 'category', 'description'];
    
    // Add category-specific required fields
    if (isAnyAssetCategory || isBMSCategory) {
      fieldsToValidate.push('subCategory');
    }
    
    if (isAnyAssetCategory) {
      fieldsToValidate.push('assetName', 'location');
    }

    if (isAssetCheckIn) {
      fieldsToValidate.push('issueType');
    }

    if (isAssetCheckOut) {
      fieldsToValidate.push('expectedReturnDate');
    }

    if (isBMSCategory) {
      fieldsToValidate.push('performanceStartDate', 'performanceEndDate', 'approvedBy');
    }

    fieldsToValidate.forEach(field => {
      newTouched[field] = true;
      newErrors[field] = validateField(field, formData[field]);
    });
    
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
      if (isUsingLocalAPI()) {
        const newTicket = addNewEmployeeTicket({
          subject: formData.subject,
          category: formData.category,
          subCategory: formData.subCategory,
          description: formData.description,
          createdBy: mockEmployee,
          fileUploaded: selectedFiles.length > 0 ? selectedFiles : null,
          scheduledRequest: formData.schedule || null,
        });

        await new Promise((resolve) => setTimeout(resolve, 1000));

        toast.success('Ticket successfully submitted.');
        setTimeout(() => navigate(`/employee/ticket-tracker/${newTicket.ticketNumber}`), 1500);
      } else {
        // Build FormData for backend submission (supports files)
        const formDataToSend = new FormData();
        formDataToSend.append('subject', formData.subject);
        formDataToSend.append('category', formData.category);
        formDataToSend.append('sub_category', formData.subCategory || '');
        formDataToSend.append('description', formData.description);
        if (formData.schedule) formDataToSend.append('scheduled_date', formData.schedule);

        // Sanitize date fields before sending to the server. Remove
        // curly quotes, collapse datetimes to date part, normalize separators,
        // and send nulls for empty values so the backend can accept them.
        const sanitizeDate = (v) => {
          if (!v && v !== 0) return null;
          let s = String(v).trim();
          // remove curly quotes and straight quotes
          s = s.replace(/[“”'\"]/g, '');
          if (s === '') return null;
          if (s.includes('T')) s = s.split('T')[0];
          s = s.replace(/\//g, '-');
          // quick YYYY-MM-DD check
          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
          // fallback: try Date parse and format
          const d = new Date(s);
          if (!isNaN(d.getTime())) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
          }
          return null;
        };

        // dynamic data: include asset details, cost items, etc.
        const dynamic = {
          assetName: formData.assetName || null,
          serialNumber: formData.serialNumber || null,
          location: formData.location || null,
          expectedReturnDate: sanitizeDate(formData.expectedReturnDate),
          issueType: formData.issueType || null,
          otherIssue: formData.otherIssue || null,
          performanceStartDate: sanitizeDate(formData.performanceStartDate),
          performanceEndDate: sanitizeDate(formData.performanceEndDate),
          approvedBy: formData.approvedBy || null,
          costItems: costItems || null,
        };

        formDataToSend.append('dynamic_data', JSON.stringify(dynamic));

        // Attach files as files[]
        selectedFiles.forEach((file) => {
          formDataToSend.append('files[]', file, file.name);
        });

        // Use the backend ticket service (apiService factory exposes tickets)
        const created = await backendTickets.createTicket(formDataToSend);

        // Persist a minimal local ticket record so the existing tracker UI
        // (which reads from localStorage) can find and display the ticket.
        try {
          const backendTicketNumber = created.ticket_number || created.ticketNumber || created.ticket || created.id;
          const localTickets = getEmployeeTickets();
          // Try to capture backend id and current user so owner-filtering works correctly
          const backendId = created.id || created.pk || created.ticket_id || created.ticket || null;
          let createdByUser = { userId: null, role: 'Employee', name: '' };
          try {
            const storedUser = localStorage.getItem('loggedInUser');
            if (storedUser) {
              const cur = JSON.parse(storedUser);
              const userId = cur?.id || cur?.userId || cur?.employeeId || null;
              const name = cur?.first_name || cur?.name || cur?.fullName || cur?.given_name || '';
              createdByUser = { userId: userId, role: (cur?.role || 'Employee'), name };
            }
          } catch (e) {
            console.warn('Failed to read loggedInUser when persisting created ticket', e);
          }

          const localTicket = {
            id: backendId,
            ticketNumber: backendTicketNumber,
            subject: created.subject || formData.subject,
            status: created.status || 'New',
            priorityLevel: created.priority || '',
            department: created.department || '',
            category: created.category || formData.category,
            subCategory: created.sub_category || formData.subCategory || '',
            dateCreated: created.submit_date || new Date().toISOString(),
            lastUpdated: created.update_date || null,
            fileUploaded: null,
            description: created.description || formData.description,
            scheduledRequest: created.scheduled_date || formData.schedule || null,
            assignedTo: created.assigned_to || { id: null, name: null },
            handledBy: null,
            createdBy: createdByUser
          };
          localTickets.push(localTicket);
          saveEmployeeTickets(localTickets);
          toast.success('Ticket successfully submitted.');
          setTimeout(() => navigate(`/employee/ticket-tracker/${localTicket.ticketNumber}`), 1500);
        } catch (e) {
          console.warn('Failed to persist created ticket locally:', e);
          toast.success('Ticket successfully submitted.');
          const fallbackNumber = created.ticket_number || created.ticketNumber || created.ticket || created.id;
          setTimeout(() => navigate(`/employee/ticket-tracker/${fallbackNumber}`), 1500);
        }
      }
    } catch (error) {
      console.error('Submit ticket error:', error);
      toast.error(error?.message || 'Failed to submit a ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subject: '',
      category: '',
      subCategory: '',
      description: '',
      assetName: '',
      serialNumber: '',
      location: '',
      expectedReturnDate: '',
      issueType: '',
      otherIssue: '',
      performanceStartDate: '',
      performanceEndDate: '',
      approvedBy: '',
      schedule: ''
    });
    setErrors({});
    setTouched({});
    setSelectedFiles([]);
    setFileError('');
    setCostItems([{ costElement: '', estimatedCost: '' }]);
  };

  return (
    <main className={styles.registration}>
      <section className={styles.registrationForm}>
        <form onSubmit={handleSubmit}>
          {/* Main Form Fields */}
          <FormField
            id="subject"
            label="Subject"
            required
            error={errors.subject}
            render={() => (
              <input
                type="text"
                placeholder="Enter ticket subject"
                value={formData.subject}
                onChange={handleInputChange('subject')}
                onBlur={handleBlur('subject')}
              />
            )}
          />

          <FormField
            id="category"
            label="Category"
            required
            error={errors.category}
            render={() => (
              <select
                value={formData.category}
                onChange={handleInputChange('category')}
                onBlur={handleBlur('category')}
              >
                <option value="">Select Category</option>
                {ticketCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          />

          {/* File Upload */}
          <fieldset>
            <label htmlFor="fileUpload">File Upload (PNG, JPG, PDF, Word, Excel, & CSV)</label>
            <div className={styles.fileUploadWrapper}>
              <input
                type="file"
                id="fileUpload"
                multiple
                accept={ALLOWED_FILE_TYPES.join(',')}
                onChange={handleFileChange}
                hidden
              />
              <label htmlFor="fileUpload" className={styles.uploadFileBtn}>
                {selectedFiles.length > 0 ? 'Add More Files' : 'Choose Files'}
              </label>
              {fileError && <span className={styles.errorMessage}>{fileError}</span>}

              {selectedFiles.length > 0 && (
                <div className={styles.filePreviewList}>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className={styles.filePreview}>
                      <p className={styles.fileName}>{file.name}</p>
                      <button
                        type="button"
                        className={styles.removeFileBtn}
                        onClick={() => removeFile(index)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>

          <FormField
            id="schedule"
            label="Scheduled Request"
            render={() => (
              <input
                type="date"
                value={formData.schedule}
                onChange={handleInputChange('schedule')}
              />
            )}
          />

          <FormField
            id="description"
            label="Description"
            required
            error={errors.description}
            render={() => (
              <textarea
                rows={5}
                placeholder="Provide a detailed description..."
                value={formData.description}
                onChange={handleInputChange('description')}
                onBlur={handleBlur('description')}
              />
            )}
          />

          {/* Asset Management Fields (AMS) - For both Check In and Check Out */}
          {isAnyAssetCategory && (
            <>
              <FormField
                id="subCategory"
                label="Sub-Category (Type of Product)"
                required
                error={errors.subCategory}
                render={() => (
                  <select
                    value={formData.subCategory}
                    onChange={handleInputChange('subCategory')}
                    onBlur={handleBlur('subCategory')}
                  >
                    <option value="">Select Product Type</option>
                    {assetSubCategories.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                )}
              />

              <FormField
                id="assetName"
                label="Asset Name"
                required
                error={errors.assetName}
                render={() => (
                  <select
                    disabled={!formData.subCategory}
                    value={formData.assetName}
                    onChange={handleInputChange('assetName')}
                    onBlur={handleBlur('assetName')}
                  >
                    <option value="">Select Asset</option>
                    {formData.subCategory &&
                      mockAssets[formData.subCategory]?.map(asset => (
                        <option key={asset.name} value={asset.name}>
                          {asset.name}
                        </option>
                      ))}
                  </select>
                )}
              />

              <FormField
                id="serialNumber"
                label="Serial Number"
                render={() => (
                  <input
                    type="text"
                    placeholder="Auto-filled when asset is selected"
                    readOnly
                    value={formData.serialNumber}
                    style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
                  />
                )}
              />

              <FormField
                id="location"
                label="Location"
                required
                error={errors.location}
                render={() => (
                  <select
                    value={formData.location}
                    onChange={handleInputChange('location')}
                    onBlur={handleBlur('location')}
                  >
                    <option value="">Select Location</option>
                    {locations.map(location => (
                      <option key={location} value={location}>{location}</option>
                    ))}
                  </select>
                )}
              />

              {/* Expected Return Date - Only for Asset Check Out */}
              {isAssetCheckOut && (
                <FormField
                  id="expectedReturnDate"
                  label="Expected Return Date"
                  required
                  error={errors.expectedReturnDate}
                  render={() => (
                    <input
                      type="date"
                      value={formData.expectedReturnDate}
                      onChange={handleInputChange('expectedReturnDate')}
                      onBlur={handleBlur('expectedReturnDate')}
                    />
                  )}
                />
              )}

              {/* Specify Issue - Only for Asset Check In */}
              {isAssetCheckIn && (
                <FormField
                  id="issueType"
                  label="Specify Issue"
                  required
                  error={errors.issueType}
                  render={() => (
                    <select
                      value={formData.issueType}
                      onChange={handleInputChange('issueType')}
                      onBlur={handleBlur('issueType')}
                    >
                      <option value="">Select Issue Type</option>
                      {assetIssueTypes.map(issue => (
                        <option key={issue} value={issue}>{issue}</option>
                      ))}
                    </select>
                  )}
                />
              )}

              {isAssetCheckIn && formData.issueType === 'Other' && (
                <FormField
                  id="otherIssue"
                  label="Please Specify Other Issue"
                  render={() => (
                    <textarea
                      rows={3}
                      placeholder="Please describe the issue..."
                      value={formData.otherIssue || ''}
                      onChange={handleInputChange('otherIssue')}
                    />
                  )}
                />
              )}
            </>
          )}

          {/* BMS Fields */}
          {isBMSCategory && (
            <>
              <FormField
                id="subCategory"
                label="Sub-Category"
                required
                error={errors.subCategory}
                render={() => (
                  <select
                    value={formData.subCategory}
                    onChange={handleInputChange('subCategory')}
                    onBlur={handleBlur('subCategory')}
                  >
                    <option value="">Select Sub-Category</option>
                    {bmsSubCategories[formData.category]?.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                )}
              />

              <FormField
                id="performanceStartDate"
                label="Performance Start Date"
                required
                error={errors.performanceStartDate}
                render={() => (
                  <input
                    type="date"
                    value={formData.performanceStartDate}
                    onChange={handleInputChange('performanceStartDate')}
                    onBlur={handleBlur('performanceStartDate')}
                  />
                )}
              />

              <FormField
                id="performanceEndDate"
                label="Performance End Date"
                required
                error={errors.performanceEndDate}
                render={() => (
                  <input
                    type="date"
                    value={formData.performanceEndDate}
                    onChange={handleInputChange('performanceEndDate')}
                    onBlur={handleBlur('performanceEndDate')}
                  />
                )}
              />

              {/* Cost Items Section */}
              <fieldset>
                <label>Cost Elements & Estimated Costs</label>
                {costItems.map((item, index) => (
                  <div key={index} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '5px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'end' }}>
                      <FormField
                        id={`costElement-${index}`}
                        label="Cost Element (e.g. Software, Hardware)"
                        render={() => (
                          <input
                            type="text"
                            placeholder="e.g., Software, Hardware"
                            value={item.costElement}
                            onChange={(e) => updateCostItem(index, 'costElement', e.target.value)}
                          />
                        )}
                      />

                      <FormField
                        id={`estimatedCost-${index}`}
                        label="Estimated Cost"
                        render={() => (
                          <select
                            value={item.estimatedCost}
                            onChange={(e) => updateCostItem(index, 'estimatedCost', e.target.value)}
                          >
                            <option value="">Select Cost Range</option>
                            {costRanges.map(range => (
                              <option key={range} value={range}>{range}</option>
                            ))}
                          </select>
                        )}
                      />

                      {costItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCostItem(index)}
                          style={{ 
                            background: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            padding: '8px 12px', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addCostItem}
                  style={{ 
                    background: '#28a745', 
                    color: 'white', 
                    border: 'none', 
                    padding: '10px 20px', 
                    borderRadius: '4px',
                    cursor: 'pointer',
                    marginBottom: '15px'
                  }}
                >
                  + Add Item
                </button>

                <div style={{ fontWeight: 'bold', fontSize: '18px' }}>
                  Total Requested Budget: ₱{calculateTotalBudget().toLocaleString()}
                </div>
              </fieldset>

              <FormField
                id="approvedBy"
                label="Approved By"
                required
                error={errors.approvedBy}
                render={() => (
                  <input
                    type="text"
                    placeholder="Enter name of approver"
                    value={formData.approvedBy}
                    onChange={handleInputChange('approvedBy')}
                    onBlur={handleBlur('approvedBy')}
                  />
                )}
              />
            </>
          )}

          <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
            {isSubmitting && <LoadingButton />}
            {isSubmitting ? 'Submitting...' : 'Submit Ticket'}
          </button>
        </form>
      </section>
    </main>
  );
}

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