import fs from 'fs';
import path from 'path';

const artifactsDir = path.join(process.cwd(), 'test_artifacts', 'latest');

function main() {
  if (!fs.existsSync(artifactsDir)) {
    console.error('test_artifacts/latest does not exist. Run link_latest_artifacts.ts first.');
    // Don't fail hard, maybe just warn if no artifacts yet (e.g. pre-run)
    return;
  }

  const files = fs.readdirSync(artifactsDir);
  console.log(`Scanning ${files.length} artifacts in ${artifactsDir}...`);
  
  // 1. Find Scientist Analysis
  // Look for largest text file from scientist
  const scientistFiles = files.filter(f => f.includes('scientist') && f.includes('text') && f.endsWith('.json'));
  let bestScientistFile = null;
  let maxScientistSize = 0;
  
  for (const f of scientistFiles) {
      try {
        const content = fs.readFileSync(path.join(artifactsDir, f), 'utf-8');
        const raw = JSON.parse(content);
        if (raw.text && raw.text.length > maxScientistSize) {
            maxScientistSize = raw.text.length;
            bestScientistFile = f;
        }
      } catch (e) {
          console.error(`Error reading ${f}:`, e);
      }
  }

  if (bestScientistFile) {
      const raw = JSON.parse(fs.readFileSync(path.join(artifactsDir, bestScientistFile), 'utf-8'));
      fs.writeFileSync(path.join(artifactsDir, 'scientist_analysis.txt'), raw.text);
      console.log(`✅ Normalized Scientist Analysis from ${bestScientistFile}`);
  } else {
      console.warn('⚠️ No Scientist Analysis text found. Writing dummy file.');
      fs.writeFileSync(path.join(artifactsDir, 'scientist_analysis.txt'), '');
  }

  // 2. Find Comic Manifest
  // Look for narrative tool call with save_comic_manifest
  const narrativeFiles = files.filter(f => f.includes('narrative') && f.includes('call') && f.endsWith('.json'));
  let foundManifest = false;
  
  for (const f of narrativeFiles) {
      try {
        const content = fs.readFileSync(path.join(artifactsDir, f), 'utf-8');
        const json = JSON.parse(content);
        // Check if it's a function call part
        if (json.functionCall && json.functionCall.name === 'save_comic_manifest') {
            // The args might be a string or object depending on ADK version/LLM output
            let args = json.functionCall.args;
            if (typeof args === 'string') {
                try { args = JSON.parse(args); } catch (e) {}
            }
            
            fs.writeFileSync(path.join(artifactsDir, 'comic_manifest.json'), JSON.stringify(args, null, 2));
            console.log(`✅ Normalized Comic Manifest from ${f}`);
            foundManifest = true;
            break; 
        }
      } catch (e) {
          console.error(`Error reading ${f}:`, e);
      }
  }
  if (!foundManifest) {
      console.warn('⚠️ No Comic Manifest tool call found. Writing dummy file.');
      fs.writeFileSync(path.join(artifactsDir, 'comic_manifest.json'), '{}');
  }

  // 3. Find Validator Report (Optional)
  const validatorFiles = files.filter(f => f.includes('validator') && f.includes('text') && f.endsWith('.json'));
   let bestValidatorFile = null;
   let maxValidatorSize = 0;
  for (const f of validatorFiles) {
      try {
        const content = fs.readFileSync(path.join(artifactsDir, f), 'utf-8');
        const raw = JSON.parse(content);
        if (raw.text && raw.text.length > maxValidatorSize) {
            maxValidatorSize = raw.text.length;
            bestValidatorFile = f;
        }
      } catch (e) {
        console.error(`Error reading ${f}:`, e);
      }
  }
   if (bestValidatorFile) {
      const raw = JSON.parse(fs.readFileSync(path.join(artifactsDir, bestValidatorFile), 'utf-8'));
      fs.writeFileSync(path.join(artifactsDir, 'validator_report.txt'), raw.text);
      console.log(`✅ Normalized Validator Report from ${bestValidatorFile}`);
  } else {
      console.warn('⚠️ No Validator Report text found. Writing dummy file.');
      fs.writeFileSync(path.join(artifactsDir, 'validator_report.txt'), '');
  }
}

main();
