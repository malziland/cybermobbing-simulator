/**
 * @file timer.js
 * @description Simulation clock and simulated phone clock display.
 *   Counts the elapsed simulation seconds (the control bar in controls.js
 *   shows them as its timeline) and drives the phone status-bar clock,
 *   which uses the user's real local time.
 *   Both are paused/resumed via togglePause() in audio.js.
 * @requires audio.js - simPaused flag, togglePause() manages tmr and clockInt
 * @requires audio.js - SIM_SPEED
 * @requires controls.js - CTL_TOTAL, ctlUpdate() (only used at run time)
 */

// ========== TIMER ==========

/** @type {number|undefined} Interval ID for the clock tick */
// eslint-disable-next-line no-unassigned-vars -- assigned from main.js/audio.js (cross-file global)
var tmr;

/** @type {number} Elapsed simulation time in seconds (incremented by 0.1 every 100ms) */
var sec = 0;

/**
 * @type {{tmr: (number|undefined), at: number, sec: number, last: number}|null}
 * Where tick() started counting: the interval it belongs to, the wall-clock
 * time and the simulation second at that moment.
 */
var tickAnchor = null;

/**
 * Clock tick, called every 100ms by setInterval. Moves sec on and lets the
 * timeline in the control bar follow. Stops itself at the end of the timeline
 * (CTL_TOTAL), a few seconds after the help page came up.
 *
 * sec follows the wall clock, not the number of ticks: browsers deliver
 * interval ticks late (measured 4 to 6 % in Firefox and WebKit) and throttle
 * them in a covered window, while the scene timers keep to real time. Counting
 * ticks let the timeline fall behind the scenes. The count starts anew
 * whenever the interval is restarted (start, resume, jump) or sec was set
 * from outside; the first tick after that adds one step of 0.1 s.
 */
function tick() {
  var now = Date.now();
  if (!tickAnchor || tickAnchor.tmr !== tmr || tickAnchor.last !== sec) {
    tickAnchor = { tmr: tmr, at: now - 100 / SIM_SPEED, sec: sec, last: sec };
  }
  sec = tickAnchor.sec + ((now - tickAnchor.at) * SIM_SPEED) / 1000;
  tickAnchor.last = sec;
  if (sec >= CTL_TOTAL) clearInterval(tmr);
  ctlUpdate();
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
    var days =
      currentLang === 'en'
        ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        : ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    var months =
      currentLang === 'en'
        ? [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
          ]
        : [
            'J\u00E4nner',
            'Februar',
            'M\u00E4rz',
            'April',
            'Mai',
            'Juni',
            'Juli',
            'August',
            'September',
            'Oktober',
            'November',
            'Dezember',
          ];
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
