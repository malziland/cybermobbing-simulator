/**
 * @file firebase-counter.js
 * @description Firebase Realtime Database view counter with daily usage limit.
 *   Tracks total all-time views and per-day views. If the daily count exceeds
 *   DAILY_LIMIT, the start screen is replaced with a "limit reached" page that
 *   shows a countdown to midnight. View counts are displayed live via Firebase
 *   .on('value') listeners.
 * @requires config.js - firebaseConfig object and DAILY_LIMIT constant
 */

// ========== FIREBASE VIEW COUNTER + DAILY LIMIT ==========

// Initialize Firebase app with credentials from config.js
firebase.initializeApp(firebaseConfig);

var db = firebase.database();

/** @type {firebase.database.Reference} Reference to /views (total all-time count) */
var viewsRef = db.ref('views');

/** @type {string} Today's date as YYYY-MM-DD, used as the daily counter key */
var today = new Date().toISOString().slice(0, 10);

/** @type {firebase.database.Reference} Reference to /daily/<today> (today's count) */
var dailyRef = db.ref('daily/' + today);

// On page load, check if today's limit has been reached
dailyRef.once('value', function (snapshot) {
  var todayCount = snapshot.val() || 0;

  if (todayCount >= DAILY_LIMIT) {
    document.getElementById('start').classList.add('hidden');
    document.getElementById('limitPage').classList.add('show');
    startLimitTimer();
  }
});

/**
 * Atomically increments both the total and daily view counters.
 * Called once when the simulation starts (from go() in main.js).
 * Uses Firebase transactions to avoid race conditions with concurrent users.
 */
function incrementCounters() {
  viewsRef.transaction(function (current) { return (current || 0) + 1; })
    .catch(function (err) { if (typeof console !== 'undefined') console.warn('Counter increment failed:', err); });
  dailyRef.transaction(function (current) { return (current || 0) + 1; })
    .catch(function (err) { if (typeof console !== 'undefined') console.warn('Daily counter increment failed:', err); });
}

// Live-update all counter display elements whenever the total changes
viewsRef.on('value', function (snapshot) {
  var count = snapshot.val() || 0;
  var formatted = count.toLocaleString('de-DE');
  var el = document.getElementById('viewCount');
  var el2 = document.getElementById('viewCountStart');
  if (el) el.textContent = formatted;
  if (el2) el2.textContent = formatted;
});

/**
 * Starts a live countdown timer showing the time remaining until midnight,
 * when the daily limit resets. Automatically reloads the page at midnight.
 */
function startLimitTimer() {
  var el = document.getElementById('limitTimer');
  if (!el) return;

  /** Updates the HH:MM:SS countdown display */
  function update() {
    var now = new Date();
    var midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    var diff = midnight - now;

    var h = Math.floor(diff / 3600000);
    var m = Math.floor((diff % 3600000) / 60000);
    var s = Math.floor((diff % 60000) / 1000);

    el.textContent =
      String(h).padStart(2, '0') + ':' +
      String(m).padStart(2, '0') + ':' +
      String(s).padStart(2, '0');

    // When midnight arrives, reload to clear the limit
    if (diff <= 0) {
      clearInterval(timerInt);
      window.location.reload();
    }
  }

  update();
  var timerInt = setInterval(update, 1000);
}
