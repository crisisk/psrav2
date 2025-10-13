const fs = require('fs');
const path = require('path');

// Files that need cleaning
const files = [
  'app/(app)/help/page.tsx',
  'app/(app)/api-docs/page.tsx',
  'app/(app)/privacy/page.tsx',
  'app/(app)/settings/page.tsx',
  'app/api/assessments/[id]/export/route.ts',
  'app/api/ltsd/generate/route.ts',
  'app/(app)/assessment/[id]/page.tsx',
  'app/(app)/cfo/page.tsx',
  'app/(app)/dashboard/page.tsx',
];

function cleanFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  try {
    let content = fs.readFileSync(fullPath, 'utf8');

    // Remove markdown description lines (e.g., "Here's a complete...")
    content = content.replace(/^.*Here's (a complete|the complete).*\n\n/im, '');
    content = content.replace(/^.*This implementation.*\n\n/im, '');

    // Remove opening code fence
    content = content.replace(/^```(?:typescript|tsx|ts|javascript|jsx|js)\n/gm, '');

    // Remove closing code fence
    content = content.replace(/\n```\s*$/gm, '');

    // Remove multiple backticks and trailing explanations
    content = content.replace(/\n```\n\n.*$/s, '');

    // Clean up any remaining backticks at start or end
    content = content.replace(/^```[a-z]*\n/, '');
    content = content.replace(/\n```$/, '');

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Cleaned: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

files.forEach(cleanFile);
console.log('\n✨ Done!');
