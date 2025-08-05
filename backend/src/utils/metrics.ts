import { register, collectDefaultMetrics, Counter, Histogram, Gauge } from 'prom-client';

// Collecte automatique système (CPU, mémoire, etc.)
// transcendence_  permet d'identifier facilement les métriques
collectDefaultMetrics({
    prefix: 'transcendence_',
    gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
});

export const httpRequestsTotal = new Counter({
    name: 'transcendence_http_requests_total',
    help: 'Total number of HTTP requests processed',
    labelNames: ['method', 'route', 'status_code'],
});

export const httpRequestDuration = new Histogram({
    name: 'transcendence_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.001, 0.01, 0.1, 0.5, 1.0, 2.5, 5.0, 10.0],
});

export const connectedUsers = new Gauge({
    name: 'transcendence_connected_users',
    help: 'Number of currently connected users',
});

export const applicationErrors = new Counter({
    name: 'transcendence_application_errors_total',
    help: 'Total number of application errors',
    labelNames: ['type', 'severity', 'route'],
});

export const signupRequests = new Counter({
    name: 'transcendence_signup_requests_total',
    help: 'Total number of signup requests',
    labelNames: ['status'], // 'success' ou 'failure'
});

export const loginRequests = new Counter({
    name: 'transcendence_login_requests_total',
    help: 'Total number of login requests',
    labelNames: ['status'],
});

export const getMetrics = async () => {
    return await register.metrics();
};

export const clearMetrics = () => {
    register.clear();
};

export const recordHttpRequest = (method: string, route: string, statusCode: number, duration: number) => {
    const labels = {
        method: method.toUpperCase(),
        route: route || 'unknown',
        status_code: statusCode.toString(),
    };

    httpRequestsTotal.inc(labels);

    httpRequestDuration.observe(labels, duration);
};

export const recordError = (type: string, severity: string, route: string) => {
    applicationErrors.inc({
        type,
        severity,
        route: route || 'unknown',
    });
};
