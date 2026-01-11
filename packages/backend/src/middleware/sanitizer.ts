import { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Basic XSS Sanitization
 * Replaces <, >, &, ", ' with HTML entities to prevent injection.
 */
function escapeHtml(str: string): string {
    return str.replace(/[&<>"']/g, (tag) => {
        const chars: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return chars[tag] || tag;
    });
}

function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
        return escapeHtml(obj);
    }
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }
    if (obj && typeof obj === 'object') {
        const newObj: any = {};
        for (const key in obj) {
            newObj[key] = sanitizeObject(obj[key]);
        }
        return newObj;
    }
    return obj;
}

export const sanitizerMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    // Sanitize Body
    if (request.body) {
        request.body = sanitizeObject(request.body);
    }

    // Sanitize Query
    if (request.query) {
        request.query = sanitizeObject(request.query) as any;
    }

    // Sanitize Params
    if (request.params) {
        request.params = sanitizeObject(request.params) as any;
    }
};
