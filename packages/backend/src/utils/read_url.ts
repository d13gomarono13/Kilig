// Using native Node.js 18+ fetch API instead of node-fetch
// This avoids type definition issues and reduces external dependencies.


export async function readUrlContent(url: string): Promise<string> {
    console.log(`[Utils] Reading content from: ${url}`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
        }
        const html = await response.text();

        // Very basic HTML to text conversion (strip tags)
        // In a real scenario, we'd use a robust library, but for prompt caching test, 
        // we want to avoid complex dependency management.
        let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
        text = text.replace(/<[^>]+>/g, ' ');
        text = text.replace(/\s+/g, ' ').trim();

        return text;
    } catch (error: any) {
        console.error(`[Utils] Error reading URL: ${error.message}`);
        throw error;
    }
}
