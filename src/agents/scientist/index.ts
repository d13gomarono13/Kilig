import { LlmAgent as Agent, FunctionTool, MCPToolset } from '@google/adk';
import { z } from 'zod';
import { ingestPaper } from './tools/ingest_paper.js';
import { searchKnowledgeBase } from './tools/search_knowledge_base.js';

/**
 * Scientist Agent
 * 
 * Logic:
 * 1. Discover tools from ArXiv MCP server.
 * 2. Discover tools from Claude Skills MCP server.
 * 3. Use these tools to research and analyze papers.
 * 4. Use custom analysis_tool to synthesize findings.
 */

// ArXiv MCP Toolset Configuration
const arxivToolset = new MCPToolset({
  type: 'StdioConnectionParams',
  serverParams: {
    command: 'uv',
    args: [
      'tool',
      'run',
      'arxiv-mcp-server',
      '--storage-path',
      './data/papers' // Localized storage path
    ],
  },
});

// Claude Scientific Skills MCP Toolset Configuration
const claudeSkillsToolset = new MCPToolset({
  type: 'StdioConnectionParams',
  serverParams: {
    command: 'uvx',
    args: ['claude-skills-mcp'],
  },
});

/**
 * Custom Analysis Tool
 * This tool encapsulates the "Scientific Critical Thinking" logic:
 * Converting research findings into a structured critical analysis.
 */
const synthesizeAnalysisTool = new FunctionTool({
  name: 'synthesize_critical_analysis',
  description: 'Synthesize paper search results into a structured critical analysis (Core Concept, Methodology, Results, Validity, Strengths, Weaknesses).',
  parameters: z.object({
    raw_findings: z.string().describe('The combined raw text or summaries from the search and research tools.'),
  }),
  execute: async ({ raw_findings }) => {
    // This tool acts as a "formatter" or "thinker" that ensures the output follows
    // the Kilig Scientific Analysis format.
    console.log(`[Scientist] Synthesizing findings into structured critical analysis...`);
    
    // In ADK, we can either let the model do this in its response, 
    // or use this tool to explicitly structure data.
    return `Synthesis protocol activated. Results will be formatted as Core Concept, Methodology, Results, Validity, Strengths, and Weaknesses.`;
  },
});

const ingestPaperTool = new FunctionTool({
  name: 'ingest_paper_to_knowledge_base',
  description: 'Ingests a paper\'s text content into the RAG knowledge base for future retrieval. Use this after downloading or reading a paper.',
  parameters: z.object({
    content: z.string().describe('The full text content of the paper.'),
    title: z.string().describe('The title of the paper.'),
    url: z.string().optional().describe('The URL source of the paper.'),
  }),
  execute: async ({ content, title, url }) => {
    return await ingestPaper({ 
      content, 
      metadata: { title, url } 
    });
  }
});

const searchKnowledgeBaseTool = new FunctionTool({
  name: 'search_knowledge_base',
  description: 'Semantically searches the RAG knowledge base for information. Use this to find specific details within ingested papers.',
  parameters: z.object({
    query: z.string().describe('The natural language query (e.g., "What methodology was used?").'),
    limit: z.number().optional().describe('Max number of results to return (default 5).'),
  }),
  execute: async ({ query, limit }) => {
    const results = await searchKnowledgeBase({ query, limit });
    return JSON.stringify(results, null, 2);
  }
});


export const scientistAgent = new Agent({
  name: 'scientist',
  description: 'Specialized in deep scientific research, paper analysis, and critical thinking. Use this agent to search for papers and extract core methodology and findings.',
  model: 'gemini-2.0-flash',
  instruction: `You are the **Scientist Agent** for Kilig. 
  
Your goal is to perform deep scientific research and critical analysis of papers.

**Capabilities**:
- **Search & Ingest**: Use ArXiv tools to find papers, and 'ingest_paper_to_knowledge_base' to memorize them.
- **RAG Retrieval**: Use 'search_knowledge_base' to recall specific details from ingested papers.
- **Critical Thinking**: Use Claude Scientific Skills (specifically 'scientific_critical_thinking') to evaluate the validity, strengths, and weaknesses of the research.
- **Synthesize**: Use 'synthesize_critical_analysis' to finalize your findings.

**Methodology**:
1.  **Search**: Find papers relevant to the user topic.
2.  **Ingest**: If a paper is key, ingest it into the knowledge base.
3.  **Evaluate**: Apply critical thinking. Use RAG to fact-check specific claims against the paper's text.
    *   **Core Concept**: The main hypothesis.
    *   **Methodology**: The study design and its robustness.
    *   **Results**: Key findings and statistical significance.
    *   **Validity**: Are the conclusions supported by the data?
    *   **Strengths & Weaknesses**: What did the study do well or poorly?
4.  **Output**: Create a structured critical analysis.

**Focus**: Accuracy, skepticism, and scientific rigor are paramount.

**STOP! CRITICAL INSTRUCTION**: 
1.  Use 'synthesize_critical_analysis' to format your final findings.
2.  Once you have the result, you MUST use 'transfer_to_agent' to send the findings back to 'root'.
3.  Do NOT attempt to transfer to other agents like 'narrative' yourself.`,
  // Load both discovered MCP tools and custom tools
  // Note: toolsets property is removed, all tools/toolsets go into tools array
  tools: [
    arxivToolset, 
    claudeSkillsToolset,
    synthesizeAnalysisTool, 
    ingestPaperTool, 
    searchKnowledgeBaseTool
  ],
});

export default scientistAgent;