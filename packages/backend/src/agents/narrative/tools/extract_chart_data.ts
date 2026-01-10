import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { createOpenSearchClient } from '../../../services/opensearch/index.js';
import { getSettings } from '../../../config/index.js';

/**
 * extractChartDataTool: Uses RAG to find real data points from indexed papers.
 * 
 * The Narrative Agent calls this tool BEFORE generating a chart panel to get
 * actual numbers instead of placeholders.
 */
export const extractChartDataTool = new FunctionTool({
    name: 'extract_chart_data',
    description: `Search the indexed papers for specific numeric data to populate charts.
Use this tool when you need real data for bar-chart, line-chart, or comparison panels.
Provide a specific query like "accuracy results on ImageNet" or "training compute in FLOPs".`,
    parameters: z.object({
        query: z.string().describe('Specific query to find numeric data (e.g., "model accuracy benchmark results")'),
        chartType: z.enum(['bar-chart', 'line-chart', 'comparison']).describe('Type of chart you are generating.'),
        maxResults: z.number().optional().default(5).describe('Maximum number of chunks to search.')
    }),
    execute: async ({ query, chartType, maxResults = 5 }) => {
        console.log(`[ExtractChartData] Query: "${query}" for ${chartType}`);

        try {
            const client = createOpenSearchClient();

            // Use the client's BM25 search method
            const result = await client.searchBM25(query, { size: maxResults });

            if (result.hits.length === 0) {

                return {
                    success: false,
                    message: 'No matching data found. Use placeholder data.',
                    extractedData: null
                };
            }

            // Extract numeric patterns from the results
            const dataPoints: { label: string; value: number | string }[] = [];
            const patterns = [
                // "Model A: 95.2%"
                /([A-Za-z0-9\s\-]+):\s*([0-9]+\.?[0-9]*%?)/g,
                // "achieved 95.2% accuracy"
                /achieved\s*([0-9]+\.?[0-9]*%?)\s*([a-z]+)/gi,
                // "X vs Y (90.1 vs 88.4)"
                /([A-Za-z]+)\s*vs\.?\s*([A-Za-z]+).*?([0-9]+\.?[0-9]*).*?([0-9]+\.?[0-9]*)/gi
            ];

            for (const hit of result.hits) {
                const text = hit.chunkText || '';

                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(text)) !== null) {
                        if (match[1] && match[2]) {
                            dataPoints.push({
                                label: match[1].trim(),
                                value: match[2]
                            });
                        }
                    }
                }
            }

            // Format for chart consumption
            const labels = dataPoints.slice(0, 6).map(d => d.label);
            const values = dataPoints.slice(0, 6).map(d => {
                const numStr = String(d.value).replace('%', '');
                return parseFloat(numStr) || 0;
            });

            return {
                success: true,
                chartType,
                extractedData: {
                    labels,
                    values,
                    rawChunks: result.hits.map(h => h.chunkText?.slice(0, 200) + '...')
                },
                message: `Extracted ${dataPoints.length} data points from ${result.hits.length} chunks.`
            };

        } catch (error) {
            console.error('[ExtractChartData] Error:', error);
            return {
                success: false,
                message: `Error extracting data: ${error}`,
                extractedData: null
            };
        }
    }
});
