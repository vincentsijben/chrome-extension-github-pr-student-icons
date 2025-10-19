// content_script.js
// Lightweight overlay icons with a test "merge+like" action.

(function () {
  'use strict';

  const ICON_COUNT = 6;

  const ICON_SVGS = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="10" fill="#0366d6" /><text x="12" y="17" font-size="16" text-anchor="middle" fill="white">👍</text></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><rect x="2" y="2" width="20" height="20" rx="4" fill="#28a745" /><text x="12" y="17" font-size="14" text-anchor="middle" fill="white">🔗?</text></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><polygon points="2,18 22,18 20,6 4,6" fill="#ffab00" /><text x="12" y="16" font-size="14" text-anchor="middle" fill="black">💻?</text></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="10" fill="#d73a49" /><text x="12" y="17" font-size="16" text-anchor="middle" fill="white">🤡?</text></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><rect x="3" y="3" width="18" height="18" rx="3" fill="#6f42c1" /><text x="12" y="17" font-size="16" text-anchor="middle" fill="white">👎</text></svg>`,
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><circle cx="12" cy="12" r="10" fill="#ff66a3" /><text x="12" y="17" font-size="14" text-anchor="middle" fill="white">🆘</text></svg>`
  ];

  function debug(...args) { try { console.debug('[gh-pr-icons]', ...args); } catch (e) {} }

  function createOverlay() {
    let o = document.querySelector('.gh-pr-overlay');
    if (o) return o;
    o = document.createElement('div');
    o.className = 'gh-pr-overlay';
    o.style.position = 'fixed';
    o.style.right = '12px';
    o.style.bottom = '12px';
    o.style.zIndex = '2147483647';
    o.style.display = 'flex';
    o.style.flexDirection = 'column';
    o.style.alignItems = 'center';
    o.style.gap = '6px';
    document.documentElement.appendChild(o);
    return o;
  }

  function showToast(msg, ms = 2200) {
    try {
      let t = document.querySelector('.gh-pr-toast');
      if (!t) {
        t = document.createElement('div');
        t.className = 'gh-pr-toast';
        t.style.position = 'fixed';
        t.style.left = '50%';
        t.style.bottom = '14px';
        t.style.transform = 'translateX(-50%)';
        t.style.background = 'rgba(0,0,0,0.85)';
        t.style.color = '#fff';
        t.style.padding = '8px 12px';
        t.style.borderRadius = '6px';
        t.style.zIndex = '2147483647';
        t.style.fontSize = '13px';
        t.style.pointerEvents = 'none';
        document.documentElement.appendChild(t);
      }
      t.textContent = msg;
      t.style.display = 'block';
      setTimeout(() => { try { t.style.display = 'none'; } catch (e) {} }, ms);
    } catch (e) { console.error(e); }
  }

  function ensureTooltip() {
    const o = createOverlay();
    let tip = o.querySelector('.gh-pr-tooltip');
    if (!tip) {
      tip = document.createElement('div');
      tip.className = 'gh-pr-tooltip';
      tip.style.position = 'fixed';
      tip.style.padding = '6px 8px';
      tip.style.background = 'rgba(0,0,0,0.9)';
      tip.style.color = '#fff';
      tip.style.borderRadius = '4px';
      tip.style.fontSize = '12px';
      tip.style.pointerEvents = 'none';
      tip.style.zIndex = '2147483647';
      tip.style.display = 'none';
      o.appendChild(tip);
    }
    return tip;
  }

  function showTooltip(el, text) {
    try {
      const tip = ensureTooltip();
      tip.textContent = text;
      const r = el.getBoundingClientRect();
      const left = r.left + r.width / 2;
      const top = r.top - 8;
      tip.style.left = left + 'px';
      tip.style.top = (top - tip.offsetHeight) + 'px';
      tip.style.transform = 'translateX(-50%)';
      tip.style.display = 'block';
    } catch (e) {}
  }
  function hideTooltip() { try { const tip = ensureTooltip(); tip.style.display = 'none'; } catch (e) {} }

  // build UI controls used previously: toggle, refresh, options, test API button
  function buildToggle(container) {
    try {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'flex';
      wrapper.style.alignItems = 'center';
      wrapper.style.gap = '12px';

      // Auto-submit toggle
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = 'gh-pr-auto-submit-toggle';
      try {
        chrome.storage.local.get([AUTO_SUBMIT_KEY], (res) => {
          try { input.checked = !!(res && res[AUTO_SUBMIT_KEY]); } catch (e) { input.checked = getAutoSubmit(); }
        });
      } catch (e) { input.checked = getAutoSubmit(); }
      input.addEventListener('change', () => { setAutoSubmit(input.checked); showToast(`Auto-submit ${input.checked ? 'on' : 'off'}`); });
      const label = document.createElement('label');
      label.htmlFor = input.id;
      label.textContent = 'Auto-submit';
      label.style.fontSize = '12px';
      label.style.color = '#222';
      wrapper.appendChild(input);
      wrapper.appendChild(label);

      // Merge-after-like toggle
      const mergeInput = document.createElement('input');
      mergeInput.type = 'checkbox';
      mergeInput.id = 'gh-pr-merge-after-like-toggle';
      try {
        chrome.storage.local.get(['gh_pr_icons_merge_after_like'], (res) => {
          try { mergeInput.checked = !!(res && res['gh_pr_icons_merge_after_like']); } catch (e) { mergeInput.checked = false; }
        });
      } catch (e) { mergeInput.checked = false; }
      mergeInput.addEventListener('change', () => {
        chrome.storage.local.set({ 'gh_pr_icons_merge_after_like': mergeInput.checked });
        showToast(`Merge after like ${mergeInput.checked ? 'on' : 'off'}`);
      });
      const mergeLabel = document.createElement('label');
      mergeLabel.htmlFor = mergeInput.id;
      mergeLabel.textContent = 'Merge after like';
      mergeLabel.style.fontSize = '12px';
      mergeLabel.style.color = '#222';
      wrapper.appendChild(mergeInput);
      wrapper.appendChild(mergeLabel);

      container.appendChild(wrapper);
      return wrapper;
    } catch (e) { return null; }
  }

  function buildRefresh(container) {
    try {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Refresh images';
      b.style.fontSize = '12px';
      b.addEventListener('click', async () => {
        const cats = [
          'https://vincentsijben.github.io/chrome-extension-github/images/like/',
          'https://vincentsijben.github.io/chrome-extension-github/images/slap/',
          'https://vincentsijben.github.io/chrome-extension-github/images/missing-screenshot/',
          'https://vincentsijben.github.io/chrome-extension-github/images/missing-profile-picture/',
          'https://vincentsijben.github.io/chrome-extension-github/images/sad/',
          'https://vincentsijben.github.io/chrome-extension-github/images/facepalm/'
        ];
        try {
          const keys = cats.map(c => `gh_pr_images_${c}`);
          chrome.storage.local.remove(keys, () => {});
        } catch (e) {}
        showToast('Cleared image caches — fetching...');
        // prefetch: trigger background fetch via fetchImages action for each category (best-effort)
        for (const c of cats) {
          try { chrome.runtime.sendMessage({ action: 'fetchImages', url: c }, () => {}); } catch (e) {}
        }
      });
      container.appendChild(b);
      return b;
    } catch (e) { return null; }
  }

  function buildTestApiButton(container) {
    try {
      const tb = document.createElement('button');
      tb.type = 'button';
      tb.textContent = 'Test API (like)';
      tb.style.fontSize = '12px';
      tb.title = 'Call the Contents API for docs/images/like in the example repo';
      tb.addEventListener('click', async () => {
        const owner = 'vincentsijben';
        const repo = 'chrome-extension-github';
        const path = 'docs/images/like';
        const stored = await getStoredToken();
        if (!stored) { showToast('No token set — open Options to add a token'); return; }
        showToast('Testing API...');
        const resp = await new Promise(resolve => chrome.runtime.sendMessage({ action: 'fetchImagesApi', owner, repo, path, token: stored }, r => resolve(r)));
        if (!resp) { showToast('No response from extension API'); return; }
        if (!resp.ok) { showToast('API error: ' + (resp.error || 'unknown')); return; }
        showToast('API returned ' + (resp.images ? resp.images.length : 0) + ' images');
      });
      container.appendChild(tb);
      return tb;
    } catch (e) { return null; }
  }

  function buildOverlay() {
    const o = createOverlay();
    // top controls: toggle, refresh, options, test
    const controls = document.createElement('div');
    controls.style.display = 'flex';
    controls.style.flexDirection = 'column';
    controls.style.alignItems = 'center';
    controls.style.gap = '6px';
    controls.style.marginBottom = '6px';

    buildToggle(controls);
    buildRefresh(controls);

    const opt = document.createElement('button');
    opt.type = 'button';
    opt.textContent = 'Options';
    opt.style.fontSize = '12px';
    opt.addEventListener('click', () => {
      try { chrome.runtime.sendMessage({ action: 'openOptions' }, (resp) => { if (!resp || !resp.ok) { try { chrome.runtime.openOptionsPage(); } catch (e) { window.open(chrome.runtime.getURL('options.html')); } } }); } catch (e) { try { chrome.runtime.openOptionsPage(); } catch (e2) { window.open(chrome.runtime.getURL('options.html')); } }
    });
    controls.appendChild(opt);

    buildTestApiButton(controls);

    o.appendChild(controls);

    // status area
    const status = document.createElement('div');
    status.className = 'gh-pr-status';
    status.style.fontSize = '12px';
    status.style.color = '#444';
    status.style.margin = '6px 0';
    status.style.minWidth = '200px';
    status.style.maxWidth = '320px';
    status.style.display = 'none';
    o.appendChild(status);

    const TITLES = [
      'Thumbs up — insert a like',
      'Broken link — insert a link placeholder',
      'Missing screenshot — insert a screenshot placeholder',
      'Missing profile picture — insert a profile placeholder',
      'Pages broken — insert a thumbs down / pages-not-working',
      'SOS — result not what was asked / other'
    ];

    const iconsRow = document.createElement('div');
    iconsRow.style.display = 'flex';
    iconsRow.style.flexDirection = 'row';
    iconsRow.style.alignItems = 'center';
    iconsRow.style.gap = '8px';
    iconsRow.style.background = 'transparent';
    iconsRow.style.padding = '6px';
    iconsRow.style.borderRadius = '6px';

    for (let i = 1; i <= ICON_COUNT; i++) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gh-pr-icon-btn';
      btn.style.border = 'none';
      btn.style.background = 'transparent';
      btn.style.cursor = 'pointer';
      btn.style.padding = '6px';
      btn.style.display = 'inline-flex';
      btn.style.alignItems = 'center';
      btn.style.justifyContent = 'center';
      btn.innerHTML = ICON_SVGS[i - 1];
      btn.addEventListener('mouseenter', () => showTooltip(btn, TITLES[i - 1]));
      btn.addEventListener('mouseleave', hideTooltip);
      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        const form = findActiveForm();
        await performAction(i, form);
      });
      iconsRow.appendChild(btn);
    }

    o.appendChild(iconsRow);
  }

  function findActiveForm() {
    const active = document.activeElement;
    if (active && (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT')) {
      const fm = active.closest('form'); if (fm) return fm;
    }
    const forms = Array.from(document.querySelectorAll('form')).filter(f => f.querySelector && f.querySelector('textarea'));
    if (!forms.length) return null;
    forms.sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);
    return forms[0];
  }

  function dispatchInputChange(el) { try { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {} }

  async function pickRandomImageForCategory(baseUrl) {
    try {
      const cacheKey = `gh_pr_images_${baseUrl}`;
      const list = await new Promise(r => { try { chrome.storage.local.get([cacheKey], res => r(res && res[cacheKey] ? res[cacheKey] : [])); } catch (e) { r([]); } });
      if (!list || !list.length) return null;
      return list[Math.floor(Math.random() * list.length)];
    } catch (e) { return null; }
  }

  function mapToPagesUrl(url) { try { const u = new URL(url); if (/github\.io$/i.test(u.hostname)) return `${u.protocol}//${u.hostname}${u.pathname}`; if (/raw\.githubusercontent\.com$/i.test(u.hostname)) { const parts = u.pathname.split('/').filter(Boolean); if (parts.length >= 4) { const owner = parts[0], repo = parts[1]; const rest = parts.slice(3).join('/').replace(/^docs\//, ''); return `https://${owner}.github.io/${repo}/${rest}`; } } return url; } catch (e) { return url; } }

  function parsePullFromUrl(url) {
    try {
      const u = new URL(url);
      if (u.hostname !== 'github.com') return null;
      const parts = u.pathname.replace(/^\//, '').split('/').filter(Boolean);
      const pullIndex = parts.indexOf('pull');
      if (pullIndex === -1 || parts.length <= pullIndex + 1) return null;
      const owner = parts[0];
      const repo = parts[1];
      const pull = parseInt(parts[pullIndex + 1], 10);
      if (!owner || !repo || !pull) return null;
      return { owner, repo, pull_number: pull };
    } catch (e) { return null; }
  }

  async function showConfirmModal(title, message) { return window.confirm(message); }

  async function performAction(idx, form) {
    try {
      if (!form) form = findActiveForm();
      if (!form) { showToast('No composer form found'); return; }

      const folders = {
        1: 'https://vincentsijben.github.io/chrome-extension-github/images/like/',
        2: 'https://vincentsijben.github.io/chrome-extension-github/images/slap/',
        3: 'https://vincentsijben.github.io/chrome-extension-github/images/missing-screenshot/',
        4: 'https://vincentsijben.github.io/chrome-extension-github/images/missing-profile-picture/',
        5: 'https://vincentsijben.github.io/chrome-extension-github/images/sad/',
        6: 'https://vincentsijben.github.io/chrome-extension-github/images/facepalm/'
      };

      if (idx >= 1 && idx <= 6) {
        const ta = form.querySelector('textarea, textarea.js-comment-field, textarea[name="comment[body]"]');
        if (!ta) { showToast('No composer textarea found'); return; }
        const cat = folders[idx];
        const imgUrl = await pickRandomImageForCategory(cat);
        if (!imgUrl) { showNoImagesAdvice(); return; }
        const pages = mapToPagesUrl(imgUrl);
        const markdown = `![](${pages})\n`;
        // We'll avoid mutating the visible composer if we can post via API (fast path).
        // Determine if we intend to merge (merge-after-like) and if a token exists.
        const pr = parsePullFromUrl(window.location.href);
        const mergeWanted = (idx === 1) ? await getMergeAfterLike() : false;
        const hasToken = await new Promise((resolve) => { try { chrome.storage.local.get(['githubToken'], (res) => resolve(!!(res && res.githubToken))); } catch (e) { resolve(false); } });
        const willUseApi = !!(pr && mergeWanted && hasToken);
        if (!willUseApi) {
          // Only touch the composer when not using the API-post fast path
          ta.value = markdown;
          dispatchInputChange(ta);
          ta.focus();
        }

        if (getAutoSubmit()) {
          // If we have a token, prefer the background API to post the comment server-side (fast/reliable)
          // (we already computed pr, mergeWanted and hasToken above; willUseApi indicates the fast path)
          if (willUseApi) {
            showToast('Posting comment via API...');
            // Post comment via background
            const body = markdown.trim();
            const resp = await new Promise((resolve) => {
              try { chrome.runtime.sendMessage({ action: 'postComment', owner: pr.owner, repo: pr.repo, pull_number: pr.pull_number, body }, (r) => resolve(r)); } catch (e) { resolve({ ok: false, error: String(e) }); }
            });
              console.debug('[gh-pr-icons] postComment resp', resp);
              if (!resp || !resp.ok) { showToast('API comment failed: ' + (resp && resp.error ? resp.error : 'unknown'), 6000); return; }
              showToast('Comment posted (API) — prompting to merge');
              const ok = await showConfirmModal('Merge PR', 'Also merge this PR now?');
              if (!ok) { showToast('Merge cancelled'); return; }
              try {
                const payload = Object.assign({ action: 'mergePr' }, pr);
                console.debug('[gh-pr-icons] sending mergePr', payload);
                chrome.runtime.sendMessage(payload, (resp2) => {
                  console.debug('[gh-pr-icons] mergePr response', resp2);
                  if (resp2 && resp2.ok) showToast('PR merged!');
                  else showToast('Merge failed: ' + (resp2 && resp2.error ? resp2.error : 'unknown'), 6000);
                });
              } catch (e) { console.error('[gh-pr-icons] merge send error', e); showToast('Merge failed (send error)'); }
              return;
            }

          // Fallback: no token or not merging -> submit via DOM and wait for detection as before
          showToast('Submitting comment...');
          const didSubmit = await submitForm(form);
          if (!didSubmit) { showToast('Failed to submit comment'); return; }
          if (idx === 1 && await getMergeAfterLike()) {
            showToast('Waiting for posted comment to appear...');
            const found = await waitForCommentPost(pages, 12000);
            if (!found) { showToast('Posted comment not detected — aborting merge', 5000); return; }
            showToast('Posted comment detected — prompting to merge');
            const ok2 = await showConfirmModal('Merge PR', 'Also merge this PR now?');
            if (!ok2) { showToast('Merge cancelled'); return; }
            try {
              const payload = Object.assign({ action: 'mergePr' }, pr);
              console.debug('[gh-pr-icons] sending mergePr', payload);
              chrome.runtime.sendMessage(payload, (resp2) => {
                console.debug('[gh-pr-icons] mergePr response', resp2);
                if (resp2 && resp2.ok) showToast('PR merged!');
                else showToast('Merge failed: ' + (resp2 && resp2.error ? resp2.error : 'unknown'), 6000);
              });
            } catch (e) { console.error('[gh-pr-icons] merge send error', e); showToast('Merge failed (send error)'); }
          }
        } else {
          showToast('Inserted image (auto-submit disabled)');
        }
        return;
      }

    } catch (e) { console.error('[gh-pr-icons] performAction error', e); showToast('Action failed'); }
  }
  // Helper to submit the form using requestSubmit if available, else click submit button
  async function submitForm(form) {
    try {
      if (typeof form.requestSubmit === 'function') {
        form.requestSubmit();
        showToast('Posting comment...');
        scheduleReinject();
        return true;
      }
      const submit = form.querySelector('button[type="submit"], input[type="submit"]');
      if (submit) {
        submit.click();
        showToast('Posting comment...');
        scheduleReinject();
        return true;
      }
    } catch (e) {}
    return false;
  }

  // Wait for the comment containing expectedText to appear in the DOM
  async function waitForCommentPost(expectedText, timeoutMs = 20000) {
    const normalize = s => (s || '').replace(/\s+/g, ' ').trim();
    const needle = normalize(expectedText);
    if (!needle) return false;
    // derive filename to match against img srcs
    let filename = null;
    try { filename = (new URL(needle)).pathname.split('/').filter(Boolean).pop() || null; } catch (e) { filename = null; }
    const selectors = [
      '.js-comment-body',
      '.comment-body',
      '.timeline-comment .comment-body',
      '.comment-body p',
      '.markdown-body'
    ];
    const start = Date.now();
    return await new Promise((resolve) => {
      const check = () => {
        // text match
        for (const sel of selectors) {
          const nodes = Array.from(document.querySelectorAll(sel));
          for (const n of nodes) {
            try {
              const text = normalize(n.innerText || n.textContent || '');
              if (!text) continue;
              if (text.includes(needle) || needle.includes(text)) { console.debug('[gh-pr-icons] waitForCommentPost: text match', sel); resolve(true); return; }
            } catch (e) { /* ignore */ }
          }
        }

        // image src match
        try {
          const imgs = Array.from(document.querySelectorAll('img'));
          for (const im of imgs) {
            try {
              const src = im.src || '';
              if (!src) continue;
              if (needle && src.includes(needle)) { console.debug('[gh-pr-icons] waitForCommentPost: img src includes needle', src); resolve(true); return; }
              if (filename && src.includes(filename)) { console.debug('[gh-pr-icons] waitForCommentPost: img src includes filename', src); resolve(true); return; }
            } catch (e) {}
          }
        } catch (e) {}

        // anchor href match
        try {
          const links = Array.from(document.querySelectorAll('a'));
          for (const a of links) {
            try {
              const href = a.href || '';
              if (!href) continue;
              if (needle && href.includes(needle)) { console.debug('[gh-pr-icons] waitForCommentPost: link href includes needle', href); resolve(true); return; }
              if (filename && href.includes(filename)) { console.debug('[gh-pr-icons] waitForCommentPost: link href includes filename', href); resolve(true); return; }
            } catch (e) {}
          }
        } catch (e) {}

        if (Date.now() - start > timeoutMs) { console.debug('[gh-pr-icons] waitForCommentPost: timeout'); resolve(false); return; }
        // keep polling
        setTimeout(check, 700);
      };
      check();
    });
  }

  // Helper to get merge-after-like toggle value
  async function getMergeAfterLike() {
    return new Promise((resolve) => {
      try {
        chrome.storage.local.get(['gh_pr_icons_merge_after_like'], (res) => {
          resolve(!!(res && res['gh_pr_icons_merge_after_like']));
        });
      } catch (e) { resolve(false); }
    });
  }

  const AUTO_SUBMIT_KEY = 'gh_pr_icons_auto_submit';
  let _autoSubmit = true;
  try { chrome.storage.local.get([AUTO_SUBMIT_KEY], (res) => { if (res && (res[AUTO_SUBMIT_KEY] === true || res[AUTO_SUBMIT_KEY] === '1')) _autoSubmit = true; else if (res && res[AUTO_SUBMIT_KEY] === false) _autoSubmit = false; }); } catch (e) {}
  function getAutoSubmit() { return _autoSubmit; }
  function setAutoSubmit(v) { try { _autoSubmit = !!v; chrome.storage.local.set({ [AUTO_SUBMIT_KEY]: _autoSubmit }); } catch (e) {} }

  // ...existing code...

  function attemptAutoSubmit(form, submit) {
    try {
      const now = Date.now();
      const last = parseInt(form.dataset.ghPrAutoSubmittedAt || '0', 10) || 0;
      if (now - last < 5000) return false;
      form.dataset.ghPrAutoSubmittedAt = String(now);
      try { if (submit.disabled) { submit.disabled = false; submit.removeAttribute('disabled'); submit.setAttribute('aria-disabled', 'false'); } } catch (e) {}
      setTimeout(() => { try { submit.click(); showToast('Posting comment...'); scheduleReinject(); } catch (e) {} }, 150);
      return true;
    } catch (e) { return false; }
  }

  async function showNoImagesAdvice() { try { const token = await getStoredToken(); if (!token) showToast('No images found — if these images are private, add a token via Options', 6000); else showToast('No images found', 3000); } catch (e) { showToast('No images found', 3000); } }

  function scheduleReinject() { [200,400,800,1200].forEach(d => setTimeout(() => {/* no-op for overlay-only mode */}, d)); }

  // ...existing code...

  function start() { buildOverlay(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

})();
