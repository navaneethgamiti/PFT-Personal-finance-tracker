# Frontend Testing Guide (for QA/Testers)

This file is intentionally designed so you can paste it into Codex and have Codex generate missing tests quickly.

## Project testing stack
- Unit + integration: Vitest + React Testing Library

## Stable selectors to use
- `data-testid="global-add-transaction"`
- `data-testid="add-transaction-modal"`
- `data-testid="save-transaction-button"`
- `data-testid="transactions-page"`
- `data-testid="transaction-row"`
- `data-testid="budgets-page"`
- `data-testid="goals-page"`
- `data-testid="reports-page"`
- `data-testid="recurring-page"`
- `data-testid="accounts-page"`

## Codex prompt template for generating tests
Use this exact prompt in Codex:

"Generate complete tests for this React personal finance tracker frontend. Use Vitest + Testing Library for component/integration tests only. Cover dashboard summaries, add/delete transaction flows, budget creation/progress, goal creation/contribution, recurring pause/resume, account/category creation, and route navigation. Reuse existing `data-testid` selectors and keep tests deterministic. If a selector is missing, add one in component code. Ensure tests pass with `npm test`."

## Manual test checklist
- Create a transaction from global modal
- Search transactions by merchant and note
- Delete a transaction and verify toast
- Create budget and verify progress bar updates
- Create goal and add contribution
- Create recurring item and pause/resume it
- Add account and category
- Check responsive behavior in mobile viewport
