# Development, AI-Integration, and QA Guide

CareerCraft AI is a career-development application starter using Node.js/npm and Gemini-backed interactions where configured. Use the current source to confirm which career-planning and job-search workflows are implemented.

## Setup and configuration

```bash
git clone https://github.com/kandisaikishore/CareerCraft-AI.git
cd CareerCraft-AI
```

Follow the scripts and runtime requirements in the package manifest. Keep Gemini keys and any other credentials in untracked local environment configuration.

## Functional test matrix

For implemented flows, test:
- Missing goals, empty skills, and malformed career inputs
- AI provider timeout, invalid credentials, rate limits, and malformed output
- Repeated submissions and stale async responses
- Empty results, loading states, and recoverable errors
- Save/reload behavior for any persisted career plan
- Keyboard navigation and accessible form validation

Mock provider calls in automated tests. Validate required response fields and reject malformed model output instead of silently treating it as a valid career plan.

## Recommendation quality and privacy

Document the inputs and rules that affect each recommendation. Make it possible to trace a recommendation to the user's stated goals or supplied role requirements. Do not fabricate job openings, salary facts, credentials, or guaranteed outcomes. Avoid logging full resumes or sensitive career profiles by default.

## Pull-request checklist

- [ ] Run declared lint/test/build scripts.
- [ ] Add tests for malformed inputs and provider failures.
- [ ] Verify error states do not claim generation succeeded.
- [ ] State which integrations were mocked or not tested.
- [ ] Keep AI suggestions clearly distinguishable from verified facts.
