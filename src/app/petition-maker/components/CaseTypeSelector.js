'use client';

import { FileText, FileSignature, Home, DollarSign, AlertCircle } from 'lucide-react';

const CASE_TYPES = [
  {
    id: 'divorce',
    name: 'Divorce',
    nameNepali: 'सम्बन्ध विच्छेद',
    description: 'File for dissolution of marriage under Nepal Civil Code',
    icon: FileText,
    color: '#ef4444',
    reasons: [
      { id: 1, text: 'Cruelty or inhuman treatment', nepali: 'क्रूरता वा अमानवीय व्यवहार' },
      { id: 2, text: 'Adultery', nepali: 'व्यभिचार' },
      { id: 3, text: 'Abandonment for more than 4 years', nepali: '४ वर्षभन्दा बढी समयको लागि परित्याग' },
      { id: 4, text: 'Incurable disease or mental disorder', nepali: 'असाध्य रोग वा मानसिक विकार' },
      { id: 5, text: 'Mutual consent', nepali: 'पारस्परिक सहमति' },
    ],
  },
  {
    id: 'divorce-alimony',
    name: 'Divorce & Alimony',
    nameNepali: 'सम्बन्ध विच्छेद तथा भरणपोषण',
    description: 'File for divorce with alimony/maintenance claim',
    icon: FileText,
    color: '#dc2626',
    reasons: [
      { id: 1, text: 'Cruelty or inhuman treatment', nepali: 'क्रूरता वा अमानवीय व्यवहार' },
      { id: 2, text: 'Adultery', nepali: 'व्यभिचार' },
      { id: 3, text: 'Abandonment for more than 4 years', nepali: '४ वर्षभन्दा बढी समयको लागि परित्याग' },
      { id: 4, text: 'Incurable disease or mental disorder', nepali: 'असाध्य रोग वा मानसिक विकार' },
      { id: 5, text: 'Mutual consent', nepali: 'पारस्परिक सहमति' },
    ],
  },
  {
    id: 'divorce-custody',
    name: 'Divorce & Child Custody',
    nameNepali: 'सम्बन्ध विच्छेद तथा बाल संरक्षण',
    description: 'File for divorce with child custody claim',
    icon: FileText,
    color: '#b91c1c',
    reasons: [
      { id: 1, text: 'Cruelty or inhuman treatment', nepali: 'क्रूरता वा अमानवीय व्यवहार' },
      { id: 2, text: 'Adultery', nepali: 'व्यभिचार' },
      { id: 3, text: 'Abandonment for more than 4 years', nepali: '४ वर्षभन्दा बढी समयको लागि परित्याग' },
      { id: 4, text: 'Incurable disease or mental disorder', nepali: 'असाध्य रोग वा मानसिक विकार' },
      { id: 5, text: 'Mutual consent', nepali: 'पारस्परिक सहमति' },
    ],
  },
  {
    id: 'contract',
    name: 'Contract Dispute',
    nameNepali: 'सम्झौता विवाद',
    description: 'Resolve disputes arising from breach of contract or agreement',
    icon: FileSignature,
    color: '#3b82f6',
  },
  {
    id: 'property',
    name: 'Property Dispute',
    nameNepali: 'जग्गा विवाद',
    description: 'Settle land ownership, boundary, or inheritance disputes',
    icon: Home,
    color: '#10b981',
  },
  {
    id: 'debt',
    name: 'Debt Recovery',
    nameNepali: 'ऋण असुली',
    description: 'Recover unpaid loans, debts, or financial obligations',
    icon: DollarSign,
    color: '#f59e0b',
  },
  {
    id: 'compensation',
    name: 'Compensation',
    nameNepali: 'क्षतिपूर्ति',
    description: 'Claim damages for injury, loss, or harm caused by another party',
    icon: AlertCircle,
    color: '#8b5cf6',
  },
];

export default function CaseTypeSelector({ onSelect, selectedType }) {
  return (
    <div className="case-type-selector">
      <div className="case-type-header">
        <h2>Select Case Type</h2>
        <p>Choose the type of civil case for your petition</p>
      </div>

      <div className="case-type-grid">
        {CASE_TYPES.map((caseType) => {
          const Icon = caseType.icon;
          const isSelected = selectedType === caseType.id;

          return (
            <div
              key={caseType.id}
              className={`case-type-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelect(caseType.id)}
              style={{
                '--case-color': caseType.color,
              }}
            >
              <div className="case-type-icon">
                <Icon size={32} />
              </div>
              <h3>{caseType.name}</h3>
              <p className="case-type-nepali">{caseType.nameNepali}</p>
              <p className="case-type-description">{caseType.description}</p>
              {isSelected && (
                <div className="case-type-selected-badge">Selected</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { CASE_TYPES };
