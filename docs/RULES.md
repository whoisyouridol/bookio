# Claude Rules for This Project

## Commit & Push Workflow

- After making any code changes, ALWAYS ask the user before committing or pushing.
- Never commit or push autonomously without explicit user approval.
- When the user approves, propose a commit name and description, then commit and push to `develop`.
- Stage only the files that were changed for the current task — do not use `git add -A` blindly.

## Testing

- Any new backend functionality MUST have both unit tests and integration tests.
- Any new frontend logic that is non-trivial MUST have frontend tests.
- After finishing any change (FE or BE), always rerun the full test suite and confirm all tests pass before considering the task done.
- If tests fail after a change, investigate and fix the root cause — do not skip or comment out failing tests.

## Cross-Layer Consistency

- Whenever a backend DTO, endpoint, or field changes, check whether the frontend types (`src/types/index.ts`), API clients (`src/api/`), and UI components need updating, and vice versa.
- Whenever a frontend feature requires new data, verify the backend endpoint already returns it — if not, add it on the backend first.
- Never assume a change is isolated to one layer without explicitly checking the other.
