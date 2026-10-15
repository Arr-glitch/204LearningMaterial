# Learning Content

A Kahoot-style quiz for **Unit 204: Digital Transformation in Inspection Technologies** (ITQAN Institute).
Plain HTML, CSS and JavaScript. No build step, no dependencies.

## Run locally
Double-click `index.html`.

## Publish on GitHub Pages
1. Create a repository and upload everything in this folder.
2. Settings > Pages > Source: `main` branch, `/ (root)`.
3. Open `https://<your-username>.github.io/<repo-name>/`.

## Structure
- `index.html` - page shell
- `css/style.css` - Kahoot-style theme
- `js/questions.js` - question bank (edit here to change or add questions)
- `js/app.js` - game engine

## Question types (`questions.js`)
| type | fields |
|------|--------|
| `mc` | `q`, `o` (options), `a` (index of the correct option) |
| `gap` | `q`, `s` (sentence with `{0}`, `{1}`...), `g` (per gap: `[correct, ...wrong]`), optional `eq` (gaps whose answers may swap) |
| `match` | `q`, `p` (pairs `[term, definition]`) |
| `order` | `q`, `o` (items in the correct order) |
| `open` | `q`, `m` (model answer, student self-assesses) |
