import { register, Counter, Histogram, Gauge } from 'prom-client'

export const httpRequestsTotal = new Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'status_code']
});

export const httpRequestDuration = new Histogram({
	name: 'http_requests_duration_seconds',
	help: 'Duration of HTTP requests in seconds',
	labelNames: ['method', 'route']
})

export const activeConnections = new Gauge({
	name: 'active_connections',
	help: 'Number of active connections',
})

export const getMetrics = () => register.metrics();