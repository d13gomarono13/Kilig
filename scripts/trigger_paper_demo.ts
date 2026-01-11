
// Native fetch is available in Node > 18
// import fetch from 'node-fetch';

async function triggerPaper() {
    const query = "Explain this paper: https://arxiv.org/abs/1706.03762";
    console.log(`📡 Triggering Pipeline for: "${query}"`);

    try {
        const response = await fetch('http://localhost:8000/api/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        console.log("✅ Triggered successfully! Connection established.");
        console.log("Listening for SSE events...");

        // Native fetch returns a ReadableStream which is async iterable in Node
        if (response.body) {
            // @ts-ignore
            for await (const chunk of response.body) {
                const text = new TextDecoder().decode(chunk);
                // Simple log of event types
                if (text.includes('agent_event')) console.log("   [Agent Active] Processing...");
                if (text.includes('artifact_updated')) console.log("   [Artifact] Content Generated!");
                if (text.includes('done')) {
                    console.log("✅ Pipeline COMPLETE!");
                    process.exit(0);
                }
            }
        }

    } catch (error) {
        console.error("❌ Error triggering pipeline:", error);
    }
}

triggerPaper();
