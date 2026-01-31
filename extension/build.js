const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');

// Ensure dist directory exists
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files
const staticFiles = ['manifest.json', 'popup.html', 'popup.css'];
staticFiles.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
    console.log(`Copied ${file}`);
  }
});

// Copy icons directory
const iconsDir = path.join(__dirname, 'icons');
const distIconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(distIconsDir)) {
  fs.mkdirSync(distIconsDir, { recursive: true });
}

// Create placeholder icons if they don't exist
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = path.join(distIconsDir, `icon${size}.png`);
  if (!fs.existsSync(iconPath)) {
    // Create a simple placeholder (1x1 transparent PNG)
    // In production, replace with actual icons
    console.log(`Note: Create icon${size}.png in extension/icons/`);
  }
});

// Build TypeScript files
const buildOptions = {
  entryPoints: [
    path.join(__dirname, 'src', 'popup.ts'),
    path.join(__dirname, 'src', 'background.ts')
  ],
  bundle: true,
  outdir: distDir,
  format: 'esm',
  platform: 'browser',
  target: ['chrome90'],
  minify: !isWatch,
  sourcemap: isWatch,
  define: {
    'process.env.NODE_ENV': isWatch ? '"development"' : '"production"'
  },
  external: [],
  logLevel: 'info'
};

async function build() {
  try {
    if (isWatch) {
      const ctx = await esbuild.context(buildOptions);
      await ctx.watch();
      console.log('Watching for changes...');
    } else {
      await esbuild.build(buildOptions);
      console.log('Build complete!');
    }
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();
