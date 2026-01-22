import { FaUser } from 'react-icons/fa';

const othersSubCategories = [];

const OthersMetadata = {
  categoryName: 'Others',
  icon: FaUser,
  description: 'General requests and other inquiries',
  // No sub-categories for Others — handled as a general request
  subCategories: othersSubCategories
};

export default function OthersForm({ formData, onChange, onBlur, errors, FormField }) {
  return (
    <>
      {/* No additional fields for Others/General Request */}
      {/* The subject and description in the main form are sufficient */}
    </>
  );
}

export { OthersMetadata };
