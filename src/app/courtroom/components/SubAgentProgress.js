'use client';
import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

const PIPELINE_META = {
  plaintiff: { label: 'Plaintiff', tone: 'plaintiff' },
  defendant: { label: 'Defendant', tone: 'defendant' },
  judge: { label: 'Judge', tone: 'judge' },
  system: { label: 'System', tone: 'system' },
};

const AGENT_STATUS = {
  'Research Agent': {
    title: 'Legal Research Agent',
    fallbackSteps: ['Classify dispute', 'Retrieve statutes', 'Verify sources'],
  },
  'Plaintiff Case Reviewer': {
    title: 'Petition Review Agent',
    fallbackSteps: ['Read petition', 'Identify parties', 'Map claims'],
  },
  'Defendant Case Reviewer': {
    title: 'Response Review Agent',
    fallbackSteps: ['Read response', 'Identify defenses', 'Check alignment'],
  },
  'Statement Prep': {
    title: 'Statement Prep Agent',
    fallbackSteps: ['Read facts', 'Frame argument', 'Draft statement'],
  },
  'Citation Verifier': {
    title: 'Citation Verifier',
    fallbackSteps: ['Find citations', 'Verify sources', 'Remove unsupported law'],
  },
  'Legal Analysis': {
    title: 'Legal Analysis Agent',
    fallbackSteps: ['Review arguments', 'Weigh evidence', 'Set questions'],
  },
  'Precedent Matcher': {
    title: 'Precedent Matcher',
    fallbackSteps: ['Search precedents', 'Filter relevance', 'Limit sources'],
  },
  'Verdict Agent': {
    title: 'Verdict Writer',
    fallbackSteps: ['Summarize dispute', 'Apply law', 'Draft conclusion'],
  },
};

const STEP_LABELS = ['Read context', 'Extract issues', 'Generate output'];

