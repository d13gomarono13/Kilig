import { MCPToolset } from '@google/adk';

// ArXiv MCP Toolset Configuration (Dockerized)
export const arxivToolset = new MCPToolset({
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
            'arxiv-mcp-server',
            '--storage-path',
            '/app/data/papers'
        ],
    },
});

// Docling MCP Toolset Configuration (Dockerized)
export const doclingToolset = new MCPToolset({
    type: 'StdioConnectionParams',
    serverParams: {
        command: 'docker',
        args: [
            'exec',
            '-i',
            'kilig-mcp-docling',
            'uv',
            'tool',
            'run',
            'docling-mcp-server'
        ],
    },
});
