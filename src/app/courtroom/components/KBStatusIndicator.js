'use client';
import { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export default function KBStatusIndicator() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    fetch(`${API_URL}/api/courtroom/setup/kb-status`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  const hasData = status.laws_count > 0 || status.cases_count > 0;

  return (
    <div className={`kb-status ${hasData ? 'kb-status--ok' : 'kb-status--warn'}`}>
      {hasData ? (
        <span>
          📚 KB: {status.laws_count} laws · {status.cases_count} cases ({status.country_code})
        </span>
      ) : (
        <span>⚠️ No knowledge base data for your country. Trial may lack citations.</span>
      )}
    </div>
  );
}
