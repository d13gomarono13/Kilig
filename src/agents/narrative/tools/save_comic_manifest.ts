import { FunctionTool } from '@google/adk';
import { z } from 'zod';

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
        codeSnippet: z.object({
          language: z.string(),
          code: z.string()
        }).optional().describe('Code snippet for "code" type panels.'),
        revideo: z.object({
          templateId: z.string().describe('ID of the Revideo template (e.g., "bar-chart", "molecular-structure").'),
          data: z.record(z.any()).describe('Data parameters for the template.'),
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
    // In a real backend, we would save this to the DB.
    // For now, we return it so the Root Agent can see the result.
    return JSON.stringify(manifest, null, 2);
  }
});
