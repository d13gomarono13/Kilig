import fs from 'fs';
import path from 'path';

const artifactsBase = path.join(process.cwd(), 'tests', 'artifacts');
const latestLink = path.join(artifactsBase, 'latest');

async function main() {
    if (!fs.existsSync(artifactsBase)) {
        console.error('No tests/artifacts directory found.');
        process.exit(1);
    }

    const dirs = fs.readdirSync(artifactsBase)
        .filter(f => {
            if (f === 'latest') return false; // Skip the symlink itself
            try {
                return fs.statSync(path.join(artifactsBase, f)).isDirectory();
            } catch (e) {
                return false; // Ignore broken links/files
            }
        })
        .sort((a, b) => b.localeCompare(a)); // Sort by timestamp string descending

    if (dirs.length === 0) {
        console.error('No artifacts found.');
        process.exit(1);
    }

    const latestDir = path.join(artifactsBase, dirs[0]);

    try {
        // Check if it exists (even if broken symlink)
        const stat = fs.lstatSync(latestLink);
        // If we get here, it exists. Remove it.
        fs.rmSync(latestLink, { recursive: true, force: true });
    } catch (e) {
        // It doesn't exist, safe to proceed
    }

    // On Windows, symlinks might need special permissions, but we are on Mac.
    fs.symlinkSync(latestDir, latestLink, 'dir');
    console.log(`Linked "latest" to: ${dirs[0]}`);
}

main();
