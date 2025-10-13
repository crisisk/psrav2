import type { Job, Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import { config, isNotificationEnabled, isTaskQueueEnabled } from './config';
import { notificationService } from './notification-service';

type QueueMap = {
  origin?: Queue;
  pdf?: Queue;
  bulk?: Queue;
  email?: Queue;
  human?: Queue;
};

export interface OriginCalculationJob {
  type: 'origin-calculation';
  data: {
    requestId: string;
    productSku: string;
    hsCode: string;
    tradeAgreement: string;
    materials: any[];
    productValue: number;
    userId?: string;
  };
}

export interface PDFGenerationJob {
  type: 'pdf-generation';
  data: {
    certificateId: string;
    userId?: string;
  };
}

export interface BulkImportJob {
  type: 'bulk-import';
  data: {
    importType: 'hs-codes' | 'origin-rules' | 'certificates';
    filePath: string;
    userId?: string;
  };
}

export interface EmailNotificationJob {
  type: 'email-notification';
  data: {
    to: string;
    subject: string;
    body: string;
    attachments?: string[];
  };
}

export interface HumanReviewJob {
  type: 'human-review';
  data: {
    requestId: string;
    productSku: string;
    hsCode: string;
    tradeAgreement: string;
    reason: string;
    aiSummary?: string;
    dissentingOpinions?: string[];
  };
}

export type JobData =
  | OriginCalculationJob
  | PDFGenerationJob
  | BulkImportJob
  | EmailNotificationJob
  | HumanReviewJob;

export class TaskQueueService {
  private connection: Redis | null = null;
  private queues: QueueMap = {};
  private workers: Worker[] = [];
  private enabled = isTaskQueueEnabled && Boolean(config.redisUrl);
  private ready: Promise<void>;

  constructor() {
    this.ready = this.enabled ? this.initialize() : Promise.resolve();
  }

  private async initialize(): Promise<void> {
    try {
      if (!config.redisUrl) {
        this.enabled = false;
        return;
      }

      const { Queue, Worker } = await import('bullmq');
      this.connection = new Redis(config.redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: null,
      });

      this.connection.on('error', (error) => {
        console.warn('Task queue Redis error:', error.message);
      });

      await this.connection.connect();

      this.queues.origin = new Queue('origin-calculations', { connection: this.connection });
      this.queues.pdf = new Queue('pdf-generation', { connection: this.connection });
      this.queues.bulk = new Queue('bulk-import', { connection: this.connection });
      this.queues.email = new Queue('email-notifications', { connection: this.connection });
      this.queues.human = new Queue('human-review', { connection: this.connection });

      this.workers = [
        new Worker('origin-calculations', async (job: Job) => this.processOriginCalculation(job.data), {
          connection: this.connection,
          concurrency: 5,
        }),
        new Worker('pdf-generation', async (job: Job) => this.processPDFGeneration(job.data), {
          connection: this.connection,
          concurrency: 3,
        }),
        new Worker('bulk-import', async (job: Job) => this.processBulkImport(job.data), {
          connection: this.connection,
          concurrency: 1,
        }),
        new Worker('email-notifications', async (job: Job) => this.processEmailNotification(job.data), {
          connection: this.connection,
          concurrency: 10,
        }),
        new Worker('human-review', async (job: Job) => this.processHumanReview(job.data), {
          connection: this.connection,
          concurrency: 2,
        }),
      ];

      this.workers.forEach((worker) => {
        worker.on('error', (error) => console.error(`Worker error (${worker.name}):`, error));
        worker.on('failed', (job, error) => console.error(`Job ${job?.id} failed (${worker.name}):`, error));
      });
    } catch (error) {
      console.warn('Task queue initialisation failed, falling back to inline processing:', error);
      this.enabled = false;
      this.connection = null;
      this.queues = {};
      await this.close();
    }
  }

  private async ensureReady(): Promise<boolean> {
    await this.ready;
    return this.enabled && Boolean(this.connection);
  }

  async queueOriginCalculation(data: OriginCalculationJob['data']): Promise<string> {
    if (!(await this.ensureReady()) || !this.queues.origin) {
      const { originEngine } = await import('./advanced-origin-engine');
      await originEngine.calculateOrigin({
        productSku: data.productSku,
        hsCode: data.hsCode,
        tradeAgreement: data.tradeAgreement,
        materials: data.materials,
        productValue: data.productValue,
      });
      return `inline-${Date.now()}`;
    }

    const job = await this.queues.origin.add('calculate', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    });
    return job.id!;
  }

  async queuePDFGeneration(data: PDFGenerationJob['data']): Promise<string> {
    if (!(await this.ensureReady()) || !this.queues.pdf) {
      await this.processPDFGeneration(data);
      return `inline-${Date.now()}`;
    }

    const job = await this.queues.pdf.add('generate', data, {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });
    return job.id!;
  }

  async queueBulkImport(data: BulkImportJob['data']): Promise<string> {
    if (!(await this.ensureReady()) || !this.queues.bulk) {
      await this.processBulkImport(data);
      return `inline-${Date.now()}`;
    }

    const job = await this.queues.bulk.add('import', data, {
      attempts: 1,
    });
    return job.id!;
  }

  async queueEmailNotification(data: EmailNotificationJob['data']): Promise<string> {
    if (!(await this.ensureReady()) || !this.queues.email) {
      if (isNotificationEnabled) {
        await notificationService.sendNotification({
          type: 'system_alert',
          title: data.subject,
          message: data.body,
          priority: 'medium',
          data,
        });
      } else {
        console.info('[email-notification]', data.subject, data.body);
      }
      return `inline-${Date.now()}`;
    }

    const job = await this.queues.email.add('send', data, {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
    return job.id!;
  }

  async queueHumanReview(data: HumanReviewJob['data']): Promise<string> {
    if (!(await this.ensureReady()) || !this.queues.human) {
      console.info('[human-review]', data.requestId, data.reason, data.aiSummary);
      return `inline-${Date.now()}`;
    }

    const job = await this.queues.human.add('review', data, {
      attempts: 1,
      removeOnComplete: true,
    });

    if (isNotificationEnabled) {
      await notificationService.sendNotification({
        type: 'system_alert',
        title: 'Human review required',
        message: `Origin calculation ${data.requestId} requires manual validation.`,
        priority: 'high',
        data,
      });
    }

    return job.id!;
  }

  private async processOriginCalculation(data: OriginCalculationJob['data']): Promise<any> {
    const { originEngine } = await import('./advanced-origin-engine');
    const result = await originEngine.calculateOrigin({
      productSku: data.productSku,
      hsCode: data.hsCode,
      tradeAgreement: data.tradeAgreement,
      materials: data.materials,
      productValue: data.productValue,
    });

    if (data.userId && isNotificationEnabled) {
      await notificationService.sendNotification({
        type: 'system_alert',
        title: 'Origin calculation completed',
        message: `Origin calculation for ${data.productSku} completed (${result.isConform ? 'conforming' : 'non-conforming'}).`,
        priority: result.isConform ? 'low' : 'high',
        data: { requestId: data.requestId, result },
      });
    }

    return result;
  }

  private async processPDFGeneration(data: PDFGenerationJob['data']): Promise<Buffer> {
    const { pdfGenerator } = await import('./pdf-generator');
    const { getCertificateById } = await import('./repository');

    const certificate = await getCertificateById(data.certificateId);
    if (!certificate) {
      throw new Error(`Certificate ${data.certificateId} not found`);
    }

    const pdf = pdfGenerator.generateCertificate({
      ...certificate,
      result: certificate.result as any,
    });

    if (data.userId && isNotificationEnabled) {
      await notificationService.sendNotification({
        type: 'system_alert',
        title: 'Certificate PDF generated',
        message: `PDF certificate for ${certificate.productSku} is ready.`,
        priority: 'medium',
        data: { certificateId: certificate.id },
      });
    }

    return pdf;
  }

  private async processBulkImport(data: BulkImportJob['data']): Promise<{ imported: number; errors: number }> {
    console.info('Bulk import request received (mock processing):', data.importType, data.filePath);
    return { imported: 0, errors: 0 };
  }

  private async processEmailNotification(data: EmailNotificationJob['data']): Promise<void> {
    if (isNotificationEnabled) {
      await notificationService.sendNotification({
        type: 'system_alert',
        title: data.subject,
        message: data.body,
        priority: 'medium',
        data,
      });
    } else {
      console.info('[queue-email]', data.subject, data.body);
    }
  }

  private async processHumanReview(data: HumanReviewJob['data']): Promise<void> {
    if (isNotificationEnabled) {
      await notificationService.sendNotification({
        type: 'system_alert',
        title: 'HITL consensus required',
        message: `Manual validation required for ${data.productSku} (${data.hsCode} - ${data.tradeAgreement}).`,
        priority: 'critical',
        data,
      });
    } else {
      console.warn('[human-review]', 'Manual validation required', data);
    }
  }

  async getQueueStats(): Promise<Record<string, any>> {
    if (!(await this.ensureReady()) || !this.queues.origin) {
      return { enabled: false };
    }

    const stats: Record<string, any> = {};
    const entries: Array<[string, Queue | undefined]> = [
      ['origin', this.queues.origin],
      ['pdf', this.queues.pdf],
      ['bulk', this.queues.bulk],
      ['email', this.queues.email],
      ['human', this.queues.human],
    ];

    for (const [name, queue] of entries) {
      if (!queue) continue;
      const [waiting, active, completed, failed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
      ]);

      stats[name] = {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
      };
    }

    return stats;
  }

  async close(): Promise<void> {
    await Promise.all(
      this.workers.map(async (worker) => {
        try {
          await worker.close();
        } catch (error) {
          console.warn('Error closing worker:', error);
        }
      })
    );

    const queues = Object.values(this.queues).filter(Boolean) as Queue[];
    await Promise.all(queues.map((queue) => queue.close().catch((error) => console.warn('Error closing queue:', error))));

    if (this.connection) {
      await this.connection.quit().catch((error) => console.warn('Error closing Redis connection:', error));
      this.connection = null;
    }
  }

  async getStatus() {
    const ready = await this.ensureReady();
    return {
      enabled: this.enabled,
      connected: ready,
      queues: Object.keys(this.queues).filter((key) => Boolean(this.queues[key as keyof QueueMap])),
    };
  }
}

export const taskQueue = new TaskQueueService();
