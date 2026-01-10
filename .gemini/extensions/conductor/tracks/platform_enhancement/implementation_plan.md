Kilig Focused Implementation Plan
Team: 2 people
Timeline: January 10 - March 21, 2026 (10 weeks)
Budget: $290-750/month (production)

Overview
This plan adapts the comprehensive roadmap to your specific requirements: ✅ Claude Skills integration (PRIORITY)
✅ PNPM Workspaces monorepo
✅ Langfuse as default observability
✅ MCP server dockerization
✅ Docling figure extraction (VERY IMPORTANT)
✅ No parallel paper processing
✅ Realistic for 2-person team

Phase 1: Claude Skills Integration (Weeks 1-3)
CRITICAL PRIORITY - This is your main focus

Step 1.1: Claude Skills MCP Setup
Verify Current Setup:

# Check if skills are available
cd src/agents/scientist
cat skills_config.json
Expected Config:

{
  "enabled_skills": [
    "scientific-critical-thinking",
    "scientific-writing", 
    "literature-review",
    "scientific-brainstorming"
  ],
  "config": {
    "verbose": true
  }
}
Step 1.2: Integrate Skills into Scientist Agent
// Claude Scientific Skills MCP Toolset // Uses local skills from .gemini/claude skills/ directory const claudeSkillsToolset = new MCPToolset({ type: 'StdioConnectionParams', serverParams: { command: 'uvx', args: [ 'claude-skills-mcp', '--config', 'src/agents/scientist/skills_config.json' ], }, });

// NOTE: The skills_config.json points to local skills: // { // "skill_sources": [{ // "type": "local", // "path": ".gemini/claude skills", // "comment": "K-Dense-AI scientific skills" // }] // }

WORKFLOW
Validate Scope → Use guardrail
Hybrid Search → Find relevant papers
Grade Documents → Assess relevance
CRITICAL ANALYSIS → Use `scientific-critical-thinking` skill
Pass paper content to skill
Request: methodology evaluation, validity assessment, bias identification
LITERATURE REVIEW (if multiple papers) → Use `literature-review` skill
Synthesize findings across papers
Identify consensus and controversies
STRUCTURED OUTPUT → Use `scientific-writing` skill
Format findings with IMRAD structure
Include proper citations
IMPORTANT
ALWAYS use `scientific-critical-thinking` for paper analysis

For multi-paper queries, use `literature-review`

Use `scientific-writing` to format final output

Return results to 'root' agent when done`,

tools: [ arxivToolset, claudeSkillsToolset, // ← Already configured doclingToolset, // ... other tools ], });

### Step 1.3: Integrate Skills into Narrative Agent
**File**: `packages/backend/src/agents/narrative/index.ts`
```typescript
export const narrativeAgent = new Agent({
  name: 'narrative',
  description: 'Creates engaging narratives using scientific writing and brainstorming skills',
  model: llmModel,
  instruction: `You are the **Narrative Architect Agent** with Claude Skills.
## AVAILABLE SKILLS
### 1. scientific-writing
Use for: Structuring narratives with clear flow and academic rigor
When: Creating video scripts or comic narratives
### 2. scientific-brainstorming  
Use for: Generating creative presentation angles
When: Need innovative ways to explain complex concepts
## WORKFLOW
1. **Receive Scientific Analysis** from Scientist Agent
2. **BRAINSTORM** → Use \`scientific-brainstorming\` skill
   - Input: Core scientific findings
   - Ask: "How can we present this visually and engagingly?"
   - Generate: 3-5 narrative angles
3. **SELECT APPROACH** → Choose most engaging angle
4. **STRUCTURE NARRATIVE** → Use \`scientific-writing\` skill
   - Create clear story arc
   - Ensure scientific accuracy
   - Design for visual medium
5. **OUTPUT FORMAT**:
   - For VIDEO: Generate script with scene descriptions
   - For COMIC: Generate comic manifest with panel descriptions
## GUIDELINES
- Prioritize VISUAL storytelling (what can be shown?)
- Maintain scientific accuracy (validated by skills)
- Target audience: General public (default) or specified
- Use \`save_comic_manifest\` or \`generate_script\` tools for output`,
  tools: [
    claudeSkillsToolset, // ← Add this
    // ... existing tools
  ],
});
Step 1.4: Test Skills Integration
Script: scripts/test_skills_integration.ts

