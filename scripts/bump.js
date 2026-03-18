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

let [major, minor, patch] = pkg.version.split('.');
patch = parseInt(patch) + 1;
const newVersion = `${major}.${minor}.${patch}`;

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

console.log(`\x1b[32m✔ Successfully bumped version to ${newVersion} across all configuration files.\x1b[0m`);
