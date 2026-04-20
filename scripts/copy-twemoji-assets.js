const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

const sourceDir = path.resolve(__dirname, '..', 'node_modules', '@twemoji', 'svg');
const targetDir = path.resolve(__dirname, '..', 'twemoji', 'svg');

function ensureDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    return;
  }

  ensureDir(path.dirname(dirPath));
  fs.mkdirSync(dirPath);
}

function copyDirectory(sourcePath, targetPath) {
  ensureDir(targetPath);

  fs.readdirSync(sourcePath).forEach((entryName) => {
    const sourceEntryPath = path.join(sourcePath, entryName);
    const targetEntryPath = path.join(targetPath, entryName);
    const stats = fs.statSync(sourceEntryPath);

    if (stats.isDirectory()) {
      copyDirectory(sourceEntryPath, targetEntryPath);
      return;
    }

    fs.copyFileSync(sourceEntryPath, targetEntryPath);
  });
}

if (!fs.existsSync(sourceDir)) {
  throw new Error('Twemoji SVG assets were not found in node_modules/@twemoji/svg.');
}

rimraf.sync(targetDir);
copyDirectory(sourceDir, targetDir);

console.log('Copied Twemoji SVG assets to %s', targetDir);