function formatDuration(ms) {
  if (!ms) return '';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatThoughtDuration(ms, fallbackSeconds = 23) {
  const seconds = ms ? Math.max(1, Math.round(ms / 1000)) : fallbackSeconds;
  return `${seconds} second${seconds === 1 ? '' : 's'}`;
}

function isUsefulThinkingStep(step) {
  if (!step) return false;
  return !String(step).toLowerCase().startsWith('reviewing case facts');
}

function compactStep(step = '', index = 0) {
  const text = String(step);
  const lower = text.toLowerCase();

  if (lower.includes('response') || text.includes('प्रतिउत्तर')) return 'Read response';
  if (lower.includes('match') || lower.includes('alignment') || text.includes('मिलान')) return 'Check alignment';
  if (lower.includes('petition') || text.includes('फिराद')) return 'Read petition';
  if (lower.includes('parties') || text.includes('पक्ष') || text.includes('नाम')) return 'Identify parties';
  if (lower.includes('claim') || text.includes('दाबी') || text.includes('माग') || text.includes('आरोप')) return 'Map claims';
  if (lower.includes('defense') || text.includes('प्रतिरक्षा') || text.includes('जवाफ')) return 'Identify defenses';
  if (lower.includes('law') || lower.includes('source') || text.includes('कानून') || text.includes('स्रोत') || text.includes('ज्ञान')) return 'Verify law';
  if (lower.includes('citation') || text.includes('दफा') || text.includes('उद्धरण')) return 'Verify citations';
  if (lower.includes('argument') || text.includes('बहस')) return 'Draft argument';
  if (lower.includes('proof') || lower.includes('evidence') || text.includes('प्रमाण')) return 'Weigh evidence';
  if (lower.includes('verdict') || text.includes('फैसला')) return 'Draft verdict';

  return STEP_LABELS[index] || 'Review';
}

function resolveAgent(agentName = '') {
  const known = AGENT_STATUS[agentName];
  if (known) return known;

  const name = String(agentName);
  if (name.includes('फिरादी') || name.toLowerCase().includes('plaintiff document')) return AGENT_STATUS['Plaintiff Case Reviewer'];
  if (name.includes('प्रतिउत्तर') || name.toLowerCase().includes('defendant response')) return AGENT_STATUS['Defendant Case Reviewer'];
  if (name.includes('कानूनी') || name.toLowerCase().includes('research')) return AGENT_STATUS['Research Agent'];
  if (name.includes('बहस') || name.toLowerCase().includes('statement')) return AGENT_STATUS['Statement Prep'];
  if (name.includes('उद्धरण') || name.toLowerCase().includes('citation')) return AGENT_STATUS['Citation Verifier'];
  if (name.includes('नजिर') || name.toLowerCase().includes('precedent')) return AGENT_STATUS['Precedent Matcher'];
  if (name.includes('न्याय') || name.toLowerCase().includes('legal analysis')) return AGENT_STATUS['Legal Analysis'];
  if (name.includes('फैसला') || name.toLowerCase().includes('verdict')) return AGENT_STATUS['Verdict Agent'];

  return {
    title: agentName || 'Sub-Agent',
    fallbackSteps: ['Read input', 'Analyze context', 'Prepare output'],
  };
}

function parseStructuredResult(result = '') {
  const text = String(result || '').trim();
  if (!text) return null;

  const lines = text.split('\n').map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return null;

  const title = lines[0].endsWith(':') ? lines[0].slice(0, -1) : lines[0];
  const rows = lines.slice(1).map((line) => {
    const match = line.match(/^([^:]+):\s*(.+)$/);
    return match ? { label: match[1].trim(), value: match[2].trim() } : null;
  }).filter(Boolean);

  if (!rows.length) return null;
  return { title, rows };
}

function rowValue(rows, label) {
  return rows.find((row) => row.label.toLowerCase() === label.toLowerCase())?.value || '';
}

function resultToParagraph(result = '', agentTitle = '') {
  const parsed = parseStructuredResult(result);
  if (!parsed) return String(result || '').trim();

  const title = parsed.title.toLowerCase();
  const rows = parsed.rows;

  if (title.includes('petition read')) {
    return `${agentTitle} reviewed the ${rowValue(rows, 'Document') || 'petition'} and confirmed ${rowValue(rows, 'Status') || 'text extraction'}.`;
  }
  if (title.includes('parties identified')) {
    return `${agentTitle} identified ${rowValue(rows, 'Plaintiff')} as the plaintiff and ${rowValue(rows, 'Defendant')} as the defendant. The related issue noted from the filing is ${rowValue(rows, 'Related issue')}.`;
  }
  if (title.includes('claims mapped')) {
    return `The petition was framed as ${rowValue(rows, 'Case type')}, with ${rowValue(rows, 'Primary relief')} as the primary relief and the main issues recorded as ${rowValue(rows, 'Issues')}.`;
  }
  if (title.includes('response read')) {
    return `${agentTitle} reviewed the ${rowValue(rows, 'Document') || 'response'} and confirmed ${rowValue(rows, 'Status') || 'text extraction'}.`;
  }
  if (title.includes('defenses identified')) {
    return `The response records ${rowValue(rows, 'Position')} as the position, ${rowValue(rows, 'Denial')} as the denial, and ${rowValue(rows, 'Counterclaim')} as the counterclaim.`;
  }
  if (title.includes('alignment checked')) {
    return `The response was aligned with the petition through the parties ${rowValue(rows, 'Matched parties')} and the case type ${rowValue(rows, 'Case type')}. Result: ${rowValue(rows, 'Result')}.`;
  }

  return `${parsed.title}: ${rows.map((row) => `${row.label} ${row.value}`).join(', ')}.`;
}

function phasePurpose(phase = '', round = 0) {
  if (phase === 'opening_statements') return 'opening statement';
  if (phase === 'closing_statements') return 'closing argument';
  if (phase === 'argument_rounds') return round > 0 ? `round ${round} response` : 'counter argument';
  if (phase === 'verdict') return 'final verdict';
  return 'courtroom argument';
}

function buildAgenticThoughtParagraphs({ agent, pipeline, work, steps }) {
  const side = pipeline.label.toLowerCase();
  const purpose = phasePurpose(work?.phase, work?.round);
  const title = agent.title;

  if (title === 'Statement Prep Agent') {
    const filing = pipeline.tone === 'defendant' ? 'defendant’s response' : 'plaintiff’s petition';
    const stance = pipeline.tone === 'defendant'
      ? 'admitted facts, disputed allegations, evidentiary gaps, and available defenses'
      : 'core claims, requested relief, supporting facts, and the strongest factual sequence';
    return [
      `${title} reviewed the ${filing} and extracted the facts needed for the ${purpose}.`,
      `It organized the ${side} position around ${stance}.`,
      `It prepared a courtroom-ready ${purpose} grounded in the uploaded documents and available legal references.`,
    ];
  }

  if (title === 'Citation Verifier') {
    return [
      `${title} checked whether the ${side} argument stays anchored to verified statutes, precedents, and uploaded facts.`,
      'It filtered unsupported legal claims and kept only references that can be traced back to the knowledge base.',
      `It finalized the ${side} submission for courtroom presentation.`,
    ];
  }

  if (title === 'Legal Analysis Agent') {
    return [
      `${title} compared the plaintiff and defendant positions for the current hearing stage.`,
      'It isolated the legal issues, disputed facts, evidentiary gaps, and relief requested by each side.',
      'It prepared a neutral judicial analysis focused on what the court should evaluate next.',
    ];
  }

  if (title === 'Precedent Matcher') {
    return [
      `${title} searched for authorities that match the issues raised by both sides.`,
      'It filtered references for relevance to the dispute, court type, and available case facts.',
      'It prepared precedent guidance for the judge’s evaluation.',
    ];
  }

  if (title === 'Verdict Writer') {
    return [
      `${title} reviewed the full exchange of arguments and the judge’s prior analysis.`,
      'It organized the findings around liability, relief, evidentiary strength, and unresolved factual questions.',
      'It drafted the final courtroom conclusion and winner assessment.',
    ];
  }

  if (title === 'Legal Research Agent') {
    return [
      `${title} searched the knowledge base for statutes and cases connected to the dispute.`,
      'It separated stronger legal anchors from weaker or unrelated references.',
      'It prepared a research summary for downstream courtroom agents.',
    ];
  }

  return steps.map((step) => `${title} handled ${step.toLowerCase()} for the ${side} pipeline.`);
}

function useTypewriter(text, speed = 10) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!text) {
      setDisplayed('');
      setDone(false);
      return;
    }

    setDisplayed('');
    setDone(false);
    let index = 0;
    const interval = setInterval(() => {
      index += 1;
      setDisplayed(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  return { displayed, done };
}

function GeneratedAgentThought({ agentLine, paragraphs, isRunning, instant = false, error, onDone }) {
  const fullText = [agentLine, ...paragraphs, isRunning ? 'Working on the next step...' : ''].filter(Boolean).join('\n\n');
  const { displayed, done } = useTypewriter(fullText, 10);
  const isDone = instant || done;
  const visibleText = instant ? fullText : displayed;
  const blocks = visibleText.split('\n\n').filter(Boolean);

  useEffect(() => {
    if (isDone) onDone?.();
  }, [isDone, onDone]);

  return (
    <div className="deep-think__body">
      {blocks[0] && <div className="deep-think__agent">{blocks[0]}</div>}

      <div className="deep-think__notes">
        {blocks.slice(1).map((paragraph, index) => (
          <p
            key={`${paragraph}-${index}`}
            className={isRunning && index === blocks.length - 2 ? 'deep-think__live' : ''}
          >
            {paragraph}
          </p>
        ))}
        {!isDone && <span className="cursor-blink">▋</span>}
      </div>

      {error && isDone && <div className="deep-think__error">{error}</div>}
    </div>
  );
}

export default function SubAgentProgress({ work, onReady, instant = false }) {
  const [open, setOpen] = useState(work?.status === 'running');
  const [generatedDone, setGeneratedDone] = useState(Boolean(instant));
  const pipeline = PIPELINE_META[work?.pipeline] || {
    label: work?.pipeline || 'Agent',
    tone: 'system',
  };
  const agent = resolveAgent(work?.agent_name);
  const usefulSteps = (work?.thinking_steps || []).filter(isUsefulThinkingStep);
  const rawSteps = usefulSteps.length ? usefulSteps : agent.fallbackSteps;
  const steps = rawSteps.slice(0, 3).map(compactStep);
  const results = work?.thinking_results || [];
  const isRunning = !instant && work?.status === 'running';
  const isError = work?.status === 'error';
  const isCancelled = work?.status === 'cancelled';
  const isDocumentReview = work?.phase === 'document_review';

  useEffect(() => {
    if (isRunning) setOpen(true);
    if (!isRunning && isDocumentReview) setOpen(true);
    if (!isRunning && !isDocumentReview) setOpen(true);
  }, [isRunning, isDocumentReview, work?.status]);

  const statusText = isRunning
    ? 'Analyzing'
    : isError
      ? 'Stopped'
      : isCancelled
        ? 'Paused'
        : `Thought for ${formatThoughtDuration(work?.duration_ms)}`;

  const noteParagraphs = results.length
    ? results.map((result) => resultToParagraph(result, agent.title)).filter(Boolean)
    : buildAgenticThoughtParagraphs({ agent, pipeline, work, steps });
  const agentLine = [
    `${agent.title} · ${pipeline.label}`,
    work?.round > 0 ? `Round ${work.round}` : '',
    work?.duration_ms ? formatDuration(work.duration_ms) : '',
  ].filter(Boolean).join(' · ');
  const thoughtKey = [
    work?.pipeline || '',
    work?.agent_name || '',
    work?.status || '',
    work?.duration_ms || '',
    agentLine,
    ...noteParagraphs,
  ].join('\n');
  const showThinking = isRunning || (!instant && !generatedDone);

  useEffect(() => {
    setGeneratedDone(Boolean(instant));
  }, [thoughtKey, instant]);

  useEffect(() => {
    if (!onReady || showThinking) return;
    onReady();
  }, [showThinking, onReady]);

  function handleToggle() {
    if (open && !isRunning) setGeneratedDone(true);
    setOpen((value) => !value);
  }

  return (
    <div className={`deep-think deep-think--${isDocumentReview ? 'document' : pipeline.tone} ${isRunning ? 'deep-think--running' : ''}`} data-tone={pipeline.tone}>
      <button className="deep-think__header" type="button" onClick={handleToggle}>
        <img className="deep-think__logo" src="/logo.png" alt="" />
        <span>{showThinking ? 'Thinking' : statusText}</span>
        {showThinking && (
          <span className="deep-think__loading" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        )}
        <span className="deep-think__chevron">
          {open ? <ChevronDown size={15} strokeWidth={2} /> : <ChevronRight size={15} strokeWidth={2} />}
        </span>
      </button>

      {open && (
        <GeneratedAgentThought
          agentLine={agentLine}
          paragraphs={noteParagraphs}
          isRunning={isRunning}
          instant={instant || generatedDone}
          error={work?.error}
          onDone={() => setGeneratedDone(true)}
        />
      )}
    </div>
  );
}
