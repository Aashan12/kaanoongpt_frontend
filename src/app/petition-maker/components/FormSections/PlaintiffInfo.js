import AddressHelper from '../AddressHelper';
import { convertDigitsToEnglish } from '../../utils/englishToNepali';

export default function PlaintiffInfo({ formData, onChange }) {
  // Debug: Log formData when component renders
  console.log('PlaintiffInfo formData:', formData);
  
  const handleChange = (field, value) => {
    // Normalize numeric fields: convert Nepali digits to English for storage
    let normalizedValue = value;
    if (field === 'age' || field === 'phone') {
      normalizedValue = convertDigitsToEnglish(value);
    }
    onChange('plaintiff', { ...formData.plaintiff, [field]: normalizedValue });
  };

  const handleAddressChange = (addressData) => {
    handleChange('addressData', addressData);
  };

  return (
    <div className="form-section compact-form">
      <h3>Plaintiff Information</h3>
      
      <div className="form-row-3">
        <div className="form-group">
          <input
            type="text"
            id="plaintiffName"
            value={formData.plaintiff?.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Full Name *"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="number"
            id="plaintiffAge"
            value={formData.plaintiff?.age || ''}
            onChange={(e) => handleChange('age', e.target.value)}
            placeholder="Age *"
            min="1"
            max="120"
            required
          />
        </div>

        <div className="form-group">
          <select
            id="plaintiffGender"
            value={formData.plaintiff?.gender || ''}
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
            id="plaintiffGrandfatherName"
            value={formData.plaintiff?.grandfatherName || ''}
            onChange={(e) => handleChange('grandfatherName', e.target.value)}
            placeholder="Grandfather Name"
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            id="plaintiffFatherName"
            value={formData.plaintiff?.fatherName || ''}
            onChange={(e) => handleChange('fatherName', e.target.value)}
            placeholder="Father Name *"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="tel"
            id="plaintiffPhone"
            value={formData.plaintiff?.phone || ''}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Phone (98XXXXXXXX)"
          />
        </div>
      </div>

      <AddressHelper
        value={formData.plaintiff?.addressData || {}}
        onChange={handleAddressChange}
        prefix="plaintiff"
      />

      {formData.plaintiff?.age && parseInt(formData.plaintiff.age) < 18 && (
        <div className="guardian-section">
          <p className="section-note">Guardian required for minor</p>
          
          <div className="form-row">
            <div className="form-group">
              <input
                type="text"
                id="guardianName"
                value={formData.plaintiff?.guardianName || ''}
                onChange={(e) => handleChange('guardianName', e.target.value)}
                placeholder="Guardian Name *"
                required
              />
            </div>

            <div className="form-group">
              <input
                type="text"
                id="guardianRelation"
                value={formData.plaintiff?.guardianRelation || ''}
                onChange={(e) => handleChange('guardianRelation', e.target.value)}
                placeholder="Relation (Father, Mother, etc.) *"
                required
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
