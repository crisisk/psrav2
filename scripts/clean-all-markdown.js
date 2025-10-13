const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all .tsx and .ts files
const files = execSync('find . -type f \\( -name "*.tsx" -o -name "*.ts" \\) ! -path "./node_modules/*" ! -path "./.next/*" ! -path "./demo/*"', {
  cwd: process.cwd(),
  encoding: 'utf8'
}).trim().split('\n').filter(Boolean);

function cleanFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');

    // Check if file starts with code fence
    if (!content.startsWith('```')) {
      return false; // Skip files that don't need cleaning
    }

    // Remove opening code fence (```tsx, ```typescript, etc)
    content = content.replace(/^```[a-z]*\n/, '');

    // Remove closing code fence and everything after it
    const lastFenceIndex = content.lastIndexOf('\n```');
    if (lastFenceIndex !== -1) {
      content = content.substring(0, lastFenceIndex + 1);
    }

    // Write cleaned content
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
    return false;
  }
}

let cleaned = 0;
let skipped = 0;

files.forEach(file => {
  if (cleanFile(file)) {
    console.log(`✅ Cleaned: ${file}`);
    cleaned++;
  } else {
    skipped++;
  }
});

console.log(`\n✨ Done! Cleaned ${cleaned} files, skipped ${skipped} files.`);
