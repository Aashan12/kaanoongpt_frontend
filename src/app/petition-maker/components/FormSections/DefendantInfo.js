import AddressHelper from '../AddressHelper';
import { convertDigitsToEnglish } from '../../utils/englishToNepali';

export default function DefendantInfo({ formData, onChange }) {
  // Debug: Log formData when component renders
  console.log('DefendantInfo formData:', formData);
  
  const handleChange = (field, value) => {
    // Normalize numeric fields: convert Nepali digits to English for storage
    let normalizedValue = value;
    if (field === 'age' || field === 'phone') {
      normalizedValue = convertDigitsToEnglish(value);
    }
    onChange('defendant', { ...formData.defendant, [field]: normalizedValue });
  };

  const handleAddressChange = (addressData) => {
    handleChange('addressData', addressData);
  };

  const handleMaidenAddressChange = (addressData) => {
    handleChange('maidenAddressData', addressData);
  };

  return (
    <div className="form-section compact-form">
      <h3>Defendant Information</h3>
      
      <div className="form-row-3">
        <div className="form-group">
          <input
            type="text"
            id="defendantName"
            value={formData.defendant?.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Full Name *"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="number"
            id="defendantAge"
            value={formData.defendant?.age || ''}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="Age *"
            min="1"
            max="120"
            required
          />
        </div>

        <div className="form-group">
          <select
            id="defendantGender"
            value={formData.defendant?.gender || ''}
            onChange={(e) => handleChange('gender', e.target.value)}
            required
          >
            <option value="">Gender *</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="form-row-3">
        <div className="form-group">
          <input
            type="text"
            id="defendantGrandfatherName"
            value={formData.defendant?.grandfatherName || ''}
            onChange={(e) => handleChange('grandfatherName', e.target.value)}
            placeholder="Grandfather Name"
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            id="defendantFatherName"
            value={formData.defendant?.fatherName || ''}
            onChange={(e) => handleChange('fatherName', e.target.value)}
            placeholder="Father Name *"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="tel"
            id="defendantPhone"
            value={formData.defendant?.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Phone (98XXXXXXXX)"
          />
        </div>
      </div>

      <AddressHelper
        value={formData.defendant?.addressData || {}}
        onChange={handleAddressChange}
        prefix="defendant"
      />

      {formData.defendant?.gender === 'female' && (
        <div className="maiden-section">
          <p className="section-note">Maiden home (optional for married women)</p>
          <AddressHelper
            value={formData.defendant?.maidenAddressData || {}}
            onChange={handleMaidenAddressChange}
            prefix="maiden"
          />
        </div>
      )}
    </div>
  );
}
