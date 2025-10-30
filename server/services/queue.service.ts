import { Queue, Worker, Job, QueueEvents } from "bullmq";
import Redis from "ioredis";
import { workflowExecutor } from "./workflow-executor.service";
import { logger } from "./logger.service";

const connection = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

export interface WorkflowJobData {
  executionId: string;
  workflowId: string;
  leadId: string;
}

export const workflowQueue = new Queue<WorkflowJobData>("workflow-executions", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: {
      age: 86400,
      count: 100,
    },
    removeOnFail: {
      age: 604800,
    },
  },
});

export const workflowWorker = new Worker<WorkflowJobData>(
  "workflow-executions",
  async (job: Job<WorkflowJobData>) => {
    logger.info(`Processing workflow execution job ${job.id}`, {
      executionId: job.data.executionId,
      workflowId: job.data.workflowId,
      leadId: job.data.leadId,
    });

    try {
      await workflowExecutor.executeWorkflow(job.data.executionId);
      logger.info(`Successfully completed workflow execution ${job.data.executionId}`);
      return { success: true, executionId: job.data.executionId };
    } catch (error: any) {
      logger.error(`Failed to execute workflow ${job.data.executionId}`, error);
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

workflowWorker.on("completed", (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

workflowWorker.on("failed", (job, error) => {
  if (job) {
    logger.error(`Job ${job.id} failed`, error, {
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts,
    });
  }
});

export const queueEvents = new QueueEvents("workflow-executions", { connection });

queueEvents.on("waiting", ({ jobId }) => {
  logger.debug(`Job ${jobId} is waiting`);
});

queueEvents.on("active", ({ jobId }) => {
  logger.debug(`Job ${jobId} is active`);
});

queueEvents.on("progress", ({ jobId, data }) => {
  logger.debug(`Job ${jobId} progress`, { data });
});

export async function enqueueWorkflowExecution(
  executionId: string,
  workflowId: string,
  leadId: string
): Promise<Job<WorkflowJobData>> {
  const job = await workflowQueue.add(
    "execute-workflow",
    {
      executionId,
      workflowId,
      leadId,
    },
    {
      jobId: executionId,
    }
  );

  logger.info(`Enqueued workflow execution ${executionId}`, {
    jobId: job.id,
    workflowId,
    leadId,
  });

  return job;
}

export async function pauseWorkflowExecution(executionId: string): Promise<boolean> {
  const job = await workflowQueue.getJob(executionId);
  if (job) {
    const state = await job.getState();
    if (state === "active" || state === "waiting" || state === "delayed") {
      await job.moveToDelayed(Date.now() + 86400000, job.token);
    }
    logger.info(`Paused workflow execution ${executionId}`);
    return true;
  }
  return false;
}

export async function resumeWorkflowExecution(executionId: string): Promise<boolean> {
  const job = await workflowQueue.getJob(executionId);
  if (job) {
    const state = await job.getState();
    if (state === "delayed" || state === "failed") {
      await job.retry();
    }
    logger.info(`Resumed workflow execution ${executionId}`);
    return true;
  }
  return false;
}

export async function getWorkflowJobStatus(executionId: string) {
  const job = await workflowQueue.getJob(executionId);
  if (!job) {
    return null;
  }

  const state = await job.getState();
  return {
    id: job.id,
    state,
    progress: job.progress,
    attemptsMade: job.attemptsMade,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
    returnvalue: job.returnvalue,
    failedReason: job.failedReason,
  };
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, closing worker and queue...");
  await workflowWorker.close();
  await workflowQueue.close();
  await connection.quit();
});
