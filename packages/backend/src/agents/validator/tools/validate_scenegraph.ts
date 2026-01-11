
import { FunctionTool } from '@google/adk';
import { z } from 'zod';
import { validateSceneGraph } from '@kilig/shared';

export const validateSceneGraphTool = new FunctionTool({
  name: 'validate_scenegraph_compliance',
  description: 'Validate the SceneGraph JSON against strict Revideo rules (schema, colors, easings). Returns a list of errors or "VALID".',
  parameters: z.object({
    json_content: z.string().describe('The full SceneGraph JSON string to validate.'),
  }),
  execute: async ({ json_content }) => {
    try {
      // 1. Parse JSON
      let data;
      try {
        data = JSON.parse(json_content);
      } catch (e) {
        return `CRITICAL: Invalid JSON syntax. ${e}`;
      }

      // 2. Validate against Schema using shared helper
      const result = validateSceneGraph(data);

      if (result.success) {
        return "VALID";
      }
      else {
        // Format errors
        const errors = result.errors?.join('\n') || 'Unknown validation error';
        return `VALIDATION_FAILED:\n${errors}`;
      }
    } catch (error: any) {
      return `INTERNAL_ERROR: ${error.message}`;
    }
  },
});
