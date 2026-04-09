import { useState, useEffect } from 'react';
import { useNepaliTranslation } from '../../hooks/useNepaliTranslation';

export default function WitnessSection({ formData, onChange }) {
  const [witnesses, setWitnesses] = useState(formData.witnesses || []);
  const { translateToNepali } = useNepaliTranslation();

  const addWitness = () => {
    const newWitness = {
      id: Date.now(),
      name: '',
      nameNepali: '',
      address: '',
      addressNepali: '',
      phone: '',
      relation: '',
      relationNepali: ''
    };
    const updated = [...witnesses, newWitness];
    setWitnesses(updated);
    onChange('witnesses', updated);
  };

  const removeWitness = (id) => {
    const updated = witnesses.filter(w => w.id !== id);
    setWitnesses(updated);
    onChange('witnesses', updated);
  };

  const updateWitness = async (id, field, value) => {
    const updated = witnesses.map(w => 
      w.id === id ? { ...w, [field]: value } : w
    );
    setWitnesses(updated);
    onChange('witnesses', updated);

    // Auto-translate to Nepali when English field is updated
    if (field === 'name' || field === 'address' || field === 'relation') {
      if (value.trim()) {
        const nepaliField = `${field}Nepali`;
        const nepaliValue = await translateToNepali(value);
        const finalUpdated = updated.map(w =>
          w.id === id ? { ...w, [nepaliField]: nepaliValue } : w
        );
        setWitnesses(finalUpdated);
        onChange('witnesses', finalUpdated);
      }
    }
  };

  return (
    <div className="form-section">
      <div className="section-header">
        <h3>Witnesses</h3>
        <button type="button" onClick={addWitness} className="btn-add">
          + Add Witness
        </button>
      </div>

      {witnesses.length === 0 && (
        <p className="empty-message">No witnesses added yet. Click "Add Witness" to add one.</p>
      )}

      {witnesses.map((witness, index) => (
        <div key={witness.id} className="witness-card">
          <div className="card-header">
            <h4>Witness {index + 1}</h4>
            <button 
              type="button" 
              onClick={() => removeWitness(witness.id)}
              className="btn-remove"
            >
              Remove
            </button>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`witness-name-${witness.id}`}>Full Name (English) *</label>
              <input
                type="text"
                id={`witness-name-${witness.id}`}
                value={witness.name}
                onChange={(e) => updateWitness(witness.id, 'name', e.target.value)}
                placeholder="Witness full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor={`witness-name-nepali-${witness.id}`}>Full Name (Nepali) *</label>
              <input
                type="text"
                id={`witness-name-nepali-${witness.id}`}
                value={witness.nameNepali || ''}
                onChange={(e) => updateWitness(witness.id, 'nameNepali', e.target.value)}
                placeholder="साक्षीको पूरा नाम"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`witness-phone-${witness.id}`}>Phone Number</label>
              <input
                type="tel"
                id={`witness-phone-${witness.id}`}
                value={witness.phone}
                onChange={(e) => updateWitness(witness.id, 'phone', e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>

            <div className="form-group">
              <label htmlFor={`witness-relation-${witness.id}`}>Relation to Case (English)</label>
              <input
                type="text"
                id={`witness-relation-${witness.id}`}
                value={witness.relation}
                onChange={(e) => updateWitness(witness.id, 'relation', e.target.value)}
                placeholder="e.g., Neighbor, Friend, Colleague"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor={`witness-address-${witness.id}`}>Address (English) *</label>
              <input
                type="text"
                id={`witness-address-${witness.id}`}
                value={witness.address}
                onChange={(e) => updateWitness(witness.id, 'address', e.target.value)}
                placeholder="Province, District, Municipality, Ward"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor={`witness-address-nepali-${witness.id}`}>Address (Nepali) *</label>
              <input
                type="text"
                id={`witness-address-nepali-${witness.id}`}
                value={witness.addressNepali || ''}
                onChange={(e) => updateWitness(witness.id, 'addressNepali', e.target.value)}
                placeholder="प्रदेश, जिल्ला, नगरपालिका, वडा"
                required
              />
            </div>
          </div>

          {witness.relation && (
            <div className="form-group">
              <label htmlFor={`witness-relation-nepali-${witness.id}`}>Relation to Case (Nepali)</label>
              <input
                type="text"
                id={`witness-relation-nepali-${witness.id}`}
                value={witness.relationNepali || ''}
                onChange={(e) => updateWitness(witness.id, 'relationNepali', e.target.value)}
                placeholder="जस्तै, छिमेकी, साथी, सहकर्मी"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
