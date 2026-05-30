# Courtroom Backend Contract

This document defines the real backend behavior required by the finalized courtroom UI.

The frontend is event-driven. The backend should stream courtroom events over the trial websocket in the same order and shape as the mock flow. The UI will render:

- A generative document review thought block.
- A clean courtroom transcript.
- A separate **Agent Status** panel showing which agent worked, for which role, in which phase, with status and duration.
- Legal references in the **Citations** panel.

## WebSocket Endpoint

Frontend default:

```txt
ws://localhost:8000/api/courtroom/ws/trial?token=<access_token>
```

Initial client message:

```json
{
  "session_id": "<courtroom_session_id>"
}
```

Optional client message for future interactive mode:

```json
{
  "type": "user_argument",
  "content": "..."
}
```

## Agent Names

Use these backend `agent_name` values so the frontend maps them correctly:

| Backend `agent_name` | UI label |
| --- | --- |
| `Plaintiff Case Reviewer` | Petition Review Agent |
| `Defendant Case Reviewer` | Response Review Agent |
| `Research Agent` | Legal Research Agent |
| `Statement Prep` | Statement Prep Agent |
| `Citation Verifier` | Citation Verifier |
| `Legal Analysis` | Legal Analysis Agent |
| `Precedent Matcher` | Precedent Matcher |
| `Verdict Agent` | Verdict Writer |

Use these `pipeline` values:

```txt
plaintiff
defendant
judge
system
```

Use these `phase` values:

```txt
document_review
research
opening_statements
argument_rounds
closing_statements
verdict
complete
```

## Final Hearing Flow

The finalized UI expects this courtroom sequence:

1. Trial starts.
2. Petition and response are reviewed.
3. Case match is checked.
4. Legal references are retrieved.
5. Opening statements:
   - Plaintiff opening.
   - Defendant opening.
6. Counter Arguments, one round only:
   - Plaintiff counter argument.
   - Defendant counter argument.
   - Plaintiff rebuttal.
   - Defendant rebuttal.
   - Judge transitions to closing statements.
7. Closing statements:
   - Plaintiff closing.
   - Defendant closing.
8. Verdict:
   - Judge/verdict writer gives final verdict.
9. Trial complete.

## Event Reference

### `trial_started`

Send once at the beginning.

```json
{
  "type": "trial_started",
  "num_rounds": 1,
  "language": "ne"
}
```

The current final design is a one-round counter exchange. Use `num_rounds: 1`.

### `phase_start`

Send before each phase.

```json
{
  "type": "phase_start",
  "phase": "opening_statements",
  "content": "Opening statements started."
}
```

Required phase order:

```txt
document_review
research
opening_statements
argument_rounds
closing_statements
verdict
```

### `sub_agent_start`

Send when an agent begins work. This powers the Agent Status panel and any inline agent display.

```json
{
  "type": "sub_agent_start",
  "pipeline": "plaintiff",
  "agent_name": "Statement Prep",
  "phase": "argument_rounds",
  "round": 1,
  "thinking_steps": ["Read facts", "Frame argument", "Draft statement"]
}
```

### `sub_agent_complete`

Send when the same agent finishes.

```json
{
  "type": "sub_agent_complete",
  "pipeline": "plaintiff",
  "agent_name": "Statement Prep",
  "phase": "argument_rounds",
  "round": 1,
  "output_summary": "Plaintiff counter argument drafted.",
  "duration_ms": 1550,
  "thinking_results": []
}
```

Matching rules used by the frontend:

- It finds the latest running `agent_work`.
- It matches by `pipeline` and `agent_name`.
- Include the same `pipeline` and `agent_name` in start and complete events.

### `thinking_step`

Optional live update while an agent is running.

```json
{
  "type": "thinking_step",
  "pipeline": "plaintiff",
  "agent_name": "Statement Prep",
  "phase": "argument_rounds",
  "round": 1,
  "step_text": "Checking petition facts against defendant response."
}
```

