import { defineConfig } from "vite";

export default defineConfig({
	root: "./src",
	publicDir: "../public",
	build: {
		outDir: "../dist",
		emptyOutDir: true,
		rollupOptions: {
			input: "./src/index.html",
		},
	},
	server: {
		host: true,
		port: 5173,
		watch: {
			usePolling: true,
			interval: 100,
		},
		hmr: {
			port: 5173,
		},
		proxy: {
			"/api": "http://localhost:3000",
		},
	},
	css: {
		postcss: "./postcss.config.js",
	},
});
