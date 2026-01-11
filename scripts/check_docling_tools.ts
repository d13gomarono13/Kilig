
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function main() {
    const transport = new StdioClientTransport({
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
        ]
    });

    const client = new Client({
        name: "test-client",
        version: "1.0.0",
    }, {
        capabilities: {}
    });

    try {
        await client.connect(transport);
        const tools = await client.listTools();
        console.log("AVAILABLE TOOLS:", JSON.stringify(tools, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        try {
            await client.close();
        } catch (e) { }
    }
}

main();