### `case_analysis`

Send after document review and before legal research completes.

```json
{
  "type": "case_analysis",
  "matched": true,
  "case_type": "सम्बन्ध विच्छेद",
  "parties_matched": true,
  "case_type_matched": true,
  "plaintiff_parties": ["सीता श्रेष्ठ"],
  "defendant_parties": ["आशान नगरकोटी"],
  "shared_parties": ["सीता श्रेष्ठ", "आशान नगरकोटी"],
  "issues": [
    "सम्बन्ध विच्छेद",
    "भरणपोषण",
    "बाल हित",
    "हिंसा/यातना",
    "विवाहबाह्य सम्बन्धको जिकिर"
  ],
  "reason": "फिरादपत्र र प्रतिउत्तरपत्र एउटै नागरिक मुद्दासँग सम्बन्धित देखिन्छन्।"
}
```

If `matched` is false, the backend should stop the trial and send `trial_error` or a clear stopped state.

### `research_complete`

Send after legal research. This powers the Citations panel and document-review thought references.

```json
{
  "type": "research_complete",
  "phase": "research",
  "laws_count": 3,
  "cases_count": 0,
  "laws": [
    {
      "title": "मुलुकी देवानी संहिता",
      "citation_label": "देवानी संहिता दफा ९४",
      "relevance_label": "सम्बन्ध विच्छेद निवेदन",
      "verified": true,
      "content": "Optional KB excerpt..."
    }
  ],
  "cases": []
}
```

Recommended fields for each source:

```txt
title
citation_label
relevance_label
section
citation
court
verified
content
```

### `argument`

Send for Plaintiff and Defendant statements.

```json
{
  "type": "argument",
  "agent": "plaintiff",
  "phase": "opening_statements",
  "round": 0,
  "content": "माननीय अदालत..."
}
```

Valid `agent` values:

```txt
plaintiff
defendant
human
```

For counter arguments use:

```json
{
  "type": "argument",
  "agent": "plaintiff",
  "phase": "argument_rounds",
  "round": 1,
  "content": "..."
}
```

Do not prefix content with labels like `फिरादी पक्ष`, `प्रतिवादी पक्ष`, `Plaintiff`, or `Defendant`. The UI already renders speaker labels.

### `evaluation`

Send for judge analysis or transition statements.

```json
{
  "type": "evaluation",
  "agent": "judge",
  "phase": "argument_rounds",
  "round": 1,
  "content": "अदालतले दुवै पक्षका प्रतिवाद र प्रत्युत्तर सुनेको छ..."
}
```

The final counter evaluation should transition to closing statements, not repeat round analysis.

### `verdict`

Send after closing statements.

```json
{
  "type": "verdict",
  "agent": "judge",
  "phase": "verdict",
  "round": 0,
  "content": "माननीय अदालत...",
  "winner": "unknown"
}
```

Recommended `winner` values:

```txt
plaintiff
defendant
partial
unknown
```

### `trial_complete`

Send once at the end.

```json
{
  "type": "trial_complete",
  "phase": "complete",
  "content": "Trial concluded."
}
```

### Error Events

Agent-level error:

```json
{
  "type": "sub_agent_error",
  "pipeline": "plaintiff",
  "agent_name": "Statement Prep",
  "phase": "argument_rounds",
  "round": 1,
  "error": "Failed to draft counter argument."
}
```

Trial-level error:

```json
{
  "type": "trial_error",
  "content": "Petition and response do not refer to the same dispute."
}
```

## Exact Event Order

Use this as the real backend target.

