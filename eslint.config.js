'use strict';

const js = require('@eslint/js');
const globals = require('globals');

// The app deliberately uses cross-file globals instead of modules (no build
// step, see ADR-0001). Every top-level declaration that other files rely on
// is listed here so no-undef still catches real typos.
const appGlobals = {
  // i18n.js
  TRANSLATIONS: 'writable',
  currentLang: 'writable',
  detectLanguage: 'writable',
  t: 'writable',
  applyI18n: 'writable',
  // audio.js
  ax: 'writable',
  initAudio: 'writable',
  tone: 'writable',
  sndWa: 'writable',
  sndIg: 'writable',
  sndTk: 'writable',
  sndIm: 'writable',
  sndShutter: 'writable',
  sndBuzz: 'writable',
  typActive: 'writable',
  typStart: 'writable',
  typStop: 'writable',
  bgMusic: 'writable',
  startMusic: 'writable',
  simPaused: 'writable',
  simTimers: 'writable',
  simTimerIdCounter: 'writable',
  simTimeout: 'writable',
  togglePause: 'writable',
  // helpers.js
  avatars: 'writable',
  getAvatar: 'writable',
  sw: 'writable',
  flash: 'writable',
  toast: 'writable',
  addMsg: 'writable',
  waType: 'writable',
  setLayer: 'writable',
  // timer.js
  tmr: 'writable',
  sec: 'writable',
  tick: 'writable',
  clockStart: 'writable',
  clockInt: 'writable',
  clockBaseH: 'writable',
  clockBaseM: 'writable',
  formatTime: 'writable',
  initClock: 'writable',
  startClock: 'writable',
  SIM_SPEED: 'writable',
  // scenes
  p1: 'writable',
  p2: 'writable',
  p3: 'writable',
  p4: 'writable',
  p4b: 'writable',
  p5: 'writable',
  p6: 'writable',
  // config.js (not in repo, see config.example.js)
  firebaseConfig: 'writable',
  DAILY_LIMIT: 'writable',
  helplineConfig: 'writable',
  // firebase-counter.js + Firebase SDK
  firebase: 'readonly',
  db: 'writable',
  viewsRef: 'writable',
  today: 'writable',
  dailyRef: 'writable',
  COUNT_STORAGE_KEY: 'writable',
  hasCountedToday: 'writable',
  markCountedToday: 'writable',
  incrementCounters: 'writable',
  viewCountLoaded: 'writable',
  hideViewCounters: 'writable',
  startLimitTimer: 'writable',
  // main.js
  mkPhoto: 'writable',
  simStarted: 'writable',
  go: 'writable',
  shareSimulation: 'writable',
};

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'scripts/video-export/node_modules/**',
      'scripts/video-export/output/**',
      'js/config.js',
      'assets/**',
      '.claude/**',
      '.firebase/**',
    ],
  },
  js.configs.recommended,
  {
    // Browser app code: ES5-style script files sharing globals (no modules)
    files: ['js/**/*.js', 'tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: { ...globals.browser, ...appGlobals, QUnit: 'readonly' },
    },
    rules: {
      // Top-level declarations are the cross-file API -> only check locals.
      // Existing idiom: intentionally empty/unused catch bindings.
      'no-unused-vars': ['error', { vars: 'local', args: 'none', caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-redeclare': 'off',
    },
  },
  {
    // Node tooling scripts (page.evaluate callbacks run in the browser,
    // hence the browser globals on top of node)
    files: ['scripts/*.js', 'scripts/video-export/*.js', 'eslint.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.browser },
    },
    rules: {
      'no-unused-vars': ['error', { caughtErrors: 'none' }],
      'no-empty': ['error', { allowEmptyCatch: true }],
    },
  },
];
