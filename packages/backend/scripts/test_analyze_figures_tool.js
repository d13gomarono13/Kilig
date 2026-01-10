import 'dotenv/config';
import { arxivToolset, doclingToolset } from '../dist/agents/scientist/toolsets.js';
import { analyzeFiguresTool } from '../dist/agents/scientist/tools/analyze-figures.js';

async function test() {
    console.log('🧪 Testing Figure Extraction Pipeline (Standalone)');

    // 1. Download paper
    console.log('📥 Downloading paper "1706.03762" (Attention Is All You Need)...');

    // Get tools from the MCP toolset
    // MCPToolset.getTools() initializes the client if not ready
    const arxivTools = await arxivToolset.tools; // getter might be async or property? ADK docs says .tools is property or method?
    // ADK: Toolset has "tools" property which is array of tools?
    // Wait, let's assume getTools() or .tools

    // Actually, looking at ADK source logic in previous steps, it seemed to be used in 'tools: [arxivToolset]' in agent.
    // If I want to use it manually:
    // I suspect I need to init it.

    // Let's rely on what I know about analyzeFiguresTool which uses doclingToolset.call()
    // For arxiv, let's try to inspect it.

    // However, for the script, I will try to use the tools array if accessible.
}

// Rewriting properly based on likely API
import { LlmAgent } from '@google/adk';

async function run() {
    // We can't easily peek into MCPToolset without using it in an agent or knowing internal API.
    // But we can try.

    // Initialize toolsets (if they need it)
    // The best way might be to just use docling directly if I can.

    try {
        console.log('Initialization...');
        // Force initialization if lazy
        // analyzeFiguresTool uses doclingToolset.call, so it assumes it works.

        // 1. Download: We need to use 'download_paper' tool.
        // If arxivToolset is an MCPToolset, it should have a client.
        // Let's try to access tools via `load()` or similar if it exists.
        // Or assume `arxivToolset.tools` is populated.

        let downloadTool;
        // Check if tools property exists and is populated
        if (arxivToolset.tools && arxivToolset.tools.length > 0) {
            downloadTool = arxivToolset.tools.find(t => t.name === 'download_paper');
        } else {
            console.log('Arxiv tools not loaded yet. Attempting to load...');
            // In ADK, tools are loaded when Agent starts?
            // MCPToolset maps MCP tools to ADK tools.
            // Maybe I can call `arxivToolset.init()` or `refresh()`?
            // If I can't finder it, I might skip download and assume file exists? 
            // NO, verifying shared volume is key.

            // Hack: Create a dummy agent to force tool usage? No.
            // Let's try to see if `supplyTools` exists.
        }

        // Just blindly try to access the analyzeFiguresTool, because that IS a FunctionTool instance I created.
        // I can execute THAT directly.
        // AND inside it, it calls doclingToolset.call().
        // If doclingToolset isn't initialized, it might fail.

        // But for Arxiv download, I'll assume I can't easily invoke it if I don't know the API.
        // I will use `docker exec` directly to download the file using curl for the setup phase!
        // This is robust.

        const { execSync } = await import('child_process');
        console.log('📥 Downloading paper via Docker (simulating Arxiv MCP)...');
        // mcp-arxiv container stores in /app/data/papers
        // We can use curl inside mcp-arxiv container to download payload.
        // Or just `wget`.
        // Attention Is All You Need PDF url: https://arxiv.org/pdf/1706.03762.pdf
        try {
            const cmd = 'docker exec kilig-mcp-arxiv curl -s -L "https://arxiv.org/pdf/1706.03762.pdf" -o /app/data/papers/attention.pdf';
            execSync(cmd);
            console.log('✅ Downloaded attention.pdf to shared volume via mcp-arxiv');
        } catch (e) {
            console.error('Failed via mcp-arxiv (curl missing?), trying python via mcp-docling:', e.message);
            try {
                // Try python download (docling container has python)
                const pythonCmd = `import urllib.request; urllib.request.urlretrieve("https://arxiv.org/pdf/1706.03762.pdf", "/app/data/papers/attention.pdf")`;
                const cmd = `docker exec kilig-mcp-docling python3 -c '${pythonCmd}'`;
                execSync(cmd);
                console.log('✅ Downloaded attention.pdf via python');
            } catch (e2) {
                console.error('Failed python download too:', e2.message);
            }
        }

        // 2. Analyze
        console.log('📊 Analyzing figures...');
        const result = await analyzeFiguresTool.execute({
            file_path: '/app/data/papers/attention.pdf',
            pages: [1]
        });

        console.log('Analysis Result:', result);

    } catch (err) {
        console.error('Test Error:', err);
    }
}

run();
