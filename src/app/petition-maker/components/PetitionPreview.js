'use client';

import { useState, useEffect } from 'react';
import { Download, Maximize2 } from 'lucide-react';
import { useNepaliTranslation } from '../../petition-maker/hooks/useNepaliTranslation';
import { convertDigitsToNepali } from '../../petition-maker/utils/englishToNepali';
import { CASE_TYPES } from './CaseTypeSelector';

export default function PetitionPreview({ formData, selectedCaseType, onHiddenChange }) {
  const { courtInfo = {}, plaintiff = {}, defendant = {}, caseDetails = {} } = formData;
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const { queueTranslation, getTranslation } = useNepaliTranslation();

  // Debug: Log when caseDetails changes
  useEffect(() => {
    console.log('PetitionPreview - caseDetails updated:', caseDetails);
    console.log('PetitionPreview - formatted_grounds:', caseDetails?.formatted_grounds);
    console.log('PetitionPreview - legal_basis:', caseDetails?.legal_basis);
    console.log('PetitionPreview - Full formData:', formData);
  }, [caseDetails, formData]);

  // Notify parent when hidden state changes
  useEffect(() => {
    if (onHiddenChange) {
      onHiddenChange(isHidden);
    }
  }, [isHidden, onHiddenChange]);

  // Queue translations when data changes (non-blocking)
  useEffect(() => {
    const fieldsToTranslate = [
      plaintiff.name,
      plaintiff.fatherName,
      plaintiff.grandfatherName,
      plaintiff.addressData?.province,
      plaintiff.addressData?.district,
      plaintiff.addressData?.municipality,
      defendant.name,
      defendant.fatherName,
      defendant.grandfatherName,
      defendant.addressData?.province,
      defendant.addressData?.district,
      defendant.addressData?.municipality,
    ];

    fieldsToTranslate.forEach(field => {
      if (field) queueTranslation(field);
    });
    
    // Queue numeric fields (age, phone, ward) for immediate conversion
    const numericFields = [
      plaintiff.age,
      plaintiff.phone,
      plaintiff.addressData?.ward,
      defendant.age,
      defendant.phone,
      defendant.addressData?.ward,
    ];
    
    numericFields.forEach(field => {
      if (field) queueTranslation(String(field));
    });
  }, [
    plaintiff.name, plaintiff.fatherName, plaintiff.grandfatherName, plaintiff.age, plaintiff.phone,
    plaintiff.addressData?.province, plaintiff.addressData?.district, plaintiff.addressData?.municipality, plaintiff.addressData?.ward,
    defendant.name, defendant.fatherName, defendant.grandfatherName, defendant.age, defendant.phone,
    defendant.addressData?.province, defendant.addressData?.district, defendant.addressData?.municipality, defendant.addressData?.ward,
    queueTranslation
  ]);

  const handleDownloadPDF = () => {
    alert('PDF download coming soon');
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Don't render the hidden state - parent handles it
  if (isHidden) {
    return null;
  }

  // Debug: Log the actual data being used
  console.log('PetitionPreview - Full formData:', formData);
  console.log('PetitionPreview - Plaintiff:', plaintiff);
  console.log('PetitionPreview - Defendant:', defendant);
  console.log('Plaintiff age:', plaintiff.age, '-> Nepali:', convertDigitsToNepali(String(plaintiff.age || '')));
  console.log('Plaintiff phone:', plaintiff.phone, '-> Nepali:', convertDigitsToNepali(String(plaintiff.phone || '')));
  console.log('Defendant age:', defendant.age, '-> Nepali:', convertDigitsToNepali(String(defendant.age || '')));
  console.log('Defendant phone:', defendant.phone, '-> Nepali:', convertDigitsToNepali(String(defendant.phone || '')));

  // Generate paper content with current nepaliNames state
  const getPaperContent = () => (
    <>
      {/* Page 1 */}
      <div className="a4-page">
          {/* Registration Numbers - Right Aligned with space for handwriting */}
          <div className="petition-doc-header">
            <div className="registration-row">
              <span>दर्ता नं :-</span>
              <span className="blank-space"></span>
            </div>
            <div className="registration-row">
              <span>दर्ता मिति :-</span>
              <span className="blank-space"></span>
            </div>
          </div>

          {/* Court Name - Centered, Bold, Bigger */}
          <div className="petition-doc-title">
            <p className="court-line">
              श्री {courtInfo.districtNepali || '_____________'} जिल्ला अदालतमा दायर गरेको,
            </p>
            <h2>फिरादपत्र</h2>
          </div>

          {/* Plaintiff Section - Two Column Layout */}
          <div className="petition-party-section">
            <div className="party-label">
              <p>फिराद पत्र</p>
              <p>प्रस्तुतकर्ता</p>
            </div>
            <div className="party-details-wrapper">
              <div className="party-details">
                <p>
                  {plaintiff.grandfatherName && `${getTranslation(plaintiff.grandfatherName)} ${plaintiff.gender === 'female' ? 'की' : 'को'} ${plaintiff.gender === 'female' ? 'नातिनी' : 'नाती'} `}
                  {plaintiff.fatherName && `${getTranslation(plaintiff.fatherName)} ${plaintiff.gender === 'female' ? 'की' : 'को'} ${plaintiff.gender === 'female' ? 'छोरी' : 'छोरा'} `}
                  {plaintiff.addressData?.province && `${getTranslation(plaintiff.addressData.province)} प्रदेश `}
                  {plaintiff.addressData?.district && `जिल्ला ${getTranslation(plaintiff.addressData.district)} `}
                  {plaintiff.addressData?.municipality && `${getTranslation(plaintiff.addressData.municipality)} `}
                  {plaintiff.addressData?.ward && `वडा नं ${convertDigitsToNepali(String(plaintiff.addressData.ward || ''))} `}
                  बस्ने
                  {plaintiff.age && ` बर्ष ${convertDigitsToNepali(String(plaintiff.age || ''))} ${plaintiff.gender === 'female' ? 'की' : 'को'}`}
                  {plaintiff.name ? ` ${getTranslation(plaintiff.name)}` : ' _______________ '}
                  {plaintiff.phone && ` (मो.न ${convertDigitsToNepali(String(plaintiff.phone || ''))})`}
                </p>
              </div>
              <p className="party-number">.....................१</p>
            </div>
          </div>

          {/* Defendant Section - Two Column Layout */}
          <div className="petition-party-section">
            <div className="party-label">
              <p>विपक्षी</p>
              <p>प्रतिवादी</p>
            </div>
            <div className="party-details-wrapper">
              <div className="party-details">
                <p>
                  {defendant.grandfatherName && `${getTranslation(defendant.grandfatherName)} ${defendant.gender === 'female' ? 'की' : 'को'} ${defendant.gender === 'female' ? 'नातिनी' : 'नाती'} `}
                  {defendant.fatherName && `${getTranslation(defendant.fatherName)} ${defendant.gender === 'female' ? 'की' : 'को'} ${defendant.gender === 'female' ? 'छोरी' : 'छोरा'} `}
                  {defendant.addressData?.province && `${getTranslation(defendant.addressData.province)} प्रदेश `}
                  {defendant.addressData?.district && `जिल्ला ${getTranslation(defendant.addressData.district)} `}
                  {defendant.addressData?.municipality && `${getTranslation(defendant.addressData.municipality)} `}
                  {defendant.addressData?.ward && `वडा नं ${convertDigitsToNepali(String(defendant.addressData.ward || ''))} `}
                  बस्ने
                  {defendant.age && ` बर्ष ${convertDigitsToNepali(String(defendant.age || ''))} ${defendant.gender === 'female' ? 'की' : 'को'}`}
                  {defendant.name ? ` ${getTranslation(defendant.name)}` : ' _______________ '}
                  {defendant.phone && ` (मो.न ${convertDigitsToNepali(String(defendant.phone || ''))})`}
                </p>
              </div>
              <p className="party-number">.....................२</p>
            </div>
          </div>

          {/* Case Type - Centered */}
          <div className="petition-case-type">
            <p>मुद्दा :- {selectedCaseType?.nameNepali || '_____________'} ।</p>
          </div>

          {/* Section 1: Case Details/Facts */}
          <div className="petition-section">
            {caseDetails?.formatted_grounds ? (
              <>
                <p>{caseDetails.formatted_grounds.header}</p>
                {caseDetails.formatted_grounds.grounds.map((ground, index) => (
                  <p key={index} style={{ marginLeft: '1rem', marginTop: index === 0 ? '0.5rem' : '0.3rem' }}>
                    {ground}
                  </p>
                ))}
              </>
            ) : (
              <>
                <p>१. म/हामी यफिरादपत्रवाला निम्न प्रकरणहरूमा लेखिए बमोजिम यफिराद गर्दछु/गर्दछौं । (फिरादको विषयवस्तु/दावी गर्ने आधार र फिराद दावी उल्लेख गर्ने)</p>
                <p style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>(क) _____________________________________________</p>
                <p style={{ marginLeft: '1rem', marginTop: '0.3rem' }}>(ख) _____________________________________________</p>
              </>
            )}
          </div>

          {/* Section 2: Limitation Period */}
          <div className="petition-section">
            {caseDetails?.legal_basis ? (
              <p>{caseDetails.legal_basis}</p>
            ) : (
              <p>३. फिराद गर्न ...... कानून बमोजिम हदम्याद रहेको छ ।</p>
            )}
          </div>

          {/* Section 3: Other Complaints */}
          <div className="petition-section">
            <p>४. प्रस्तुत विषयमा अन्यत्र फिराद गरेको छ/छैन ।</p>
          </div>

          {/* Section 4: Notice Service */}
          <div className="petition-section">
            <p>५. प्रतिवादीलाई आफैंले/कानून व्यवसायी मार्फत/न्यायिक समितिबाट म्याद तामेल गर्ने व्यवस्था गरी पाउँ ।</p>
          </div>

          {/* Section 5: Lawyer Information */}
          <div className="petition-section">
            <p>६. कानून व्यवसायी नियुक्त गरेको भए सोको विवरणः</p>
            <p style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>(क) नाम ........... प्रमाण पत्र नं....... </p>
          </div>

          {/* Section 6: Fees */}
          <div className="petition-section">
            <p>७. देहायको दस्तुर यसैसाथ बुझाउँन ल्याएको छु/छौं ।</p>
            <p style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>(क) _______________ बापत रु. ............</p>
          </div>
        </div>

      {/* Page 2 */}
      <div className="a4-page">
          {/* Section 8: Evidence to Support Claim */}
          <div className="petition-section">
            <p>८. फिरादको दावीलाई पुष्टि गर्ने प्रमाणः–</p>
            <p style={{ marginTop: '0.5rem' }}>यस विषयमा देहायको प्रमाण सम्बन्धी कागजातको प्रतिलिपि संलग्न गरेको छु/छौं ।</p>
            {caseDetails?.evidence && Array.isArray(caseDetails.evidence) && caseDetails.evidence.length > 0 ? (
              caseDetails.evidence.map((item, index) => {
                const nepaliLetters = ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'];
                const letter = index < nepaliLetters.length ? nepaliLetters[index] : index + 1;
                return (
                  <p key={index} style={{ marginLeft: '1rem', marginTop: index === 0 ? '0.5rem' : '0.3rem' }}>
                    ({letter}) {item}
                  </p>
                );
              })
            ) : (
              <>
                <p style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>(क) _______________</p>
                <p style={{ marginLeft: '1rem', marginTop: '0.3rem' }}>(ख) _______________</p>
                <p style={{ marginLeft: '1rem', marginTop: '0.3rem' }}>(ग) _______________</p>
              </>
            )}
          </div>

          {/* Section 9: Witnesses */}
          <div className="petition-section">
            <p>९. साक्षीः-</p>
            {formData.witnesses && formData.witnesses.length > 0 ? (
              formData.witnesses.map((witness, index) => {
                const nepaliLetters = ['क', 'ख', 'ग', 'घ', 'ङ', 'च', 'छ', 'ज', 'झ', 'ञ'];
                const letter = index < nepaliLetters.length ? nepaliLetters[index] : index + 1;
                return (
                  <p key={index} style={{ marginLeft: '1rem', marginTop: index === 0 ? '0.5rem' : '0.3rem' }}>
                    ({letter}) {witness.address && `${witness.address} बस्ने `}
                    {witness.name || '_______________'}
                    {witness.phone && ` (मो.न ${convertDigitsToNepali(String(witness.phone))})`}
                  </p>
                );
              })
            ) : (
              <>
                <p style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>(क) _______________</p>
                <p style={{ marginLeft: '1rem', marginTop: '0.3rem' }}>(ख) _______________</p>
                <p style={{ marginLeft: '1rem', marginTop: '0.3rem' }}>(ग) _______________</p>
              </>
            )}
            <p style={{ marginTop: '0.5rem', fontSize: '9px', fontStyle: 'italic', color: '#666' }}>
              ............................................................................................................ (साक्षीहरूको पूरा नाम, उमेर र ठेगाना उल्लेख गर्ने)
            </p>
          </div>

          {/* Section 10: Oath Statement */}
          <div className="petition-section">
            <p>१०. यसमा लेखिएको व्यहोरा ठीक साँचो छ, झुट्ठा ठहरे कानून बमोजिम सहुँला बुझाउँला ।</p>
          </div>

          {/* Footer with Signature and Date */}
          <div className="petition-footer">
            <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
              ..................................................................
            </p>
            <p style={{ textAlign: 'center', fontSize: '10px' }}>
              फिरादपत्रवालाको दस्तखत र सङ्गठित संस्था भए संस्थाको छाप
            </p>
            <p style={{ marginTop: '1.5rem', fontSize: '10px' }}>
              इति सम्वत्.............साल .........महिना.........गते..........रोज.........शुभम्।।
            </p>
          </div>
        </div>
    </>
  );

  if (isExpanded) {
    return (
      <div className="petition-preview-expanded">
        <div className="expanded-header">
          <h3>फिरादपत्र पूर्वावलोकन</h3>
          <button 
            className="close-expand-btn" 
            onClick={handleExpand}
            title="Close fullscreen"
          >
            ✕
          </button>
        </div>
        <div className="expanded-content">
          {getPaperContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="petition-preview-container">
      <div className="petition-preview-header">
        <h3>फिरादपत्र पूर्वावलोकन</h3>
        <div className="preview-controls">
          <span className="page-counter">Page 1-2 of 2</span>
          <button 
            className="preview-toggle-btn hide" 
            onClick={() => setIsHidden(true)}
            title="Hide preview"
          >
            Hide
          </button>
          <button 
            className="preview-toggle-btn expand" 
            onClick={handleExpand}
            title="Expand to fullscreen"
          >
            <Maximize2 size={16} />
            Expand
          </button>
        </div>
      </div>
      
      <div className="petition-document">
        {getPaperContent()}
      </div>
    </div>
  );
}
