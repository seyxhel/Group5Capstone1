import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { IoClose } from 'react-icons/io5';
import { FaFileAlt, FaFilePdf, FaFileWord, FaFileExcel, FaFileImage, FaEye, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Button from '../../../shared/components/Button';
import InputField from '../../../shared/components/InputField';
import EmployeeTicketSubmissionFormModal from '../../components/modals/ticket-submission-form/EmployeeTicketSubmissionFormModal';
import ProgressBar from '../../../shared/components/ProgressBar';
import styles from './EmployeeTicketSubmissionForm.module.css';
import FormActions from '../../../shared/components/FormActions';
import { createTicket } from '../../../utilities/storages/ticketStorage';
import authService from '../../../utilities/service/authService';
import ITSupportForm, { ITSupportMetadata } from './ITSupportForm';
import AssetCheckInForm, { AssetCheckInMetadata, mockAssets } from './AssetCheckInForm';
import AssetCheckOutForm, { AssetCheckOutMetadata } from './AssetCheckOutForm';
import BudgetProposalForm, { BudgetProposalMetadata } from './BudgetProposalForm';
import { OthersMetadata } from './OthersForm';

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

// Build category metadata dynamically from imported form metadata
const categoryMetadata = {
  'IT Support': ITSupportMetadata,
  'Asset Check In': AssetCheckInMetadata,
  'Asset Check Out': AssetCheckOutMetadata,
  'New Budget Proposal': BudgetProposalMetadata,
  'Others': OthersMetadata
};

// Main ticket categories derived from metadata
const ticketCategories = Object.keys(categoryMetadata);

export default function EmployeeTicketSubmissionForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = authService.getCurrentUser();
  
  // Multi-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    subject: '',
    category: '',
    subCategory: '',
    description: '',
    assetName: '',
    serialNumber: '',
    issueType: '',
    otherIssue: '',
    schedule: '',
    deviceType: '',
    customDeviceType: '',
    softwareAffected: '',
    performanceStartDate: '',
    performanceEndDate: '',
    preparedBy: ''
  });

  // If navigated with prefill state, populate initial fields
  useEffect(() => {
    if (location && location.state && location.state.prefill) {
      const pre = location.state.prefill;
      setFormData((prev) => ({
        ...prev,
        subject: pre.subject || prev.subject,
        description: pre.description || prev.description,
        category: pre.category || prev.category,
      }));
    }
  }, [location]);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketNumber, setSubmittedTicketNumber] = useState(null);
  const [budgetItems, setBudgetItems] = useState([{ costElement: '', estimatedCost: '' }]);
  const [showCustomDeviceType, setShowCustomDeviceType] = useState(false);
  const [attachmentsExpanded, setAttachmentsExpanded] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const DESCRIPTION_MAX_LENGTH = 240; // Standard display length for collapsed description
  // Show toggle only when description length >= standard max length
  const showDescriptionToggle = (formData.description || '').length >= DESCRIPTION_MAX_LENGTH;

  // Determine actual category (if "Others", it's General Request)
  const getActualCategory = () => {
    if (formData.category === 'Others') {
      return 'General Request';
    }
    return formData.category;
  };

  // Category checks
  const actualCategory = getActualCategory();
  const isGeneralRequest = actualCategory === 'General Request';
  const isITSupport = formData.category === 'IT Support';
  const isAssetCheckIn = formData.category === 'Asset Check In';
  const isAssetCheckOut = formData.category === 'Asset Check Out';
  const isBudgetProposal = formData.category === 'New Budget Proposal';
  const isAnyAssetCategory = isAssetCheckIn || isAssetCheckOut;

  // Minimum allowed schedule: start of today (local) — prevents selecting the previous day
  const getTodayMinLocal = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };
  const scheduleMin = getTodayMinLocal();

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
        if ((isITSupport || isAnyAssetCategory || isBudgetProposal) && !value) {
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
        // location removed from asset forms
        break;

      case 'issueType':
        if (isAssetCheckIn && !value) {
          error = 'Issue Type is required';
        }
        break;

      case 'expectedReturnDate':
        // expectedReturnDate removed from asset forms
        break;

      case 'deviceType':
        if (isITSupport && !value && !formData.customDeviceType) {
          error = 'Device Type is required';
        }
        break;

      case 'customDeviceType':
        if (isITSupport && showCustomDeviceType && !value.trim()) {
          error = 'Custom Device Type is required';
        }
        break;

      case 'softwareAffected':
        // optional
        break;

      case 'performanceStartDate':
        if (isBudgetProposal && !value) {
          error = 'Performance Start Date is required';
        }
        break;

      case 'performanceEndDate':
        if (isBudgetProposal && !value) {
          error = 'Performance End Date is required';
        } else if (isBudgetProposal && formData.performanceStartDate && value < formData.performanceStartDate) {
          error = 'End Date must be after or equal to Start Date';
        }
        break;

      case 'preparedBy':
        if (isBudgetProposal && !value.trim()) {
          error = 'Prepared By is required';
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
        issueType: '',
        otherIssue: '',
        deviceType: '',
        customDeviceType: '',
        softwareAffected: '',
        performanceStartDate: '',
        performanceEndDate: '',
        preparedBy: ''
      }));
      setBudgetItems([{ costElement: '', estimatedCost: '' }]);
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
    if (field === 'assetName' && formData.subCategory) {
      const selectedAsset = mockAssets[formData.subCategory]?.find(
        asset => asset.name === value
      );
      if (selectedAsset) {
        setFormData(prev => ({
          ...prev,
          assetName: value,
          serialNumber: selectedAsset.serialNumber
        }));
      }
    }

    if (touched[field]) {
      const fieldError = validateField(field, value);
      setErrors({ ...errors, [field]: fieldError });
    }
  };

  const handleBlur = (field) => () => {
    setTouched({ ...touched, [field]: true });
    const fieldError = validateField(field, formData[field]);
    setErrors({ ...errors, [field]: fieldError });
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const invalidFiles = files.filter(file => !ALLOWED_FILE_TYPES.includes(file.type));

    if (invalidFiles.length > 0) {
      setFileError('Some files have invalid types. Please upload only PNG, JPG, PDF, Word, Excel, or CSV files.');
      return;
    }

    setFileError('');
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const removeFile = (index) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  // Calculate total budget for Budget Proposal
  const calculateTotalBudget = () => {
    return budgetItems.reduce((total, item) => {
      if (!item.estimatedCost) return total;
      
      const range = item.estimatedCost;
      let maxValue = 0;

      if (range === '₱1,000,001 and above') {
        maxValue = 1000001;
      } else {
        const numbers = range.match(/\d+/g);
        if (numbers && numbers.length > 1) {
          maxValue = parseInt(numbers[1].replace(/,/g, ''));
        }
      }

      return total + maxValue;
    }, 0);
  };

  const validateAllFields = () => {
    const newErrors = {};
    const newTouched = {};
    
    const fieldsToValidate = ['subject', 'category', 'description'];
    
    // Add category-specific required fields
    if (isITSupport || isAnyAssetCategory || isBudgetProposal) {
      fieldsToValidate.push('subCategory');
    }

    if (isITSupport) {
      // Device type and software affected are required for IT Support
      fieldsToValidate.push('deviceType');
      if (showCustomDeviceType) {
        fieldsToValidate.push('customDeviceType');
      }
    }
    
    if (isAnyAssetCategory) {
      fieldsToValidate.push('assetName');
    }

    // expectedReturnDate removed from form

    if (isBudgetProposal) {
      fieldsToValidate.push('performanceStartDate', 'performanceEndDate', 'preparedBy');
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
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalCategory = formData.category === 'Others' ? 'General Request' : formData.category;

      const ticketData = {
        subject: formData.subject,
        category: finalCategory,
        subCategory: formData.subCategory,
        description: formData.description,
        priority: 'Medium',
        urgency: 'Medium',
        status: 'Open',
        employeeId: currentUser?.id || 1,
        employeeName: currentUser?.name || 'Unknown User',
        employeeDepartment: currentUser?.department || 'Unknown Department',
        createdAt: new Date().toISOString(),
        fileAttachments: selectedFiles.map((file, index) => ({
          name: file.name,
          url: `/uploads/${file.name}`,
          size: `${(file.size / 1024).toFixed(0)} KB`,
          uploadedAt: new Date().toISOString()
        })),
        scheduleRequest: formData.schedule ? {
          date: formData.schedule,
          time: '',
          notes: ''
        } : null
      };

      // Add IT Support specific data
      if (isITSupport) {
        ticketData.deviceType = showCustomDeviceType ? formData.customDeviceType : formData.deviceType;
        ticketData.softwareAffected = formData.softwareAffected;
      }

      // Add category-specific data
      if (isAnyAssetCategory) {
        ticketData.assetName = formData.assetName;
        ticketData.serialNumber = formData.serialNumber;
      }

      if (isAssetCheckIn) {
        ticketData.issueType = formData.issueType;
        if (formData.issueType === 'Other') {
          ticketData.otherIssue = formData.otherIssue;
        }
      }

      if (isBudgetProposal) {
        ticketData.budgetItems = budgetItems;
        ticketData.totalBudget = calculateTotalBudget();
        ticketData.performanceStartDate = formData.performanceStartDate;
        ticketData.performanceEndDate = formData.performanceEndDate;
        ticketData.preparedBy = formData.preparedBy;
      }

      const newTicket = createTicket(ticketData);

      // Keep user on Review & Submit (step 4). Save ticket number for reference.
      setSubmittedTicketNumber(newTicket.ticketNumber);
      setIsSubmitted(true);
    } catch (error) {
      toast.error('Failed to submit ticket. Please try again.');
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
      issueType: '',
      otherIssue: '',
      schedule: '',
      deviceType: '',
      customDeviceType: '',
      softwareAffected: '',
      performanceStartDate: '',
      performanceEndDate: '',
      preparedBy: ''
    });
    setErrors({});
    setTouched({});
    setSelectedFiles([]);
    setFileError('');
    setBudgetItems([{ costElement: '', estimatedCost: '' }]);
    setShowCustomDeviceType(false);
    setCurrentStep(1);
    setIsSubmitted(false);
  };

  // Check if Step 3 form is complete
  const isStep3Complete = () => {
    const fieldsToCheck = ['subject', 'description'];
    
    // Add category-specific required fields
    if (isITSupport || isAnyAssetCategory || isBudgetProposal) {
      fieldsToCheck.push('subCategory');
    }

    if (isITSupport) {
      fieldsToCheck.push('deviceType');
      if (showCustomDeviceType) {
        fieldsToCheck.push('customDeviceType');
      }
    }
    
    if (isAnyAssetCategory) {
      fieldsToCheck.push('assetName');
    }

    // expectedReturnDate removed from form

    if (isBudgetProposal) {
      fieldsToCheck.push('performanceStartDate', 'performanceEndDate', 'preparedBy');
    }

    // Check if all required fields have values and no errors
    return fieldsToCheck.every(field => {
      const hasValue = formData[field] && String(formData[field]).trim() !== '';
      const hasNoError = !errors[field];
      return hasValue && hasNoError;
    });
  };

  // Step navigation handlers
  const handleNextStep = () => {
    if (currentStep === 1 && !formData.category) {
      toast.error('Please select a category');
      return;
    }
    if (currentStep === 2 && !formData.subCategory) {
      toast.error('Please select a sub-category');
      return;
    }
    if (currentStep === 3) {
      if (!isStep3Complete()) {
        toast.error('Please fill in all required fields');
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    // If we're on Step 3 and the category is 'Others', skip Step 2 and go back to Step 1
    if (currentStep === 3 && formData.category === 'Others') {
      setCurrentStep(1);
      return;
    }
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleCategorySelect = (category) => {
    setFormData(prev => ({
      ...prev,
      category,
      subCategory: '', // Reset sub-category when changing category
    }));
    // If 'Others' is selected, skip sub-category step and go straight to Details (step 3)
    if (category === 'Others') {
      setCurrentStep(3);
    } else {
      setCurrentStep(2);
    }
  };

  const handleSubCategorySelect = (subCategory) => {
    setFormData(prev => ({
      ...prev,
      subCategory
    }));
    setCurrentStep(3);
  };

  const handleFinalSubmit = async () => {
    // Validate all fields before final submit
    if (!validateAllFields()) {
      toast.error('Please fix all errors before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      await handleSubmit({ preventDefault: () => {} });
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Progress Bar
  const renderProgressBar = () => {
    const steps = [
      { number: 1, label: 'Category' },
      { number: 2, label: 'Sub-Category' },
      { number: 3, label: 'Details' },
      { number: 4, label: 'Submit' }
    ];
    // Centralized ProgressBar component controls visuals
    return <ProgressBar currentStep={currentStep} steps={steps} />;
  };

  // Render Step 1: Category Selection
  const renderCategorySelection = () => {
    return (
      <>
        <h2 className={styles.stepTitle}>Select Category</h2>
        <p className={styles.stepSubtitle}>What type of assistance do you need?</p>
        
        <div className={styles.categoryGrid}>
          {ticketCategories.map(category => {
            const metadata = categoryMetadata[category] || categoryMetadata['Others'];
            const IconComponent = metadata.icon;
            
            return (
              <div
                key={category}
                className={`${styles.categoryCard} ${formData.category === category ? styles.selected : ''}`}
                onClick={() => handleCategorySelect(category)}
              >
                <div className={styles.categoryIcon}>
                  <IconComponent size={32} />
                </div>
                <h3 className={styles.categoryTitle}>{category}</h3>
                <p className={styles.categoryDescription}>{metadata.description}</p>
              </div>
            );
          })}
        </div>

        <div className={styles.stepActions}>
          <Button variant="outline" size="small" onClick={() => navigate('/employee/dashboard')}>
            Cancel
          </Button>
        </div>
      </>
    );
  };

  // Render Step 2: Sub-Category Selection
  const renderSubCategorySelection = () => {
    // Explicitly source sub-categories from their respective form metadata
    let metadata = categoryMetadata[formData.category] || categoryMetadata['Others'];
    if (formData.category === 'IT Support') metadata = ITSupportMetadata || metadata;
    if (formData.category === 'Asset Check In') metadata = AssetCheckInMetadata || metadata;
    if (formData.category === 'Asset Check Out') metadata = AssetCheckOutMetadata || metadata;
    if (formData.category === 'New Budget Proposal') metadata = BudgetProposalMetadata || metadata;
    if (formData.category === 'Others') metadata = OthersMetadata || metadata;
    const IconComponent = metadata.icon;
    const subCategories = Array.isArray(metadata.subCategories) ? metadata.subCategories : [];
    
    return (
      <>
        <h2 className={styles.stepTitle}>Choose Sub-Category</h2>
        <p className={styles.stepSubtitle}>Please specify the type of request</p>
        
        <div className={styles.selectedCategoryBanner}>
          <IconComponent size={20} style={{ color: '#007BFF' }} />
          <span>{formData.category}</span>
        </div>

        <div className={styles.subCategoryGrid}>
          {subCategories.map(subCat => (
            <div
              key={subCat}
              className={`${styles.subCategoryCard} ${formData.subCategory === subCat ? styles.selected : ''}`}
              onClick={() => handleSubCategorySelect(subCat)}
            >
              <h3 className={styles.subCategoryTitle}>{subCat}</h3>
              <p className={styles.subCategoryDescription}>
                {subCat.includes('Support') ? 'Hardware and software issues' :
                 subCat.includes('Deployment') ? 'Software installation and updates' :
                 subCat.includes('Maintenance') ? 'System updates and maintenance' :
                 subCat.includes('Network') ? 'Network and security support' :
                 'Select this option'}
              </p>
            </div>
          ))}
        </div>

        <div className={styles.stepActions}>
          <Button variant="outline" size="small" onClick={handlePrevStep}>
            Back
          </Button>
        </div>
      </>
    );
  };

  // Render Step 3: Details Form (existing form)
  const renderDetailsForm = () => {
    const metadata = categoryMetadata[formData.category] || categoryMetadata['Others'];
    const IconComponent = metadata.icon;

    return (
      <>
        <h2 className={styles.stepTitle}>Ticket Details</h2>
        <p className={styles.stepSubtitle}>Provide the necessary details for your request</p>
        
        <div className={styles.selectedCategoryBanner}>
          <IconComponent size={20} style={{ color: '#007BFF' }} />
          <span>{formData.category}</span>
          <span className={styles.separator}>•</span>
          <span>{formData.subCategory}</span>
        </div>

        <form className={styles.detailsForm}>
          {/* Main Form Fields */}
          <InputField
            type="text"
            label="Subject"
            placeholder="Enter ticket subject"
            value={formData.subject}
            onChange={handleInputChange('subject')}
            onBlur={handleBlur('subject')}
            required
            error={errors.subject}
          />

          {/* Sub-Category for IT Support */}
          {isITSupport && (
            <ITSupportForm
              formData={formData}
              onChange={handleInputChange}
              onBlur={handleBlur}
              errors={errors}
              FormField={FormField}
            />
          )}

          {/* Asset Check In Form */}
          {isAssetCheckIn && (
            <AssetCheckInForm
              formData={formData}
              onChange={handleInputChange}
              onBlur={handleBlur}
              errors={errors}
              FormField={FormField}
            />
          )}

          {/* Asset Check Out Form */}
          {isAssetCheckOut && (
            <AssetCheckOutForm
              formData={formData}
              onChange={handleInputChange}
              onBlur={handleBlur}
              errors={errors}
              FormField={FormField}
            />
          )}

          {/* Budget Proposal Form */}
          {isBudgetProposal && (
            <BudgetProposalForm
              formData={formData}
              onChange={handleInputChange}
              onBlur={handleBlur}
              errors={errors}
              FormField={FormField}
              budgetItems={budgetItems}
              setBudgetItems={setBudgetItems}
            />
          )}

          {/* Description */}
          <InputField
            variant="longTextArea"
            label="Description"
            placeholder="Provide a detailed description..."
            value={formData.description}
            onChange={handleInputChange('description')}
            onBlur={handleBlur('description')}
            required
            error={errors.description}
          />

          {/* Scheduled Request (always present, optional) */}
          <InputField
            type="datetime-local"
            label="Scheduled Request"
            placeholder="Optional — choose date and time"
            value={formData.schedule}
            onChange={handleInputChange('schedule')}
            onBlur={handleBlur('schedule')}
            error={errors.schedule}
            min={scheduleMin}
          />

          {/* File Upload - Available for All Categories */}
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
                ref={(input) => {
                  if (input) {
                    input.clickHandler = () => input.click();
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                size="small"
                onClick={() => document.getElementById('fileUpload').click()}
              >
                <FaFileAlt/>
                Choose Files
              </Button>
            </div>
            {fileError && <p className={styles.errorMessage}>{fileError}</p>}
            
            {/* File Preview List */}
            {selectedFiles.length > 0 && (
              <div className={styles.filePreviewList}>
                {selectedFiles.map((file, index) => (
                  <div key={index} className={styles.filePreview}>
                    <span className={styles.fileName}>{file.name}</span>
                    <button
                      type="button"
                      className={styles.removeFileBtn}
                      onClick={() => removeFile(index)}
                    >
                      <IoClose size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        </form>

        <FormActions
          onCancel={handlePrevStep}
          cancelLabel="Back"
          onSubmit={handleNextStep}
          submitLabel="Next"
          submitVariant="primary"
          submitDisabled={!isStep3Complete()}
          cancelSize="small"
          submitSize="small"
        />
      </>
    );
  };

  // Render Step 4: Review & Submit
  const renderReviewSubmit = () => {
    const metadata = categoryMetadata[formData.category] || categoryMetadata['Others'];
    const IconComponent = metadata.icon;

    const formatCurrencyLocal = (val) => {
      if (val === null || val === undefined || val === '') return <em>—</em>;
      const cleaned = String(val).toString().replace(/,/g, '').replace(/[^0-9.\-]/g, '');
      const num = Number(cleaned);
      if (Number.isNaN(num)) return <em>—</em>;
      return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(num);
    };

    const formatDateLocal = (d) => {
      if (!d) return <em>—</em>;
      try {
        const parsed = new Date(d);
        if (isNaN(parsed)) return <em>—</em>;
        return parsed.toLocaleDateString('en-PH');
      } catch (err) {
        return <em>—</em>;
      }
    };

    const formatBytes = (bytes) => {
      if (bytes == null || bytes === 0) return '0 B';
      const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(1024));
      const value = bytes / Math.pow(1024, i);
      return `${value.toFixed(i === 0 ? 0 : 2)} ${sizes[i]}`;
    };

    // Get file type icon based on MIME type or extension
    const getFileTypeIcon = (fileName) => {
      const ext = fileName.split('.').pop().toLowerCase();
      const mimeIcons = {
        'pdf': <FaFilePdf style={{ color: '#dc2626', marginRight: 6 }} size={16} />,
        'doc': <FaFileWord style={{ color: '#2563eb', marginRight: 6 }} size={16} />,
        'docx': <FaFileWord style={{ color: '#2563eb', marginRight: 6 }} size={16} />,
        'xls': <FaFileExcel style={{ color: '#16a34a', marginRight: 6 }} size={16} />,
        'xlsx': <FaFileExcel style={{ color: '#16a34a', marginRight: 6 }} size={16} />,
        'csv': <FaFileExcel style={{ color: '#16a34a', marginRight: 6 }} size={16} />,
        'jpg': <FaFileImage style={{ color: '#9333ea', marginRight: 6 }} size={16} />,
        'jpeg': <FaFileImage style={{ color: '#9333ea', marginRight: 6 }} size={16} />,
        'png': <FaFileImage style={{ color: '#9333ea', marginRight: 6 }} size={16} />,
        'gif': <FaFileImage style={{ color: '#9333ea', marginRight: 6 }} size={16} />,
      };
      return mimeIcons[ext] || <FaFileAlt style={{ color: '#6b7280', marginRight: 6 }} size={16} />;
    };

    const getAttachmentClass = (fileName) => {
      const ext = fileName.split('.').pop().toLowerCase();
      if (['pdf'].includes(ext)) return 'pdf';
      if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
      if (['doc', 'docx'].includes(ext)) return 'word';
      if (['png', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'image';
      return 'defaultFile';
    };

    const previewFile = (file) => {
      try {
        const url = URL.createObjectURL(file);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 1000 * 10);
      } catch (err) {
        console.error('Preview failed', err);
      }
    };

    const downloadFile = (file) => {
      try {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000 * 10);
      } catch (err) {
        console.error('Download failed', err);
      }
    };

    return (
      <>
        <h2 className={styles.stepTitle}>Review & Submit</h2>
        <p className={styles.stepSubtitle}>Review your information before submitting</p>

        <div className={styles.reviewSection}>
          <div className={styles.selectedCategoryBanner}>
            <IconComponent size={20} style={{ color: '#007BFF' }} />
            <span>{formData.category}</span>
            <span className={styles.separator}>•</span>
            <span>{formData.subCategory}</span>
          </div>

          {/* Common fields */}
          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>Subject</span>
            <span className={styles.reviewValue}>{formData.subject || <em>—</em>}</span>
          </div>

          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>Description</span>
            <div className={styles.descriptionValue}>
              <div className={`${styles.descriptionContent} ${descriptionExpanded ? styles.descriptionContentExpanded : ''}`}>
                {formData.description ? formData.description.split('\n').map((line, i) => (<div key={i}>{line}</div>)) : <em>—</em>}
              </div>
              {showDescriptionToggle && (
                <button
                  type="button"
                  className={styles.descriptionToggle}
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  aria-expanded={descriptionExpanded}
                >
                  <span>{descriptionExpanded ? 'Show less' : 'Show more'}</span>
                  {descriptionExpanded ? <FaChevronUp size={12} /> : <FaChevronDown size={12} />}
                </button>
              )}
            </div>
          </div>

          <div className={styles.reviewItem}>
            <span className={styles.reviewLabel}>Scheduled Request</span>
            <span className={styles.reviewValue}>{formData.schedule ? new Date(formData.schedule).toLocaleString() : <em>—</em>}</span>
          </div>

          {/* IT Support fields */}
          {isITSupport && (
            <>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Device Type</span>
                <span className={styles.reviewValue}>{showCustomDeviceType ? formData.customDeviceType : (formData.deviceType || <em>—</em>)}</span>
              </div>
              {formData.softwareAffected && (
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Software Affected</span>
                  <span className={styles.reviewValue}>{formData.softwareAffected}</span>
                </div>
              )}
            </>
          )}

          {/* Asset categories */}
          {isAnyAssetCategory && (
            <>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Asset Name</span>
                <span className={styles.reviewValue}>{formData.assetName || <em>—</em>}</span>
              </div>
              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Serial Number</span>
                <span className={styles.reviewValue}>{formData.serialNumber || <em>—</em>}</span>
              </div>
              <div className={styles.reviewItem}>
                        {/* Location removed */}
              </div>
            </>
          )}


          {isAssetCheckIn && formData.issueType && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Issue Type</span>
              <span className={styles.reviewValue}>{formData.issueType}</span>
            </div>
          )}

          {isAssetCheckIn && formData.issueType === 'Other' && formData.otherIssue && (
            <div className={styles.reviewItem}>
              <span className={styles.reviewLabel}>Other Issue Details</span>
              <span className={styles.reviewValue}>{formData.otherIssue}</span>
            </div>
          )}

          {/* Budget Proposal: list items and total */}
          {isBudgetProposal && (
            <>
              {budgetItems && budgetItems.length > 0 ? (
                budgetItems.map((it, idx) => (
                  <div className={styles.reviewItem} key={idx}>
                    <span className={styles.reviewLabel}>{it.costElement || `Item ${idx + 1}`}</span>
                    <span className={styles.reviewValue}>{it.estimatedCost ? formatCurrencyLocal(it.estimatedCost) : <em>—</em>}</span>
                  </div>
                ))
              ) : (
                <div className={styles.reviewItem}>
                  <span className={styles.reviewLabel}>Budget Items</span>
                  <span className={styles.reviewValue}><em>—</em></span>
                </div>
              )}

              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Total Budget</span>
                <span className={styles.reviewValue}>{formatCurrencyLocal(calculateTotalBudget())}</span>
              </div>

              <div className={styles.reviewItem}>
                <span className={styles.reviewLabel}>Performance Period</span>
                <span className={styles.reviewValue}>{formatDateLocal(formData.performanceStartDate)} to {formatDateLocal(formData.performanceEndDate)}</span>
              </div>
            </>
          )}

          <div className={`${styles.reviewItem} ${styles.attachmentsRow}`}>
            <span className={styles.reviewLabel}>Attachments <span style={{ fontSize: '12px', fontWeight: 400, color: '#9ca3af' }}>({selectedFiles.length})</span></span>
          </div>
          {selectedFiles.length > 0 && (
            <div className={styles.attachmentsFullWidth}>
              {!attachmentsExpanded ? (
                <div className={styles.attachmentsList}>
                  {selectedFiles.slice(0, 3).map((file, i) => {
                    const cls = getAttachmentClass(file.name);
                    return (
                      <div key={i} className={`${styles.attachmentItem} ${styles[cls]}`} onClick={() => previewFile(file)}>
                        <div className={styles.attachmentContentWrapper}>
                          <div className={styles.attachmentIconWrapper}>
                            {getFileTypeIcon(file.name)}
                          </div>
                          <div className={styles.fileInfo}>
                            <span className={styles.attachmentName} title={file.name}>{file.name}</span>
                            {file.size != null && <span className={styles.attachmentSize}>{formatBytes(file.size)}</span>}
                          </div>
                        </div>
                        <button type="button" className={styles.attachmentViewBtn} onClick={(e) => { e.stopPropagation(); previewFile(file); }} title="View">
                          <FaEye />
                        </button>
                      </div>
                    );
                  })}
                  {selectedFiles.length > 3 && (
                    <button type="button" className={styles.showMoreLessBtn} onClick={() => setAttachmentsExpanded(true)}>
                      <span>Show more ({selectedFiles.length - 3})</span>
                      <FaChevronDown size={12} />
                    </button>
                  )}
                </div>
              ) : (
                <div className={styles.attachmentsList}>
                  {selectedFiles.map((file, index) => {
                    const cls = getAttachmentClass(file.name);
                    return (
                      <div key={index} className={`${styles.attachmentItem} ${styles[cls]}`} onClick={() => previewFile(file)}>
                        <div className={styles.attachmentContentWrapper}>
                          <div className={styles.attachmentIconWrapper}>
                            {getFileTypeIcon(file.name)}
                          </div>
                          <div className={styles.fileInfo}>
                            <span className={styles.attachmentName} title={file.name}>{file.name}</span>
                            {file.size != null && <span className={styles.attachmentSize}>{formatBytes(file.size)}</span>}
                          </div>
                        </div>
                        <button type="button" className={styles.attachmentViewBtn} onClick={(e) => { e.stopPropagation(); previewFile(file); }} title="View">
                          <FaEye />
                        </button>
                      </div>
                    );
                  })}
                  <button type="button" className={styles.showMoreLessBtn} onClick={() => setAttachmentsExpanded(false)}>
                    <span>Show less</span>
                    <FaChevronUp size={12} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <FormActions
          onCancel={handlePrevStep}
          cancelLabel="Back"
          cancelVariant="outline"
          onSubmit={handleFinalSubmit}
          submitLabel="Submit Ticket"
          submitVariant="primary"
          submitDisabled={isSubmitting}
          cancelSize="small"
          submitSize="small"
        />
      </>
    );
  };

  // Success modal is rendered via separate component `EmployeeTicketSubmissionFormModal`

  return (
    <main className={styles.registration}>
      <section className={styles.centerSection}>
        {renderProgressBar()}

        <div className={`${styles.stepContainer} ${(currentStep === 3 || currentStep === 4) ? styles.stepContainerCard : ''}`}>
          {currentStep === 1 ? renderCategorySelection() :
           currentStep === 2 ? renderSubCategorySelection() :
           currentStep === 3 ? renderDetailsForm() :
           currentStep === 4 ? renderReviewSubmit() : null}
        </div>

        {isSubmitted && (
          <EmployeeTicketSubmissionFormModal
            submittedTicketNumber={submittedTicketNumber}
            onCreateNew={() => resetForm()}
            onView={() => {
              if (submittedTicketNumber) {
                navigate(`/employee/ticket-tracker/${submittedTicketNumber}`);
              } else {
                navigate('/employee/ticket-tracker');
              }
            }}
          />
        )}
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