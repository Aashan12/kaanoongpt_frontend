'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, ChevronRight, ChevronLeft, Sun, Moon } from 'lucide-react';
import CaseTypeSelector, { CASE_TYPES } from './components/CaseTypeSelector';
import ProgressBar from './components/ProgressBar';
import CourtInfo from './components/FormSections/CourtInfo';
import PlaintiffInfo from './components/FormSections/PlaintiffInfo';
import DefendantInfo from './components/FormSections/DefendantInfo';
import CaseDetails from './components/FormSections/CaseDetails';
import WitnessSection from './components/FormSections/WitnessSection';
import PetitionPreview from './components/PetitionPreview';
import './petition-maker.css';

export default function PetitionMaker() {
  const { user, loading, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCaseType, setSelectedCaseType] = useState(null);
  const [formData, setFormData] = useState({
    courtInfo: {},
    plaintiff: {},
    defendant: {},
    caseDetails: {},
    witnesses: [],
    evidence: []
  });

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated || !user) {
      router.push('/auth/login');
      return;
    }
    setShouldRender(true);
  }, [isAuthenticated, loading, user, router]);

  const handleCaseTypeSelect = (caseType) => {
    setSelectedCaseType(caseType);
  };

  const handleFormChange = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
  };

  // Get the full case type object for preview
  const getSelectedCaseTypeObject = () => {
    if (!selectedCaseType) return null;
    return CASE_TYPES.find(ct => ct.id === selectedCaseType);
  };

  const handleGeneratePDF = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/petition/agentic/generate-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          formData: formData,
          caseType: getSelectedCaseTypeObject(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `firadpatra_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const handleNext = () => {
    if (currentStep === 1 && !selectedCaseType) {
      alert('Please select a case type');
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  if (loading) {
    return (
      <div className="petition-loading">
        <div className="petition-loading-text">Loading...</div>
      </div>
    );
  }

  if (!shouldRender || !user) return null;

  return (
    <div className="petition-maker">
      {/* Header */}
      <header className="petition-header">
        <div className="petition-header-left">
          <button className="petition-back-btn" onClick={() => router.push('/dashboard')}>
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
        </div>
        <div className="petition-header-center">
          <h1 className="petition-title">Petition Maker</h1>
          <p className="petition-subtitle">Generate court-ready firad patra for civil cases</p>
        </div>
        <div className="petition-header-right">
          <button className="petition-theme-toggle" onClick={toggleTheme} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="petition-progress-container">
        <ProgressBar currentStep={currentStep} />
      </div>

      {/* Main Content */}
      <main className="petition-main">
        <div className="petition-content">
          {/* Step 1: Case Type Selection */}
          {currentStep === 1 && (
            <CaseTypeSelector
              onSelect={handleCaseTypeSelect}
              selectedType={selectedCaseType}
            />
          )}

          {/* Step 2: Court Info */}
          {currentStep === 2 && (
            <CourtInfo
              formData={formData}
              onChange={handleFormChange}
            />
          )}

          {/* Step 3: Parties (Plaintiff & Defendant) */}
          {currentStep === 3 && (
            <>
              <PlaintiffInfo
                formData={formData}
                onChange={handleFormChange}
              />
              <DefendantInfo
                formData={formData}
                onChange={handleFormChange}
              />
            </>
          )}

          {/* Step 4: Case Details */}
          {currentStep === 4 && (
            <CaseDetails
              formData={formData}
              onChange={handleFormChange}
              caseType={selectedCaseType}
            />
          )}

          {/* Step 5: Witnesses */}
          {currentStep === 5 && (
            <div className="petition-step-with-preview">
              <div className="petition-form-column">
                <WitnessSection
                  formData={formData}
                  onChange={handleFormChange}
                />
              </div>
              <div className="petition-preview-column">
                <PetitionPreview
                  formData={formData}
                  selectedCaseType={getSelectedCaseTypeObject()}
                  onHiddenChange={() => {}}
                />
              </div>
            </div>
          )}

          {/* Step 6: Review - Final Step with Actions */}
          {currentStep === 6 && (
            <div className="petition-review" key="review-step">
              <div className="review-header">
                <div>
                  <h2>Review Your Petition</h2>
                  <p>Review your complete petition document before downloading</p>
                </div>
                <div className="review-actions">
                  <button 
                    className="petition-btn petition-btn-secondary"
                    onClick={() => setCurrentStep(1)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    ✏️ Edit Petition
                  </button>
                  <button 
                    className="petition-btn petition-btn-primary"
                    onClick={handleGeneratePDF}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    📄 Save as PDF
                  </button>
                </div>
              </div>
              <PetitionPreview
                formData={formData}
                selectedCaseType={getSelectedCaseTypeObject()}
                onHiddenChange={() => {}}
              />
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="petition-nav-buttons">
          {currentStep > 1 && currentStep < 6 && (
            <button className="petition-btn petition-btn-secondary" onClick={handleBack}>
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <div className="petition-nav-spacer" />
          {currentStep < 6 && (
            <button className="petition-btn petition-btn-primary" onClick={handleNext}>
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
