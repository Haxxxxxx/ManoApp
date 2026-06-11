/**
 * Queue Interface
 *
 * Two backends, selected by the QUEUE_MODE env var:
 *
 * - 'inline' (default): jobs run synchronously inside the enqueueing
 *   invocation. Cloud Functions throttles CPU after the response is sent,
 *   so fire-and-forget background work would be silently killed — awaiting
 *   the job within the request lifecycle is the only safe in-process option.
 *   No retries; a thrown handler error surfaces to the caller's logs and the
 *   submission is marked failed by the handler itself.
 *
 * - 'cloud-tasks': jobs are dispatched to the Cloud Tasks queue backing the
 *   matching onTaskDispatched function (see jobs/taskQueues.ts). Durable,
 *   with retry/backoff handled by Cloud Tasks. Requires the task functions
 *   to be deployed and the Cloud Tasks API enabled on the project.
 */

import { logger } from 'firebase-functions';
import { getFunctions } from 'firebase-admin/functions';

/**
 * Job data interface
 */
export interface JobData {
  [key: string]: unknown;
}

/**
 * Job handler function type
 */
export type JobHandler = (data: JobData) => Promise<void>;

/**
 * Maps queue job names to the deployed onTaskDispatched function that
 * processes them. Keep in sync with jobs/taskQueues.ts exports in index.ts.
 */
const TASK_FUNCTION_BY_JOB: Record<string, string> = {
  submitToProvider: 'submitToProviderTask',
};

/**
 * Inline queue implementation (default)
 */
class InlineQueue {
  private jobs: Array<{ name: string; data: JobData }> = [];
  private processors: Map<string, JobHandler> = new Map();
  private processing = false;

  /**
   * Enqueue a job and process it before returning — see module docblock for
   * why processing must complete within the request lifecycle.
   */
  async enqueue(jobName: string, data: JobData): Promise<void> {
    logger.info(`Enqueuing job: ${jobName}`, { data: sanitizeData(data) });
    this.jobs.push({ name: jobName, data });

    if (!this.processing) {
      await this.processJobs();
    }
  }

  /**
   * Register a job processor
   */
  process(jobName: string, handler: JobHandler): void {
    this.processors.set(jobName, handler);
    logger.info(`Registered processor for job: ${jobName}`);
  }

  /**
   * Process queued jobs
   */
  private async processJobs(): Promise<void> {
    if (this.processing || this.jobs.length === 0) {
      return;
    }

    this.processing = true;

    while (this.jobs.length > 0) {
      const job = this.jobs.shift();
      if (!job) break;

      const handler = this.processors.get(job.name);
      if (handler) {
        try {
          logger.info(`Processing job: ${job.name}`);
          await handler(job.data);
          logger.info(`Job completed: ${job.name}`);
        } catch (error) {
          logger.error(`Job failed: ${job.name}`, error);
          // Inline mode has no retries — the handler is responsible for
          // persisting failure state (e.g. submission status = 'failed')
        }
      } else {
        logger.warn(`No processor registered for job: ${job.name}`);
      }
    }

    this.processing = false;
  }
}

const inlineQueue = new InlineQueue();

function useCloudTasks(): boolean {
  return process.env.QUEUE_MODE === 'cloud-tasks';
}

/**
 * Enqueue a job on the configured backend
 */
export async function enqueueJob(jobName: string, data: JobData): Promise<void> {
  if (useCloudTasks()) {
    const taskFunction = TASK_FUNCTION_BY_JOB[jobName];
    if (!taskFunction) {
      throw new Error(`No task function mapped for job: ${jobName}`);
    }
    await getFunctions().taskQueue(taskFunction).enqueue(data);
    logger.info(`Dispatched job to Cloud Tasks: ${jobName} -> ${taskFunction}`, {
      data: sanitizeData(data),
    });
    return;
  }

  logger.warn(
    'QUEUE_MODE is not "cloud-tasks": job runs inline within this invocation. ' +
    'Set QUEUE_MODE=cloud-tasks in production for durable, retried processing.'
  );
  await inlineQueue.enqueue(jobName, data);
}

/**
 * Register a job processor (inline mode only — in cloud-tasks mode the
 * onTaskDispatched functions in jobs/taskQueues.ts are the processors)
 */
export function processJob(jobName: string, handler: JobHandler): void {
  inlineQueue.process(jobName, handler);
}

/**
 * Sanitize data for logging (remove sensitive information)
 */
function sanitizeData(data: JobData): JobData {
  const sanitized: JobData = { ...data };
  if ('manifest' in sanitized) {
    sanitized.manifest = '[REDACTED]';
  }
  if ('userId' in sanitized) {
    sanitized.userId = '[REDACTED]';
  }
  return sanitized;
}
