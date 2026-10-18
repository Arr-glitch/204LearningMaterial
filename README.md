# Learning Content

A Kahoot-style quiz for **Unit 204: Digital Transformation in Inspection Technologies** (ITQAN Institute).
Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run locally (practice mode)
Double-click `index.html`. Scores are kept on that device only.

## Publish on GitHub Pages
1. Create a repository and upload everything in this folder.
2. Settings > Pages > Source: `main` branch, `/ (root)`.
3. Open `https://<your-username>.github.io/<repo-name>/`.

## Class leaderboard (real students, same time)
GitHub Pages is static, so the shared leaderboard uses a free Google Apps Script web app that stores scores in a Google Sheet.
1. Create a Google Sheet, then Extensions > Apps Script, and paste `apps-script/Code.gs`.
2. Deploy > New deployment > Web app. Execute as **Me**, access **Anyone**. Copy the web-app URL.
3. Paste the URL into `js/config.js` as `API_URL`, commit, and refresh the page.

How a round works:
- You give students a **Game PIN** (any word, e.g. `ROUND1`). Students enter PIN, full name and Student ID.
- Every answer updates the sheet. After each question students see the **top 3** (score first, then fastest total time).
- The final screen shows the real podium and top 10.
- Show `index.html?board=ROUND1` on the projector for a live scoreboard.
- The `Scores` sheet is your permanent record (name, ID, score, correct, total time).
- Same Student ID + same PIN = one row. A replay only replaces the old result if it finishes with a better score.

## Written answers
Graded automatically in `js/grading.js`: each question lists key ideas with many synonyms, and spelling mistakes, plurals and verb endings are forgiven. To accept more wording, add words to the `k` lists in `js/questions.js`.

## Structure
- `index.html` - page shell
- `css/style.css` - theme
- `js/config.js` - leaderboard URL
- `js/questions.js` - question bank
- `js/grading.js` - written-answer grader
- `js/leaderboard.js` - leaderboard client (online + local fallback)
- `js/app.js` - game engine
- `apps-script/Code.gs` - backend for the shared leaderboard

## Question types (`questions.js`)
| type | fields |
|------|--------|
| `mc` | `q`, `o` (options), `a` (index of the correct option) |
| `gap` | `q`, `s` (sentence with `{0}`, `{1}`...), `g` (per gap: `[correct, ...wrong]`), optional `eq` |
| `match` | `q`, `p` (pairs `[term, definition]`) |
| `order` | `q`, `o` (items in the correct order) |
| `open` | `q`, `m` (model answer), `k` (key ideas), `need`, optional `must`; for "list 3" questions add `list:1`, `minw:1`, `h` (hint) |

True/False questions are `mc` with options `["True","False"]`, `fixed:1` (no shuffle) and an optional `x` explanation.
