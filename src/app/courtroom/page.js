'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Upload, Play, AlertCircle } from 'lucide-react';
import ChatTrial from './chat-trial';
import './courtroom.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function CourtroomSimulator() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  const [country, setCountry] = useState('US');
  const [courtType, setCourtType] = useState('');
  const [state, setState] = useState('');
  const [caseType, setCaseType] = useState('');
  const [plaintiffFile, setPlaintiffFile] = useState(null);
  const [defendantFile, setDefendantFile] = useState(null);

  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState('');
  const [trialData, setTrialData] = useState(null);

  if (loading) {
    return (
      <div className="courtroom-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  const handleStartTrial = async () => {
    // Validate required fields
    const missingFields = [];
    if (!country) missingFields.push('Country');
    if (!courtType) missingFields.push('Court type');
    if (courtType === 'State' && !state) missingFields.push('State');
    if (!caseType) missingFields.push('Case type');
    if (!plaintiffFile) missingFields.push('Plaintiff document');
    if (!defendantFile) missingFields.push('Defendant document');

    if (missingFields.length > 0) {
      setError(`Please complete all fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSimulating(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('country', country);
      formData.append('court_type', courtType);
      formData.append('state', state || 'Federal');
      formData.append('case_type', caseType);
      formData.append('plaintiff_document', plaintiffFile);
      formData.append('defendant_document', defendantFile);

      // Show trial UI immediately with placeholder data
      setTrialData({
        case_title: 'Case Loading...',
        plaintiff_name: 'Plaintiff',
        defendant_name: 'Defendant',
        plaintiff_analysis: {
          opening_statement: 'Loading plaintiff statement...'
        },
        defendant_analysis: {
          opening_statement: 'Loading defendant statement...'
        },
        isLoading: true,
      });

      // Fetch actual data in background
      const response = await fetch(`${API_BASE_URL}/api/courtroom/start-trial`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: Failed to start trial`);
      }

      const data = await response.json();

      // Ensure data has required structure
      const processedData = {
        ...data,
        plaintiff_analysis: data.plaintiff_analysis || {
          opening_statement: 'Your Honor, the plaintiff respectfully submits their case.'
        },
        defendant_analysis: data.defendant_analysis || {
          opening_statement: 'Your Honor, the defendant respectfully denies the allegations.'
        }
      };

      // Update with real data
      setTrialData(processedData);
    } catch (err) {
      console.error('Trial error:', err);
      setError(err.message || 'Error starting trial');
      setTrialData(null);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerateVerdict = async () => {
    // This is now handled in ChatTrial component
  };

  const handleReset = () => {
    setCountry('US');
    setCourtType('');
    setState('');
    setCaseType('');
    setPlaintiffFile(null);
    setDefendantFile(null);
    setError('');
    setTrialData(null);
  };

  // Trial View - Chat Interface
  if (trialData) {
    return <ChatTrial trialData={trialData} onBack={() => setTrialData(null)} />;
  }

  // Main Form
  return (
    <div className="courtroom-page">
      <div className="courtroom-header">
        <button onClick={() => router.push('/dashboard')} className="header-back">
          <ArrowLeft size={20} />
        </button>
        <h1>Courtroom Simulator</h1>
        <div></div>
      </div>

      <div className="courtroom-container">
        <div className="form-content">
          {error && (
            <div className="error-box">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Left Column - Jurisdiction */}
            <div className="form-column">
              <div className="form-section">
                <div className="section-header">
                  <div className="section-number">1</div>
                  <h2 className="section-title">Jurisdiction</h2>
                </div>

                <div>
                  <label className="section-label">Country</label>
                  <div className="button-group">
                    <button
                      onClick={() => setCountry('US')}
                      className={`option-btn ${country === 'US' ? 'active' : ''}`}
                    >
                      <span className="option-radio"></span>
                      <span>🇺🇸 United States</span>
                    </button>
                    <button
                      onClick={() => setCountry('Nepal')}
                      className={`option-btn ${country === 'Nepal' ? 'active' : ''}`}
                    >
                      <span className="option-radio"></span>
                      <span>🇳🇵 Nepal</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="section-label">Court Type</label>
                  <div className="button-group">
                    <button
                      onClick={() => {
                        setCourtType('Federal');
                        setState('');
                      }}
                      className={`option-btn ${courtType === 'Federal' ? 'active' : ''}`}
                    >
                      <span className="option-radio"></span>
                      <span>⚖️ Federal Court</span>
                    </button>
                    <button
                      onClick={() => setCourtType('State')}
                      className={`option-btn ${courtType === 'State' ? 'active' : ''}`}
                    >
                      <span className="option-radio"></span>
                      <span>🏛️ State Court</span>
                    </button>
                  </div>
                </div>

                {courtType === 'State' && (
                  <div>
                    <label className="section-label">State</label>
                    <div className="button-group">
                      {['CA', 'NY', 'TX'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setState(s)}
                          className={`option-btn ${state === s ? 'active' : ''}`}
                        >
                          <span className="option-radio"></span>
                          <span>{s}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="section-label">Case Type</label>
                  <div className="button-group">
                    {['Criminal', 'Civil', 'Family'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setCaseType(type)}
                        className={`option-btn ${caseType === type ? 'active' : ''}`}
                      >
                        <span className="option-radio"></span>
                        <span>{type}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Document Upload */}
            <div className="form-column">
              <div className="form-section">
                <div className="section-header">
                  <div className="section-number">2</div>
                  <h2 className="section-title">Upload Documents</h2>
                </div>

                <p className="section-description">
                  Upload case documents for plaintiff and defendant. The system will extract case details from the documents.
                </p>

                <div className="form-row">
                  <div className="file-input-wrapper">
                    <label className="section-label">Plaintiff Document</label>
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={(e) => setPlaintiffFile(e.target.files[0])}
                      className="file-input"
                      id="plaintiff-file"
                    />
                    <label htmlFor="plaintiff-file" className={`file-label ${plaintiffFile ? 'file-selected' : ''}`}>
                      <div className="file-label-icon">
                        {plaintiffFile ? '✓' : <Upload size={24} />}
                      </div>
                      <div className="file-label-text">
                        {plaintiffFile ? 'File Selected' : 'Upload Document'}
                      </div>
                      <div className="file-label-subtext">
                        {plaintiffFile ? plaintiffFile.name : 'PDF, DOC, DOCX, TXT (Max 10MB)'}
                      </div>
                    </label>
                  </div>

                  <div className="file-input-wrapper">
                    <label className="section-label">Defendant Document</label>
                    <input
                      type="file"
                      accept=".txt,.pdf,.doc,.docx"
                      onChange={(e) => setDefendantFile(e.target.files[0])}
                      className="file-input"
                      id="defendant-file"
                    />
                    <label htmlFor="defendant-file" className={`file-label ${defendantFile ? 'file-selected' : ''}`}>
                      <div className="file-label-icon">
                        {defendantFile ? '✓' : <Upload size={24} />}
                      </div>
                      <div className="file-label-text">
                        {defendantFile ? 'File Selected' : 'Upload Document'}
                      </div>
                      <div className="file-label-subtext">
                        {defendantFile ? defendantFile.name : 'PDF, DOC, DOCX, TXT (Max 10MB)'}
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  onClick={handleStartTrial}
                  disabled={isSimulating}
                  className="btn-start-trial"
                >
                  {isSimulating ? 'Starting Trial...' : 'Start Trial'}
                  <Play size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
