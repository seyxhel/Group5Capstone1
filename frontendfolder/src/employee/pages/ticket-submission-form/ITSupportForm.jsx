import { useState } from 'react';
import { FaLaptop } from 'react-icons/fa';
import InputField from '../../../shared/components/InputField';
import SelectField from '../../../shared/components/SelectField';

const itSupportSubCategories = [
  'Technical Assistance',
  'Software Installation/Update',
  'Hardware Troubleshooting',
  'Email/Account Access Issue',
  'Internet/Network Connectivity Issue',
  'Printer/Scanner Setup or Issue',
  'System Performance Issue',
  'Virus/Malware Check',
  'IT Consultation Request',
  'Data Backup/Restore'
];

const ITSupportMetadata = {
  categoryName: 'IT Support',
  icon: FaLaptop,
  description: 'Technical support, troubleshooting, and IT assistance',
  subCategories: itSupportSubCategories
};

const deviceTypes = [
  'Laptop',
  'Printer',
  'Projector',
  'Monitor',
  'Other'
];

export default function ITSupportForm({ formData, onChange, onBlur, errors, FormField }) {
  return (
    <>
          {/* Sub-Category is chosen in the Category step and shown in the banner */}

      {/* Device Type */}
      <SelectField
        label="Device Type"
        placeholder="Select Device Type"
        value={formData.deviceType}
        onChange={onChange('deviceType')}
        onBlur={onBlur('deviceType')}
        required
        error={errors.deviceType}
        options={deviceTypes.map(type => ({ value: type, label: type }))}
      />

      {/* Custom Device Type - Shown when "Other" is selected */}
      {formData.deviceType === 'Other' && (
        <InputField
          type="text"
          label="Please Specify Device Type"
          placeholder="Enter device type"
          value={formData.customDeviceType || ''}
          onChange={onChange('customDeviceType')}
          onBlur={onBlur('customDeviceType')}
          error={errors.customDeviceType}
        />
      )}

      {/* Software Affected */}
      <InputField
        type="text"
        label="Software Affected (Problem inside the device)"
        placeholder="Enter affected software"
        value={formData.softwareAffected}
        onChange={onChange('softwareAffected')}
        onBlur={onBlur('softwareAffected')}
        error={errors.softwareAffected}
      />
    </>
  );
}
export { ITSupportMetadata };