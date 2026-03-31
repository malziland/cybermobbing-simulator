/**
 * @file p4b-messages.js
 * @description Scene 4b: iMessage conversation -- Tom writes to his mother (93-112s).
 *   The emotional core of the simulation. Tom's mother sends a normal "Gute Nacht"
 *   message. Tom tries to respond but hesitates: the typing indicator appears,
 *   disappears (he deletes what he wrote), reappears (he tries again), and finally
 *   he sends a brief, understated message that hides his pain. This conveys
 *   how hard it is for victims to reach out, even to people they trust.
 *   Transitions to the finale scene (p5).
 * @requires audio.js   - simTimeout(), sndIm(), typStart(), typStop()
 * @requires helpers.js  - sw()
 * @requires i18n.js     - t() for message text
 */

// ===== P4b: MESSAGES - Tom writes to Mama (93-112s) =====

/**
 * Runs the iMessage scene showing Tom's emotional hesitation.
 * The sequence: receive mama's message -> typing... -> stops typing (deletes) ->
 * typing again... -> finally sends a short reply -> transition to finale.
 */
function p4b() {
  var c = document.getElementById('imC');

  // Mama's "Gute Nacht" message arrives
  simTimeout(function () {
    var d = document.createElement('div');
    d.className = 'im-bub received';
    d.textContent = t('im.mama');
    c.appendChild(d);
    sndIm();
  }, 500);

  // First typing attempt: Tom starts writing but can't bring himself to say it
  simTimeout(function () {
    var tp = document.createElement('div');
    tp.className = 'im-typ';
    tp.id = 'imTyp';
    tp.innerHTML = '<i></i><i></i><i></i>';
    c.appendChild(tp);
    c.scrollTop = 99999;
    typStart();
  }, 4000);

  // Tom deletes what he wrote -- typing indicator disappears
  simTimeout(function () {
    document.getElementById('imTyp').remove();
    typStop();
  }, 8000);

  // Second attempt: he tries again after a pause
  simTimeout(function () {
    var tp = document.createElement('div');
    tp.className = 'im-typ';
    tp.id = 'imTyp2';
    tp.innerHTML = '<i></i><i></i><i></i>';
    c.appendChild(tp);
    c.scrollTop = 99999;
    typStart();
  }, 10000);

  // Finally sends a short, understated reply that hides his real feelings
  simTimeout(function () {
    document.getElementById('imTyp2').remove();
    typStop();
    var d = document.createElement('div');
    d.className = 'im-bub vic';
    d.textContent = t('im.tom');
    c.appendChild(d);
    c.scrollTop = 99999;
    sndIm();
  }, 13000);

  simTimeout(function () {
    sw('aIm', 'aFn');
    p5();
  }, 19000);
}
