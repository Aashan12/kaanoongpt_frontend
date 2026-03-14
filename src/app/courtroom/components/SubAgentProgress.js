'use client';

const PIPELINE_STEPS = {
  plaintiff: ['Statement Prep', 'Citation Verifier'],
  defendant: ['Statement Prep', 'Citation Verifier'],
  judge: ['Legal Analysis', 'Precedent Matcher', 'Verdict Agent'],
};

export default function SubAgentProgress({ subAgentStatus }) {
  if (!subAgentStatus) return null;

  const { pipeline, agent_name } = subAgentStatus;
  const steps = PIPELINE_STEPS[pipeline] || [];
  const currentIdx = steps.indexOf(agent_name);

  const pipelineLabel = pipeline.charAt(0).toUpperCase() + pipeline.slice(1);

  return (
    <div className="sub-agent-progress">
      <div className="sub-agent-progress__label">
        <span className="pipeline-name">{pipelineLabel}</span>
        <span className="thinking-dot">●</span>
        <span className="agent-name">{agent_name}</span>
      </div>
      <div className="sub-agent-progress__steps">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`step-dot ${i < currentIdx ? 'step-dot--done' : i === currentIdx ? 'step-dot--active' : ''}`}
            title={step}
          />
        ))}
      </div>
    </div>
  );
}
