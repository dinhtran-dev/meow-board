# Jules Agents - Meow Board

This repository is managed by **Meow the Secretary** and **Will the Boss**.

## Project Context
Meow Board is a Trello-style task management board for tracking AI agent workflows.

## Agents & Tools
- **Meow (OpenClaw Agent):** The primary orchestrator and project secretary.
- **Jules (Google Autonomous Agent):** Responsible for implementation, refactoring, and feature additions.

## Workflow Conventions
- **Feature Requests:** Defined in GitHub Issues.
- **Implementation:** Triggered by adding the `jules` label to an issue.
- **Persistence:** Current state is managed via `public/data.json`.
- **Testing:** Playwright is used for E2E verification of the React UI.

## Build Instructions
```bash
npm install
npm start
```
