import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

export const saveComicManifestTool = new FunctionTool({
  name: 'save_comic_manifest',
  description: 'Generates the structured manifest for the Scientific Comic. This defines the panels, layout, and Revideo content.',
  parameters: z.object({
    title: z.string().describe('The title of the scientific paper/comic.'),
    pages: z.array(z.object({
      id: z.string().describe('Unique page ID (e.g., "page-1").'),
      panels: z.array(z.object({
        id: z.string().describe('Unique panel ID (e.g., "p1-intro").'),
        type: z.enum(['static', 'revideo', 'code']).describe('The type of panel content.'),
        title: z.string().optional().describe('Panel header title.'),
        content: z.string().optional().describe('Text content for static panels.'),
        imageUrl: z.string().optional().describe('URL for a background image or illustration.'),
        codeSnippet: z.object({
          language: z.string(),
          code: z.string()
        }).optional().describe('Code snippet for "code" type panels.'),
        revideo: z.object({
          templateId: z.string().describe('ID of the Revideo template (e.g., "bar-chart", "process-flow", "network-graph").'),
          data: z.string().describe(`JSON string containing data parameters for the template. 
          - bar-chart: { labels: string[], values: number[] }
          - process-flow: { steps: string[] }
          - network-graph: { nodes: {id, label}[], links: {source, target}[] }`),
          thumbnailUrl: z.string().optional().describe('Placeholder image URL.')
        }).optional().describe('Configuration for "revideo" type panels.'),
        layout: z.object({
          x: z.number().describe('Grid column (1-6).'),
          y: z.number().describe('Grid row (1-8).'),
          w: z.number().describe('Width in columns.'),
          h: z.number().describe('Height in rows.')
        }).describe('Grid layout coordinates.')
      }))
    }))
  }),
  execute: async (manifest) => {
    console.log(`[Narrative Agent] Generated Comic Manifest: "${manifest.title}" with ${manifest.pages[0].panels.length} panels.`);

    // Persistence: Save to local file for frontend usage
    try {
      const outputPath = path.join(process.cwd(), 'web/src/data/comic-manifest.json');
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2));
      console.log(`[Narrative Agent] Manifest saved to: ${outputPath}`);
    } catch (error) {
      console.error('[Narrative Agent] Failed to save manifest to file:', error);
    }

    return JSON.stringify(manifest, null, 2);
  }
});
