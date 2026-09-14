# Engineering Notes

## Overview
Flowrun is a focused job automation product. The frontend is a Next.js client interface; route handlers provide the backend API; Prisma maps jobs and executions to PostgreSQL. The initial product supports manual execution, execution history, HTTP status/error visibility, timeouts, and bounded retries.

## Data model
`Job` stores the automation definition and operational policy: endpoint, method, schedule label, timeout, and retry limit. `Execution` is append-only event history linked to a job. Indexes support job history queries and status filtering. Execution status is one of `queued`, `running`, `succeeded`, or `failed`.

## Execution and concurrency decisions
A manual trigger creates exactly one execution row before work begins. The execution ID is then passed to the runner. The runner checks that the execution is still `queued` before changing it to `running`, which prevents accidental re-processing of a completed execution by the same process.

For a production queue, I would use PostgreSQL row locking (`SELECT ... FOR UPDATE SKIP LOCKED`) or a durable queue such as Redis/SQS. A worker lease with `locked_at`, `locked_by`, and a visibility timeout would recover jobs from crashed workers. The current in-process runner is intentionally small and easy to demonstrate within the assignment timebox; it is not a replacement for a durable multi-worker queue.

## Retries and failures
HTTP non-2xx responses and network/timeout errors are recorded as failures with a human-readable message. Retry attempts are bounded by `retryLimit` and use exponential backoff capped at 30 seconds. Response bodies are truncated to 10,000 characters to avoid uncontrolled storage growth.

## Idempotency and duplicate requests
The execution record is created before execution, so every explicit Run Now click has a visible audit record. The current API does not accept an idempotency key. In production I would require an idempotency key for trigger requests and enforce a unique `(job_id, idempotency_key)` constraint.

## Product decisions
- Manual execution is the primary path because it is deterministic for a take-home demo.
- A compact dashboard shows total jobs, success/failure counts, and success rate.
- Failure details are stored on each execution rather than hidden in server logs.
- Schedule is represented in the model/UI, while a durable scheduler is a follow-up feature.
- Authentication/authorization is omitted from the demo UI because there is one workspace; it must be added before multi-tenant use.

## Known limitations
- The worker is in-process, so work is lost if the server is terminated during execution.
- Schedule labels are stored but not actively scheduled.
- No authentication, multi-tenancy, secrets vault, request payload editor, cancellation, or live websocket updates.
- Concurrent triggers are not globally deduplicated.
- Endpoint allowlisting/SSRF protection is required before exposing this to untrusted users.

## Next improvements
1. Add auth and tenant-scoped authorization.
2. Add a durable queue and worker service with leases and heartbeats.
3. Add cron parsing and a scheduler service.
4. Add idempotency keys, cancellation, structured logs, and alerting.
5. Add integration tests for retries, concurrent claims, authorization, and stale-worker recovery.
