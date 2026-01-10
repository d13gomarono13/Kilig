import { doclingToolset } from '../dist/agents/scientist/toolsets.js';

async function inspect() {
    console.log('Inspecting Docling Toolset...');
    try {
        if (typeof doclingToolset.supplyTools === 'function') {
            const tools = await doclingToolset.supplyTools();
            console.log('Tools found:', tools.map(t => t.name));
            console.log('First tool definition:', JSON.stringify(tools[0], null, 2));
        } else {
            console.log('No supplyTools method found');
            if (doclingToolset.mcpSessionManager) {
                console.log('mcpSessionManager keys:', Object.keys(doclingToolset.mcpSessionManager));
                // Try getClient
                if (doclingToolset.mcpSessionManager.getClient) {
                    console.log('Has getClient method');
                    const client = await doclingToolset.mcpSessionManager.getClient();
                    console.log('Client acquired');
                    const tools = await client.listTools();
                    console.log('Client tools:', tools);
                }
            }
        }
    } catch (e) {
        console.error('Inspection failed:', e);
    }
}
inspect();
