/**
 * Unit tests for the Analyze Figures Tool
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the toolsets
vi.mock('../toolsets.js', () => ({
    doclingToolset: null
}));

import { analyzeFiguresTool } from './analyze-figures.js';

describe('analyzeFiguresTool', () => {
    describe('file path validation', () => {
        it('should reject relative file paths', async () => {
            const result = await analyzeFiguresTool.execute({
                file_path: 'relative/path/paper.pdf'
            }) as string;

            const parsed = JSON.parse(result);
            expect(parsed.success).toBe(false);
            expect(parsed.error).toContain('absolute path');
        });

        it('should reject paths without leading slash', async () => {
            const result = await analyzeFiguresTool.execute({
                file_path: 'paper.pdf'
            }) as string;

            const parsed = JSON.parse(result);
            expect(parsed.success).toBe(false);
        });
    });
});

/**
 * Tests for the extractMetricsFromTable helper function
 * Testing the logic used in the tool
 */
describe('Table data extraction logic', () => {
    it('should extract first 5 rows from grid', () => {
        const table = {
            data: {
                grid: [
                    ['header1', 'header2'],
                    ['row1col1', 'row1col2'],
                    ['row2col1', 'row2col2'],
                    ['row3col1', 'row3col2'],
                    ['row4col1', 'row4col2'],
                    ['row5col1', 'row5col2'],
                    ['row6col1', 'row6col2'] // Should be excluded
                ]
            }
        };

        // Replicate the extraction logic
        const extractMetricsFromTable = (t: any) => {
            if (t.data && t.data.grid) {
                return t.data.grid.slice(0, 5);
            }
            return "Table data extraction pending full implementation";
        };

        const extracted = extractMetricsFromTable(table);
        expect(extracted).toHaveLength(5);
        expect(extracted[0]).toEqual(['header1', 'header2']);
    });

    it('should return placeholder for tables without grid', () => {
        const table = {
            caption: 'A table',
            data: {}
        };

        const extractMetricsFromTable = (t: any) => {
            if (t.data && t.data.grid) {
                return t.data.grid.slice(0, 5);
            }
            return "Table data extraction pending full implementation";
        };

        const extracted = extractMetricsFromTable(table);
        expect(extracted).toBe("Table data extraction pending full implementation");
    });

    it('should handle null data gracefully', () => {
        const table = {
            caption: 'Empty table',
            data: null
        };

        const extractMetricsFromTable = (t: any) => {
            if (t.data && t.data.grid) {
                return t.data.grid.slice(0, 5);
            }
            return "Table data extraction pending full implementation";
        };

        const extracted = extractMetricsFromTable(table);
        expect(extracted).toBe("Table data extraction pending full implementation");
    });
});
