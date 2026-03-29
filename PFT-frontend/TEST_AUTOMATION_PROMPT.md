# Prompt For Codex Test Generation

Paste the prompt below into Codex to auto-generate/expand tests for this project.

## Prompt
You are working on the Personal Finance Tracker frontend (React + TypeScript + Redux Toolkit + React Router + Recharts).

Tasks:
1. Analyze existing frontend code and data-testid selectors.
2. Add missing unit/integration tests using Vitest + React Testing Library for:
   - login bootstrap and navigation
   - add/search/delete transaction
   - create budget and validate progress percentage
   - create goal and add contribution
   - create recurring transaction and pause/resume
   - create account and category
3. Keep tests deterministic and avoid flaky timing.
4. If selectors are missing, add stable `data-testid` attributes to components.
5. Run tests and update code until all pass.
6. Return a final summary listing tests added and execution result.

Constraints:
- Do not rewrite architecture.
- Keep tests readable and grouped by feature.
- Prefer behavior assertions over implementation details.
