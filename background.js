// background.js
// Service worker to fetch GitHub Pages directories and return image URLs.

self.addEventListener('message', async (event) => {
  // Not used - content scripts will use runtime.sendMessage below
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  try { console.debug('[gh-pr-icons][bg] onMessage', msg && msg.action, msg); } catch (e) {}
  if (!msg || !msg.action) return;
  if (msg.action === 'fetchImages') {
    const url = msg.url;
    (async () => {
      try {
        const res = await fetch(url);
        if (!res.ok) return sendResponse({ ok: false, error: `Pages fetch error ${res.status}` });
        const html = await res.text();
        let found = [];

        // Use DOMParser when available (not guaranteed in service worker)
        try {
          if (typeof DOMParser !== 'undefined') {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            doc.querySelectorAll('a').forEach(a => {
              try {
                const href = a.getAttribute('href');
                if (href && href.match(/\.(png|jpe?g|gif|webp)$/i)) found.push(href);
              } catch (e) {}
            });
            doc.querySelectorAll('img').forEach(img => {
              try {
                const s = img.getAttribute('src');
                if (s && s.match(/\.(png|jpe?g|gif|webp)$/i)) found.push(s);
              } catch (e) {}
            });
          }
        } catch (e) {
          // ignore and fall back to regex
        }

        if (!found.length) {
          const hrefRegex = /href=(?:'|")([^"'>]+\.(?:png|jpg|jpeg|gif|webp))(?:'|")/ig;
          const srcRegex = /src=(?:'|")([^"'>]+\.(?:png|jpg|jpeg|gif|webp))(?:'|")/ig;
          Array.from(html.matchAll(hrefRegex)).forEach(m => found.push(m[1]));
          Array.from(html.matchAll(srcRegex)).forEach(m => found.push(m[1]));
        }

        const abs = found.map(u => { try { return new URL(u, url).href } catch (e) { return null } }).filter(Boolean);
        const dedup = Array.from(new Set(abs));
        try { console.debug('[gh-pr-icons][bg] fetchImages found', dedup.length, 'images for', url); } catch (e) {}
        sendResponse({ ok: true, images: dedup });
      } catch (err) {
        console.debug('[gh-pr-icons] fetchImages error', err);
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    // indicate we will respond asynchronously
    return true;
  }

  if (msg.action === 'fetchImagesApi') {
    // msg should contain { owner, repo, path }
  const { owner, repo, path } = msg;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const headers = {};
  if (msg.token) headers['Authorization'] = `token ${msg.token}`;
    (async () => {
      try {
  const res = await fetch(apiUrl, { headers });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          let message = `GitHub API error ${res.status}`;
          if (res.status === 401) message = 'Unauthorized - invalid or missing token (401)';
          else if (res.status === 403) message = 'Forbidden - token may lack permissions or rate-limited (403)';
          else if (res.status === 404) message = 'Not found - repository/path may be private or the path is incorrect (404)';
          else if (res.status === 429) message = 'Too many requests - rate limit exceeded (429)';
          // include server text only if available
          if (text) message += `: ${text.substring(0, 200)}`;
          console.debug('[gh-pr-icons] fetchImagesApi', message);
          return sendResponse({ ok: false, error: message });
        }
        const json = await res.json();
        if (!Array.isArray(json)) return sendResponse({ ok: false, error: 'API returned non-array' });

        // Filter to image files
        const files = json.filter(item => item && item.type === 'file' && item.name && item.name.match(/\.(png|jpe?g|gif|webp)$/i));

        // Use download_url when available (this works for private repos when authorized).
        let images = files.map(f => f.download_url).filter(Boolean);

        // If some items lack download_url, fall back to constructing raw.githubusercontent URLs using the repo's default branch
        if (images.length < files.length) {
          // fetch repo metadata to find the default branch
          const metaUrl = `https://api.github.com/repos/${owner}/${repo}`;
          const metaRes = await fetch(metaUrl, { headers });
          let defaultBranch = 'master';
          if (metaRes && metaRes.ok) {
            try {
              const meta = await metaRes.json();
              if (meta && meta.default_branch) defaultBranch = meta.default_branch;
            } catch (e) {}
          }

          const pathSegment = path ? `${path.replace(/\/$/, '')}/` : '';
          const rawBase = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}`;
          const constructed = files.map(f => `${rawBase}/${pathSegment}${f.name}`);
          // Merge: prefer any download_url values, but include constructed for missing ones
          images = files.map((f, i) => (f.download_url ? f.download_url : constructed[i]));
        }

        // dedupe
        const dedup = Array.from(new Set(images.filter(Boolean)));
        try { console.debug('[gh-pr-icons][bg] fetchImagesApi found', dedup.length, 'images for', apiUrl); } catch (e) {}
        sendResponse({ ok: true, images: dedup });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true;
  }

  if (msg.action === 'openOptions') {
    try {
      // In MV3 service worker, openOptionsPage is available and will open the options UI
      chrome.runtime.openOptionsPage(() => {
        // ignore errors; respond to sender if possible
        try { sendResponse({ ok: true }); } catch (e) {}
      });
    } catch (e) {
      try { sendResponse({ ok: false, error: String(e) }); } catch (e2) {}
    }
    return true;
  }

  if (msg.action === 'mergePr') {
    const { owner, repo, pull_number } = msg;
    try {
      // Read token from storage in the service worker
      chrome.storage.local.get(['githubToken'], async (res) => {
        const token = (res && res.githubToken) ? res.githubToken : '';
        if (!token) return sendResponse({ ok: false, error: 'No token saved' });
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/pulls/${pull_number}/merge`;
        const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' };
        try {
          const body = JSON.stringify({ commit_title: `Merge PR #${pull_number} via extension`, merge_method: 'merge' });
          const res2 = await fetch(apiUrl, { method: 'PUT', headers, body });
          const text = await res2.text().catch(() => '');
          if (!res2.ok) {
            let message = `Merge API error ${res2.status}`;
            if (text) message += `: ${text.substring(0, 200)}`;
            return sendResponse({ ok: false, error: message, status: res2.status });
          }
          // Try to parse json
          try {
            const json = JSON.parse(text || '{}');
            return sendResponse({ ok: true, result: json });
          } catch (e) {
            return sendResponse({ ok: true, result: text });
          }
        } catch (err) {
          return sendResponse({ ok: false, error: String(err) });
        }
      });
    } catch (e) {
      try { sendResponse({ ok: false, error: String(e) }); } catch (ee) {}
    }
    return true;
  }

  if (msg.action === 'postComment') {
    // msg: { owner, repo, pull_number, body }
    const { owner, repo, pull_number, body } = msg;
    try {
      chrome.storage.local.get(['githubToken'], async (res) => {
        const token = (res && res.githubToken) ? res.githubToken : '';
        if (!token) return sendResponse({ ok: false, error: 'No token saved' });
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${pull_number}/comments`;
        const headers = { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github+json', 'Content-Type': 'application/json' };
        try {
          const bodyJson = JSON.stringify({ body });
          const r = await fetch(apiUrl, { method: 'POST', headers, body: bodyJson });
          const text = await r.text().catch(() => '');
          if (!r.ok) {
            let message = `Comment API error ${r.status}`;
            if (text) message += `: ${text.substring(0, 200)}`;
            return sendResponse({ ok: false, error: message, status: r.status });
          }
          try { return sendResponse({ ok: true, result: JSON.parse(text || '{}') }); } catch (e) { return sendResponse({ ok: true, result: text }); }
        } catch (err) {
          return sendResponse({ ok: false, error: String(err) });
        }
      });
    } catch (e) { try { sendResponse({ ok: false, error: String(e) }); } catch (ee) {} }
    return true;
  }
});
