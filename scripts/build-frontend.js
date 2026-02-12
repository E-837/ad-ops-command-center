/**
 * Frontend Build Script
 * 
 * Simple build process using esbuild for production optimization:
 * - Minifies JavaScript files
 * - Bundles dependencies (if any)
 * - Outputs to build/ directory
 * - Preserves original files in ui/ for development
 * 
 * Usage:
 *   node scripts/build-frontend.js
 *   npm run build
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { promisify } = require('util');

const gzip = promisify(zlib.gzip);

const UI_DIR = path.join(__dirname, '..', 'ui');
const BUILD_DIR = path.join(__dirname, '..', 'build');

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
  console.log('✅ Created build/ directory');
}

// Get all JavaScript files in ui/ directory
const jsFiles = fs.readdirSync(UI_DIR)
  .filter(file => file.endsWith('.js'))
  .map(file => path.join(UI_DIR, file));

if (jsFiles.length === 0) {
  console.log('⚠️  No JavaScript files found in ui/ directory');
  process.exit(0);
}

console.log(`\n🔨 Building ${jsFiles.length} JavaScript files...\n`);

// Build each JS file
Promise.all(
  jsFiles.map(async (file) => {
    const filename = path.basename(file);
    const outfile = path.join(BUILD_DIR, filename);
    
    try {
      await esbuild.build({
        entryPoints: [file],
        outfile: outfile,
        bundle: false,  // Don't bundle - these are standalone scripts
        minify: true,
        sourcemap: true,
        target: 'es2020',
        format: 'iife',  // Wrap in IIFE for browser compatibility
        logLevel: 'warning'
      });
      
      const originalSize = fs.statSync(file).size;
      const minifiedSize = fs.statSync(outfile).size;
      const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(1);
      
      console.log(`✅ ${filename}`);
      console.log(`   ${(originalSize / 1024).toFixed(1)}KB → ${(minifiedSize / 1024).toFixed(1)}KB (${savings}% smaller)`);
    } catch (error) {
      console.error(`❌ ${filename}: ${error.message}`);
    }
  })
).then(async () => {
  console.log('\n✨ Build complete!\n');
  console.log('📦 Production files in build/');
  console.log('💡 Set NODE_ENV=production to serve from build/\n');
  
  // Copy HTML files to build directory
  const htmlFiles = fs.readdirSync(UI_DIR).filter(f => f.endsWith('.html'));
  htmlFiles.forEach(file => {
    fs.copyFileSync(
      path.join(UI_DIR, file),
      path.join(BUILD_DIR, file)
    );
  });
  
  console.log(`📄 Copied ${htmlFiles.length} HTML files to build/\n`);
  
  // Gzip compress JS files for faster serving
  console.log('🗜️  Compressing assets with gzip...\n');
  const jsBuiltFiles = fs.readdirSync(BUILD_DIR).filter(f => f.endsWith('.js'));
  let totalCompressed = 0;
  
  for (const file of jsBuiltFiles) {
    const filePath = path.join(BUILD_DIR, file);
    const content = fs.readFileSync(filePath);
    const compressed = await gzip(content);
    fs.writeFileSync(filePath + '.gz', compressed);
    
    const savings = ((1 - compressed.length / content.length) * 100).toFixed(1);
    totalCompressed++;
    console.log(`✅ ${file}.gz (${savings}% smaller)`);
  }
  
  console.log(`\n✨ Compressed ${totalCompressed} files for production\n`);
}).catch(error => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});
