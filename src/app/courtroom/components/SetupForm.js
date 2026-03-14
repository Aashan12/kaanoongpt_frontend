'use client';
import { useState, useEffect, useRef } from 'react';
import KBStatusIndicator from './KBStatusIndicator';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function authHeaders() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : '';
  return { Authorization: `Bearer ${token}` };
}

const DOC_TYPES = [
  'Charge Sheet / FIR',
  'Contract / Agreement',
  'Medical Report',
  'Property Document',
  'Witness Statement',
  'Evidence Exhibit',
  'Defense Statement',
  'Counter-Evidence',
  'Alibi Document',
  'Other',
];

// Multi-document upload — document type required, multiple files allowed
function DocumentUpload({ onFilesChange, setUploadingCount }) {
  const inputRef = useRef(null);
  const [docType, setDocType] = useState('');
  const [docTypeError, setDocTypeError] = useState('');
  const [files, setFiles] = useState([]);

  async function processFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'txt'].includes(ext)) return;

    setFiles((prev) => [...prev, { name: file.name, type: docType, status: 'uploading', error: '' }]);
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
      onFilesChange(data.text, file.name, docType);
    } catch (e) {
      setFiles((prev) => prev.map((f) => f.name === file.name ? { ...f, status: 'error', error: e.message } : f));
    } finally {
      setUploadingCount((c) => c - 1);
    }
  }

  function handleFiles(fileList) {
    if (!docType) { setDocTypeError('Select a document type before uploading'); return; }
    setDocTypeError('');
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

  return (
    <div className="doc-upload">
      <div className="doc-upload__type-row">
        <select
          className={`doc-type-select ${docTypeError ? 'input-error' : ''}`}
          value={docType}
          onChange={(e) => { setDocType(e.target.value); setDocTypeError(''); }}
        >
          <option value="">Select document type *</option>
          {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        {docTypeError && <span className="field-error">{docTypeError}</span>}
      </div>

      <div
        className="doc-drop-zone"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          multiple
          style={{ display: 'none' }}
          onChange={handleChange}
        />
        <span className="doc-upload__hint">
          📎 Drop PDF or TXT files here, or click to upload
          <br />
          <small>Multiple files allowed</small>
        </span>
      </div>

      {files.length > 0 && (
        <ul className="doc-file-list">
          {files.map((f) => (
            <li key={f.name} className={`doc-file-item doc-file-item--${f.status}`}>
              <span className="doc-file-icon">
                {f.status === 'uploading' ? '⏳' : f.status === 'done' ? '✅' : '❌'}
              </span>
              {f.type && <span className="doc-file-type">{f.type}</span>}
              <span className="doc-file-name">{f.name}</span>
              {f.status === 'error' && <span className="doc-file-error">{f.error}</span>}
              {f.status !== 'uploading' && (
                <button type="button" className="doc-file-remove" onClick={() => removeFile(f.name)}>×</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function SetupForm({ onSubmit, loading }) {
  const [caseTypes, setCaseTypes] = useState([]);
  const [courtTypes, setCourtTypes] = useState([]);
  const [chatModels, setChatModels] = useState([]);
  const [form, setForm] = useState({
    case_name: '',
    case_type: '',
    court_type: '',
    court_type_name: '',
    plaintiff_position: '',
    defendant_position: '',
    mode: 'agent_vs_agent',
    num_rounds: 3,
    model_id: '',
  });
  const [errors, setErrors] = useState({});
  const [plaintiffUploadCount, setPlaintiffUploadCount] = useState(0);
  const [defendantUploadCount, setDefendantUploadCount] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/courtroom/setup/case-types`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setCaseTypes(d.case_types || []))
      .catch(() => {});

    fetch(`${API_URL}/api/courtroom/setup/court-types`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => setCourtTypes(d.court_types || []))
      .catch(() => {});

    fetch(`${API_URL}/api/courtroom/setup/chat-models`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((d) => {
        const models = d.models || [];
        setChatModels(models);
        // Auto-select first model
        if (models.length > 0) {
          setForm((prev) => ({ ...prev, model_id: models[0].id }));
        }
      })
      .catch(() => {});
  }, []);

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  }

  function handlePlaintiffDoc(text, filename, docType) {
    const label = docType ? `[${docType}: ${filename}]` : `[Document: ${filename}]`;
    setForm((prev) => ({
      ...prev,
      plaintiff_position: prev.plaintiff_position
        ? `${prev.plaintiff_position}\n\n${label}\n${text}`
        : `${label}\n${text}`,
    }));
    setErrors((prev) => ({ ...prev, plaintiff_position: '' }));
  }

  function handleDefendantDoc(text, filename, docType) {
    const label = docType ? `[${docType}: ${filename}]` : `[Document: ${filename}]`;
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
    if (!form.case_name.trim()) e.case_name = 'Case name is required';
    if (!form.case_type) e.case_type = 'Select a case type';
    if (!form.court_type) e.court_type = 'Select a court type';
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

  function selectCourtType(ct) {
    set('court_type', ct.id || ct._id || ct.code || ct.name);
    set('court_type_name', ct.name);
  }

  const isUploading = plaintiffUploadCount > 0 || defendantUploadCount > 0;

  return (
    <form className="setup-form" onSubmit={handleSubmit}>
      <div className="setup-form__header">
        <h2>New Trial</h2>
        <KBStatusIndicator />
      </div>

      <div className="form-group">
        <label>Case Name</label>
        <input
          type="text"
          placeholder="e.g. Smith v. Johnson — Contract Dispute"
          value={form.case_name}
          onChange={(e) => set('case_name', e.target.value)}
          className={errors.case_name ? 'input-error' : ''}
        />
        {errors.case_name && <span className="field-error">{errors.case_name}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Case Type</label>
          <div className="chip-group">
            {caseTypes.length === 0 && <span className="no-data">No case types configured</span>}
            {caseTypes.map((ct) => (
              <button
                key={ct._id || ct.id || ct.name}
                type="button"
                className={`chip ${form.case_type === (ct._id || ct.id || ct.name) ? 'chip--active' : ''}`}
                onClick={() => set('case_type', ct._id || ct.id || ct.name)}
              >
                {ct.name}
              </button>
            ))}
          </div>
          {errors.case_type && <span className="field-error">{errors.case_type}</span>}
        </div>

        <div className="form-group">
          <label>Court Type</label>
          <select
            value={form.court_type}
            onChange={(e) => {
              const ct = courtTypes.find((c) => (c._id || c.id || c.name) === e.target.value);
              if (ct) selectCourtType(ct);
            }}
            className={errors.court_type ? 'input-error' : ''}
          >
            <option value="">Select court type...</option>
            {courtTypes.map((ct) => (
              <option key={ct._id || ct.id || ct.name} value={ct._id || ct.id || ct.name}>
                {ct.name}
              </option>
            ))}
          </select>
          {errors.court_type && <span className="field-error">{errors.court_type}</span>}
        </div>
      </div>

      <div className="form-group">
        <label>Plaintiff Documents <span className="label-required">*</span></label>
        <DocumentUpload
          onFilesChange={handlePlaintiffDoc}
          uploadingCount={plaintiffUploadCount}
          setUploadingCount={setPlaintiffUploadCount}
        />
        {form.plaintiff_position && (
          <textarea
            rows={3}
            value={form.plaintiff_position}
            onChange={(e) => set('plaintiff_position', e.target.value)}
            className="doc-extracted-text"
          />
        )}
        {errors.plaintiff_position && <span className="field-error">{errors.plaintiff_position}</span>}
      </div>

      <div className="form-group">
        <label>Defendant Documents <span className="label-required">*</span></label>
        <DocumentUpload
          onFilesChange={handleDefendantDoc}
          uploadingCount={defendantUploadCount}
          setUploadingCount={setDefendantUploadCount}
        />
        {form.defendant_position && (
          <textarea
            rows={3}
            value={form.defendant_position}
            onChange={(e) => set('defendant_position', e.target.value)}
            className="doc-extracted-text"
          />
        )}
        {errors.defendant_position && <span className="field-error">{errors.defendant_position}</span>}
      </div>

      {chatModels.length > 0 && (
        <div className="form-group">
          <label>AI Model</label>
          <select
            value={form.model_id}
            onChange={(e) => set('model_id', e.target.value)}
          >
            {chatModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.model_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-row">
        <div className="form-group">
          <label>Mode</label>          <div className="mode-toggle">
            <button
              type="button"
              className={`mode-btn ${form.mode === 'agent_vs_agent' ? 'mode-btn--active' : ''}`}
              onClick={() => set('mode', 'agent_vs_agent')}
            >
              🤖 Agent vs Agent
            </button>
            <button
              type="button"
              className={`mode-btn ${form.mode === 'human_vs_agent' ? 'mode-btn--active' : ''}`}
              onClick={() => set('mode', 'human_vs_agent')}
            >
              👤 Human vs Agent
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Rounds</label>
          <div className="chip-group">
            {[2, 3, 5].map((n) => (
              <button
                key={n}
                type="button"
                className={`chip ${form.num_rounds === n ? 'chip--active' : ''}`}
                onClick={() => set('num_rounds', n)}
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="submit" className="btn-start" disabled={loading || isUploading}>
        {loading ? 'Starting Trial...' : isUploading ? 'Extracting documents...' : '⚖️ Start Trial'}
      </button>
    </form>
  );
}
