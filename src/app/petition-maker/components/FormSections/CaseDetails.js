'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import AgenticChatInterface from '../AgenticChatInterface';
import PetitionPreview from '../PetitionPreview';
import { CASE_TYPES } from '../CaseTypeSelector';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CaseDetails({ formData, onChange, caseType }) {
  const [casualDescription, setCasualDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNarrative, setGeneratedNarrative] = useState('');
  const [showAgenticMode, setShowAgenticMode] = useState(false);
  const [aiCompleted, setAiCompleted] = useState(false);

  // Get the selected case type object for PetitionPreview
  const selectedCaseType = caseType ? 
    CASE_TYPES.find(ct => ct.id === caseType) || {
      id: caseType,
      nameNepali: caseType === 'divorce' ? 'सम्बन्ध विच्छेद (Divorce)' : 
                  caseType === 'divorce-custody' ? 'सम्बन्ध विच्छेद र सन्तान संरक्षण' :
                  caseType === 'divorce-alimony' ? 'सम्बन्ध विच्छेद र भरणपोषण' : 'सम्बन्ध विच्छेद'
    } : null;

  const handleChange = (field, value) => {
    onChange('caseDetails', { ...formData.caseDetails, [field]: value });
  };

  const handleGenerateNarrative = async () => {
    if (!casualDescription.trim()) {
      alert('Please enter a description of your case');
      return;
    }

    setIsGenerating(true);
    setGeneratedNarrative(''); // Clear previous narrative and show textarea immediately
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/translation/generate-case-narrative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          casual_description: casualDescription,
          case_type: caseType,
          plaintiff_name: formData.plaintiff?.name || 'Plaintiff',
          defendant_name: formData.defendant?.name || 'Defendant',
          marriage_date: formData.caseDetails?.marriageDate,
          children_info: formData.caseDetails?.children ? `${formData.caseDetails.children} children` : null,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate narrative');
      }

      // Handle streaming response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              break;
            }
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.error) {
                throw new Error(parsed.error);
              }
              
              if (parsed.content) {
                accumulatedText += parsed.content;
                setGeneratedNarrative(accumulatedText);
                handleChange('professionalNarrative', accumulatedText);
              }
              
              if (parsed.done) {
                break;
              }
            } catch (e) {
              // Skip invalid JSON
              continue;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error generating narrative:', error);
      alert('Failed to generate professional narrative. Please try again.');
      setGeneratedNarrative(''); // Clear on error
    } finally {
      setIsGenerating(false);
    }
  };

  const startAgenticMode = () => {
    // Validate required fields
    if (!formData.caseDetails?.marriageDate || !formData.caseDetails?.marriagePlace) {
      alert('Please fill in Marriage Date and Marriage Place before starting AI Assistant');
      return;
    }
    
    setShowAgenticMode(true);
  };

  const renderDivorceFields = () => (
    <>
      <div className="form-row form-row-3-divorce">
        <div className="form-group">
          <label htmlFor="marriageDate">Marriage Date *</label>
          <input
            type="date"
            id="marriageDate"
            value={formData.caseDetails?.marriageDate || ''}
            onChange={(e) => handleChange('marriageDate', e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="marriagePlace">Marriage Place *</label>
          <input
            type="text"
            id="marriagePlace"
            value={formData.caseDetails?.marriagePlace || ''}
            onChange={(e) => handleChange('marriagePlace', e.target.value)}
            placeholder="Location where marriage took place"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="children">Number of Children</label>
          <input
            type="number"
            id="children"
            value={formData.caseDetails?.children || ''}
            onChange={(e) => handleChange('children', e.target.value)}
            min="0"
            placeholder="0"
          />
        </div>
      </div>

      {/* Agentic AI Assistant Button */}
      <div className="form-group">
        <button
          type="button"
          className="ai-generate-btn"
          onClick={startAgenticMode}
          disabled={aiCompleted}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            width: '100%',
            justifyContent: 'center',
            padding: '1rem',
            fontSize: '1rem',
            fontWeight: '600',
            opacity: aiCompleted ? 0.6 : 1,
            cursor: aiCompleted ? 'not-allowed' : 'pointer'
          }}
        >
          <MessageSquare size={20} />
          {aiCompleted ? '✓ AI Assistant Completed' : 'Start AI Petition Assistant (Conversational)'}
        </button>
        {aiCompleted && (
          <p style={{ 
            marginTop: '0.5rem', 
            color: 'var(--ka-success)', 
            fontSize: '0.875rem',
            textAlign: 'center'
          }}>
            ✓ फिरादपत्र तयार भयो! अब तपाईं साक्षीहरूको विवरण थप्न Step 5 मा जान सक्नुहुन्छ।
          </p>
        )}
      </div>

      {/* Agentic Mode - Split View Modal */}
      {showAgenticMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '1600px',
            height: '90vh',
            background: 'var(--ka-bg)',
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            gap: '1rem',
            padding: '1rem',
            position: 'relative'
          }}>
            {/* Chat Interface - Left */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <AgenticChatInterface
                formData={formData}
                caseType={caseType}
                onClose={() => {
                  setShowAgenticMode(false);
                  setAiCompleted(true);
                }}
                onPetitionUpdate={(data) => {
                  console.log('CaseDetails received petition update:', data);
                  console.log('Current formData.caseDetails before update:', formData.caseDetails);
                  
                  // Build updated caseDetails object with all changes at once
                  const updatedCaseDetails = { ...formData.caseDetails };
                  
                  // Update formatted_grounds
                  if (data.formatted_grounds) {
                    console.log('Updating formatted_grounds:', data.formatted_grounds);
                    updatedCaseDetails.formatted_grounds = data.formatted_grounds;
                  }
                  // Update legal_basis
                  if (data.legal_basis || data.formatted_legal_basis) {
                    console.log('Updating legal_basis:', data.legal_basis || data.formatted_legal_basis);
                    updatedCaseDetails.legal_basis = data.legal_basis || data.formatted_legal_basis;
                  }
                  // Update evidence
                  if (data.evidence || data.formatted_evidence) {
                    console.log('Updating evidence:', data.evidence || data.formatted_evidence);
                    updatedCaseDetails.evidence = data.evidence || data.formatted_evidence;
                  }
                  // Update witnesses
                  if (data.witnesses) {
                    console.log('Updating witnesses:', data.witnesses);
                    updatedCaseDetails.witnesses = data.witnesses;
                  }
                  
                  // Update all at once to trigger re-render
                  console.log('Calling onChange with updated caseDetails:', updatedCaseDetails);
                  onChange('caseDetails', updatedCaseDetails);
                }}
              />
            </div>

            {/* Document Preview - Right */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <PetitionPreview
                formData={formData}
                selectedCaseType={selectedCaseType}
                onHiddenChange={() => {}}
              />
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowAgenticMode(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '0.75rem 1.5rem',
                cursor: 'pointer',
                fontWeight: '600',
                zIndex: 10001,
                fontSize: '0.95rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
              }}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="divorceReason">Additional Notes (Optional)</label>
        <textarea
          id="divorceReason"
          value={formData.caseDetails?.divorceReason || ''}
          onChange={(e) => handleChange('divorceReason', e.target.value)}
          placeholder="Any additional information or specific points you want to mention"
          rows="3"
        />
      </div>
    </>
  );

  const renderContractFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="contractDate">Contract Date *</label>
        <input
          type="date"
          id="contractDate"
          value={formData.caseDetails?.contractDate || ''}
          onChange={(e) => handleChange('contractDate', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="contractAmount">Contract Amount (NPR) *</label>
        <input
          type="number"
          id="contractAmount"
          value={formData.caseDetails?.contractAmount || ''}
          onChange={(e) => handleChange('contractAmount', e.target.value)}
          placeholder="Amount in Nepali Rupees"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="contractType">Type of Contract *</label>
        <input
          type="text"
          id="contractType"
          value={formData.caseDetails?.contractType || ''}
          onChange={(e) => handleChange('contractType', e.target.value)}
          placeholder="e.g., Sale, Service, Lease"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="breachDetails">Breach Details *</label>
        <textarea
          id="breachDetails"
          value={formData.caseDetails?.breachDetails || ''}
          onChange={(e) => handleChange('breachDetails', e.target.value)}
          placeholder="Describe how the contract was breached"
          rows="4"
          required
        />
      </div>
    </>
  );

  const renderPropertyFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="propertyType">Property Type *</label>
        <select
          id="propertyType"
          value={formData.caseDetails?.propertyType || ''}
          onChange={(e) => handleChange('propertyType', e.target.value)}
          required
        >
          <option value="">Select Property Type</option>
          <option value="land">Land</option>
          <option value="house">House</option>
          <option value="apartment">Apartment</option>
          <option value="commercial">Commercial Property</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="propertyLocation">Property Location *</label>
        <input
          type="text"
          id="propertyLocation"
          value={formData.caseDetails?.propertyLocation || ''}
          onChange={(e) => handleChange('propertyLocation', e.target.value)}
          placeholder="Full address of the property"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="propertyValue">Estimated Property Value (NPR) *</label>
        <input
          type="number"
          id="propertyValue"
          value={formData.caseDetails?.propertyValue || ''}
          onChange={(e) => handleChange('propertyValue', e.target.value)}
          placeholder="Estimated value in Nepali Rupees"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="disputeDetails">Dispute Details *</label>
        <textarea
          id="disputeDetails"
          value={formData.caseDetails?.disputeDetails || ''}
          onChange={(e) => handleChange('disputeDetails', e.target.value)}
          placeholder="Describe the property dispute"
          rows="4"
          required
        />
      </div>
    </>
  );

  const renderDebtFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="loanDate">Loan Date *</label>
        <input
          type="date"
          id="loanDate"
          value={formData.caseDetails?.loanDate || ''}
          onChange={(e) => handleChange('loanDate', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="loanAmount">Loan Amount (NPR) *</label>
        <input
          type="number"
          id="loanAmount"
          value={formData.caseDetails?.loanAmount || ''}
          onChange={(e) => handleChange('loanAmount', e.target.value)}
          placeholder="Original loan amount"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="outstandingAmount">Outstanding Amount (NPR) *</label>
        <input
          type="number"
          id="outstandingAmount"
          value={formData.caseDetails?.outstandingAmount || ''}
          onChange={(e) => handleChange('outstandingAmount', e.target.value)}
          placeholder="Amount still owed"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="interestRate">Interest Rate (%)</label>
        <input
          type="number"
          id="interestRate"
          value={formData.caseDetails?.interestRate || ''}
          onChange={(e) => handleChange('interestRate', e.target.value)}
          placeholder="Annual interest rate"
          min="0"
          step="0.1"
        />
      </div>

      <div className="form-group">
        <label htmlFor="dueDate">Due Date *</label>
        <input
          type="date"
          id="dueDate"
          value={formData.caseDetails?.dueDate || ''}
          onChange={(e) => handleChange('dueDate', e.target.value)}
          required
        />
      </div>
    </>
  );

  const renderCompensationFields = () => (
    <>
      <div className="form-group">
        <label htmlFor="incidentDate">Incident Date *</label>
        <input
          type="date"
          id="incidentDate"
          value={formData.caseDetails?.incidentDate || ''}
          onChange={(e) => handleChange('incidentDate', e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="incidentPlace">Incident Place *</label>
        <input
          type="text"
          id="incidentPlace"
          value={formData.caseDetails?.incidentPlace || ''}
          onChange={(e) => handleChange('incidentPlace', e.target.value)}
          placeholder="Location where incident occurred"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="damageType">Type of Damage *</label>
        <select
          id="damageType"
          value={formData.caseDetails?.damageType || ''}
          onChange={(e) => handleChange('damageType', e.target.value)}
          required
        >
          <option value="">Select Damage Type</option>
          <option value="physical">Physical Injury</option>
          <option value="property">Property Damage</option>
          <option value="emotional">Emotional Distress</option>
          <option value="financial">Financial Loss</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="compensationAmount">Compensation Sought (NPR) *</label>
        <input
          type="number"
          id="compensationAmount"
          value={formData.caseDetails?.compensationAmount || ''}
          onChange={(e) => handleChange('compensationAmount', e.target.value)}
          placeholder="Amount of compensation requested"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="incidentDetails">Incident Details *</label>
        <textarea
          id="incidentDetails"
          value={formData.caseDetails?.incidentDetails || ''}
          onChange={(e) => handleChange('incidentDetails', e.target.value)}
          placeholder="Describe what happened and the damages incurred"
          rows="4"
          required
        />
      </div>
    </>
  );

  return (
    <div className="form-section">
      <h3>Case Details - {caseType?.charAt(0).toUpperCase() + caseType?.slice(1)}</h3>
      <p className="section-description">
        {caseType === 'divorce' || caseType === 'divorce-alimony' || caseType === 'divorce-custody' 
          ? 'Use AI to convert your casual description into professional legal Nepali with proper citations'
          : 'Provide details about your case'}
      </p>
      
      {(caseType === 'divorce' || caseType === 'divorce-alimony' || caseType === 'divorce-custody') && renderDivorceFields()}
      {caseType === 'contract' && renderContractFields()}
      {caseType === 'property' && renderPropertyFields()}
      {caseType === 'debt' && renderDebtFields()}
      {caseType === 'compensation' && renderCompensationFields()}
    </div>
  );
}
