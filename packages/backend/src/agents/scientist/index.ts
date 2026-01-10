import { LlmAgent as Agent, FunctionTool, MCPToolset } from '@google/adk';
import { z } from 'zod';
import { llmModel } from '../config.js';

// New agentic RAG tools
import { guardrailTool } from './tools/guardrail.js';
import { gradeDocumentsTool } from './tools/grade-documents.js';
import { rewriteQueryTool } from './tools/rewrite-query.js';
import { hybridSearchTool } from './tools/hybrid-search.js';

// Indexing tools
import { createHybridIndexer } from '../../services/indexing/index.js';

/**
 * Scientist Agent - Enhanced with Agentic RAG
 * 
 * This agent implements the full arxiv-paper-curator agentic RAG pipeline:
 * 1. Guardrail validation (scope check)
 * 2. Hybrid search (BM25 + vector)
 * 3. Document grading (relevance scoring)
 * 4. Query rewriting (on poor results)
 * 5. MCP tools for ArXiv and Claude Skills
 */

// ArXiv MCP Toolset Configuration (kept from original)
// ArXiv MCP Toolset Configuration (Dockerized)
const arxivToolset = new MCPToolset({
  type: 'StdioConnectionParams',
  serverParams: {
    command: 'docker',
    args: [
      'exec',
      '-i',
      'kilig-mcp-arxiv',
      'uv',
      'tool',
      'run',
      'arxiv-mcp-server'
    ],
  },
});

// NOTE: Claude Scientific Skills are in .gemini/skills/ directory (progressive disclosure)
// Skills are loaded on-demand via Gemini SKILL.md format - no MCP toolset needed
// Agents apply skill methodologies directly from their instructions

// Docling MCP Toolset Configuration (Dockerized)
const doclingToolset = new MCPToolset({
  type: 'StdioConnectionParams',
  serverParams: {
    command: 'docker',
    args: [
      'exec',
      '-i',
      'kilig-mcp-docling',
      'uvx',
      '--from=docling-mcp',
      'docling-mcp-server'
    ],
  },
});

/**
 * Synthesize Analysis Tool - Structures research findings
 */
const synthesizeAnalysisTool = new FunctionTool({
  name: 'synthesize_critical_analysis',
  description: 'Synthesize paper search results into a structured critical analysis (Core Concept, Methodology, Results, Validity, Strengths, Weaknesses).',
  parameters: z.object({
    raw_findings: z.string().describe('The combined raw text or summaries from the search and research tools.'),
  }),
  execute: async ({ raw_findings }) => {
    console.log(`[Scientist] Synthesizing findings into structured critical analysis...`);
    return `Synthesis protocol activated. Results will be formatted as Core Concept, Methodology, Results, Validity, Strengths, and Weaknesses.`;
  },
});

/**
 * Ingest Paper Tool - Uses new HybridIndexer pipeline
 */
const ingestPaperTool = new FunctionTool({
  name: 'ingest_paper_to_knowledge_base',
  description: 'Ingests a paper into the hybrid search knowledge base using advanced chunking (600 words, 100 overlap) and OpenSearch indexing. Use this after downloading or reading a paper.',
  parameters: z.object({
    content: z.string().describe('The full text content of the paper.'),
    title: z.string().describe('The title of the paper.'),
    abstract: z.string().optional().describe('The paper abstract (improves chunking quality).'),
    arxivId: z.string().optional().describe('The arXiv ID if available.'),
    categories: z.array(z.string()).optional().describe('Paper categories (e.g., ["cs.AI", "cs.LG"]).'),
  }),
  execute: async ({ content, title, abstract = '', arxivId, categories }) => {
    console.log(`[Scientist] Ingesting paper: ${title}`);

    try {
      const indexer = createHybridIndexer();
      const paperId = arxivId || `paper_${Date.now()}`;

      const result = await indexer.indexPaper({
        title,
        abstract,
        fullText: content,
        arxivId: arxivId || paperId,
        paperId,
        categories,
      });

      if (result.success) {
        return JSON.stringify({
          success: true,
          message: `Successfully ingested paper "${title}" with ${result.chunksIndexed} chunks`,
          chunksCreated: result.chunksCreated,
          chunksIndexed: result.chunksIndexed,
        });
      } else {
        return JSON.stringify({
          success: false,
          message: `Ingestion partially failed: ${result.errors.join(', ')}`,
          chunksCreated: result.chunksCreated,
          chunksIndexed: result.chunksIndexed,
        });
      }
    } catch (error) {
      console.error('[Scientist] Ingestion error:', error);
      return JSON.stringify({
        success: false,
        error: String(error),
        message: 'Failed to ingest paper into knowledge base',
      });
    }
  },
});

