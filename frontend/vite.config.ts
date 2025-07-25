import { defineConfig } from "vite";
import fs from "fs";

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
    host: '0.0.0.0',
    port: 5174,

    https: {
      key: fs.readFileSync('/app/backend/src/../ssl/key.pem'),
      cert: fs.readFileSync('/app/backend/src/../ssl/cert.pem'),
    },

    watch: {
      usePolling: true,
      interval: 100,
    },

    hmr: {
      port: 5174,
    },

    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false, // Accepte les certificats auto-signés
      },

      "/ws": {
        target: "ws://localhost:3000",
        changeOrigin: true,
        secure: false,
        ws: true,
      },

      '/metrics': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    },
  },

  css: {
    postcss: "./postcss.config.js",
  },
});



// import { defineConfig } from "vite";
// import fs from "fs";

// export default defineConfig({
// 	root: "./src",
// 	publicDir: "../public",
// 	build: {
// 		outDir: "../dist",
// 		emptyOutDir: true,
// 		rollupOptions: {
// 			input: "./src/index.html",
// 		},
// 	},
// 	server: {
// 		host: '0.0.0.0',
// 		port: 5174,
// 		https: {
// 			key: fs.readFileSync('/app/backend/src/../ssl/key.pem'),
// 			cert: fs.readFileSync('/app/backend/src/../ssl/cert.pem'),
// 		},
// 		watch: {
// 			usePolling: true,
// 			interval: 100,
// 		},
// 		hmr: {
// 			port: 5174,
// 		},
// 		proxy: {
// 			"/api": {
// 				target: "https://10.16.13.4:3443",
// 				changeOrigin: true,
// 				secure: false,
// 			},
// 			"/ws": {
// 				target: "ws://10.16.13.4:3443",
// 				ws: true,
// 				changeOrigin: true,
// 			},
// 			'/metrics': 'http://localhost:3000'
// 		},
// 	},
// 	css: {
// 		postcss: "./postcss.config.js",
// 	},
// });
