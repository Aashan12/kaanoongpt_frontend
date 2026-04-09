import { useState } from 'react';
import { NEPAL_DISTRICTS } from '../../data/districts';

export default function CourtInfo({ formData, onChange }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredDistricts = NEPAL_DISTRICTS.filter(district =>
    district.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
    district.nepali.includes(searchTerm)
  );

  const handleDistrictChange = (districtEnglish) => {
    const district = NEPAL_DISTRICTS.find(d => d.english === districtEnglish);
    onChange('courtInfo', { 
      ...formData.courtInfo, 
      district: district.english,
      districtNepali: district.nepali
    });
  };

  return (
    <div className="form-section compact-form">
      <h3>Court Information</h3>
      <p className="form-description">Select the district court where you want to file the petition</p>
      
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="districtSearch">Search District</label>
          <input
            type="text"
            id="districtSearch"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search..."
            className="compact-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="district">District Court *</label>
          <select
            id="district"
            value={formData.courtInfo?.district || ''}
            onChange={(e) => handleDistrictChange(e.target.value)}
            required
            className="compact-input"
          >
            <option value="">Select District</option>
            {filteredDistricts.map(district => (
              <option key={district.english} value={district.english}>
                {district.english} ({district.nepali})
              </option>
            ))}
          </select>
        </div>
      </div>

      {formData.courtInfo?.district && (
        <div className="court-preview">
          <span className="preview-label">Court Name:</span>
          <span className="preview-value">श्री {formData.courtInfo.districtNepali} जिल्ला अदालत</span>
        </div>
      )}
    </div>
  );
}
