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
  // Explicit version provided (e.g. node scripts/bump.js 1.1.1)
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

// Update package.json
pkg.version = newVersion;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

// Update tauri.conf.json
const tauriConfPath = 'src-tauri/tauri.conf.json';
if (fs.existsSync(tauriConfPath)) {
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  fs.writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
}

// Update Cargo.toml
const cargoTomlPath = 'src-tauri/Cargo.toml';
if (fs.existsSync(cargoTomlPath)) {
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  cargoToml = cargoToml.replace(/^version = ".*"$/m, `version = "${newVersion}"`);
  fs.writeFileSync(cargoTomlPath, cargoToml);
}

console.log(`\x1b[32m✔ Successfully updated version to ${newVersion} across package.json, tauri.conf.json, and Cargo.toml.\x1b[0m`);
