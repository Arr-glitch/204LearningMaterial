/* Leaderboard client. Online mode talks to the Google Apps Script web app (shared by all students).
   Falls back to localStorage (this device only) when API_URL is empty or unreachable. */
const LB = (() => {
  const cfg = window.CONFIG || {};
  const key = p => "lc_lb_" + p;
  const sortL = l => l.sort((a, b) => b.score - a.score || a.time - b.time);
  const better = (n, o) => n.score > o.score || (n.score === o.score && n.time < o.time);
  const localList = pin => { try { return JSON.parse(localStorage.getItem(key(pin)) || "[]"); } catch (e) { return []; } };
  function localPost(r) {
    const l = localList(r.pin), i = l.findIndex(x => x.id === r.id);
    if (i < 0) l.push(r);
    else { const o = l[i]; if (o.attempt === r.attempt || !o.done || (r.done && better(r, o))) l[i] = r; }
    try { localStorage.setItem(key(r.pin), JSON.stringify(l)); } catch (e) { /* storage full or blocked */ }
    return sortL(l);
  }
  async function call(url, opt) {
    const c = new AbortController(), t = setTimeout(() => c.abort(), 9000);
    try { return await (await fetch(url, { ...opt, signal: c.signal })).json(); } finally { clearTimeout(t); }
  }
  const api = {
    offline: false,
    async post(rec) {
      if (cfg.API_URL) {
        try { const j = await call(cfg.API_URL, { method: "POST", body: JSON.stringify(rec) }); api.offline = false; return sortL(j.list); }
        catch (e) { api.offline = true; }
      }
      return localPost(rec);
    },
    async list(pin) {
      if (cfg.API_URL) {
        try { const j = await call(cfg.API_URL + "?pin=" + encodeURIComponent(pin), {}); api.offline = false; return sortL(j.list); }
        catch (e) { api.offline = true; }
      }
      return sortL(localList(pin));
    }
  };
  return api;
})();
