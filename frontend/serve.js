import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5174;

// Serve static files from dist directory
app.use(express.static(path.join(__dirname, 'dist')));

// API proxy
app.use('/api', createProxyMiddleware({
  target: 'https://localhost:3002',
  changeOrigin: true,
  secure: true,
  rejectUnauthorized: false
}));

// WebSocket proxy
app.use('/ws', createProxyMiddleware({
  target: 'wss://localhost:3002',
  ws: true,
  changeOrigin: true,
  secure: true,
  rejectUnauthorized: false
}));

// Metrics proxy
app.use('/metrics', createProxyMiddleware({
  target: 'http://localhost:3001',
  changeOrigin: true,
  secure: false
}));

// Catch-all handler for SPA routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// HTTPS configuration
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, '../backend/ssl/key.pem')),
  cert: fs.readFileSync(path.join(__dirname, '../backend/ssl/cert.pem')),
};

const server = https.createServer(httpsOptions, app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Development server running at https://localhost:${PORT}`);
});