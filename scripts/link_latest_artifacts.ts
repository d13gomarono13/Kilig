import fs from 'fs';
import path from 'path';

const artifactsBase = path.join(process.cwd(), 'test_artifacts');
const latestLink = path.join(artifactsBase, 'latest');

async function main() {
    if (!fs.existsSync(artifactsBase)) {
        console.error('No test_artifacts directory found.');
        process.exit(1);
    }

    const dirs = fs.readdirSync(artifactsBase)
        .filter(f => fs.statSync(path.join(artifactsBase, f)).isDirectory() && f !== 'latest')
        .sort((a, b) => b.localeCompare(a)); // Sort by timestamp string descending

    if (dirs.length === 0) {
        console.error('No artifacts found.');
        process.exit(1);
    }

    const latestDir = path.join(artifactsBase, dirs[0]);

    if (fs.existsSync(latestLink)) {
        fs.unlinkSync(latestLink);
    }

    // On Windows, symlinks might need special permissions, but we are on Mac.
    fs.symlinkSync(latestDir, latestLink, 'dir');
    console.log(`Linked "latest" to: ${dirs[0]}`);
}

main();
