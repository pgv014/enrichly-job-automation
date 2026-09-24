# Flowrun — Job Automation Platform

A small job automation platform built for the Enrichly HR Full Stack Developer Intern assignment. Users can create jobs, trigger them, inspect execution history, and understand failures/retries.

## Stack
- Next.js 15 / React / TypeScript
- Prisma ORM + PostgreSQL
- Next.js Route Handlers for the backend API
- In-process execution worker for the take-home demo

## Local setup
1. Install Node.js 20+ and PostgreSQL.
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Run:

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000.

## API
- `GET/POST /api/jobs`
- `GET/PATCH/DELETE /api/jobs/:id`
- `GET/POST /api/executions`
- `GET /api/health`

To test a failure, create a job pointing to `https://httpbin.org/status/500`. The execution is marked failed and retry executions are queued up to the configured retry limit.

## Environment variables
- `DATABASE_URL`: PostgreSQL connection string.

## Deployment
Provision PostgreSQL, set `DATABASE_URL` in the hosting provider, run `npx prisma migrate deploy` during deployment, and deploy as a standard Next.js application
.
