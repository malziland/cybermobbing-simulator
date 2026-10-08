/**
 * Gate before every deployment: lists the files the Firebase CLI would upload
 * (with the CLI's own file selection and the ignore list from firebase.json)
 * and compares them with what the page consists of. Anything else stops the
 * deployment -- the ignore list is a negative list, and one missing entry
 * publishes a whole folder (as happened with .git/ up to v1.2.1).
 *
 *   node scripts/deploy-files.js          check, exit code 0 / 1 / 2
 *   node scripts/deploy-files.js --list   print the files, one per line
 *
 * Runs automatically as hosting.predeploy (firebase.json). Exit code 2 means
 * the check itself could not run; that stops the deployment as well.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');

/** Single files that belong to the page, besides the three folders below. */
const ALLOWED_FILES = [
  'index.html',
  'favicon.svg',
  'llms.txt',
  'robots.txt',
  'sitemap.xml',
  'LICENSE',
];
const ALLOWED_FOLDERS = ['css/', 'js/', 'assets/'];
/** Without these the page does not work as intended. */
const REQUIRED = ['index.html', 'css/styles.css', 'js/main.js', 'js/config.js', 'assets/bgm.mp3'];

/** Finds the file selection of the installed Firebase CLI. */
function loadListFiles() {
  const candidates = [];
  try {
    candidates.push(require.resolve('firebase-tools/lib/listFiles', { paths: [ROOT] }));
  } catch (e) {
    // not installed in the project: look next to the firebase command
  }
  try {
    const bin = fs.realpathSync(execSync('command -v firebase', { encoding: 'utf8' }).trim());
    candidates.push(path.join(path.dirname(bin), '..', 'listFiles.js'));
  } catch (e) {
    // no firebase command on the path
  }
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8' }).trim();
    candidates.push(path.join(globalRoot, 'firebase-tools', 'lib', 'listFiles.js'));
  } catch (e) {
    // npm not available
  }
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const mod = require(file);
      if (typeof mod.listFiles === 'function') return mod.listFiles;
    }
  }
  return null;
}

/** True if the path is part of the page. */
function allowed(file) {
  if (file.split('/').some((part) => part.startsWith('.'))) return false;
  if (ALLOWED_FILES.includes(file)) return true;
  return ALLOWED_FOLDERS.some((folder) => file.startsWith(folder));
}

function main() {
  const listFiles = loadListFiles();
  if (!listFiles) {
    console.error('deploy-files: file selection of the Firebase CLI not found -- check failed');
    return 2;
  }
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, 'firebase.json'), 'utf8'));
  const hosting = config.hosting || {};
  const files = listFiles(path.join(ROOT, hosting.public || '.'), hosting.ignore || []).sort();
  if (!files.length) {
    console.error('deploy-files: the CLI would upload no files -- check failed');
    return 2;
  }
  if (process.argv.includes('--list')) {
    console.log(files.join('\n'));
    return 0;
  }
  const foreign = files.filter((file) => !allowed(file));
  const missing = REQUIRED.filter((file) => !files.includes(file));
  foreign.slice(0, 20).forEach((file) => console.error('  NOT PART OF THE PAGE  ' + file));
  if (foreign.length > 20) console.error('  ... and ' + (foreign.length - 20) + ' more');
  missing.forEach((file) => console.error('  MISSING               ' + file));
  if (foreign.length || missing.length) {
    console.error(
      'deploy-files: STOP -- ' +
        foreign.length +
        ' file(s) that do not belong to the page, ' +
        missing.length +
        ' required file(s) missing (of ' +
        files.length +
        ' files). Extend hosting.ignore in firebase.json, or the lists in this script if the page really needs the file.'
    );
    return 1;
  }
  console.log('deploy-files: ' + files.length + ' files, all part of the page');
  return 0;
}

process.exit(main());
