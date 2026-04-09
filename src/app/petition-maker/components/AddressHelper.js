'use client';
import { useState, useEffect } from 'react';
import { convertDigitsToEnglish } from '../utils/englishToNepali';

export default function AddressHelper({ value = {}, onChange, prefix = 'address' }) {
  const [province, setProvince] = useState(value.province || '');
  const [district, setDistrict] = useState(value.district || '');
  const [municipality, setMunicipality] = useState(value.municipality || '');
  const [wardNumber, setWardNumber] = useState(value.ward || '');

  // Update parent component when values change
  useEffect(() => {
    onChange({
      province,
      district,
      municipality,
      ward: wardNumber
    });
  }, [province, district, municipality, wardNumber]);

  const handleWardChange = (e) => {
    // Normalize ward number: convert Nepali digits to English for storage
    const normalizedValue = convertDigitsToEnglish(e.target.value);
    setWardNumber(normalizedValue);
  };

  return (
    <div className="address-helper">
      <div className="form-row">
        <div className="form-group">
          <input
            type="text"
            id={`${prefix}-province`}
            value={province}
            onChange={(e) => setProvince(e.target.value)}
            placeholder="Province *"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            id={`${prefix}-district`}
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            placeholder="District *"
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <input
            type="text"
            id={`${prefix}-municipality`}
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
            placeholder="Municipality/Rural Municipality/VDC *"
            required
          />
        </div>

        <div className="form-group">
          <input
            type="number"
            id={`${prefix}-ward`}
            value={wardNumber}
            onChange={handleWardChange}
            placeholder="Ward (1-35) *"
            min="1"
            max="35"
            required
          />
        </div>
      </div>
    </div>
  );
}
