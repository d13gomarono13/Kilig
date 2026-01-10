/**
 * Unit tests for the SimpleJobQueue
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SimpleJobQueue, Job, JobStatus } from './simple-queue.js';

describe('SimpleJobQueue', () => {
    let queue: SimpleJobQueue;
    let mockProcessor: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        mockProcessor = vi.fn().mockResolvedValue({ success: true });
        queue = new SimpleJobQueue(mockProcessor);
    });

    describe('constructor', () => {
        it('should create a queue with a processor', () => {
            expect(queue).toBeDefined();
        });
    });

    describe('add', () => {
        it('should add a job to the queue', async () => {
            const job = await queue.add('test-job', { message: 'hello' });

            expect(job).toBeDefined();
            expect(job.id).toMatch(/^job_/);
            expect(job.type).toBe('test-job');
            expect(job.data).toEqual({ message: 'hello' });
        });

        it('should set initial job status to pending or start processing immediately', async () => {
            // Use a slow processor to catch the pending state
            const slowQueue = new SimpleJobQueue(async () => {
                await new Promise(r => setTimeout(r, 100));
                return {};
            });
            const job = await slowQueue.add('test', {});

            // Job should be pending or processing (depending on timing)
            expect(['pending', 'processing'].includes(job.status)).toBe(true);
        });

        it('should set createdAt timestamp', async () => {
            const before = Date.now();
            const job = await queue.add('test', {});
            const after = Date.now();

            expect(job.createdAt).toBeGreaterThanOrEqual(before);
            expect(job.createdAt).toBeLessThanOrEqual(after);
        });

        it('should emit jobAdded event', async () => {
            const spy = vi.fn();
            queue.on('jobAdded', spy);

            await queue.add('test', {});

            expect(spy).toHaveBeenCalled();
        });

        it('should trigger processing', async () => {
            await queue.add('process-me', { value: 42 });

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockProcessor).toHaveBeenCalled();
        });
    });

    describe('get', () => {
        it('should retrieve an existing job by id', async () => {
            const added = await queue.add('test', { key: 'value' });
            const retrieved = queue.get(added.id);

            expect(retrieved).toBeDefined();
            expect(retrieved!.id).toBe(added.id);
        });

        it('should return undefined for non-existent job', () => {
            const result = queue.get('non-existent-id');

            expect(result).toBeUndefined();
        });
    });

    describe('processing', () => {
        it('should call processor with job', async () => {
            const job = await queue.add('test-type', { data: 123 });

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(mockProcessor).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: job.id,
                    type: 'test-type'
                })
            );
        });

        it('should emit jobProcessing event', async () => {
            const spy = vi.fn();
            queue.on('jobProcessing', spy);

            await queue.add('test', {});
            await new Promise(resolve => setTimeout(resolve, 10));

            expect(spy).toHaveBeenCalled();
        });

        it('should emit jobCompleted on success', async () => {
            const completedSpy = vi.fn();
            queue.on('jobCompleted', completedSpy);

            await queue.add('test', {});
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(completedSpy).toHaveBeenCalled();
        });

        it('should set job result on completion', async () => {
            mockProcessor.mockResolvedValue({ result: 'done' });

            const job = await queue.add('test', {});
            await new Promise(resolve => setTimeout(resolve, 20));

            const completed = queue.get(job.id);
            expect(completed!.status).toBe('completed');
            expect(completed!.result).toEqual({ result: 'done' });
        });

        it('should emit jobFailed on error', async () => {
            mockProcessor.mockRejectedValue(new Error('Processing failed'));
            const failedSpy = vi.fn();
            queue.on('jobFailed', failedSpy);

            await queue.add('failing-job', {});
            await new Promise(resolve => setTimeout(resolve, 20));

            expect(failedSpy).toHaveBeenCalled();
        });

        it('should set job error on failure', async () => {
            const error = new Error('Test error');
            mockProcessor.mockRejectedValue(error);

            const job = await queue.add('test', {});
            await new Promise(resolve => setTimeout(resolve, 20));

            const failed = queue.get(job.id);
            expect(failed!.status).toBe('failed');
            expect(failed!.error).toBe(error);
        });

        it('should process jobs sequentially', async () => {
            const processOrder: string[] = [];
            mockProcessor.mockImplementation(async (job: Job) => {
                processOrder.push(job.id);
                await new Promise(r => setTimeout(r, 5));
                return { processed: job.id };
            });

            const job1 = await queue.add('first', {});
            const job2 = await queue.add('second', {});

            // Wait for both to complete
            await new Promise(resolve => setTimeout(resolve, 50));

            expect(processOrder[0]).toBe(job1.id);
            expect(processOrder[1]).toBe(job2.id);
        });
    });

    describe('Job interface', () => {
        it('should have all required properties', async () => {
            const job = await queue.add('test', { key: 'value' });

            expect(job).toHaveProperty('id');
            expect(job).toHaveProperty('type');
            expect(job).toHaveProperty('data');
            expect(job).toHaveProperty('status');
            expect(job).toHaveProperty('createdAt');
            expect(job).toHaveProperty('updatedAt');
        });
    });
});
