import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const cacheDir = process.env.CACHE_DIR || '.cache';
const absoluteCacheDir = path.resolve(process.cwd(), cacheDir);

async function clearCache() {
  console.log(`[ClearCache] Target: ${absoluteCacheDir}`);
  
  try {
    const stats = await fs.stat(absoluteCacheDir);
    if (!stats.isDirectory()) {
      console.log('[ClearCache] Path is not a directory. Skipping.');
      return;
    }

    const files = await fs.readdir(absoluteCacheDir);
    console.log(`[ClearCache] Found ${files.length} files. Removing...`);

    await Promise.all(
      files.map(file => {
        const filePath = path.join(absoluteCacheDir, file);
        return fs.unlink(filePath).catch(err => console.error(`Failed to delete ${file}:`, err));
      })
    );

    console.log('[ClearCache] Success.');
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('[ClearCache] Cache directory does not exist. Nothing to clear.');
    } else {
      console.error('[ClearCache] Error:', error);
    }
  }
}

clearCache();
