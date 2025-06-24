import { defineConfig } from 'vite';

export default defineConfig({
    root: './src',
    publicDir: '../public',
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: 'index.html'
        }
    },
    server: {
        proxy: {
            '/api': 'http://localhost:3000'
        }
    }
});