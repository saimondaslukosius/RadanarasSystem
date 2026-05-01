# Codex Project Instructions

These instructions apply to all AI work inside:

`C:\Users\saimo\RadanarasSystem`

## Core Workflow

- Work only in the local project folder unless the user explicitly gives another path.
- Do not make big changes on the live server.
- Do not deploy, push, or publish without explicit user permission.
- Handle one task at a time.
- Read the relevant project structure and files before editing.
- Preserve currently working features.
- Do not perform large refactors without permission.
- Always create a backup before editing any existing project file.
- Test locally before commit, push, or deploy.

## Current Priority

The current priority is fixing select/dropdown issues in the Orders forms.

Focus investigation and edits on the smallest relevant area first. Avoid unrelated UI, data model, backend, or architecture changes unless the user approves them.

## Editing Rules

- Do not modify app code unless the user asks for a code change.
- Before editing, identify the exact files that will be touched.
- Back up each existing file before editing it.
- Keep changes small and reversible.
- Do not delete old backups unless the user asks.
- Do not rewrite working modules just to improve style.
- Do not change data files unless the task requires it and a backup has been made.

## Verification

- Run the smallest useful local verification after changes.
- For frontend work, prefer `npm run build` and targeted browser checks when relevant.
- For backend work, start or test locally before claiming the fix works.
- Report any verification that could not be run.

