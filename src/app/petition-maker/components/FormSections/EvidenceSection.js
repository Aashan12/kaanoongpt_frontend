import { useState } from 'react';

export default function EvidenceSection({ formData, onChange }) {
  const [evidence, setEvidence] = useState(formData.evidence || []);

  const nepaliMarkers = ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ', 'ट', 'ठ', 'ड', 'ढ', 'ण'];

  const evidenceTypes = [
    'Document',
    'Photograph',
    'Video',
    'Audio Recording',
    'Contract/Agreement',
    'Receipt',
    'Certificate',
    'Letter',
    'Other'
  ];

  const addEvidence = () => {
    const newEvidence = {
      id: Date.now(),
      type: '',
      description: ''
    };
    const updated = [...evidence, newEvidence];
    setEvidence(updated);
    onChange('evidence', updated);
  };

  const removeEvidence = (id) => {
    const updated = evidence.filter(e => e.id !== id);
    setEvidence(updated);
    onChange('evidence', updated);
  };

  const updateEvidence = (id, field, value) => {
    const updated = evidence.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    );
    setEvidence(updated);
    onChange('evidence', updated);
  };

  return (
    <div className="form-section">
      <div className="section-header">
        <h3>Evidence</h3>
        <button type="button" onClick={addEvidence} className="btn-add">
          + Add Evidence
        </button>
      </div>

      {evidence.length === 0 && (
        <p className="empty-message">No evidence added yet. Click "Add Evidence" to add one.</p>
      )}

      {evidence.map((item, index) => (
        <div key={item.id} className="evidence-card">
          <div className="card-header">
            <h4>
              <span className="nepali-marker">{nepaliMarkers[index] || index + 1}</span>
              Evidence {index + 1}
            </h4>
            <button 
              type="button" 
              onClick={() => removeEvidence(item.id)}
              className="btn-remove"
            >
              Remove
            </button>
          </div>

          <div className="form-group">
            <label htmlFor={`evidence-type-${item.id}`}>Evidence Type *</label>
            <select
              id={`evidence-type-${item.id}`}
              value={item.type}
              onChange={(e) => updateEvidence(item.id, 'type', e.target.value)}
              required
            >
              <option value="">Select Type</option>
              {evidenceTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor={`evidence-desc-${item.id}`}>Description *</label>
            <textarea
              id={`evidence-desc-${item.id}`}
              value={item.description}
              onChange={(e) => updateEvidence(item.id, 'description', e.target.value)}
              placeholder="Describe the evidence and its relevance to the case"
              rows="3"
              required
            />
          </div>
        </div>
      ))}
    </div>
  );
}
