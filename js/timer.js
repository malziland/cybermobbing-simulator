/**
 * @file timer.js
 * @description Progress bar timer and simulated phone clock display.
 *   Drives two visual elements: a progress bar that fills over 120 seconds,
 *   and a phone status-bar clock that uses the user's real local time.
 *   Both are paused/resumed via togglePause() in audio.js.
 * @requires audio.js - simPaused flag, togglePause() manages tmr and clockInt
 */

// ========== TIMER ==========

/** @type {number|undefined} Interval ID for the progress bar tick */
var tmr;

/** @type {number} Elapsed simulation time in seconds (incremented by 0.1 every 100ms) */
var sec = 0;

/**
 * Progress bar tick handler, called every 100ms by setInterval.
 * Increments sec by 0.1, updates the progress bar width as a percentage of 120s,
 * and updates the text label. Self-terminates at 130s to allow a brief overrun
 * for final scene timing.
 */
function tick() {
  sec += 0.1;
  document.getElementById('tf').style.width = Math.min(sec / 120 * 100, 100) + '%';
  if (sec <= 120) {
    document.getElementById('tl').textContent = Math.floor(sec) + 's / 120s';
  }
  if (sec >= 130) clearInterval(tmr);
}

/** @type {number} Wall-clock timestamp when the clock was started/resumed (ms) */
var clockStart;

/** @type {number|undefined} Interval ID for the phone clock updater */
var clockInt;

/** @type {number} Starting hour from real local time, captured at simulation start */
var clockBaseH;

/** @type {number} Starting minute from real local time, captured at simulation start */
var clockBaseM;

/**
 * Formats a time string as HH:MM from hours and minutes.
 * @param {number} h - Hours (0-23)
 * @param {number} m - Minutes (0-59)
 * @returns {string} Formatted time string
 */
function formatTime(h, m) {
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

/**
 * Initializes the phone clock with the user's real local time and date.
 * Called once from go() before startClock(). Sets the statusbar clock,
 * homescreen clock, and homescreen date to real values.
 */
function initClock() {
  var now = new Date();
  clockBaseH = now.getHours();
  clockBaseM = now.getMinutes();

  // Set initial time display
  var timeStr = formatTime(clockBaseH, clockBaseM);
  document.getElementById('sbTime').textContent = timeStr;
  var hc = document.getElementById('hsClock');
  if (hc) hc.textContent = timeStr;

  // Set homescreen date to today's real date
  var hsDate = document.getElementById('hsDate');
  if (hsDate) {
    var days = currentLang === 'en'
      ? ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
      : ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
    var months = currentLang === 'en'
      ? ['January','February','March','April','May','June','July','August','September','October','November','December']
      : ['J\u00E4nner','Februar','M\u00E4rz','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
    hsDate.textContent = days[now.getDay()] + ', ' + now.getDate() + '. ' + months[now.getMonth()];
  }
}

/**
 * Starts (or restarts after pause) the simulated phone clock display.
 * Uses the real local time captured by initClock() and advances in real time.
 * Updates both the status bar clock (#sbTime) and the homescreen clock (#hsClock).
 * Stops itself after 120 real seconds.
 */
function startClock() {
  if (!clockStart) clockStart = Date.now();

  clockInt = setInterval(function () {
    var elapsed = Math.floor((Date.now() - clockStart) / 1000);

    if (elapsed > 120) {
      clearInterval(clockInt);
      return;
    }

    // Calculate current time by adding elapsed minutes to the real start time
    var totalMinutes = clockBaseM + Math.floor(elapsed / 60);
    var h = clockBaseH + Math.floor(totalMinutes / 60);
    var m = totalMinutes % 60;
    if (h >= 24) h -= 24;

    var timeStr = formatTime(h, m);
    document.getElementById('sbTime').textContent = timeStr;
    var hc = document.getElementById('hsClock');
    if (hc) hc.textContent = timeStr;
  }, 1000);
}