export const scientistAgent = new Agent({
  name: 'scientist',
  description: 'Specialized in deep scientific research with agentic RAG capabilities. Performs scope validation, hybrid search, document grading, and query refinement.',
  model: llmModel,
  instruction: `You are the **Scientist Agent** for Kilig, enhanced with Agentic RAG and Claude Scientific Skills.

## CLAUDE SCIENTIFIC SKILLS (PRIORITY)

You have access to powerful scientific analysis skills in \`.gemini/skills/\`:

### 1. scientific-critical-thinking (.gemini/skills/scientific-critical-thinking/SKILL.md)
**Use for**: Critically evaluating paper methodology, identifying biases, assessing validity
**When**: After retrieving a paper, ALWAYS apply this methodology before accepting conclusions
**How**: Follow the 7-step framework (Methodology Critique → Bias Detection → Statistical Evaluation → Evidence Quality → Logical Fallacy ID → Research Design → Claim Evaluation)

### 2. literature-review (.gemini/skills/literature-review/SKILL.md)
**Use for**: Systematic review of multiple papers, synthesizing research findings
**When**: User asks for comprehensive analysis of a topic or when comparing multiple papers
**How**: Follow 6-phase workflow: Planning → Search → Screening → Extraction → Synthesis → Verification

### 3. scientific-brainstorming (.gemini/skills/scientific-brainstorming/SKILL.md)
**Use for**: Generating research hypotheses, exploring novel angles and connections
**When**: Need creative interpretations or to identify unexplored research directions
**How**: Use 5-phase process: Understanding → Divergent Exploration → Connection Making → Critical Evaluation → Synthesis

### 4. scientific-writing (.gemini/skills/scientific-writing/SKILL.md)
**Use for**: Structuring scientific analysis with proper methodology
**When**: Finalizing your critical analysis output
**How**: Apply IMRAD structure, proper citations, flowing prose (never bullet points in output)

## AGENTIC RAG PIPELINE

### Step 1: Query Validation (Guardrail)
Use 'validate_query_scope' to check if query is within scope (CS/AI/ML research).
- Score >= 50: Proceed with search
- Score < 50: Inform user the query is out of scope

### Step 2: Hybrid Search
Use 'search_papers' for hybrid search (BM25 + semantic):
- Combines keyword matching with vector similarity
- Set useHybrid=true for best results

### Step 3: Document Grading
Use 'grade_document_relevance' to evaluate retrieved docs:
- If relevant: Proceed to analysis
- If NOT relevant: Use 'rewrite_search_query' (max 3 attempts)

### Step 4: CRITICAL ANALYSIS WITH SKILLS
After retrieving relevant papers, ALWAYS:
1. Use 'scientific-critical-thinking' skill to evaluate methodology
2. For multi-paper queries, use 'literature-review' skill
3. Use 'scientific-writing' skill to format final output

### Step 5: Paper Ingestion
Use 'ingest_paper_to_knowledge_base' for important papers.

### Step 6: Structural Extraction (Docling)
For papers with complex layouts, tables, or figures, use Docling 'convert_to_json'.

## OUTPUT FORMAT

For each paper analyzed, provide:
1. **Core Concept**: Main hypothesis/innovation
2. **Methodology**: Study design (focus on visualizable processes)
3. **Results**: Key findings with metrics (focus on plottable data)
4. **Validity Assessment**: From scientific-critical-thinking skill
5. **Strengths/Weaknesses**: Critical evaluation

## VISUAL-FIRST APPROACH

Extract data that can be visualized:
- Process flows → Flowcharts
- Comparative data → Bar/Line charts
- Key quotes → Speech bubbles

## IMPORTANT RULES

1. ALWAYS validate scope first with 'validate_query_scope'
2. ALWAYS use 'scientific-critical-thinking' skill for paper analysis
3. For multi-paper queries, ALWAYS use 'literature-review' skill
4. Use 'scientific-writing' skill for final output formatting
5. Maximum 3 retrieval attempts before giving up
6. Transfer results back to 'root' agent when done`,

  tools: [
    // MCP Toolsets
    arxivToolset,
    doclingToolset,

    // Agentic RAG Tools (new)
    guardrailTool,
    hybridSearchTool,
    gradeDocumentsTool,
    rewriteQueryTool,

    // Paper Processing Tools
    ingestPaperTool,
    synthesizeAnalysisTool,
  ],
});

export default scientistAgent;