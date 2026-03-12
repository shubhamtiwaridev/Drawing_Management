const fs = require('fs');
const path = require('path');

const releaseDir = path.join(__dirname, '..', 'release');

try {
  fs.rmSync(releaseDir, { recursive: true, force: true });
  console.log(`Removed ${releaseDir}`);
} catch (error) {
  console.error(`Failed to remove ${releaseDir}:`, error.message);
  process.exit(1);
}
