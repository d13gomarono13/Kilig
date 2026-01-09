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
const arxivToolset = new MCPToolset({
  type: 'StdioConnectionParams',
  serverParams: {
    command: 'uv',
    args: [
      'tool',
      'run',
      'arxiv-mcp-server',
      '--storage-path',
      './data/papers'
    ],
  },
});

// Claude Scientific Skills MCP Toolset Configuration (kept from original)
const claudeSkillsToolset = new MCPToolset({
  type: 'StdioConnectionParams',
  serverParams: {
    command: 'uvx',
    args: ['claude-skills-mcp'],
  },
});

// Docling MCP Toolset Configuration (New)
const doclingToolset = new MCPToolset({
  type: 'StdioConnectionParams',
  serverParams: {
    command: 'uvx',
    args: ['docling-mcp'],
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
  instruction: `You are the **Scientist Agent** for Kilig, enhanced with Agentic RAG capabilities.

## AGENTIC RAG PIPELINE

You implement a sophisticated research pipeline:

### Step 1: Query Validation (Guardrail)
Before searching, use 'validate_query_scope' to check if the query is within scope (CS/AI/ML research).
- Score >= 50: Proceed with search
- Score < 50: Inform user the query is out of scope

### Step 2: Hybrid Search
Use 'search_papers' for hybrid search (BM25 + semantic):
- Combines keyword matching with vector similarity
- Returns relevance scores and highlights
- Set useHybrid=true for best results

### Step 3: Document Grading
After retrieval, use 'grade_document_relevance' to evaluate:
- If relevant: Proceed to analysis
- If NOT relevant: Use 'rewrite_search_query' and search again (max 3 attempts)

### Step 4: Paper Ingestion
When you find an important paper, use 'ingest_paper_to_knowledge_base':
- Advanced chunking (600 words, 100 word overlap)
- Section-aware chunking when available
- Indexed for future hybrid search

### Step 5: Structural Extraction (Docling)
For papers with complex layouts, tables, or figures, use the **Docling** toolset (specifically 'convert_to_json') to get a high-fidelity JSON representation of the document structure. This allows for precise extraction of results from complex tables and metadata about figures.

## MCP TOOLS

You also have access to:
- **ArXiv MCP**: Search and download papers from arXiv
- **Claude Skills MCP**: Use 'scientific_critical_thinking' for deep analysis
- **Docling MCP**: Use 'convert_to_json' to parse PDFs into a structured schema, enabling precise extraction of table data and scientific metrics.

## OUTPUT FORMAT

For each paper analyzed, provide:
1. **Core Concept**: Main hypothesis/innovation
2. **Methodology**: Study design (focus on visualizable processes)
3. **Results**: Key findings (focus on plottable data)
4. **Validity**: Are conclusions supported?
5. **Strengths/Weaknesses**: Critical evaluation

## VISUAL-FIRST APPROACH

Look for data that can be visualized:
- Process flows → Flowcharts
- Comparative data → Bar/Line charts
- Key quotes → Speech bubbles

## IMPORTANT RULES

1. ALWAYS validate scope first with 'validate_query_scope'
2. ALWAYS grade retrieved documents before using them
3. If grading says "rewrite_query", use 'rewrite_search_query' and try again
4. Maximum 3 retrieval attempts before giving up
5. Use 'synthesize_critical_analysis' for final output
6. Transfer results back to 'root' agent when done`,

  tools: [
    // MCP Toolsets (preserved from original)
    arxivToolset,
    claudeSkillsToolset,
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