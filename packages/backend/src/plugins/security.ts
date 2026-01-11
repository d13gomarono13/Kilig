import { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';

/**
 * Security Plugin
 * Configures Helmet headers and other security safeguards.
 */
export async function securityPlugin(server: FastifyInstance) {
    // 1. HTTP Security Headers (Helmet)
    await server.register(helmet, {
        global: true,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                baseUri: ["'self'"],
                fontSrc: ["'self'", 'https:', 'data:'],
                formAction: ["'self'"],
                frameAncestors: ["'self'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                objectSrc: ["'none'"],
                scriptSrc: ["'self'"],
                scriptSrcAttr: ["'none'"],
                styleSrc: ["'self'", 'https:', "'unsafe-inline'"],
                upgradeInsecureRequests: [],
            },
        },
        // Disable HSTS in development to avoid local SSL issues if not using HTTPS
        hsts: process.env.NODE_ENV === 'production',
    });

    server.log.info('[Security] Helmet headers configured');
}
