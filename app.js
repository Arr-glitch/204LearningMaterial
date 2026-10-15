/* Learning Content - Kahoot-style quiz engine (no dependencies).
   Question data lives in questions.js. Every question type lets the student
   make mistakes and then shows the right answer, so they learn from it. */
"use strict";

const app = document.getElementById("app");
const COLORS = ["#e21b3c", "#1368ce", "#d89e00", "#26890c", "#a63cbf"];
const SHAPES = ["▲", "◆", "●", "■", "★"];
let st, tm; // st = player state, tm = timer handle

/* ---------- helpers ---------- */
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const shuffle = a => {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
function beep(freq, dur = 0.15) {
  try {
    const c = beep.ctx || (beep.ctx = new AudioContext());
    const o = c.createOscillator(), g = c.createGain();
    o.frequency.value = freq; g.gain.value = 0.07;
    o.connect(g); g.connect(c.destination);
    o.start(); o.stop(c.currentTime + dur);
  } catch (e) { /* audio is optional */ }
}
const head = timed =>
  `<div class="top"><span class="pill">${st.i + 1} / ${QUESTIONS.length}</span>` +
  `<span class="pill">${esc(st.n)} · ${st.sc} pts</span></div>` +
  (timed ? '<div class="bar"><i id="tb"></i></div>' : "");
const qbox = q => `<div class="qb">${esc(q.q).replace(/\n/g, "<br>")}</div>`;
const checkBtn = on =>
  `<button class="go chk" id="ck" ${on ? "" : "disabled"}>Check my answer</button>`;

function startTimer(limit, onTimeout) {
  st.t0 = Date.now();
  clearInterval(tm);
  tm = setInterval(() => {
    const e = (Date.now() - st.t0) / 1000, bar = document.getElementById("tb");
    if (bar) bar.style.width = Math.max(0, 100 - (e / limit) * 100) + "%";
    if (e >= limit) { clearInterval(tm); onTimeout(); }
  }, 100);
}

/* ---------- screens: home, how-to, countdown ---------- */
function how() {
  const m = document.createElement("div");
  m.className = "modal";
  m.innerHTML = `<div class="card"><h3 style="margin-top:0">How to play</h3><ol>
    <li><b>Multiple choice:</b> tap a coloured answer. Faster = more points.</li>
    <li><b>Drop-down gaps:</b> pick an answer in every gap, then press <b>Check my answer</b>.</li>
    <li><b>Matching:</b> tap a term, then tap the definition you think fits. Each term gets its own colour. You can change your mind, then press <b>Check</b>.</li>
    <li><b>Ordering:</b> tap the steps in order. Tap a placed step to take it back.</li>
    <li><b>Written:</b> type your answer, compare with the model answer, score yourself.</li>
    <li>Wrong answers are fine: you always see the correct answer so you can learn from it. Keep a streak for bonus points!</li></ol>
    <button class="go" id="x">Got it</button></div>`;
  document.body.appendChild(m);
  m.querySelector("#x").onclick = () => m.remove();
}

function home() {
  clearInterval(tm);
  app.innerHTML = `<div class="c"><h1 class="logo">Learning Content</h1>
    <p class="sub">Unit 204 · Digital Transformation in Inspection Technologies</p>
    <div class="card"><div class="pin" style="font-size:20px">Game PIN: 204 024</div>
    <input id="nm" maxlength="16" placeholder="Nickname" aria-label="Nickname">
    <button class="go" id="en">Enter</button></div>
    <button class="lnk" id="hw">How to play?</button>
    <p class="sub" style="margin-top:18px">${QUESTIONS.length} questions · answer fast for more points</p></div>`;
  document.getElementById("hw").onclick = how;
  document.getElementById("en").onclick = () => {
    st = { n: document.getElementById("nm").value.trim() || "Player", i: 0, sc: 0, sk: 0, res: [] };
    countdown(3, ask);
  };
}

function countdown(n, next) {
  app.innerHTML = `<div class="c"><p class="sub">Get ready, ${esc(st.n)}!</p><div class="big">${n}</div></div>`;
  beep(500);
  setTimeout(() => (n > 1 ? countdown(n - 1, next) : next()), 900);
}

function ask() {
  const q = QUESTIONS[st.i];
  window.scrollTo(0, 0);
  st.done = false;
  ({ mc: renderMC, gap: renderGap, match: renderMatch, order: renderOrder, open: renderOpen })[q.t](q);
}

/* ---------- question type: multiple choice ---------- */
function renderMC(q) {
  const limit = 30, right = q.o[q.a], opts = shuffle(q.o);
  app.innerHTML = head(true) + qbox(q) + '<div class="ans">' +
    opts.map((x, i) => `<button class="a" style="background:${COLORS[i]}" data-i="${i}"><b>${SHAPES[i]}</b><span>${esc(x)}</span></button>`).join("") + "</div>";
  app.querySelectorAll(".a").forEach(b => (b.onclick = () =>
    finish(opts[b.dataset.i] === right ? 1 : 0, limit, "<b>" + esc(right) + "</b>")));
  startTimer(limit, () => finish(0, limit, "<b>" + esc(right) + "</b>", true));
}

/* ---------- question type: drop-down gaps ---------- */
function renderGap(q) {
  const limit = 60, n = q.g.length;
  const opts = q.g.map(shuffle);
  const sentence = q.s.replace(/\{(\d)\}/g, (m, i) =>
    `<select data-g="${i}" aria-label="Gap ${+i + 1}"><option value="">Select…</option>` +
    opts[i].map(o => `<option>${esc(o)}</option>`).join("") + "</select>");
  app.innerHTML = head(true) + qbox(q) + `<div class="gapq">${sentence}</div>` + checkBtn(false);
  const sels = [...app.querySelectorAll("select")], ck = document.getElementById("ck");
  const vals = () => sels.map(s => s.value);
  sels.forEach(s => (s.onchange = () => { ck.disabled = vals().includes(""); beep(400, .06); }));

  // Gaps listed in q.eq are interchangeable (e.g. "upper and lower").
  const isRight = (i, v) => {
    const grp = (q.eq || []).find(g => g.includes(i));
    if (!grp) return v[i] === q.g[i][0];
    const set = grp.map(j => q.g[j][0]);
    return set.includes(v[i]) && new Set(grp.map(j => v[j])).size === grp.length;
  };
  const grade = timeout => {
    const v = vals();
    let c = 0;
    const html = q.s.replace(/\{(\d)\}/g, (m, i) => {
      const ok = isRight(+i, v), shown = q.g[i][0];
      if (ok) { c++; return `<b>✔ ${esc(v[i])}</b>`; }
      return `<s>${esc(v[i] || "(blank)")}</s> ✖ <b>${esc(shown)}</b>`;
    });
    finish(c / n, limit, `<div class="ln">${html}</div>`, timeout);
  };
  ck.onclick = () => grade(false);
  startTimer(limit, () => grade(true));
}

/* ---------- question type: matching (free choice, graded at the end) ---------- */
function renderMatch(q) {
  const limit = 90, n = q.p.length;
  const order = shuffle(q.p.map((_, i) => i)); // shuffled definition order
  const asg = {};                              // definitionIndex -> termIndex
  let sel = null;                              // currently selected term

  function draw() {
    const used = new Set(Object.values(asg));
    const terms = q.p.map((p, i) =>
      `<button class="tb${sel === i ? " sel" : ""}" style="background:${COLORS[i]}" data-t="${i}">` +
      `<b>${SHAPES[i]}</b><span>${esc(p[0])}</span>${used.has(i) ? "<small>✔</small>" : ""}</button>`).join("");
    const defs = order.map(d => {
      const t = asg[d];
      const style = t === undefined ? "" : `style="background:${COLORS[t]}"`;
      const tag = t === undefined ? "" : `<b>${SHAPES[t]}</b> `;
      return `<button class="pi df${t === undefined ? "" : " asg"}" ${style} data-d="${d}">${tag}${esc(q.p[d][1])}</button>`;
    }).join("");
    app.innerHTML = head(true) + qbox(q) +
      `<p class="hint">${sel === null ? "Step 1: tap a term" : "Step 2: tap the definition that matches it"} · tap a coloured definition to undo</p>` +
      `<div class="mcols"><div>${terms}</div><div>${defs}</div></div>` + checkBtn(Object.keys(asg).length === n);
    app.querySelectorAll(".tb").forEach(b => (b.onclick = () => { sel = +b.dataset.t; beep(400, .06); draw(); }));
    app.querySelectorAll(".df").forEach(b => (b.onclick = () => {
      const d = +b.dataset.d;
      if (sel === null) { delete asg[d]; draw(); return; }          // no term chosen: undo
      Object.keys(asg).forEach(k => { if (asg[k] === sel) delete asg[k]; }); // one definition per term
      asg[d] = sel; sel = null; beep(600, .08); draw();
    }));
    document.getElementById("ck").onclick = () => grade(false);
  }
  const grade = timeout => {
    let c = 0;
    const lines = q.p.map((p, i) => {
      const d = Object.keys(asg).find(k => asg[k] === i);
      if (d !== undefined && +d === i) { c++; return `<div class="ln">✔ <b>${esc(p[0])}</b> — ${esc(p[1])}</div>`; }
      return `<div class="ln">✖ <b>${esc(p[0])}</b> — you chose: <s>${d === undefined ? "(nothing)" : esc(q.p[d][1])}</s><br>✔ correct: ${esc(p[1])}</div>`;
    }).join("");
    finish(c / n, limit, lines, timeout);
  };
  draw();
  startTimer(limit, () => grade(true));
}

/* ---------- question type: ordering (free choice, graded at the end) ---------- */
function renderOrder(q) {
  const limit = 60, n = q.o.length, pool = shuffle(q.o), seq = [];
  function draw() {
    const slots = q.o.map((_, i) => seq[i]
      ? `<button class="slot f" data-r="${i}">${i + 1}. ${esc(seq[i])}</button>`
      : `<div class="slot">${i + 1}.</div>`).join("");
    const left = pool.map((x, i) => seq.includes(x) ? "" :
      `<button class="a" style="background:${COLORS[i]}" data-v="${i}"><b>${SHAPES[i]}</b><span>${esc(x)}</span></button>`).join("");
    app.innerHTML = head(true) + qbox(q) +
      '<p class="hint">Tap the steps in order. Tap a placed step to take it back.</p>' +
      `<div class="slots">${slots}</div><div class="ans">${left}</div>` + checkBtn(seq.length === n);
    app.querySelectorAll(".a").forEach(b => (b.onclick = () => { seq.push(pool[b.dataset.v]); beep(600, .08); draw(); }));
    app.querySelectorAll(".slot.f").forEach(b => (b.onclick = () => { seq.splice(+b.dataset.r, 1); draw(); }));
    document.getElementById("ck").onclick = () => grade(false);
  }
  const grade = timeout => {
    let c = 0;
    const lines = q.o.map((x, i) => {
      if (seq[i] === x) { c++; return `<div class="ln">✔ ${i + 1}. ${esc(x)}</div>`; }
      return `<div class="ln">✖ ${i + 1}. <s>${esc(seq[i] || "(empty)")}</s> → <b>${esc(x)}</b></div>`;
    }).join("");
    finish(c / n, limit, lines, timeout);
  };
  draw();
  startTimer(limit, () => grade(true));
}

/* ---------- question type: written answer (self-assessed) ---------- */
function renderOpen(q) {
  clearInterval(tm);
  app.innerHTML = head(false) + qbox(q) +
    '<textarea id="ta" placeholder="Type your answer here..." aria-label="Your answer"></textarea>' +
    '<button class="go" id="sb" style="background:#1368ce;box-shadow:0 4px 0 #0a3d7a">Check my answer</button>';
  document.getElementById("sb").onclick = () => {
    const v = document.getElementById("ta").value;
    app.innerHTML = head(false) + qbox(q) +
      `<div class="rev"><b>Your answer</b><br>${esc(v) || "(blank)"}</div>` +
      `<div class="rev" style="background:#26890c"><b>Model answer</b><br>${esc(q.m)}</div>` +
      '<p class="hint">How did you do?</p><div class="ans">' +
      '<button class="a" style="background:#26890c" id="s1"><b>■</b><span>Nailed it</span></button>' +
      '<button class="a" style="background:#d89e00" id="s2"><b>●</b><span>Partly</span></button>' +
      '<button class="a" style="background:#e21b3c" id="s3"><b>▲</b><span>Not yet</span></button></div>';
    st.t0 = Date.now();
    [["s1", 1], ["s2", .5], ["s3", 0]].forEach(([id, f]) =>
      (document.getElementById(id).onclick = () => finish(f, 1, esc(q.m), false, true)));
  };
}

/* ---------- scoring + feedback overlay ---------- */
function finish(f, limit, detail, timeout, noTimeBonus) {
  if (st.done) return;
  st.done = true;
  clearInterval(tm);
  const q = QUESTIONS[st.i];
  const el = Math.min(limit, (Date.now() - st.t0) / 1000);
  const good = f === 1, part = f > 0 && f < 1;
  let pts = Math.round(1000 * f * (noTimeBonus ? 1 : 1 - 0.5 * el / limit));
  st.sk = good ? st.sk + 1 : 0;
  const bonus = good && st.sk > 1 ? Math.min(st.sk - 1, 5) * 100 : 0;
  pts += bonus; st.sc += pts;
  st.res.push({ q: q.q, f, d: detail });
  beep(good ? 800 : 220, .3);

  const d = document.createElement("div");
  d.className = "fb";
  d.style.background = good ? "#26890c" : part ? "#d89e00" : "#e21b3c";
  const title = good ? "✔ Correct" : part ? "◐ Almost there" : timeout ? "✖ Time's up" : "✖ Incorrect";
  d.innerHTML = `<div class="in"><h2>${title}</h2><div class="pts">+${pts}</div>` +
    (st.sk > 1 ? `<div class="pts">🔥 Streak ${st.sk}${bonus ? " · +" + bonus + " bonus" : ""}</div>` : "") +
    `<div>Score: ${st.sc}</div>` +
    (good && q.t === "mc" ? "" : `<div class="ca"><b>${good ? "Well done" : "Learn from it"}</b><br><br>${detail}</div>`) +
    `<button class="nx" id="nx">${st.i + 1 < QUESTIONS.length ? "Next" : "See results"}</button></div>`;
  document.body.appendChild(d);
  d.querySelector("#nx").onclick = () => { d.remove(); st.i++; st.i < QUESTIONS.length ? ask() : end(); };
}

/* ---------- results + podium ---------- */
function end() {
  window.scrollTo(0, 0);
  const max = QUESTIONS.length * 1000;
  const bots = [["Geo Fence", .82], ["Thermal Ninja", .66], ["Payload Pro", .5]]
    .map(b => [b[0], Math.round(max * b[1] * (0.9 + Math.random() * 0.2))]);
  const all = bots.concat([[st.n, st.sc, 1]]).sort((a, b) => b[1] - a[1]);
  const rank = all.findIndex(x => x[2]) + 1, top = [all[1], all[0], all[2]], heights = [150, 200, 110];
  const missed = st.res.filter(r => r.f < 1), ok = st.res.length - missed.length;
  app.innerHTML = `<div class="c" style="max-width:600px"><h1 class="logo">${rank === 1 ? "🏆 You win!" : "Great job!"}</h1>
    <p class="sub">${esc(st.n)}, you finished #${rank} with ${st.sc} points · ${ok} of ${QUESTIONS.length} fully correct</p>
    <div class="pod">${top.map((x, i) => `<div class="${x[2] ? "me" : ""}" style="height:${heights[i]}px"><span style="font-size:22px">${["🥈", "🥇", "🥉"][i]}</span>${esc(x[0])}<br>${x[1]}</div>`).join("")}</div>` +
    (missed.length ? "<h3>Review these</h3>" + missed.map(r => `<div class="rev"><b>${esc(r.q).slice(0, 140)}</b><br><br>${r.d}</div>`).join("") : "<h3>Perfect run! Nothing to review.</h3>") +
    '<button class="nx" id="again">Play again</button></div>';
  document.getElementById("again").onclick = home;
  for (let i = 0; i < 4; i++) setTimeout(() => beep(500 + i * 150, .2), i * 180);
}

home();
