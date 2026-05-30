'use client';

import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import CaseTypeSelector, { CASE_TYPES } from '../../petition-maker/components/CaseTypeSelector';
import ProgressBar from '../../petition-maker/components/ProgressBar';
import CourtInfo from '../../petition-maker/components/FormSections/CourtInfo';
import PlaintiffInfo from '../../petition-maker/components/FormSections/PlaintiffInfo';
import DefendantInfo from '../../petition-maker/components/FormSections/DefendantInfo';
import CaseDetails from '../../petition-maker/components/FormSections/CaseDetails';
import WitnessSection from '../../petition-maker/components/FormSections/WitnessSection';
import PetitionPreview from '../../petition-maker/components/PetitionPreview';
import '../../petition-maker/petition-maker.css';
import '../../petition-maker/components/PetitionPreview.css';

export default function PetitionView() {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCaseType, setSelectedCaseType] = useState(null);
  const [isPreviewHidden, setIsPreviewHidden] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    courtInfo: {},
    plaintiff: {},
    defendant: {},
    caseDetails: {},
    witnesses: [],
    evidence: []
  });

  const handleCaseTypeSelect = (caseType) => {
    setSelectedCaseType(caseType);
  };

  const handleFormChange = (section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }));
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

  // Get the full case type object for preview
  const getSelectedCaseTypeObject = () => {
    if (!selectedCaseType) return null;
    return CASE_TYPES.find(ct => ct.id === selectedCaseType);
  };

  // Generate and download PDF
  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Get all A4 pages
      const pages = document.querySelectorAll('.a4-page');
      if (!pages || pages.length === 0) {
        alert('Document not found');
        setIsGeneratingPDF(false);
        return;
      }

      // Create PDF with A4 dimensions (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        // Convert page to canvas
        const canvas = await html2canvas(page, {
          scale: 2, // Higher quality
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        // Calculate dimensions to fit A4
        const imgWidth = 210; // A4 width in mm
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        // Add new page if not first page
        if (i > 0) {
          pdf.addPage();
        }

        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      }

      // Download the PDF
      const fileName = `firadpatra_${new Date().getTime()}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Save petition to database and Cloudinary
  const handleSavePetition = async () => {
    setIsSaving(true);
    
    try {
      // Get all A4 pages
      const pages = document.querySelectorAll('.a4-page');
      if (!pages || pages.length === 0) {
        alert('Document not found');
        setIsSaving(false);
        return;
      }

      // Create PDF with A4 dimensions
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true
      });

      // Process each page
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i];
        
        const canvas = await html2canvas(page, {
          scale: 1.5, // Reduced from 2 to 1.5 for smaller file size
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });

        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (i > 0) {
          pdf.addPage();
        }

        // Use JPEG with compression instead of PNG for smaller file size
        const imgData = canvas.toDataURL('image/jpeg', 0.85); // 85% quality
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
      }

      // Convert PDF to base64
      const pdfBase64 = pdf.output('datauristring').split(',')[1];

      // Get case type object
      const caseTypeObj = getSelectedCaseTypeObject();

      // Send to backend
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/kanoongpt/petition/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          case_type: selectedCaseType,
          case_type_nepali: caseTypeObj?.nameNepali,
          petition_data: formData,
          pdf_base64: pdfBase64
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save petition');
      }

      const data = await response.json();
      alert(`Petition saved successfully!\nPDF URL: ${data.pdf_url}`);
      
    } catch (error) {
      console.error('Error saving petition:', error);
      alert('Failed to save petition. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="petition-view">
      {/* Progress Bar at Top */}
      <div className="petition-progress-container">
        <ProgressBar currentStep={currentStep} />
        {currentStep > 1 && currentStep < 6 && (
          <button 
            className={`preview-toggle-btn-header ${isPreviewHidden ? 'show' : 'hide'}`}
            onClick={() => setIsPreviewHidden(!isPreviewHidden)}
            title={isPreviewHidden ? 'Show preview' : 'Hide preview'}
          >
            {isPreviewHidden ? 'Preview' : 'Hide'}
          </button>
        )}
      </div>

      {/* Main Content */}
      <main className="petition-main">
        <div className={`petition-content-wrapper ${currentStep > 1 && currentStep < 6 && !isPreviewHidden ? 'split-view' : 'full-width'}`}>
          {/* Left Side - Form */}
          <div className="petition-content">
            {currentStep === 1 && (
              <CaseTypeSelector
                onSelect={handleCaseTypeSelect}
                selectedType={selectedCaseType}
              />
            )}

            {currentStep === 2 && (
              <CourtInfo
                formData={formData}
                onChange={handleFormChange}
              />
            )}

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

            {currentStep === 4 && (
              <CaseDetails
                formData={formData}
                onChange={handleFormChange}
                caseType={selectedCaseType}
              />
            )}

            {currentStep === 5 && (
              <WitnessSection
                formData={formData}
                onChange={handleFormChange}
              />
            )}

            {currentStep === 6 && (
              <div className="petition-review-fullscreen">
                {/* Action Buttons */}
                <div className="review-actions-bar">
                  <button 
                    className="petition-btn petition-btn-secondary"
                    onClick={() => setCurrentStep(1)}
                  >
                    ✏️ Edit Petition
                  </button>
                  <button 
                    className="petition-btn petition-btn-primary"
                    onClick={handleSavePetition}
                    disabled={isSaving}
                    style={{ 
                      opacity: isSaving ? 0.7 : 1,
                      cursor: isSaving ? 'wait' : 'pointer',
                      background: '#10b981'
                    }}
                  >
                    {isSaving ? '💾 Saving...' : '💾 Save Firadpatra'}
                  </button>
                  <button 
                    className="petition-btn petition-btn-primary"
                    onClick={handleDownloadPDF}
                    disabled={isGeneratingPDF}
                    style={{ 
                      opacity: isGeneratingPDF ? 0.7 : 1,
                      cursor: isGeneratingPDF ? 'wait' : 'pointer'
                    }}
                  >
                    {isGeneratingPDF ? '⏳ Generating...' : '📄 Download PDF'}
                  </button>
                </div>
                
                {/* Full Document - Scrollable */}
                <div className="review-document-container">
                  <PetitionPreview 
                    formData={formData}
                    selectedCaseType={getSelectedCaseTypeObject()}
                    onHiddenChange={() => {}}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Side - Live Preview (only show from step 2 to 5, not in step 6) */}
          {currentStep > 1 && currentStep < 6 && !isPreviewHidden && (
            <PetitionPreview 
              formData={formData}
              selectedCaseType={getSelectedCaseTypeObject()}
              onHiddenChange={setIsPreviewHidden}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="petition-nav-buttons">
          {currentStep > 1 && (
            <button className="petition-btn petition-btn-secondary" onClick={handleBack}>
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <div className="petition-nav-spacer" />
          {currentStep < 6 && (
            <button 
              className="petition-btn petition-btn-primary" 
              onClick={handleNext}
              disabled={currentStep === 1 && !selectedCaseType}
              style={{
                opacity: currentStep === 1 && !selectedCaseType ? 0.5 : 1,
                cursor: currentStep === 1 && !selectedCaseType ? 'not-allowed' : 'pointer'
              }}
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
