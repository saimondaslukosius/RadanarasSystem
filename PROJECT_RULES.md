# RadanarasSystem Project Rules

## Local-Only Work

All normal development work must happen locally in:

`C:\Users\saimo\RadanarasSystem`

Do not make direct live-server changes. Do not push, deploy, or run production actions unless the user explicitly instructs it.

## Safety Rules

- One task at a time.
- Always back up files before editing.
- Keep changes focused on the requested issue.
- Preserve working features and existing data.
- No broad refactors without permission.
- No dependency upgrades unless required for the task and approved.
- No cleanup of backups, uploads, data, or generated files unless requested.

## App Awareness

The project has a backend and frontend:

- Backend: `backend`
- Frontend: `frontend`
- Main frontend app: `frontend\src\App.jsx`
- Orders-related frontend files include `frontend\src\orders_settings_only.jsx` and related order draft/domain adapters.
- Backend data lives under `backend\data`.

## Current Priority

Fix select/dropdown issues in Orders forms.

When working on this priority:

- First inspect the existing Orders form flow.
- Identify whether the issue is state, option values, rendering, persistence, or data mapping.
- Change the smallest necessary code path.
- Avoid rebuilding the whole Orders form.
- Verify that existing Orders features still work.

## Before Commit, Push, or Deploy

- Confirm backups exist for edited files.
- Run local verification.
- Review the diff.
- Summarize changed files and test results.
- Ask before pushing or deploying.

