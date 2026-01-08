import fs from 'fs';
import path from 'path';

const resultsDir = path.join(process.cwd(), 'tests', 'results');
const latestJson = path.join(resultsDir, 'latest.json');
const latestHtml = path.join(resultsDir, 'latest.html');

function main() {
  if (!fs.existsSync(latestJson)) {
    console.error('❌ No latest.json found in tests/results. Run "npm run test:eval" first.');
    // Don't fail the build, just warn
    return;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const archiveName = `run-${timestamp}`;
  
  // Archive JSON
  const jsonArchive = path.join(resultsDir, `${archiveName}.json`);
  fs.copyFileSync(latestJson, jsonArchive);
  
  // Archive HTML if it exists
  if (fs.existsSync(latestHtml)) {
      const htmlArchive = path.join(resultsDir, `${archiveName}.html`);
      fs.copyFileSync(latestHtml, htmlArchive);
      console.log(`✅ Archived results to:\n  - ${jsonArchive}\n  - ${htmlArchive}`);
  } else {
      console.log(`✅ Archived JSON results to: ${jsonArchive}`);
  }

  console.log(`\n📊 To view historical results, use: npx promptfoo view`);
}

main();