import 'dotenv/config';
import { InMemoryRunner } from '@google/adk';
import { rootAgent } from './src/agents/root/index.js';
async function testSkillsIntegration() {
  console.log('🧪 Testing Claude Skills Integration\n');
  const runner = new InMemoryRunner({
    agent: rootAgent,
    appName: 'kilig-skills-test'
  });
  await runner.sessionService.createSession({
    appName: 'kilig-skills-test',
    userId: 'test-user',
    sessionId: 'test-session-skills'
  });
  // Test 1: Critical Thinking Skill
  console.log('Test 1: Scientific Critical Thinking');
  const prompt1 = `Analyze the paper "Attention Is All You Need" (arXiv:1706.03762). 
  Use the scientific-critical-thinking skill to evaluate the methodology and identify potential biases.`;
  const results1 = runner.runAsync({
    userId: 'test-user',
    sessionId: 'test-session-skills',
    newMessage: { role: 'user', parts: [{ text: prompt1 }] } as any
  });
  for await (const event of results1) {
    if ((event as any).content?.parts) {
      for (const part of (event as any).content.parts) {
        if (part.text) console.log(part.text);
      }
    }
  }
  console.log('\n' + '='.repeat(60) + '\n');
  // Test 2: Scientific Writing Skill
  console.log('Test 2: Scientific Writing');
  const prompt2 = `Create a narrative script about transformer architecture.
  Use scientific-writing skill to structure it properly.`;
  const results2 = runner.runAsync({
    userId: 'test-user',
    sessionId: 'test-session-skills-2',
    newMessage: { role: 'user', parts: [{ text: prompt2 }] } as any
  });
  for await (const event of results2) {
    if ((event as any).content?.parts) {
      for (const part of (event as any).content.parts) {
        if (part.text) console.log(part.text);
      }
    }
  }
  console.log('\n✅ Skills integration test complete');
}
testSkillsIntegration();
Add to package.json:

{
  "scripts": {
    "test:skills": "tsx scripts/test_skills_integration.ts"
  }
}
Phase 2: PNPM Workspaces Migration (Week 4)
Step 2.1: Install PNPM
# Install PNPM globally
npm install -g pnpm
# Verify installation
pnpm --version
Step 2.2: Create Workspace Configuration
File: pnpm-workspace.yaml

packages:
  - 'packages/*'
