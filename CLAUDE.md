# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

営業日報システム（Daily Sales Report System） - A web application for sales representatives to report daily customer visits and receive feedback from managers.

**Current Status:** Design phase

## Commands

```bash
# Development
npm install          # Install dependencies
npm run dev          # Run development server
npm run build        # Build for production
npm run start        # Start production server

# Quality
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run format       # Run Prettier
npm run typecheck    # TypeScript type check
npm run test         # Run tests
npm run test:coverage # Run tests with coverage

# Database
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
npm run db:push      # Push schema to database (dev)
npm run db:studio    # Open Prisma Studio

# Deploy (via Makefile)
make deploy          # Full deployment (build, push, deploy)
make docker-build    # Build Docker image
make cloud-run-logs  # Show Cloud Run logs
make help            # Show all available commands
```

## Documentation

All design documents are in Japanese and located in `docs/`:

- `requirements.md` - Requirements specification including ER diagram (Mermaid), functional requirements, and screen list
- `api-specification.md` - REST API specification with JWT authentication, 36 endpoints covering auth, reports, visits, problems, plans, comments, customers, and salespersons
- `test-specification.md` - Test specification with ~130 test cases

## Data Model

Core entities and relationships:

- **SALESPERSON** - Sales reps and managers (self-referential for hierarchy)
- **CUSTOMER** - Customer master
- **DAILY_REPORT** - One report per salesperson per day (draft/submitted status)
- **VISIT** - Customer visits (multiple per report)
- **PROBLEM** - Issues/concerns (multiple per report, with priority)
- **PLAN** - Next day's plans (multiple per report)
- **COMMENT** - Manager comments on Problems/Plans (polymorphic: target_type + target_id)

## API Design

- Base URL pattern: `/v1/`
- Auth: JWT Bearer token
- Nested resources: `/reports/{id}/visits`, `/reports/{id}/problems`, `/reports/{id}/plans`
- Polymorphic comments: `/problems/{id}/comments`, `/plans/{id}/comments`
- Standard response: `{ "success": bool, "data": {...}, "pagination": {...} }`

## User Roles

| Role    | Permissions                                  |
| ------- | -------------------------------------------- |
| sales   | Create/edit own reports, view own data       |
| manager | View subordinates' reports, post comments    |
| admin   | Full access including master data management |

## Tech Stack

- **Language**: TypeScript
- **Framework**: Nest.js (App Router)
- **UI**: shadcn/ui + Tailwind CSS
- **API Schema**: OpenAPI (Zod validation)
- **DB Schema**: Prisma.js
- **Test**: Vitest
- **Deploy**: Google Cloud Run

## CI/CD

- **CI**: GitHub Actions (`.github/workflows/ci.yml`)
  - Lint, TypeCheck, Test, Build on push/PR
- **CD**: GitHub Actions (`.github/workflows/deploy.yml`)
  - Auto-deploy to Cloud Run on push to `main`
- **Project ID**: `dailyreportsystem-487505`
- **Region**: `asia-northeast1`
