/* Short-answer auto-grader: spelling-tolerant keyword / synonym matching.
   A question has k = key ideas. Each idea is { l: label, r: [ [synonyms], [synonyms] ] }:
   an idea is found when EVERY synonym group has at least one hit (word or phrase).
   need = how many ideas earn full marks; must = index of an idea that is required for more than 50%. */
const Grader = (() => {
  const norm = s => String(s).toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  const stem = w => (w.length > 4 ? w.replace(/(ing|ed|es|s)$/, "") : w);
  function lev(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return d[a.length][b.length];
  }
  function same(a, b) {            // forgives plurals, verb endings and small typos
    if (a === b) return true;
    a = stem(a); b = stem(b);
    if (a === b) return true;
    const m = Math.max(a.length, b.length), tol = m >= 9 ? 2 : m >= 5 ? 1 : 0;
    return tol > 0 && Math.abs(a.length - b.length) <= tol && lev(a, b) <= tol;
  }
  function has(words, phrase) {
    const p = norm(phrase).split(" ");
    for (let i = 0; i + p.length <= words.length; i++)
      if (p.every((w, j) => same(words[i + j], w))) return true;
    return false;
  }
  function grade(q, text) {
    const words = norm(text).split(" ").filter(Boolean);
    const mw = q.minw ?? 3;
    const hits = q.k.map(c => words.length >= mw && c.r.every(group => group.some(p => has(words, p))));
    let f = Math.min(1, hits.filter(Boolean).length / q.need);
    if (q.must != null && !hits[q.must]) f = Math.min(f, 0.5);
    return { f, hits, short: words.length < mw };
  }
  return { grade };
})();
