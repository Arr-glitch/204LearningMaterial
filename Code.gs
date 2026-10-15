/** Learning Content leaderboard backend (Google Apps Script).
 *  1. Create a Google Sheet, open Extensions > Apps Script, paste this file.
 *  2. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *  3. Copy the web-app URL into js/config.js (API_URL).
 *  Every student's score is stored in the "Scores" sheet, so you keep a permanent record. */
const SHEET = "Scores";

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) {
    s = ss.insertSheet(SHEET);
    s.appendRow(["PIN", "Student ID", "Name", "Score", "Correct", "Answered", "Time (s)", "Finished", "Attempt", "Updated"]);
    s.setFrozenRows(1);
  }
  return s;
}
function clean_(v) { v = String(v || "").slice(0, 60); return /^[=+\-@]/.test(v) ? "'" + v : v; } // block formula injection
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function list_(pin) {
  const rows = sheet_().getDataRange().getValues().slice(1).filter(r => String(r[0]) === String(pin));
  return rows.map(r => ({ id: String(r[1]), name: r[2], score: +r[3], correct: +r[4], answered: +r[5], time: +r[6], done: r[7] === true || r[7] === "TRUE", attempt: String(r[8]) }))
    .sort((a, b) => b.score - a.score || a.time - b.time);
}
function doGet(e) { return out_({ ok: true, list: list_((e.parameter && e.parameter.pin) || "") }); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents), s = sheet_(), rows = s.getDataRange().getValues();
    const pin = clean_(d.pin).toUpperCase(), id = clean_(d.id);
    const row = [pin, id, clean_(d.name), +d.score || 0, +d.correct || 0, +d.answered || 0, +d.time || 0, !!d.done, String(d.attempt), new Date()];
    let at = -1;
    for (let i = 1; i < rows.length; i++) if (String(rows[i][0]) === pin && String(rows[i][1]) === id) { at = i + 1; break; }
    if (at < 0) s.appendRow(row);
    else {
      const o = rows[at - 1], oldDone = o[7] === true || o[7] === "TRUE";
      const better = row[3] > +o[3] || (row[3] === +o[3] && row[6] < +o[6]);
      // same attempt keeps updating; a replay only replaces an unfinished record or a finished, better one
      if (String(o[8]) === row[8] || !oldDone || (row[7] && better)) s.getRange(at, 1, 1, row.length).setValues([row]);
    }
    return out_({ ok: true, list: list_(pin) });
  } finally { lock.releaseLock(); }
}
