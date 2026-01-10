import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { doclingToolset } from '../toolsets.js';

export const analyzeFiguresTool = new FunctionTool({
    name: 'analyze_paper_figures',
    description: 'Extract and interpret figures, charts, tables, and diagrams from scientific papers using Docling. Returns structured data about visual elements.',
    parameters: z.object({
        file_path: z.string().describe('Absolute path to the paper inside the Docling container (e.g. /app/data/papers/file.pdf)'),
        pages: z.array(z.number()).optional().describe('Specific pages to analyze (not fully supported by CLI yet, analyzes all)')
    }),
    execute: async ({ file_path, pages }) => {
        console.log(`[Scientist] Analyzing figures in paper: ${file_path}`);

        // Validate path (must be absolute structure inside container)
        if (!file_path.startsWith('/')) {
            return JSON.stringify({
                success: false,
                error: "File path must be absolute path inside the Docling container (e.g. /app/data/papers/...)"
            });
        }

        try {
            console.log(`[Scientist] Executing Docling CLI via Docker...`);

            const { exec } = await import('node:child_process');
            const { promisify } = await import('node:util');
            const execAsync = promisify(exec);

            // 1. Run Docling conversion to JSON
            // We output to a temp dir inside container
            const outputDir = '/tmp/docling_out_' + Date.now();
            const cmd = `docker exec kilig-mcp-docling uv tool run docling "${file_path}" --to json --output "${outputDir}" --no-ocr`;

            console.log(`[Scientist] Running: ${cmd}`);
            await execAsync(cmd);

            // 2. Read the result file
            // Docling names output file same as input basename but .json
            const basename = file_path.split('/').pop()?.replace(/\.[^/.]+$/, "") || "document";
            const jsonPath = `${outputDir}/${basename}.json`;

            const readCmd = `docker exec kilig-mcp-docling cat "${jsonPath}"`;
            const { stdout } = await execAsync(readCmd);

            // 3. Cleanup
            try {
                await execAsync(`docker exec kilig-mcp-docling rm -rf "${outputDir}"`);
            } catch (e) {
                console.warn('Cleanup failed (ignoring):', e);
            }

            const docData = JSON.parse(stdout);

            // 4. Extract Visual Data
            const figures: any[] = [];
            const tables: any[] = [];

            // Docling JSON structure (flexible adaptation)
            if (docData.pictures) {
                docData.pictures.forEach((pic: any, idx: number) => {
                    figures.push({
                        type: 'chart',
                        id: `fig_${idx + 1}`,
                        caption: pic.caption?.text || `Figure ${idx + 1}`,
                        page_no: pic.prov?.[0]?.page_no,
                    });
                });
            }

            if (docData.tables) {
                docData.tables.forEach((tbl: any, idx: number) => {
                    tables.push({
                        type: 'table',
                        id: `tbl_${idx + 1}`,
                        caption: tbl.caption?.text || `Table ${idx + 1}`,
                        page_no: tbl.prov?.[0]?.page_no,
                        data: extractMetricsFromTable(tbl)
                    });
                });
            }

            const result = {
                success: true,
                figure_count: figures.length,
                table_count: tables.length,
                analysis: {
                    figures,
                    tables
                }
            };

            return JSON.stringify(result, null, 2);

        } catch (error: any) {
            console.error('[Scientist] Figure analysis error:', error);
            return JSON.stringify({
                success: false,
                error: error.message || String(error),
            });
        }
    },
});

// Helper: Extract data from table model
function extractMetricsFromTable(table: any): any {
    if (table.data && table.data.grid) {
        return table.data.grid.slice(0, 5);
    }
    return "Table data extraction pending full implementation";
}
