'use client';

import { useState, useEffect } from 'react';
import { FileText, ZoomIn, ZoomOut } from 'lucide-react';
import './PetitionDocumentPreview.css';

export default function PetitionDocumentPreview({ sessionId, petitionData, formData, caseType }) {
  const [zoom, setZoom] = useState(100);

  // Use petitionData if available, otherwise fall back to formData
  const displayData = petitionData || {
    court_name: formData?.courtInfo?.courtName || '',
    plaintiff_name: formData?.plaintiff?.name || '',
    plaintiff_age: formData?.plaintiff?.age || '',
    plaintiff_father: formData?.plaintiff?.fatherName || '',
    plaintiff_grandfather: formData?.plaintiff?.grandfatherName || '',
    plaintiff_phone: formData?.plaintiff?.phone || '',
    plaintiff_address: formData?.plaintiff?.addressData ? 
      `${formData.plaintiff.addressData.district || ''}, ${formData.plaintiff.addressData.municipality || ''}, ${formData.plaintiff.addressData.ward || ''}`.trim() : '',
    defendant_name: formData?.defendant?.name || '',
    defendant_age: formData?.defendant?.age || '',
    defendant_father: formData?.defendant?.fatherName || '',
    defendant_grandfather: formData?.defendant?.grandfatherName || '',
    defendant_phone: formData?.defendant?.phone || '',
    defendant_address: formData?.defendant?.addressData ? 
      `${formData.defendant.addressData.district || ''}, ${formData.defendant.addressData.municipality || ''}, ${formData.defendant.addressData.ward || ''}`.trim() : '',
    case_title: caseType === 'divorce' ? 'सम्बन्ध विच्छेद (Divorce)' : 
                caseType === 'divorce-custody' ? 'सम्बन्ध विच्छेद र सन्तान संरक्षण' :
                caseType === 'divorce-alimony' ? 'सम्बन्ध विच्छेद र भरणपोषण' : 'सम्बन्ध विच्छेद',
    marriage_date: formData?.caseDetails?.marriageDate || '',
    marriage_place: formData?.caseDetails?.marriagePlace || '',
    children_count: formData?.caseDetails?.children || '0',
  };

  const renderField = (value, placeholder = '_____________') => {
    if (value && value.trim()) {
      return <span className="filled-field">{value}</span>;
    }
    return <span className="blank-field">{placeholder}</span>;
  };

  const renderSection = (content, isFilled = false) => {
    const className = isFilled ? 'petition-section section-filled' : 'petition-section section-empty';
    return <div className={className}>{content || 'यो खण्ड भरिने बाँकी छ...'}</div>;
  };

  return (
    <div className="petition-preview-container">
      <div className="preview-header">
        <h3>
          <FileText size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
          Document Preview
        </h3>
        <div className="preview-actions">
          <button onClick={() => setZoom(Math.max(50, zoom - 10))}>
            <ZoomOut size={14} />
          </button>
          <span style={{ padding: '0 0.5rem' }}>{zoom}%</span>
          <button onClick={() => setZoom(Math.min(150, zoom + 10))}>
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      <div className="preview-content" style={{ fontSize: `${zoom}%` }}>
        <div className="petition-document">
          {/* Document Header */}
          <div className="document-header">
            <div>दर्ता नं :- {renderField(displayData?.registration_number)}</div>
            <div>दर्ता मिति :- {renderField(displayData?.registration_date)}</div>
          </div>

          {/* Title */}
          <div className="document-title">
            <div>श्री {renderField(displayData?.court_name, 'काठमाडौं जिल्ला अदालत')}मा दायर गरेको,</div>
            <h2>फिरादपत्र</h2>
            <div className="underline">________</div>
          </div>

          {/* Plaintiff Section */}
          <div className="party-section">
            <div className="party-label">फिराद पत्र<br />प्रस्तुतकर्ता</div>
            <div className="party-details">
              {displayData?.plaintiff_full_address || (
                <>
                  नाती {renderField(displayData?.plaintiff_grandfather)}को छोरा{' '}
                  {renderField(displayData?.plaintiff_father)}को छोरा{' '}
                  {renderField(displayData?.plaintiff_address)}{' '}
                  बर्ष {renderField(displayData?.plaintiff_age)} को{' '}
                  {renderField(displayData?.plaintiff_name)}
                  <br />
                  (मो.न {renderField(displayData?.plaintiff_phone)})
                  <br />
                  .....................१
                </>
              )}
            </div>
          </div>

          {/* Defendant Section */}
          <div className="party-section">
            <div className="party-label">विपक्षी<br />प्रतिवादी</div>
            <div className="party-details">
              {displayData?.defendant_full_address || (
                <>
                  नाती {renderField(displayData?.defendant_grandfather)}को छोरी{' '}
                  {renderField(displayData?.defendant_father)}को छोरी{' '}
                  {renderField(displayData?.defendant_address)}{' '}
                  अ. बर्ष {renderField(displayData?.defendant_age)} की{' '}
                  {renderField(displayData?.defendant_name)}
                  <br />
                  .................१
                </>
              )}
            </div>
          </div>

          {/* Case Title */}
          <div className="case-title">
            मुद्दा :- {renderField(displayData?.case_title, 'सम्बन्ध विच्छेद (Divorce)')} ।
          </div>

          {/* Main Petition Content */}
          {displayData?.grounds && displayData.grounds.length > 0 ? (
            displayData.grounds.map((ground, index) => (
              <div key={index}>
                {renderSection(ground, true)}
              </div>
            ))
          ) : (
            <>
              {renderSection('१. म फिरादी र प्रतिवादी बीच मिति _____ साल _____ गते विवाह भएको थियो...', false)}
              {renderSection('२. विवाह पश्चात...', false)}
              {renderSection('३. मिति _____ गते...', false)}
            </>
          )}

          {/* Legal Basis */}
          {renderSection(
            displayData?.legal_basis || '३. यो फिराद गर्न मुलुकी देवानी संहिता २०७४ को दफा ९४ बमोजिम हदम्याद रहेको छ ।',
            !!displayData?.legal_basis
          )}

          {/* Other Sections */}
          {renderSection('४. प्रस्तुत विषयमा अन्यत्र उजुर गरेको छैन ।', true)}
          {renderSection('५. प्रतिवादीहरुलाई अदालतबाट म्याद तामेल गर्न व्यवस्था गरी पाऊ ।', true)}
          {renderSection('६. हाल कानुन व्यवस्थामै मुकुरर गरेको छैन ।', true)}

          {/* Court Fees */}
          <div className="petition-section">
            <div>७. देहायको दस्तुर चसै साथ सुकाउन त्यापेको छु ।</div>
            <div style={{ marginLeft: '2rem' }}>
              <div>क) यो फिराद पत्र दर्ता गर्न मुलुकी देवानी कार्यविधि संहिता २०७४ को दफा २०५, २०६, २११ बमोजिम लाग्ने अदालती शुल्क रु.१,५००/- र ऐ संहिताको दफा ५६ बमोजिम लाग्ने फिराद दस्तुर रु.३००। यसै साथ छ ।</div>
            </div>
          </div>

          {/* Evidence */}
          <div className="petition-section">
            <div>८. यस विषयमा देहायको प्रमाण सम्बन्धी कागजातको प्रतिलिपि संलग्न गरेको छु ।</div>
            {displayData?.evidence && displayData.evidence.length > 0 ? (
              <div style={{ marginLeft: '2rem' }}>
                {displayData.evidence.map((item, index) => (
                  <div key={index} className="section-filled">
                    {String.fromCharCode(2325 + index)}) {item}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginLeft: '2rem', color: '#999' }}>
                <div>क) _______________</div>
                <div>ख) _______________</div>
              </div>
            )}
          </div>

          {/* Witnesses */}
          <div className="petition-section">
            <div>९. साक्षी :-</div>
            {displayData?.witnesses && displayData.witnesses.length > 0 ? (
              <div style={{ marginLeft: '2rem' }}>
                {displayData.witnesses.map((witness, index) => (
                  <div key={index} className="section-filled">
                    {index + 1}) {witness}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ marginLeft: '2rem', color: '#999' }}>
                <div>१) _______________</div>
                <div>२) _______________</div>
              </div>
            )}
          </div>

          {/* Truth Statement */}
          {renderSection('१०. सत्यता लेखिएको व्यहोरा ठिक छ, झुठा ठहरे कानुन बमोजिम सहुला बुझाउला ।', true)}

          {/* Signature */}
          <div className="signature-section">
            <div>फिरादपत्र प्रस्तुतकर्ता</div>
            <div>निज {renderField(displayData?.plaintiff_name)} ।</div>
          </div>

          {/* Date */}
          <div className="date-section">
            इति सम्बत {renderField(displayData?.submission_date)} गते रोज {renderField(displayData?.submission_day)} मा शुभम् ................................
          </div>
        </div>
      </div>
    </div>
  );
}
