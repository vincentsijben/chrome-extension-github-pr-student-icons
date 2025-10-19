# GitHub PR Comment Icons (Demo)

This is a minimal Chrome extension (Manifest V3) that injects 5 clickable icons into the action/toolbars of comments on GitHub Pull Request pages. Each icon currently shows a simple `alert()` when clicked.

Files:

- `manifest.json` - extension manifest
- `content_script.js` - injects icons and handlers
- `icons/` - five simple SVG icons used by the content script

How to load in Chrome (Developer mode):

1. Open Chrome and go to chrome://extensions
2. Enable "Developer mode" (top-right)
3. Click "Load unpacked" and select this folder (`github-pr-icons`)
4. Open any GitHub Pull Request page (e.g. https://github.com/<owner>/<repo>/pull/<number>)
5. The extension will inject icons into each comment's action row. Click an icon to see an alert.

Notes:

- This is a demo scaffold. Icons are injected into elements matching common GitHub action-row selectors. GitHub's DOM changes over time and selectors may need updates.
- The extension only uses content scripts and no additional permissions.
