
import { FunctionTool } from '@google/adk';
import { z } from 'zod';

// Define the valid easing functions in Revideo
const validEasings = [
  'linear',
  'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
  'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
  'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
  'easeInQuint', 'easeOutQuint', 'easeInOutQuint',
  'easeInSine', 'easeOutSine', 'easeInOutSine',
  'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
  'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
  'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
  'easeInBack', 'easeOutBack', 'easeInOutBack',
  'easeInBounce', 'easeOutBounce', 'easeInOutBounce',
];

const hexColorRegex = /^#([0-9A-F]{3}){1,2}$/i;

// Detailed Schema for Validation
const sceneGraphSchema = z.object({
  scenes: z.array(z.object({
    id: z.string().min(1),
    duration: z.number().positive('Duration must be positive'),
    background: z.string().regex(hexColorRegex, 'Invalid hex color').optional(),
    root_nodes: z.array(z.object({
      type: z.enum(['Circle', 'Rect', 'Line', 'Text', 'Layout', 'Img', 'Latex', 'Grid', 'Spline']),
      props: z.record(z.any()),
      children: z.array(z.any()).optional(),
      animations: z.array(z.object({
        prop: z.string(),
        target: z.any(),
        duration: z.number().positive(),
        easing: z.string().refine(val => validEasings.includes(val), {
           message: "Invalid easing function. Use standard Revideo easings (e.g., 'easeInOutCubic')."
        }).optional(),
      })).optional(),
    })),
  })).min(1, 'SceneGraph must have at least one scene'),
});

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

      // 2. Validate against Schema
      const result = sceneGraphSchema.safeParse(data);

      if (result.success) {
        // Additional Logic Checks (if any not covered by Zod)
        return "VALID";
      }
      else {
        // Format Zod errors
        const errors = result.error.errors.map(err => `Path: ${err.path.join('.')} - ${err.message}`).join('\n');
        return `VALIDATION_FAILED:\n${errors}`;
      }
    } catch (error: any) {
      return `INTERNAL_ERROR: ${error.message}`;
    }
  },
});
