/**
 * Unit tests for the Extract Chart Data Tool
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies
const mockSearchBM25 = vi.fn();

vi.mock('../../../services/opensearch/index.js', () => ({
    createOpenSearchClient: () => ({
        searchBM25: mockSearchBM25
    })
}));

vi.mock('../../../config/index.js', () => ({
    getSettings: () => ({})
}));

import { extractChartDataTool } from './extract_chart_data.js';

describe('extractChartDataTool', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('successful extraction', () => {
        it('should extract data points from search results', async () => {
            mockSearchBM25.mockResolvedValue({
                hits: [
                    { chunkText: 'Model A: 95.2% accuracy on ImageNet' },
                    { chunkText: 'Model B: 93.5% on the same benchmark' }
                ]
            });

            const result = await extractChartDataTool.execute({
                query: 'ImageNet accuracy',
                chartType: 'bar-chart'
            }) as any;

            expect(result.success).toBe(true);
            expect(result.chartType).toBe('bar-chart');
            expect(result.extractedData.labels.length).toBeGreaterThan(0);
        });

        it('should parse percentage values correctly', async () => {
            mockSearchBM25.mockResolvedValue({
                hits: [
                    { chunkText: 'ResNet: 94.5%' }
                ]
            });

            const result = await extractChartDataTool.execute({
                query: 'accuracy results',
                chartType: 'bar-chart'
            }) as any;

            expect(result.success).toBe(true);
            expect(result.extractedData.labels).toContain('ResNet');
            expect(result.extractedData.values).toContain(94.5);
        });

        it('should limit results to maxResults', async () => {
            mockSearchBM25.mockResolvedValue({
                hits: []
            });

            await extractChartDataTool.execute({
                query: 'test',
                chartType: 'line-chart',
                maxResults: 10
            });

            expect(mockSearchBM25).toHaveBeenCalledWith('test', { size: 10 });
        });

        it('should default maxResults to 5', async () => {
            mockSearchBM25.mockResolvedValue({
                hits: []
            });

            await extractChartDataTool.execute({
                query: 'test',
                chartType: 'comparison'
            });

            expect(mockSearchBM25).toHaveBeenCalledWith('test', { size: 5 });
        });

        it('should limit extracted data points to 6', async () => {
            mockSearchBM25.mockResolvedValue({
                hits: [
                    { chunkText: 'A: 1%, B: 2%, C: 3%, D: 4%, E: 5%, F: 6%, G: 7%, H: 8%' }
                ]
            });

            const result = await extractChartDataTool.execute({
                query: 'test',
                chartType: 'bar-chart'
            }) as any;

            expect(result.extractedData.labels.length).toBeLessThanOrEqual(6);
            expect(result.extractedData.values.length).toBeLessThanOrEqual(6);
        });
    });

    describe('no results', () => {
        it('should return failure when no hits found', async () => {
            mockSearchBM25.mockResolvedValue({
                hits: []
            });

            const result = await extractChartDataTool.execute({
                query: 'nonexistent data',
                chartType: 'bar-chart'
            }) as any;

            expect(result.success).toBe(false);
            expect(result.message).toContain('No matching data found');
            expect(result.extractedData).toBeNull();
        });
    });

    describe('error handling', () => {
        it('should handle search errors gracefully', async () => {
            mockSearchBM25.mockRejectedValue(new Error('OpenSearch connection failed'));

            const result = await extractChartDataTool.execute({
                query: 'test',
                chartType: 'line-chart'
            }) as any;

            expect(result.success).toBe(false);
            expect(result.message).toContain('Error extracting data');
            expect(result.extractedData).toBeNull();
        });
    });

    describe('pattern matching', () => {
        it('should match "Label: value" pattern', async () => {
            mockSearchBM25.mockResolvedValue({
                hits: [
                    { chunkText: 'GPT-4: 86.4%, Claude: 82.1%' }
                ]
            });

            const result = await extractChartDataTool.execute({
                query: 'model comparison',
                chartType: 'bar-chart'
            }) as any;

            expect(result.success).toBe(true);
            expect(result.extractedData.labels.length).toBeGreaterThan(0);
            expect(result.extractedData.values.length).toBeGreaterThan(0);
        });

        it('should include raw chunks in response', async () => {
            mockSearchBM25.mockResolvedValue({
                hits: [
                    { chunkText: 'Performance results: Transformer: 90%' }
                ]
            });

            const result = await extractChartDataTool.execute({
                query: 'performance',
                chartType: 'comparison'
            }) as any;

            expect(result.success).toBe(true);
            expect(result.extractedData.rawChunks).toBeDefined();
            expect(result.extractedData.rawChunks.length).toBeGreaterThan(0);
        });
    });
});
