'use client';
import { useState, useRef } from 'react';
import { AlertTriangle, CheckCircle2, FileText, Loader2, Play, Scale, UploadCloud, X, XCircle } from 'lucide-react';
import KBStatusIndicator from './KBStatusIndicator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const SAMPLE_PLAINTIFF_TEXT = `[ui-preview-firadpatra.txt]
फिरादी: २८ वर्ष पुगेकी सीता श्रेष्ठ
प्रतिवादी: ३० वर्ष पुगेका आशान नगरकोटी
मुद्दा: सम्बन्ध विच्छेद तथा भरणपोषण
फिरादीले प्रतिवादीबाट घरेलु हिंसा, आर्थिक बेवास्ता, मानसिक यातना र मदिरा सेवनपछि कुटपिट भएको जिकिर गरेकी छन्। सन्तानको सर्वोत्तम हितका लागि बाल संरक्षण र उचित भरणपोषण माग गरिएको छ।`;

const SAMPLE_DEFENDANT_TEXT = `[ui-preview-pratiuttar.txt]
फिरादी: २८ वर्ष पुगेकी सीता श्रेष्ठ
प्रतिवादी: ३० वर्ष पुगेका आशान नगरकोटी
मुद्दा: सम्बन्ध विच्छेद
प्रतिवादीले वैवाहिक सम्बन्ध बिग्रिएको कुरा आंशिक रूपमा स्वीकार गरे पनि हिंसा र आर्थिक बेवास्ताका आरोप अस्वीकार गरेका छन्। प्रतिवादीले वादी आर्थिक रूपमा सक्षम रहेको र विवाहबाह्य सम्बन्धको प्रतिआरोप प्रस्तुत गरेका छन्।`;

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
  return { Authorization: `Bearer ${token}` };
}

// Simplified document upload without document type selection
function DocumentUpload({ onFilesChange, setUploadingCount, label, disabled = true }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);

  async function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) return;

    const uploadMessage = ext === 'pdf'
      ? 'Nepali OCR चल्दैछ। PDF image पढ्दा केही समय लाग्न सक्छ...'
      : 'Document text निकाल्दै...';

    setFiles((prev) => [...prev, { name: file.name, status: 'uploading', error: '', progress: uploadMessage }]);
    setUploadingCount((c) => c + 1);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_URL}/api/courtroom/setup/extract-document`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Extraction failed');
      }
      const data = await res.json();
      if (data.manual_required) {
        setFiles((prev) => prev.map((f) => f.name === file.name
          ? { ...f, status: 'manual', error: data.message || 'Upload DOCX/TXT or paste the correct text below.' }
          : f));
        return;
      }
      setFiles((prev) => prev.map((f) => f.name === file.name
        ? { ...f, status: 'done', warning: data.warning || '' }
        : f));
      onFilesChange(data.text, file.name);
    } catch (e) {
      const message = e.message?.includes('text layer')
        ? 'यो PDF को Nepali text layer बिग्रिएको छ। DOCX/TXT upload गर्नुहोस् वा तल सही text paste गर्नुहोस्।'
        : e.message;
      setFiles((prev) => prev.map((f) => f.name === file.name ? { ...f, status: 'error', error: message } : f));
    } finally {
      setUploadingCount((c) => c - 1);
    }
  }

  function handleFiles(fileList) {
    if (disabled) return;
    Array.from(fileList).reduce(
      (chain, file) => chain.then(() => processFile(file)),
      Promise.resolve()
    );
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }

  function handleChange(e) {
    handleFiles(e.target.files);
    e.target.value = '';
  }

  function removeFile(name) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  function renderFileIcon(status) {
    if (status === 'uploading') return <Loader2 size={16} className="doc-file-spinner" />;
    if (status === 'done') return <CheckCircle2 size={16} />;
    if (status === 'manual') return <AlertTriangle size={16} />;
    return <XCircle size={16} />;
  }

  return (
    <div className="doc-upload">
      <div
        className="doc-drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        aria-disabled={disabled}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          multiple
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <div className="doc-upload__content">
          <UploadCloud size={22} />
          <span className="doc-upload__hint">
            {disabled ? 'Mock mode: paste text below, uploads are disabled' : 'Drop PDF, DOCX, or TXT files here, or click to upload'}
            <small>{disabled ? `${label} upload is skipped in frontend mock mode` : `${label} files can include multiple PDF, DOCX, or TXT documents`}</small>
          </span>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="doc-file-list">
          {files.map((f) => (
            <li key={f.name} className={`doc-file-item doc-file-item--${f.status}`}>
              <span className="doc-file-icon">{renderFileIcon(f.status)}</span>
              <span className="doc-file-name">{f.name}</span>
              {f.status === 'uploading' && <span className="doc-file-progress">{f.progress}</span>}
              {(f.status === 'error' || f.status === 'manual') && <span className="doc-file-error">{f.error}</span>}
              {f.status === 'done' && f.warning && <span className="doc-file-warning">{f.warning}</span>}
              {f.status !== 'uploading' && (
                <button type="button" className="doc-file-remove" onClick={() => removeFile(f.name)} aria-label={`Remove ${f.name}`}>
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="doc-upload-note">
        Nepali PDF बिग्रिएमा trial सुरु नगर्नुहोस्; सही text तल paste गर्नुहोस् वा DOCX/TXT upload गर्नुहोस्।
      </p>
    </div>
  );
}

export default function SetupForm({ onSubmit, loading, mockMode = false }) {
  const [form, setForm] = useState({
    case_name: 'Court Session',
    case_type: 'general',
    court_type: 'district',
    court_type_name: 'District Court',
    plaintiff_position: '',
    defendant_position: '',
    mode: 'agent_vs_agent',
    num_rounds: 1,
    model_id: '',
  });
  const [errors, setErrors] = useState({});
  const [plaintiffUploadCount, setPlaintiffUploadCount] = useState(0);
  const [defendantUploadCount, setDefendantUploadCount] = useState(0);

  function handlePlaintiffDoc(text, filename) {
    const label = `[${filename}]`;
    setForm((prev) => ({
      ...prev,
      plaintiff_position: prev.plaintiff_position
        ? `${prev.plaintiff_position}\n\n${label}\n${text}`
        : `${label}\n${text}`,
    }));
    setErrors((prev) => ({ ...prev, plaintiff_position: '' }));
  }

  function handleDefendantDoc(text, filename) {
    const label = `[${filename}]`;
    setForm((prev) => ({
      ...prev,
      defendant_position: prev.defendant_position
        ? `${prev.defendant_position}\n\n${label}\n${text}`
        : `${label}\n${text}`,
    }));
    setErrors((prev) => ({ ...prev, defendant_position: '' }));
  }

  function validate() {
    const e = {};
    if (!form.plaintiff_position.trim()) e.plaintiff_position = 'Upload or paste at least one plaintiff document';
    if (!form.defendant_position.trim()) e.defendant_position = 'Upload or paste at least one defendant document';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    const payload = {
      ...form,
      num_rounds: 1,
      plaintiff_position: form.plaintiff_position.trim(),
      defendant_position: form.defendant_position.trim(),
    };
    setErrors({});
    onSubmit(payload);
  }

  const isUploading = plaintiffUploadCount > 0 || defendantUploadCount > 0;
  const hasRequiredDocs = Boolean(form.plaintiff_position.trim() && form.defendant_position.trim());

  return (
    <form className="setup-form" onSubmit={handleSubmit}>
      <div className="setup-form__header">
        <div className="setup-form__title">
          <span className="setup-form__icon"><Scale size={22} /></span>
          <div>
            <h2>New Court Session</h2>
            <span>Opening, counter exchange, closing, verdict</span>
          </div>
        </div>
        {mockMode ? <span className="mock-mode-badge">Frontend mock mode</span> : <KBStatusIndicator />}
      </div>

      <div className="setup-doc-grid">
        <div className="form-group form-group--plaintiff">
          <div className="form-group__title">
            <FileText size={17} />
            <label>Plaintiff's Petition <span className="label-required">*</span></label>
          </div>
          <DocumentUpload
            onFilesChange={handlePlaintiffDoc}
            setUploadingCount={setPlaintiffUploadCount}
            label="Plaintiff"
            disabled={mockMode}
          />
          <textarea
            rows={5}
            value={form.plaintiff_position}
            onChange={(e) => setForm((prev) => ({ ...prev, plaintiff_position: e.target.value }))}
            className="doc-extracted-text"
            placeholder={mockMode ? 'UI preview mode: leave empty to use sample फिरादपत्र text.' : 'Extracted text will appear here. If Nepali PDF extraction fails, paste the correct फिरादपत्र text manually or upload DOCX/TXT.'}
          />
          {errors.plaintiff_position && <span className="field-error">{errors.plaintiff_position}</span>}
        </div>

        <div className="form-group form-group--defendant">
          <div className="form-group__title">
            <FileText size={17} />
            <label>Defendant's Response <span className="label-required">*</span></label>
          </div>
          <DocumentUpload
            onFilesChange={handleDefendantDoc}
            setUploadingCount={setDefendantUploadCount}
            label="Defendant"
            disabled={mockMode}
          />
          <textarea
            rows={5}
            value={form.defendant_position}
            onChange={(e) => setForm((prev) => ({ ...prev, defendant_position: e.target.value }))}
            className="doc-extracted-text"
            placeholder={mockMode ? 'UI preview mode: leave empty to use sample प्रतिउत्तरपत्र text.' : 'Extracted text will appear here. If Nepali PDF extraction fails, paste the correct प्रतिउत्तरपत्र text manually or upload DOCX/TXT.'}
          />
          {errors.defendant_position && <span className="field-error">{errors.defendant_position}</span>}
        </div>
      </div>

      <div className="setup-actions">
        <div className="setup-actions__state">
          <span className={form.plaintiff_position ? 'complete' : ''}>Plaintiff</span>
          <span className={form.defendant_position ? 'complete' : ''}>Defendant</span>
        </div>
        <button type="submit" className="btn-start" disabled={loading || isUploading || !hasRequiredDocs}>
          <Play size={17} />
          <span>{loading ? 'Starting...' : isUploading ? 'Processing...' : !hasRequiredDocs ? 'Add documents first' : 'Start Hearing'}</span>
        </button>
      </div>
    </form>
  );
}
