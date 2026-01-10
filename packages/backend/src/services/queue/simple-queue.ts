import { EventEmitter } from 'events';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job<T = any> {
  id: string;
  type: string;
  data: T;
  status: JobStatus;
  result?: any;
  error?: any;
  createdAt: number;
  updatedAt: number;
}

export class SimpleJobQueue extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private processing: boolean = false;
  private processor: (job: Job) => Promise<any>;

  constructor(processor: (job: Job) => Promise<any>) {
    super();
    this.processor = processor;
  }

  async add(type: string, data: any): Promise<Job> {
    const job: Job = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    this.jobs.set(job.id, job);
    this.emit('jobAdded', job);
    this.processNext();
    return job;
  }

  get(jobId: string): Job | undefined {
    return this.jobs.get(jobId);
  }

  private async processNext() {
    if (this.processing) return;
    
    const nextJob = Array.from(this.jobs.values()).find(j => j.status === 'pending');
    if (!nextJob) return;

    this.processing = true;
    nextJob.status = 'processing';
    nextJob.updatedAt = Date.now();
    this.jobs.set(nextJob.id, nextJob);
    this.emit('jobProcessing', nextJob);

    try {
      const result = await this.processor(nextJob);
      nextJob.status = 'completed';
      nextJob.result = result;
      this.emit('jobCompleted', nextJob);
    } catch (error) {
      nextJob.status = 'failed';
      nextJob.error = error;
      this.emit('jobFailed', nextJob);
    } finally {
      nextJob.updatedAt = Date.now();
      this.jobs.set(nextJob.id, nextJob);
      this.processing = false;
      // Process next immediately
      setImmediate(() => this.processNext());
    }
  }
}