Step 2.3: Restructure Project
# Create packages directory
mkdir -p packages/backend packages/frontend packages/shared
# Move backend (current src/)
mv src packages/backend/src
mv package.json packages/backend/package.json
mv tsconfig.json packages/backend/tsconfig.json
# Move frontend (current web/)
mv web/* packages/frontend/
mv web/.gitignore packages/frontend/
# Cleanup
rmdir web
Step 2.4: Create Shared Package
File: packages/shared/package.json

{
  "name": "@kilig/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  },
  "dependencies": {
    "zod": "^3.25.76"
  }
}
File: packages/shared/tsconfig.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"]
}
File: packages/shared/src/types/agent.types.ts

import { z } from 'zod';
// Agent Pipeline Types
export interface AgentMessage {
  role: 'user' | 'agent' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}
export interface PipelineState {
  stage: 'research' | 'narrative' | 'design' | 'validation';
  currentAgent: string;
  artifacts: Record<string, unknown>;
}
// Scene Graph Types
export const SceneGraphElementSchema = z.object({
  type: z.enum(['text', 'image', 'chart', 'diagram']),
  position: z.object({ x: z.number(), y: z.number() }),
  content: z.any(),
  duration: z.number().optional()
});
export const SceneGraphSchema = z.object({
  scenes: z.array(z.object({
    id: z.string(),
    duration: z.number(),
    elements: z.array(SceneGraphElementSchema)
  }))
});
export type SceneGraph = z.infer<typeof SceneGraphSchema>;
// Comic Manifest Types
export const ComicPanelSchema = z.object({
  id: z.string(),
  description: z.string(),
  type: z.enum(['intro', 'explanation', 'data-viz', 'conclusion']),
  visual_type: z.string(),
  dialogue: z.string().optional(),
  caption: z.string().optional()
});
export const ComicManifestSchema = z.object({
  title: z.string(),
  pages: z.array(z.object({
    pageNumber: z.number(),
    panels: z.array(ComicPanelSchema)
  }))
});
export type ComicManifest = z.infer<typeof ComicManifestSchema>;
File: packages/shared/src/index.ts

export * from './types/agent.types.js';
Step 2.5: Update Root package.json
File: package.json (root)

{
  "name": "kilig-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "dev": "pnpm -r --parallel dev",
    "dev:backend": "pnpm --filter @kilig/backend dev",
    "dev:frontend": "pnpm --filter @kilig/frontend dev",
    "test": "pnpm -r test",
    "lint": "pnpm -r lint"
  },
  "devDependencies": {
    "typescript": "^5.4.5"
  }
}
Step 2.6: Update Package Names
Backend (packages/backend/package.json):

{
  "name": "@kilig/backend",
  "dependencies": {
    "@kilig/shared": "workspace:*"
  }
}
Frontend (packages/frontend/package.json):

{
  "name": "@kilig/frontend",
  "dependencies": {
    "@kilig/shared": "workspace:*"
  }
}
Step 2.7: Install Dependencies
# Install all workspace dependencies
pnpm install
# Build shared package first
pnpm --filter @kilig/shared build
# Build everything
pnpm build
Phase 3: Langfuse Default Observability (Week 4)
Step 3.1: Enable Langfuse by Default
File: .env (update)

# Langfuse - NOW ENABLED BY DEFAULT
LANGFUSE_ENABLED=true
LANGFUSE_PUBLIC_KEY=your_public_key  # Get from local Langfuse UI
LANGFUSE_SECRET_KEY=your_secret_key
LANGFUSE_HOST=http://localhost:3001
Step 3.2: Update Docker Compose
File: docker-compose.yml

version: '3.8'
services:
  # ... existing opensearch, redis services
  # Langfuse - NOW DEFAULT (not in profile)
  langfuse:
    image: langfuse/langfuse:2
    container_name: kilig-langfuse
    depends_on:
      langfuse-db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://langfuse:langfuse@langfuse-db:5432/langfuse
      - NEXTAUTH_SECRET=mysecret
      - SALT=mysalt
      - NEXTAUTH_URL=http://localhost:3001
      - TELEMETRY_ENABLED=false
    ports:
      - "3001:3000"
    # REMOVED profiles section - now starts by default
  langfuse-db:
    image: postgres:15-alpine
    container_name: kilig-langfuse-db
    environment:
      - POSTGRES_USER=langfuse
      - POSTGRES_PASSWORD=langfuse
      - POSTGRES_DB=langfuse
    volumes:
      - langfuse-db-data:/var/lib/postgresql/data
    healthcheck:
      test: [ "CMD-SHELL", "pg_isready -U langfuse" ]
      interval: 5s
      timeout: 5s
      retries: 5
    # REMOVED profiles section
volumes:
  opensearch-data:
  redis-data:
  langfuse-db-data:
Step 3.3: Integrate Langfuse Tracing
Install SDK:

cd packages/backend
pnpm add langfuse
File: packages/backend/src/services/observability/langfuse.ts

import { Langfuse } from 'langfuse';
export const langfuse = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
  enabled: process.env.LANGFUSE_ENABLED === 'true'
});
export function createAgentTrace(agentName: string, userId: string, sessionId: string) {
  return langfuse.trace({
    name: `${agentName}_execution`,
    userId,
    sessionId,
    metadata: {
      agent: agentName,
      timestamp: new Date().toISOString()
    }
  });
}
Integrate in Agents (packages/backend/src/agents/scientist/index.ts):

import { createAgentTrace } from '../../services/observability/langfuse.js';
// In tool execution
const ingestPaperTool = new FunctionTool({
  name: 'ingest_paper_to_knowledge_base',
  execute: async ({ content, title, arxivId }) => {
    const trace = createAgentTrace('scientist', 'user-01', 'session-01');
    const span = trace.span({
      name: 'ingest_paper',
      input: { title, arxivId }
    });
    try {
      const result = await indexer.indexPaper({
        title,
        fullText: content,
        arxivId
      });
      span.end({ output: result });
      return JSON.stringify(result);
    } catch (error) {
      span.end({ output: { error: String(error) } });
      throw error;
    }
  }
});
Phase 4: Dockerize MCP Servers (Week 5)
Step 4.1: ArXiv MCP Dockerfile
File: docker/arxiv-mcp/Dockerfile

FROM python:3.12-slim
WORKDIR /app
# Install uv
RUN pip install uv
# Install arxiv-mcp-server
RUN uv tool install arxiv-mcp-server
# Create storage directory
RUN mkdir -p /app/data/papers
# Expose MCP via stdio (no ports needed)
CMD ["uv", "tool", "run", "arxiv-mcp-server", "--storage-path", "/app/data/papers"]
Step 4.2: Docling MCP Dockerfile
File: docker/docling-mcp/Dockerfile

FROM python:3.12-slim
WORKDIR /app
# Install system dependencies for Docling
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*
    
# Install uvx
RUN pip install uv
# Install docling-mcp
RUN uvx install --from=docling-mcp docling-mcp-server
CMD ["uvx", "--from=docling-mcp", "docling-mcp-server"]
Step 4.3: Update Docker Compose
File: docker-compose.yml (add MCP services)

services:
  # ... existing services
  # MCP Servers
  mcp-arxiv:
    build:
      context: ./docker/arxiv-mcp
      dockerfile: Dockerfile
    container_name: kilig-mcp-arxiv
    volumes:
      - arxiv-papers:/app/data/papers
    networks:
      - kilig-network
  # Claude Skills - LOCAL DIRECTORY (No container needed)
  # Skills are accessed directly from /claude skills/ directory
  mcp-docling:
    build:
      context: ./docker/docling-mcp
      dockerfile: Dockerfile
    container_name: kilig-mcp-docling
    networks:
      - kilig-network
networks:
  kilig-network:
    driver: bridge
volumes:
  # ... existing volumes
  arxiv-papers:
Step 4.4: Update Agent MCP Configuration
File: packages/backend/src/agents/scientist/index.ts

// Update MCP toolsets to use Docker containers
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
// Claude Skills - Access local directory
// Note: Skills are NOT an MCP server, they're local tools
// They should be imported directly or accessed via file system
// Configuration depends on how skills are structured in /claude skills/
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
Phase 5: Docling Figure Extraction (Week 6) - VERY IMPORTANT
Step 5.1: Create Figure Analysis Tool
File: packages/backend/src/agents/scientist/tools/analyze-figures.ts

import { FunctionTool } from '@google/adk';
import { z } from 'zod';
export const analyzeFiguresTool = new FunctionTool({
  name: 'analyze_paper_figures',
  description: 'Extract and interpret figures, charts, tables, and diagrams from scientific papers using Docling. Returns structured data about visual elements.',
  parameters: z.object({
    paperId: z.string().describe('The ID of the paper'),
    paperContent: z.string().describe('Full text content of the paper (optional if using PDF)'),
    pdfPath: z.string().optional().describe('Path to PDF file if available'),
    focusAreas: z.array(z.enum(['charts', 'diagrams', 'tables', 'all'])).default(['all']).describe('Which types of figures to focus on')
  }),
  execute: async ({ paperId, paperContent, pdfPath, focusAreas }) => {
    console.log(`[Scientist] Analyzing figures in paper: ${paperId}`);
    try {
      // Use Docling MCP to convert to structured JSON
      // This is a pseudo-implementation - actual call would go through MCPToolset
      const doclingResult = await doclingToolset.call('convert_to_json', {
        content: paperContent || undefined,
        pdf_path: pdfPath
      });
      const document = JSON.parse(doclingResult);
      // Extract figures
      const figures = document.elements
        .filter(el => {
          if (focusAreas.includes('all')) return ['figure', 'table', 'chart'].includes(el.type);
          return focusAreas.some(focus => {
            if (focus === 'charts') return ['chart', 'graph', 'plot'].includes(el.type);
            if (focus === 'diagrams') return el.type === 'figure' && el.subtype === 'diagram';
            if (focus === 'tables') return el.type === 'table';
            return false;
          });
        })
        .map(el => ({
          id: el.id,
          type: el.type,
          caption: el.caption,
          data: extractDataFromElement(el),
          location: {
            page: el.page,
            bbox: el.bbox
          }
        }));
      return JSON.stringify({
        success: true,
        paperId,
        figures,
        summary: {
          totalFigures: figures.length,
          byType: countByType(figures)
        }
      });
    } catch (error) {
      console.error('[Scientist] Figure analysis error:', error);
      return JSON.stringify({
        success: false,
        error: String(error)
      });
    }
  }
});
function extractDataFromElement(element: any): any {
  if (element.type === 'table') {
    // Extract table data
    return {
      headers: element.table?.headers || [],
      rows: element.table?.rows || [],
      metrics: extractMetricsFromTable(element.table)
    };
  }
  
  if (['chart', 'graph', 'plot'].includes(element.type)) {
    // Extract chart data (if available in Docling output)
    return {
      chartType: element.subtype,
      data: element.data || [],
      axes: element.axes || {}
    };
  }
  return { raw: element.content };
}
function extractMetricsFromTable(table: any): Record<string, number> {
  // Extract key numerical metrics from table
  const metrics: Record<string, number> = {};
  
  // Look for common scientific metrics
  const metricKeywords = ['accuracy', 'precision', 'recall', 'f1', 'score', 'error', 'rate'];
  
  table.rows?.forEach((row: any[]) => {
    row.forEach((cell, idx) => {
      const header = table.headers?.[idx] || '';
      const value = parseFloat(cell);
      
      if (!isNaN(value) && metricKeywords.some(kw => header.toLowerCase().includes(kw))) {
        metrics[header] = value;
      }
    });
  });
  return metrics;
}
function countByType(figures: any[]): Record<string, number> {
  return figures.reduce((acc, fig) => {
    acc[fig.type] = (acc[fig.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
Step 5.2: Integrate into Scientist Agent
File: packages/backend/src/agents/scientist/index.ts (update)

import { analyzeFiguresTool } from './tools/analyze-figures.js';
export const scientistAgent = new Agent({
  // ... existing config
  instruction: `You are the **Scientist Agent** with advanced capabilities.
  // ... existing instructions
  ## FIGURE ANALYSIS
  When analyzing papers with visual data:
  1. Use \`analyze_paper_figures\` to extract:
     - Charts and graphs (for data trends)
     - Tables (for precise metrics)
     - Diagrams (for process flows)
  2. Integrate extracted data into your analysis
  3. Highlight visualizable data for Narrative Agent
  Example workflow:
  \`\`\`
  1. Download paper via ArXiv MCP
  2. Analyze figures: analyze_paper_figures(paperId, focusAreas=['tables', 'charts'])
  3. Use extracted metrics in critical analysis
  4. Pass figure descriptions to Narrative Agent
  \`\`\`
  ## OUTPUT FORMAT
  Include a "Visual Data" section with:
  - Key figures and their captions
  - Extracted metrics from tables
  - Suggested visualizations for narrative
  `,
  tools: [
    arxivToolset,
    claudeSkillsToolset,
    doclingToolset,
    // ... existing tools
    analyzeFiguresTool, // ← Add this
    // ... other tools
  ],
});
Step 5.3: Update Narrative Agent to Use Figure Data
File: packages/backend/src/agents/narrative/index.ts

export const narrativeAgent = new Agent({
  instruction: `You are the **Narrative Architect Agent**.
  ## VISUAL DATA INTEGRATION
  When you receive analysis from Scientist Agent:
  1. Look for "Visual Data" section
  2. Prioritize figures and charts for visualization
  3. Use extracted metrics for data-driven storytelling
  4. Create scenes/panels that recreate key figures
  Example:
  If scientist provides:
  - Chart: "Figure 3: Accuracy vs Training Time"
  - Metrics: {"accuracy": 0.95, "training_time": 24}
  
  Create scene:
  - Type: "chart"
  - Data: Use extracted metrics
  - Visual: Animated line graph showing improvement
  - Narration: "After 24 hours of training, accuracy reached 95%"
  ## IMPORTANT
  - Transform complex tables into simple visualizations
  - Use figure captions as guide for narration
  - Ensure all data is traceable to source`,
  
  // ... rest of config
});
Testing & Validation
End-to-End Test Script
File: scripts/test_e2e_with_figures.ts

import 'dotenv/config';
import { InMemoryRunner } from '@google/adk';
import { rootAgent } from '../packages/backend/src/agents/root/index.js';
async function testFigureExtraction() {
  console.log('🧪 Testing End-to-End with Figure Extraction\n');
  const runner = new InMemoryRunner({
    agent: rootAgent,
    appName: 'kilig-e2e-test'
  });
  await runner.sessionService.createSession({
    appName: 'kilig-e2e-test',
    userId: 'test-user',
    sessionId: 'test-session-e2e'
  });
  // Test with a paper that has rich visual data
  const prompt = `Create a scientific video explaining "Attention Is All You Need" (arXiv:1706.03762).
  IMPORTANT:
  1. Extract and analyze all figures and tables from the paper
  2. Use the figure data to create visual scenes
  3. Highlight key metrics from tables in the narrative
  4. Create a video that shows the architecture diagram (Figure 1)`;
  console.log('📝 Processing request...\n');
  const results = runner.runAsync({
    userId: 'test-user',
    sessionId: 'test-session-e2e',
    newMessage: { role: 'user', parts: [{ text: prompt }] } as any
  });
  for await (const event of results) {
    const author = (event as any).author || 'system';
    
    if ((event as any).content?.parts) {
      console.log(`\n[${author}]:`);
      for (const part of (event as any).content.parts) {
        if (part.text) console.log(part.text);
        if (part.function call) console.log(`🔧 Tool: ${part.functionCall.name}`);
      }
    }
  }
  console.log('\n✅ E2E test complete');
}
testFigureExtraction();
Next Steps
Start with Phase 1 (Claude Skills) - Highest priority
Test each phase before moving to next
Document as you go
Monitor costs using Langfuse traces
Recommended Weekly Schedule:

Weeks 1-3: Claude Skills integration + testing
Week 4: Monorepo migration + Langfuse setup
Week 5: Docker MCP servers
Week 6: Docling figure extraction
Weeks 7-8: Testing, optimization, documentation
Weeks 9-10: Production deployment prep
Would you like me to help you start with any specific phase?