```txt
trial_started
phase_start document_review
sub_agent_start Plaintiff Case Reviewer
sub_agent_complete Plaintiff Case Reviewer
sub_agent_start Defendant Case Reviewer
sub_agent_complete Defendant Case Reviewer
case_analysis
phase_start research
sub_agent_start Research Agent
sub_agent_complete Research Agent
research_complete
phase_start opening_statements
sub_agent_start Statement Prep plaintiff
sub_agent_complete Statement Prep plaintiff
sub_agent_start Citation Verifier plaintiff
sub_agent_complete Citation Verifier plaintiff
argument plaintiff opening
sub_agent_start Statement Prep defendant
sub_agent_complete Statement Prep defendant
sub_agent_start Citation Verifier defendant
sub_agent_complete Citation Verifier defendant
argument defendant opening
phase_start argument_rounds
sub_agent_start Statement Prep plaintiff
sub_agent_complete Statement Prep plaintiff
sub_agent_start Citation Verifier plaintiff
sub_agent_complete Citation Verifier plaintiff
argument plaintiff counter
sub_agent_start Statement Prep defendant
sub_agent_complete Statement Prep defendant
sub_agent_start Citation Verifier defendant
sub_agent_complete Citation Verifier defendant
argument defendant counter
sub_agent_start Statement Prep plaintiff
sub_agent_complete Statement Prep plaintiff
sub_agent_start Citation Verifier plaintiff
sub_agent_complete Citation Verifier plaintiff
argument plaintiff rebuttal
sub_agent_start Statement Prep defendant
sub_agent_complete Statement Prep defendant
sub_agent_start Citation Verifier defendant
sub_agent_complete Citation Verifier defendant
argument defendant rebuttal
sub_agent_start Legal Analysis judge
sub_agent_complete Legal Analysis judge
sub_agent_start Precedent Matcher judge
sub_agent_complete Precedent Matcher judge
evaluation judge transition-to-closing
phase_start closing_statements
sub_agent_start Statement Prep plaintiff
sub_agent_complete Statement Prep plaintiff
sub_agent_start Citation Verifier plaintiff
sub_agent_complete Citation Verifier plaintiff
argument plaintiff closing
sub_agent_start Statement Prep defendant
sub_agent_complete Statement Prep defendant
sub_agent_start Citation Verifier defendant
sub_agent_complete Citation Verifier defendant
argument defendant closing
phase_start verdict
sub_agent_start Legal Analysis judge
sub_agent_complete Legal Analysis judge
sub_agent_start Precedent Matcher judge
sub_agent_complete Precedent Matcher judge
sub_agent_start Verdict Agent judge
sub_agent_complete Verdict Agent judge
verdict
trial_complete
```

## Backend Agent Responsibilities

### Petition Review Agent

Input:

- Uploaded petition/firadpatra text.

Output:

- Extracted plaintiff parties.
- Claims.
- Relief requested.
- Issues.
- Text extraction status.

Event usage:

- `sub_agent_start`
- `sub_agent_complete` with `thinking_results`

### Response Review Agent

Input:

- Uploaded response/pratiuttar text.

Output:

- Extracted defendant parties.
- Admissions.
- Denials.
- Counterclaims.
- Case alignment with petition.

### Case Match Logic

Backend should compare:

- Parties.
- Case type.
- Core issues.
- Whether petition and response belong to the same dispute.

Then emit `case_analysis`.

### Legal Research Agent

Input:

- Case type.
- Issues.
- Requested relief.
- Party positions.

Output:

- Verified laws.
- Verified cases if available.
- Count fields.

Then emit `research_complete`.

### Statement Prep Agent

Use for:

- Opening statements.
- Counter argument.
- Rebuttal.
- Closing statements.

It should not decide the verdict. It only drafts party submissions.

### Citation Verifier

Recommended for real backend:

- Run after each Statement Prep draft.
- Verify that legal citations exist in `research_complete`.
- Remove unsupported law claims.
- Optionally emit `sub_agent_start` and `sub_agent_complete` before the final `argument`.

Example:

```txt
Statement Prep start
Statement Prep complete
Citation Verifier start
Citation Verifier complete
argument
```

### Legal Analysis Agent

Use for judge transition after counter arguments.

