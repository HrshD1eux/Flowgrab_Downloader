const fs = require('fs');

// Read package.json version
const pkgPath = 'package.json';
let pkg;
try {
  pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
} catch (e) {
  console.error("Could not read package.json", e);
  process.exit(1);
}

const arg = process.argv[2];

let [major, minor, patch] = pkg.version.split('.').map(n => parseInt(n, 10) || 0);

let newVersion;
if (arg && /^\d+\.\d+\.\d+$/.test(arg)) {
  // Explicit version provided (e.g. node scripts/bump.js 1.1.3)
  newVersion = arg;
} else if (arg === 'major') {
  newVersion = `${major + 1}.1.1`;
} else if (arg === 'minor') {
  newVersion = `${major}.${minor + 1}.1`;
} else {
  // Default bump rule:
  // 1.1.1 -> 1.1.2 -> ... -> 1.1.40 -> 1.2.1 -> ... -> 1.2.40 -> 1.3.1
  patch += 1;
  if (patch > 40) {
    minor += 1;
    patch = 1;
  }
  newVersion = `${major}.${minor}.${patch}`;
}

// 1. Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// 2. Update tauri.conf.json
const tauriConfPath = 'src-tauri/tauri.conf.json';
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
}

// 3. Update Cargo.toml
const cargoTomlPath = 'src-tauri/Cargo.toml';
if (fs.existsSync(cargoTomlPath)) {
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${newVersion}"`);
  fs.writeFileSync(cargoTomlPath, cargoToml);
}

// 4. Update README.md
const readmePath = 'README.md';
if (fs.existsSync(readmePath)) {
  let readme = fs.readFileSync(readmePath, 'utf8');
  readme = readme.replace(/# ⚡ Flowgrab Downloader \(v\d+\.\d+\.\d+\)/g, `# ⚡ Flowgrab Downloader (v${newVersion})`);
  readme = readme.replace(/Release-Flowgrab_v\d+\.\d+\.\d+/g, `Release-Flowgrab_v${newVersion}`);
  readme = readme.replace(/Flowgrab Downloader_\d+\.\d+\.\d+_/g, `Flowgrab Downloader_${newVersion}_`);
  readme = readme.replace(/flowgrab_\d+\.\d+\.\d+_/g, `flowgrab_${newVersion}_`);
  fs.writeFileSync(readmePath, readme);
}

// 5. Update docs/index.html & website/index.html
for (const htmlPath of ['docs/index.html', 'website/index.html']) {
  if (fs.existsSync(htmlPath)) {
    let html = fs.readFileSync(htmlPath, 'utf8');
    html = html.replace(/"softwareVersion": "v\d+\.\d+\.\d+"/g, `"softwareVersion": "v${newVersion}"`);
    html = html.replace(/<span class="text-\[11px\] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">v\d+\.\d+\.\d+<\/span>/g, `<span class="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200">v${newVersion}</span>`);
    html = html.replace(/Download Flowgrab v\d+\.\d+\.\d+/g, `Download Flowgrab v${newVersion}`);
    fs.writeFileSync(htmlPath, html);
  }
}

console.log(`\x1b[32m✔ Successfully bumped version to ${newVersion} across package.json, tauri.conf.json, Cargo.toml, README.md, docs/index.html, and website/index.html.\x1b[0m`);
