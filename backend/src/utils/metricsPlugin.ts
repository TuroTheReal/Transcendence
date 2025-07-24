import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { getMetrics, recordHttpRequest, recordError } from './metrics.js';

declare module 'fastify' {
    interface FastifyRequest {
        metricsStartTime?: number;
    }
}

export const metricsPlugin = async (fastify: FastifyInstance, options: FastifyPluginOptions) => {

    fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
        request.metricsStartTime = Date.now();
    });

    fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
        const duration = request.metricsStartTime
            ? (Date.now() - request.metricsStartTime) / 1000
            : 0;

        const method = request.method;
        const route = request.routeOptions?.url || request.url;
        const statusCode = reply.statusCode;

        recordHttpRequest(method, route, statusCode, duration);
    });

    fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
        const errorType = error.constructor.name || 'UnknownError';
        const severity = reply.statusCode >= 500 ? 'critical' : 'warning';
       const route = request.routeOptions?.url || request.url;

        recordError(errorType, severity, route);
    });

    fastify.get('/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const metrics = await getMetrics();

            reply.type('text/plain; version=0.0.4; charset=utf-8');

            return metrics;
        } catch (error) {
            console.error('Erreur lors de la récupération des métriques:', error);
            reply.code(500);
            return 'Erreur interne du serveur';
        }
    });
};

// Fonction pour mettre à jour manuellement certaines métriques
// Par exemple, pour mettre à jour le nombre d'utilisateurs connectés
export const updateConnectedUsers = (count: number) => {
    const { connectedUsers } = require('./metrics.js');
    connectedUsers.set(count);
};

// Fonction pour enregistrer des événements métier spécifiques
export const recordBusinessEvent = (event: string, labels: Record<string, string> = {}) => {
    const { signupRequests, loginRequests } = require('./metrics.js');

    switch (event) {
        case 'signup_success':
            signupRequests.inc({ status: 'success' });
            break;
        case 'signup_failure':
            signupRequests.inc({ status: 'failure' });
            break;
        case 'login_success':
            loginRequests.inc({ status: 'success' });
            break;
        case 'login_failure':
            loginRequests.inc({ status: 'failure' });
            break;
        default:
            console.warn(`Événement métier non reconnu: ${event}`);
    }
};
