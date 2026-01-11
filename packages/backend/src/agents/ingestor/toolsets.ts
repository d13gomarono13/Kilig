import { MCPToolset } from '@google/adk';

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
            '--from',
            'docling-mcp',
            'docling-mcp-server'
        ],
    },
});
