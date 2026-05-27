'use client';
import { useEffect, useState } from 'react';

const PIPELINE_META = {
  plaintiff: {
    label: 'फिरादी पक्ष',
    tone: 'plaintiff',
  },
  defendant: {
    label: 'प्रतिवादी पक्ष',
    tone: 'defendant',
  },
  judge: {
    label: 'श्रीमान् न्यायाधीश',
    tone: 'judge',
  },
};

const AGENT_STATUS = {
  'Research Agent': {
    title: 'Research Agent',
    getAction: () => 'कानून र तथ्य खोज्दै...',
    fallbackSteps: ['फिरादपत्र र प्रतिउत्तरपत्र पढ्दै...', 'मुद्दाको प्रकार पहिचान गर्दै...', 'सम्बन्धित कानून ज्ञानभण्डारमा खोज्दै...'],
  },
  'Plaintiff Case Reviewer': {
    title: 'Plaintiff Case Reviewer Agent',
    getAction: () => 'फिरादपत्र समीक्षा गर्दै...',
    fallbackSteps: ['फिरादपत्र पढ्दै...', 'फिरादी र प्रतिवादीको नाम पहिचान गर्दै...', 'मुद्दाको प्रकार र मुख्य माग छुट्याउँदै...'],
  },
  'Defendant Case Reviewer': {
    title: 'Defendant Case Reviewer Agent',
    getAction: () => 'प्रतिउत्तरपत्र समीक्षा गर्दै...',
    fallbackSteps: ['प्रतिउत्तरपत्र पढ्दै...', 'प्रतिवादीको जवाफ र जिकिर पहिचान गर्दै...', 'फिरादपत्रसँग पक्ष र मुद्दा मिलाउँदै...'],
  },
  'Statement Prep': {
    title: 'Statement Prep Agent',
    getAction: (role) => `${role}को बयान तयार गर्दै...`,
    fallbackSteps: ['कागजातका तथ्य पढ्दै', 'मुख्य दाबी र विवाद छुट्याउँदै', 'अदालत शैलीको बहस तयार गर्दै'],
  },
  'Citation Verifier': {
    title: 'Citation Verifier Agent',
    getAction: () => 'उल्लेखित कानून ज्ञानभण्डारमा जाँच्दै...',
    fallbackSteps: ['उल्लेखित दफा खोज्दै', 'ज्ञानभण्डारसँग मिलाउँदै', 'अप्रमाणित उद्धरण छुट्याउँदै'],
  },
  'Legal Analysis': {
    title: 'Legal Analysis Agent',
    getAction: () => 'दुवै पक्षको कानूनी आधार मूल्याङ्कन गर्दै...',
    fallbackSteps: ['फिरादीको बहस जाँच्दै', 'प्रतिवादीको जिकिर जाँच्दै', 'निर्णय गर्नुपर्ने प्रश्नहरू छुट्याउँदै'],
  },
  'Precedent Matcher': {
    title: 'Precedent Matcher Agent',
    getAction: () => 'सम्बन्धित नजिर र कानूनी सन्दर्भ खोज्दै...',
    fallbackSteps: ['मुद्दाको तथ्यसँग मिल्ने नजिर खोज्दै', 'नजिरको सान्दर्भिकता जाँच्दै', 'बलियो कानूनी आधार छान्दै'],
  },
  'Verdict Agent': {
    title: 'Judgment Agent',
    getAction: () => 'फैसला/आदेशको मस्यौदा तयार गर्दै...',
    fallbackSteps: ['मुख्य विवाद संक्षेप गर्दै', 'प्रमाण र कानून मिलाउँदै', 'सिमुलेटेड फैसला तयार गर्दै'],
  },
};

function formatDuration(ms) {
  if (!ms) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function isUsefulThinkingStep(step) {
  if (!step) return false;
  const normalized = step.toLowerCase();
  return !normalized.startsWith('reviewing case facts');
}

export default function SubAgentProgress({ work }) {
  const [open, setOpen] = useState(work?.status === 'running');
  const pipeline = PIPELINE_META[work?.pipeline] || {
    label: work?.pipeline || 'Agent',
    tone: 'system',
  };
  const agent = AGENT_STATUS[work?.agent_name] || {
    title: work?.agent_name || 'Sub-Agent',
    getAction: () => 'कार्य गर्दै...',
    fallbackSteps: ['इनपुट पढ्दै', 'सन्दर्भ मिलाउँदै', 'नतिजा तयार गर्दै'],
  };
  const usefulSteps = (work?.thinking_steps || []).filter(isUsefulThinkingStep);
  const steps = usefulSteps.length ? usefulSteps : agent.fallbackSteps;
  const isRunning = work?.status === 'running';
  const isError = work?.status === 'error';
  const isCancelled = work?.status === 'cancelled';

  useEffect(() => {
    if (isRunning) setOpen(true);
  }, [isRunning]);

  const statusText = isRunning
    ? 'Thinking'
    : isError
      ? 'Thought stopped'
      : isCancelled
        ? 'Thought paused'
        : `Thought for ${steps.length} step${steps.length === 1 ? '' : 's'}`;

  return (
    <div className={`deep-think ${isRunning ? 'deep-think--running' : ''}`}>
      <button className="deep-think__header" type="button" onClick={() => setOpen((v) => !v)}>
        <span className="deep-think__icon">⌘</span>
        <span>{statusText}</span>
        <span className="deep-think__chevron">{open ? '⌃' : '⌄'}</span>
      </button>

      {open && (
        <div className="deep-think__body">
          <div className="deep-think__agent">
            {agent.title} · {pipeline.label}
            {work?.round > 0 ? ` · चरण ${work.round}` : ''}
            {work?.duration_ms ? ` · ${formatDuration(work.duration_ms)}` : ''}
          </div>

          <ul className="deep-think__steps">
            {steps.map((step, index) => (
              <li key={`${step}-${index}`}>{step}</li>
            ))}
            {isRunning && <li className="deep-think__live">अर्को चरण विश्लेषण गर्दै...</li>}
          </ul>

          {work?.error && <div className="deep-think__error">{work.error}</div>}
        </div>
      )}
    </div>
  );
}
