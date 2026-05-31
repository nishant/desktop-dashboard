// Pre-populate the electron-builder winCodeSign cache on Windows.
//
// electron-builder downloads winCodeSign-2.6.0.7z and extracts it via 7za. The
// archive contains darwin/* symbolic links (libcrypto/libssl dylibs) and 7za
// returns exit code 2 if it can't create them. Non-admin Windows accounts
// can't create symlinks unless Developer Mode is enabled, so the extract fails
// and the whole packaging step aborts.
//
// We don't need the darwin files for Windows builds. This script downloads the
// archive and extracts it ourselves with -xr!darwin so 7za never touches the
// symlink entries, then places the result at the cache path electron-builder
// expects (LOCALAPPDATA/electron-builder/Cache/winCodeSign/winCodeSign-2.6.0).
//
// No-op on macOS/Linux.

const fs = require('fs');
const https = require('https');
const path = require('path');
const { spawnSync } = require('child_process');

if (process.platform !== 'win32') process.exit(0);

const VERSION = '2.6.0';
const NAME = `winCodeSign-${VERSION}`;
const URL = `https://github.com/electron-userland/electron-builder-binaries/releases/download/${NAME}/${NAME}.7z`;

const cacheRoot = path.join(process.env.LOCALAPPDATA, 'electron-builder', 'Cache', 'winCodeSign');
const finalDir = path.join(cacheRoot, NAME);
const archivePath = path.join(cacheRoot, `${NAME}.7z`);

if (fs.existsSync(path.join(finalDir, 'rcedit-x64.exe'))) {
  console.log(`[prepare-wincodesign] cache already populated at ${finalDir}`);
  process.exit(0);
}

fs.mkdirSync(cacheRoot, { recursive: true });

function download(url, dest) {
  return new Promise((resolve, reject) => {
    function get(u) {
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode} from ${u}`));
        }
        const out = fs.createWriteStream(dest);
        res.pipe(out);
        out.on('finish', () => out.close(resolve));
        out.on('error', reject);
      }).on('error', reject);
    }
    get(url);
  });
}

(async () => {
  if (!fs.existsSync(archivePath)) {
    console.log(`[prepare-wincodesign] downloading ${URL}`);
    await download(URL, archivePath);
  }

  // 7za ships with electron-builder via 7zip-bin (transitive dep, can't be
  // required directly under pnpm strict resolution). Glob node_modules/.pnpm
  // for the binary so we don't pin a specific version.
  const pnpmDir = path.join(__dirname, '..', 'node_modules', '.pnpm');
  const sevenZip = fs.readdirSync(pnpmDir)
    .filter((d) => d.startsWith('7zip-bin@'))
    .map((d) => path.join(pnpmDir, d, 'node_modules', '7zip-bin', 'win', 'x64', '7za.exe'))
    .find((p) => fs.existsSync(p));
  if (!sevenZip) {
    console.error('[prepare-wincodesign] 7za.exe not found under node_modules/.pnpm/7zip-bin@*');
    process.exit(1);
  }

  console.log(`[prepare-wincodesign] extracting to ${finalDir} (excluding darwin/)`);
  const r = spawnSync(sevenZip, [
    'x', '-snld', '-bd', '-y',
    archivePath,
    `-o${finalDir}`,
    '-xr!darwin',
  ], { stdio: 'inherit' });

  if (r.status !== 0) {
    console.error(`[prepare-wincodesign] 7za exited ${r.status}`);
    process.exit(r.status || 1);
  }
  console.log('[prepare-wincodesign] done');
})().catch((e) => {
  console.error('[prepare-wincodesign]', e);
  process.exit(1);
});
