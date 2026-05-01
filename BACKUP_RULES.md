# Backup Rules

## Required Before Edits

Before editing any existing project file, create a backup copy in the same folder.

Recommended naming format:

`filename.YYYYMMDD-HHMM.reason.bak`

Examples:

- `App.jsx.20260427-1430.orders-select-fix.bak`
- `orders_settings_only.jsx.20260427-1430.dropdown-state-fix.bak`
- `settings.json.20260427-1430.before-orders-test.bak`

## What To Back Up

Back up each existing file that will be edited, including:

- Frontend source files
- Backend source files
- JSON data files
- Config files
- Scripts
- Templates

New files do not need backups before creation.

## Backup Safety

- Do not overwrite existing backups.
- Do not delete backups unless the user explicitly asks.
- Do not move backups to another folder unless requested.
- Keep backup names specific enough to identify the task.
- If multiple files are edited, back up each one separately.

## Before Finishing A Task

Confirm:

- Which files were edited.
- Which backups were created.
- Which local verification was run.
- Whether any verification could not be run.

