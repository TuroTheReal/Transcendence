import { build, context } from 'esbuild';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDev = process.argv.includes('--dev');

async function buildCSS() {
  try {
    // Utiliser PostCSS CLI directement
    const command = 'npx postcss src/style.css -o dist/style.css --config ./postcss.config.js';
    execSync(command, { cwd: __dirname, stdio: 'inherit' });
    console.log('✓ CSS compiled with Tailwind');
  } catch (error) {
    console.error('❌ CSS compilation failed:', error.message);
    throw error;
  }
}

const config = {
  entryPoints: ['src/main.ts'],
  bundle: true,
  outdir: 'dist',
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  sourcemap: isDev,
  minify: !isDev,
  tsconfig: 'tsconfig.json',
  loader: {
    '.css': 'text',
  },
  external: [],
  define: {
    'process.env.NODE_ENV': isDev ? '"development"' : '"production"'
  }
};

async function copyPublicAssets() {
  const publicDir = path.join(__dirname, '../public');
  const distDir = path.join(__dirname, 'dist');
  
  try {
    await fs.access(publicDir);
    await fs.cp(publicDir, distDir, { 
      recursive: true,
      filter: (src) => !src.includes('node_modules')
    });
    console.log('✓ Public assets copied');
  } catch (error) {
    console.log('No public directory found or error copying assets');
  }
}

async function createHTMLFile() {
  const htmlContent = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="./assets/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="./style.css">
    <title>Transcendence</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="./main.js"></script>
  </body>
</html>`;

  const distDir = path.join(__dirname, 'dist');
  await fs.mkdir(distDir, { recursive: true });
  await fs.writeFile(path.join(distDir, 'index.html'), htmlContent);
  console.log('✓ HTML file created');
}

async function buildOnce() {
  try {
    await fs.mkdir('dist', { recursive: true });
    await buildCSS();
    await build(config);
    await createHTMLFile();
    await copyPublicAssets();
    console.log('✓ Build completed successfully');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function buildWatch() {
  try {
    await fs.mkdir('dist', { recursive: true });
    await buildCSS();
    const ctx = await context(config);
    
    await ctx.watch();
    await createHTMLFile();
    await copyPublicAssets();
    
    console.log('👀 Watching for changes...');
    
    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error('Watch build failed:', error);
    process.exit(1);
  }
}

if (isDev) {
  buildWatch();
} else {
  buildOnce();
}