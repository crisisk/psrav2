# Contributing Guide

## Getting Started
1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and adjust credentials.
3. Start the development server with `npm run dev`.

## Development Standards
- Follow the existing TypeScript and React patterns in `app/` and `components/`.
- Use Zod schemas for request validation in API routes.
- Keep database access behind helpers in `lib/repository.ts`.

## Quality Gates
- Run `npm run lint`, `npm run typecheck`, and `npm run test` before pushing changes.
- Commit messages should use the conventional commits style (e.g. `feat: add certificate batch endpoint`).

## Pull Requests
- Describe the motivation and summarize the changes in the PR description.
- Link to related issues or roadmap items from `docs/roadmap-vNext.md`.
- Ensure GitHub Actions checks pass before requesting review.
