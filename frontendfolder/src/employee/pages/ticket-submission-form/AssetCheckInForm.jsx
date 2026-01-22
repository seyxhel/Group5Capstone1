import { FaBoxOpen } from 'react-icons/fa';
import InputField from '../../../shared/components/InputField';
import SelectField from '../../../shared/components/SelectField';

const AssetCheckInMetadata = {
  categoryName: 'Asset Check In',
  icon: FaBoxOpen,
  description: 'Return or check in company assets',
  subCategories: ['Laptop', 'Printer', 'Projector', 'Mouse', 'Keyboard']
};

const assetSubCategories = [
  'Laptop',
  'Printer',
  'Projector',
  'Mouse',
  'Keyboard'
];

const assetIssueTypes = [
  'Not Functioning',
  'Missing Accessories (e.g., charger, case)',
  'Physical Damage (e.g., cracked screen, broken keys)',
  'Battery Issue (e.g., not charging, quick drain)',
  'Software Issue (e.g., system crash, unable to boot)',
  'Screen/Display Issue (e.g., flickering, dead pixels)',
  'Other'
];

// Mock assets data - this would come from your AMS in production
const mockAssets = {
  'Laptop': [
    { name: 'Dell Latitude 5420', serialNumber: 'DL-2024-001' },
    { name: 'HP ProBook 450 G9', serialNumber: 'HP-2024-002' },
    { name: 'Lenovo ThinkPad X1', serialNumber: 'LN-2024-003' }
  ],
  'Printer': [
    { name: 'HP LaserJet Pro M404dn', serialNumber: 'PR-2024-001' },
    { name: 'Canon imageCLASS MF445dw', serialNumber: 'PR-2024-002' }
  ],
  'Projector': [
    { name: 'Epson PowerLite 2247U', serialNumber: 'PJ-2024-001' },
    { name: 'BenQ MH535A', serialNumber: 'PJ-2024-002' }
  ],
  'Mouse': [
    { name: 'Logitech MX Master 3', serialNumber: 'MS-2024-001' },
    { name: 'Microsoft Surface Mouse', serialNumber: 'MS-2024-002' }
  ],
  'Keyboard': [
    { name: 'Logitech K380', serialNumber: 'KB-2024-001' },
    { name: 'Microsoft Ergonomic Keyboard', serialNumber: 'KB-2024-002' }
  ]
};

export default function AssetCheckInForm({ formData, onChange, onBlur, errors, FormField }) {
  return (
    <>
      {/* Sub-Category selection is done in Step 2 and displayed in the banner */}

      {/* Asset Name */}
      <SelectField
        label="Asset Name"
        placeholder="Select Asset"
        value={formData.assetName}
        onChange={onChange('assetName')}
        onBlur={onBlur('assetName')}
        required
        disabled={!formData.subCategory}
        error={errors.assetName}
        options={formData.subCategory ? mockAssets[formData.subCategory]?.map(asset => ({ value: asset.name, label: asset.name })) || [] : []}
      />

      {/* Serial Number (Auto-filled) */}
      <InputField
        type="text"
        label="Serial Number"
        placeholder="Auto-filled when asset is selected"
        value={formData.serialNumber}
        disabled
        readOnly
      />

      {/* Issue Type (optional) */}
      <SelectField
        label="If there's an issue, please specify (Optional)"
        placeholder="Select issue"
        value={formData.issueType}
        onChange={onChange('issueType')}
        onBlur={onBlur('issueType')}
        options={assetIssueTypes.map(i => ({ value: i, label: i }))}
        error={errors.issueType}
      />

      {/* Other Issue - Shown when "Other" is selected */}
      {formData.issueType === 'Other' && (
        <InputField
          type="textarea"
          label="Please Specify Other Issue"
          placeholder="Please describe the issue..."
          value={formData.otherIssue || ''}
          onChange={onChange('otherIssue')}
          error={errors.otherIssue}
        />
      )}
    </>
  );
}

// Export the mock assets for use in parent component
export { mockAssets, AssetCheckInMetadata };
