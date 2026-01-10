import { FunctionTool } from '@google/adk';
import { z } from 'zod';

export const validateComicManifestTool = new FunctionTool({
  name: 'validate_comic_manifest',
  description: 'Validates a ComicManifest JSON for schema compliance and logical consistency (e.g., no overlapping panels).',
  parameters: z.object({
    manifest_json: z.string().describe('The JSON string of the ComicManifest to validate.'),
  }),
  execute: async ({ manifest_json }) => {
    try {
      const manifest = JSON.parse(manifest_json);
      const errors: string[] = [];

      // Basic structure checks
      if (!manifest.title) errors.push("Missing 'title'");
      if (!Array.isArray(manifest.pages)) errors.push("Missing or invalid 'pages' array");

      // Panel checks
      manifest.pages?.forEach((page: any, pIdx: number) => {
        if (!page.id) errors.push(`Page ${pIdx} missing 'id'`);
        if (!Array.isArray(page.panels)) {
          errors.push(`Page ${pIdx} missing 'panels' array`);
          return;
        }

        const grid = Array(8).fill(null).map(() => Array(6).fill(false));

        page.panels.forEach((panel: any, panIdx: number) => {
          const id = panel.id || `unnamed-${panIdx}`;
          
          // Schema checks
          if (!panel.type) errors.push(`Panel ${id} missing 'type'`);
          if (!panel.layout) {
            errors.push(`Panel ${id} missing 'layout'`);
            return;
          }

          const { x, y, w, h } = panel.layout;
          
          // Bounds checks (1-indexed for AI friendliness usually, but let's check)
          if (x < 1 || x > 6) errors.push(`Panel ${id} X coordinate out of bounds (1-6)`);
          if (y < 1 || y > 8) errors.push(`Panel ${id} Y coordinate out of bounds (1-8)`);
          if (x + w - 1 > 6) errors.push(`Panel ${id} width exceeds grid bounds`);
          if (y + h - 1 > 8) errors.push(`Panel ${id} height exceeds grid bounds`);

          // Overlap checks
          for (let r = y - 1; r < y + h - 1; r++) {
            for (let c = x - 1; c < x + w - 1; c++) {
              if (r >= 0 && r < 8 && c >= 0 && c < 6) {
                if (grid[r][c]) {
                  errors.push(`Panel ${id} overlaps with another panel at (${c+1}, ${r+1})`);
                }
                grid[r][c] = true;
              }
            }
          }

          // Content type specific checks
          if (panel.type === 'revideo' && !panel.revideo?.templateId) {
            errors.push(`Panel ${id} type 'revideo' missing 'templateId'`);
          }
        });
      });

      if (errors.length > 0) {
        return `VALIDATION_FAILED:\n- ${errors.join('\n- ')}`;
      }

      return "VALID";
    } catch (e: any) {
      return `VALIDATION_FAILED: Invalid JSON format. ${e.message}`;
    }
  }
});