It should:

- Summarize what both sides argued.
- Identify narrowed issues.
- Move to closing statements.

### Verdict Writer

Use after both closing statements.

It should:

- Summarize the dispute.
- Apply verified legal references.
- Discuss evidentiary strength.
- Produce winner assessment.

## Content Rules

Keep transcript content clean:

- Do not include speaker labels inside `content`.
- Do not include `Round 1` or `चरण 1` inside `content`.
- Do not repeat the same counter argument across multiple turns.
- Use Nepali courtroom language for arguments and verdict if the case is Nepali.
- Use English for event names, agent names, phases, and pipelines.

## UI Expectations

### Transcript

The frontend will show:

- Speaker labels as English: `Plaintiff`, `Defendant`, `Judge`.
- Counter Arguments as one `Round 1`.
- Agent status lines during counter statements.
- Typewriter/generative reveal for message content.

### Agent Status Button

The frontend lists all visible `agent_work` records from:

- `sub_agent_start`
- `sub_agent_complete`
- `sub_agent_error`

To make this useful, always emit start and complete events around real agent work.

### Citations Button

The frontend uses `research_complete.laws` and `research_complete.cases`.

## Minimal Real Backend Pseudocode

```python
await send({"type": "trial_started", "num_rounds": 1, "language": "ne"})

await phase("document_review")
petition = await run_agent("plaintiff", "Plaintiff Case Reviewer", "document_review", 0, review_petition)
response = await run_agent("defendant", "Defendant Case Reviewer", "document_review", 0, review_response)
await send_case_analysis(petition, response)

await phase("research")
research = await run_agent("system", "Research Agent", "research", 0, retrieve_law)
await send_research_complete(research)

await phase("opening_statements")
pl_open = await draft_and_verify("plaintiff", "opening_statements", 0)
await send_argument("plaintiff", "opening_statements", 0, pl_open)
def_open = await draft_and_verify("defendant", "opening_statements", 0)
await send_argument("defendant", "opening_statements", 0, def_open)

await phase("argument_rounds", round=1)
pl_counter = await draft_and_verify("plaintiff", "argument_rounds", 1)
await send_argument("plaintiff", "argument_rounds", 1, pl_counter)
def_counter = await draft_and_verify("defendant", "argument_rounds", 1)
await send_argument("defendant", "argument_rounds", 1, def_counter)
pl_rebuttal = await draft_and_verify("plaintiff", "argument_rounds", 1, mode="rebuttal")
await send_argument("plaintiff", "argument_rounds", 1, pl_rebuttal)
def_rebuttal = await draft_and_verify("defendant", "argument_rounds", 1, mode="rebuttal")
await send_argument("defendant", "argument_rounds", 1, def_rebuttal)

transition = await run_agent("judge", "Legal Analysis", "argument_rounds", 1, judge_transition)
await send_evaluation("argument_rounds", 1, transition)

await phase("closing_statements")
pl_close = await draft_and_verify("plaintiff", "closing_statements", 0)
await send_argument("plaintiff", "closing_statements", 0, pl_close)
def_close = await draft_and_verify("defendant", "closing_statements", 0)
await send_argument("defendant", "closing_statements", 0, def_close)

await phase("verdict")
verdict = await run_agent("judge", "Verdict Agent", "verdict", 0, write_verdict)
await send_verdict(verdict)
await send({"type": "trial_complete", "phase": "complete", "content": "Trial concluded."})
```

## Acceptance Checklist

The real backend is compatible when:

- The frontend receives `trial_started` first.
- Every real agent emits `sub_agent_start` and `sub_agent_complete`.
- Document review produces one generative thought block.
- The Agent Status button shows all agent work.
- Citations panel shows verified laws/cases.
- Counter Arguments has one round with four party turns and one judge transition.
- Closing Statements happen after judge transition.
- Verdict happens after both closings.
- `trial_complete` is sent only after verdict.
