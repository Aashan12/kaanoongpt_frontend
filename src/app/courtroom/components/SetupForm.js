'use client';
import { useState, useRef } from 'react';
import { CheckCircle2, FileText, Loader2, Play, Scale, UploadCloud, X, XCircle } from 'lucide-react';
import KBStatusIndicator from './KBStatusIndicator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
  return { Authorization: `Bearer ${token}` };
}

// Simplified document upload without document type selection
function DocumentUpload({ onFilesChange, setUploadingCount, label }) {
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);

  async function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'docx', 'txt'].includes(ext)) return;

    setFiles((prev) => [...prev, { name: file.name, status: 'uploading', error: '' }]);
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
      setFiles((prev) => prev.map((f) => f.name === file.name ? { ...f, status: 'done' } : f));
      onFilesChange(data.text, file.name);
    } catch (e) {
      setFiles((prev) => prev.map((f) => f.name === file.name ? { ...f, status: 'error', error: e.message } : f));
    } finally {
      setUploadingCount((c) => c - 1);
    }
  }

  function handleFiles(fileList) {
    Array.from(fileList).forEach(processFile);
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
    return <XCircle size={16} />;
  }

  return (
    <div className="doc-upload">
      <div
        className="doc-drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
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
            Drop PDF, DOCX, or TXT files here, or click to upload
            <small>{label} files can include multiple PDF, DOCX, or TXT documents</small>
          </span>
        </div>
      </div>

      {files.length > 0 && (
        <ul className="doc-file-list">
          {files.map((f) => (
            <li key={f.name} className={`doc-file-item doc-file-item--${f.status}`}>
              <span className="doc-file-icon">{renderFileIcon(f.status)}</span>
              <span className="doc-file-name">{f.name}</span>
              {f.status === 'error' && <span className="doc-file-error">{f.error}</span>}
              {f.status !== 'uploading' && (
                <button type="button" className="doc-file-remove" onClick={() => removeFile(f.name)} aria-label={`Remove ${f.name}`}>
                  <X size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SetupForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    case_name: 'Court Session',
    case_type: 'general',
    court_type: 'district',
    court_type_name: 'District Court',
    plaintiff_position: '',
    defendant_position: '',
    mode: 'agent_vs_agent',
    num_rounds: 3,
    model_id: 'default',
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
    if (!form.plaintiff_position.trim()) e.plaintiff_position = 'Upload at least one plaintiff document';
    if (!form.defendant_position.trim()) e.defendant_position = 'Upload at least one defendant document';
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSubmit(form);
  }

  const isUploading = plaintiffUploadCount > 0 || defendantUploadCount > 0;

  return (
    <form className="setup-form" onSubmit={handleSubmit}>
      <div className="setup-form__header">
        <div className="setup-form__title">
          <span className="setup-form__icon"><Scale size={22} /></span>
          <div>
            <h2>New Court Session</h2>
            <span>3-round hearing</span>
          </div>
        </div>
        <KBStatusIndicator />
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
          />
          {form.plaintiff_position && (
            <textarea
              rows={4}
              value={form.plaintiff_position}
              onChange={(e) => setForm((prev) => ({ ...prev, plaintiff_position: e.target.value }))}
              className="doc-extracted-text"
              placeholder="Extracted text will appear here..."
            />
          )}
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
          />
          {form.defendant_position && (
            <textarea
              rows={4}
              value={form.defendant_position}
              onChange={(e) => setForm((prev) => ({ ...prev, defendant_position: e.target.value }))}
              className="doc-extracted-text"
              placeholder="Extracted text will appear here..."
            />
          )}
          {errors.defendant_position && <span className="field-error">{errors.defendant_position}</span>}
        </div>
      </div>

      <div className="setup-actions">
        <div className="setup-actions__state">
          <span className={form.plaintiff_position ? 'complete' : ''}>Plaintiff</span>
          <span className={form.defendant_position ? 'complete' : ''}>Defendant</span>
        </div>
        <button type="submit" className="btn-start" disabled={loading || isUploading}>
          <Play size={17} />
          <span>{loading ? 'Starting...' : isUploading ? 'Processing...' : 'Start 3-Round Hearing'}</span>
        </button>
      </div>
    </form>
  );
}
