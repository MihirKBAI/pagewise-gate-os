import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 Building PageWise executable package...');

// 1. Ensure Vite production build is ready
const distPath = path.join(rootDir, 'dist');
const indexPath = path.join(distPath, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.log('📦 dist/index.html not found, running build...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} else {
  console.log('✅ dist/index.html found.');
}

// 2. Locate Electron installation
let electronLibDir = null;
const possibleDirs = [
  '/usr/lib/electron29',
  '/usr/lib/electron28',
  '/usr/lib/electron',
];

for (const dir of possibleDirs) {
  if (fs.existsSync(path.join(dir, 'electron'))) {
    electronLibDir = dir;
    break;
  }
}

if (!electronLibDir) {
  console.error('❌ Could not locate system electron runtime in:', possibleDirs);
  process.exit(1);
}

console.log(`🔍 Using Electron runtime from: ${electronLibDir}`);

// 3. Destination directory
const outDir = path.join(rootDir, 'dist-desktop', 'pagewise-linux-x64');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

// 4. Copy runtime files
const filesToCopy = [
  'chrome_100_percent.pak',
  'chrome_200_percent.pak',
  'chrome_crashpad_handler',
  'chrome-sandbox',
  'libEGL.so',
  'libffmpeg.so',
  'libGLESv2.so',
  'libvk_swiftshader.so',
  'libvulkan.so.1',
  'resources.pak',
  'snapshot_blob.bin',
  'v8_context_snapshot.bin',
  'version',
  'vk_swiftshader_icd.json',
];

for (const file of filesToCopy) {
  const src = path.join(electronLibDir, file);
  const dest = path.join(outDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
}

// Copy locales directory
const localesSrc = path.join(electronLibDir, 'locales');
if (fs.existsSync(localesSrc)) {
  fs.cpSync(localesSrc, path.join(outDir, 'locales'), { recursive: true });
}

// Copy resources (without existing default_app)
const resourcesDest = path.join(outDir, 'resources');
fs.mkdirSync(resourcesDest, { recursive: true });
const resourcesPakSrc = path.join(electronLibDir, 'resources', 'resources.pak');
if (fs.existsSync(resourcesPakSrc)) {
  fs.copyFileSync(resourcesPakSrc, path.join(resourcesDest, 'resources.pak'));
} else if (fs.existsSync(path.join(electronLibDir, 'resources.pak'))) {
  fs.copyFileSync(path.join(electronLibDir, 'resources.pak'), path.join(resourcesDest, 'resources.pak'));
}

// Copy electron binary as "pagewise"
const electronBinarySrc = path.join(electronLibDir, 'electron');
const appBinaryDest = path.join(outDir, 'pagewise');
fs.copyFileSync(electronBinarySrc, appBinaryDest);
fs.chmodSync(appBinaryDest, 0o755);

// 5. Setup resources/app with our application code
const appDir = path.join(resourcesDest, 'app');
fs.mkdirSync(appDir, { recursive: true });

// Copy dist/
fs.cpSync(distPath, path.join(appDir, 'dist'), { recursive: true });

// Copy electron/main.cjs
const electronAppDir = path.join(appDir, 'electron');
fs.mkdirSync(electronAppDir, { recursive: true });
fs.copyFileSync(
  path.join(rootDir, 'electron', 'main.cjs'),
  path.join(electronAppDir, 'main.cjs')
);

// Write app package.json
const appPackageJson = {
  name: 'pagewise-gate-os',
  version: '1.0.0',
  main: 'electron/main.cjs',
};
fs.writeFileSync(
  path.join(appDir, 'package.json'),
  JSON.stringify(appPackageJson, null, 2)
);

// 6. Create icon and desktop shortcut
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" rx="20" fill="#4f46e5"/>
  <text y="70" x="18" font-size="60" fill="white">⚡</text>
</svg>`;

const desktopDir = path.join(rootDir, 'dist-desktop');
fs.writeFileSync(path.join(desktopDir, 'pagewise.svg'), iconSvg);
fs.writeFileSync(path.join(outDir, 'pagewise.svg'), iconSvg);

const desktopEntry = `[Desktop Entry]
Name=PageWise
Comment=GATE OS Visual & Infographic Tutor
Exec="${appBinaryDest}" %U
Icon=${path.join(outDir, 'pagewise.svg')}
Terminal=false
Type=Application
Categories=Education;Science;
StartupWMClass=pagewise-gate-os
`;
fs.writeFileSync(path.join(desktopDir, 'pagewise.desktop'), desktopEntry);
fs.chmodSync(path.join(desktopDir, 'pagewise.desktop'), 0o755);

// 7. Create root executable launcher script
const rootLauncherPath = path.join(rootDir, 'pagewise');
const rootLauncherScript = `#!/usr/bin/env bash
# PageWise Desktop App Launcher
set -e

DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
STANDALONE_BIN="$DIR/dist-desktop/pagewise-linux-x64/pagewise"

if [ -x "$STANDALONE_BIN" ]; then
  exec "$STANDALONE_BIN" "$@"
elif [ -x "$DIR/node_modules/.bin/electron" ]; then
  exec "$DIR/node_modules/.bin/electron" "$DIR" "$@"
elif command -v electron >/dev/null 2>&1; then
  exec electron "$DIR" "$@"
else
  echo "Error: Neither standalone bundle nor electron runtime was found." >&2
  exit 1
fi
`;
fs.writeFileSync(rootLauncherPath, rootLauncherScript);
fs.chmodSync(rootLauncherPath, 0o755);

// Also create a symlink / copy with package name pagewise-gate-os
const rootLauncherAlias = path.join(rootDir, 'pagewise-gate-os');
fs.writeFileSync(rootLauncherAlias, rootLauncherScript);
fs.chmodSync(rootLauncherAlias, 0o755);

console.log('🎉 Successfully created standalone executable:');
console.log(`  - Root Executable: ${rootLauncherPath}`);
console.log(`  - Standalone Package: ${appBinaryDest}`);
console.log(`  - Desktop Shortcut: ${path.join(desktopDir, 'pagewise.desktop')}`);
