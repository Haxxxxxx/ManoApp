/**
 * Queue Interface
 * 
 * Mock queue implementation with BullMQ skeleton for production use.
 * 
 * TODO: Replace mock implementation with BullMQ for production:
 * 1. Install bullmq: npm install bullmq
 * 2. Set BULLMQ_REDIS_URL environment variable
 * 3. Uncomment BullMQ implementation below
 * 4. Remove mock implementation
 */

import { logger } from 'firebase-functions';

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
 * Mock queue implementation
 * 
 * This is a simple in-memory queue for development/testing.
 * In production, replace with BullMQ.
 */
class MockQueue {
  private jobs: Array<{ name: string; data: JobData; handler?: JobHandler }> = [];
  private processors: Map<string, JobHandler> = new Map();
  private processing = false;

  /**
   * Enqueue a job
   */
  async enqueue(jobName: string, data: JobData): Promise<void> {
    logger.info(`Enqueuing job: ${jobName}`, { data: this.sanitizeData(data) });
    this.jobs.push({ name: jobName, data });
    
    // Process jobs asynchronously
    if (!this.processing) {
      this.processJobs();
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
          // In production, you'd want to retry failed jobs
        }
      } else {
        logger.warn(`No processor registered for job: ${job.name}`);
      }
    }

    this.processing = false;
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  private sanitizeData(data: JobData): JobData {
    const sanitized: JobData = { ...data };
    // Remove sensitive fields
    if ('manifest' in sanitized) {
      sanitized.manifest = '[REDACTED]';
    }
    if ('userId' in sanitized) {
      sanitized.userId = '[REDACTED]';
    }
    return sanitized;
  }
}

// Mock queue instance
const mockQueue = new MockQueue();

// Warn that in-memory queue will lose jobs on restart
logger.warn(
  'Using in-memory mock queue. Jobs will be lost on process restart. ' +
  'For production, migrate to BullMQ by setting BULLMQ_REDIS_URL environment variable.'
);

/**
 * Enqueue a job (mock implementation)
 * 
 * TODO: Replace with BullMQ implementation
 */
export async function enqueueJob(jobName: string, data: JobData): Promise<void> {
  await mockQueue.enqueue(jobName, data);
}

/**
 * Register a job processor (mock implementation)
 * 
 * TODO: Replace with BullMQ implementation
 */
export function processJob(jobName: string, handler: JobHandler): void {
  mockQueue.process(jobName, handler);
}

/* 
 * ============================================================================
 * BULLMQ IMPLEMENTATION (for production)
 * ============================================================================
 * 
 * Uncomment and use this implementation when ready for production:
 * 
 * import { Queue, Worker, Job } from 'bullmq';
 * import { logger } from 'firebase-functions';
 * 
 * const redisUrl = process.env.BULLMQ_REDIS_URL;
 * if (!redisUrl) {
 *   throw new Error('BULLMQ_REDIS_URL environment variable is required');
 * }
 * 
 * const connection = {
 *   host: new URL(redisUrl).hostname,
 *   port: parseInt(new URL(redisUrl).port || '6379'),
 *   password: new URL(redisUrl).password,
 * };
 * 
 * const queues: Map<string, Queue> = new Map();
 * const workers: Map<string, Worker> = new Map();
 * 
 * function getQueue(name: string): Queue {
 *   if (!queues.has(name)) {
 *     const queue = new Queue(name, { connection });
 *     queues.set(name, queue);
 *   }
 *   return queues.get(name)!;
 * }
 * 
 * export async function enqueueJob(jobName: string, data: JobData): Promise<void> {
 *   const queue = getQueue(jobName);
 *   await queue.add(jobName, data);
 *   logger.info(`Enqueued job: ${jobName}`, { data: sanitizeData(data) });
 * }
 * 
 * export function processJob(jobName: string, handler: JobHandler): void {
 *   if (workers.has(jobName)) {
 *     logger.warn(`Worker for ${jobName} already exists`);
 *     return;
 *   }
 * 
 *   const worker = new Worker(
 *     jobName,
 *     async (job: Job) => {
 *       logger.info(`Processing job: ${jobName}`, { jobId: job.id });
 *       try {
 *         await handler(job.data);
 *         logger.info(`Job completed: ${jobName}`, { jobId: job.id });
 *       } catch (error) {
 *         logger.error(`Job failed: ${jobName}`, { jobId: job.id, error });
 *         throw error; // BullMQ will handle retries
 *       }
 *     },
 *     { connection }
 *   );
 * 
 *   workers.set(jobName, worker);
 *   logger.info(`Registered worker for job: ${jobName}`);
 * }
 * 
 * function sanitizeData(data: JobData): JobData {
 *   const sanitized: JobData = { ...data };
 *   if ('manifest' in sanitized) {
 *     sanitized.manifest = '[REDACTED]';
 *   }
 *   if ('userId' in sanitized) {
 *     sanitized.userId = '[REDACTED]';
 *   }
 *   return sanitized;
 * }
 */

