import { prisma } from './prisma';
export async function executeJob(executionId: string) {
  const execution = await prisma.execution.findUnique({ where: { id: executionId }, include: { job: true } });
  if (!execution || execution.status !== 'queued') return;
  const started = Date.now();
  await prisma.execution.update({ where: { id: executionId }, data: { status: 'running', startedAt: new Date(), attempt: { increment: 1 } } });
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), execution.job.timeoutMs);
    const response = await fetch(execution.job.endpoint, { method: execution.job.method, signal: controller.signal, headers: { 'User-Agent': 'EnrichlyJobRunner/1.0' } });
    clearTimeout(timer);
    const body = (await response.text()).slice(0, 10000);
    const failed = !response.ok;
    await prisma.execution.update({ where: { id: executionId }, data: { status: failed ? 'failed' : 'succeeded', finishedAt: new Date(), durationMs: Date.now() - started, statusCode: response.status, responseBody: body, errorMessage: failed ? `Endpoint returned HTTP ${response.status}` : null } });
    if (failed && execution.attempt < execution.job.retryLimit) await enqueueRetry(execution.jobId, execution.attempt);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown execution error';
    await prisma.execution.update({ where: { id: executionId }, data: { status: 'failed', finishedAt: new Date(), durationMs: Date.now() - started, errorMessage: message } });
    if (execution.attempt < execution.job.retryLimit) await enqueueRetry(execution.jobId, execution.attempt);
  }
}
async function enqueueRetry(jobId: string, attempt: number) {
  const retry = await prisma.execution.create({ data: { jobId, status: 'queued', attempt } });
  setTimeout(() => executeJob(retry.id), Math.min(30000, 1000 * Math.pow(2, attempt)));
}
