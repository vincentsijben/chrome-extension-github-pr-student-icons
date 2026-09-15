// content_script.js
// Lightweight overlay icons with a test "merge+like" action.

(function () {
  'use strict';

  const BASE = 'https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/';

  // The actions, in display order.
  const ACTIONS = [
    { key: 'like',        title: 'Thumbs up — like the work (optionally merge)',        emoji: '👍', color: '#1f6feb' },
    { key: 'slap',        title: 'Broken link — student did not post the Pages URL',    emoji: '🔗', color: '#2da44e' },
    { key: 'facepalm',    title: 'Pages broken — the URL does not work',                emoji: '👎', color: '#8250df' },
    { key: 'sad',         title: 'SOS — result is not what was asked',                   emoji: '🆘', color: '#cf222e' },
    { key: 'multiple_pr', title: 'Multiple PRs — student opened more than one PR (#2+)', emoji: '1️⃣', color: '#bf8700' }
  ];

  // Hardcoded image URLs (GitHub Pages) — these render fine inside GitHub comments
  const IMAGES = {
    'like': [
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/great-success.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/i-approve.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/its-a-very-nice-i-like.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/very-nice-i-like.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/very-nice.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/well-done.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/thumbs-up.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/when-your-work-is-lit.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/you-did-it.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/good-job.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/niiiiiice.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/niiiiice.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/niiiice.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/harold-approves.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/ass-kicking-approved.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/congrats.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/congrats-i-approve.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/nice-time-for-beer.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/whoohoow-its-a-very-nice.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/awesome-i-like.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/thats-awesome.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/you-know-i-like.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/the-hoff-approves.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/this-project-nailed-it.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/nailed-it.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/that-feeling-when-youve-nailed-it.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/awesomeness.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/good-job-i-like.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/congratulations.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/awesome-awesome-to-the-max.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/thank-you.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/jo-approves.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/yes-i-approve.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/when-youve-nailed-your-project.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/when-your-work-is-approved.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/the-face-you-make-when-your-project-is-done.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/holy-moly-nice.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/omg.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/wow.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/im-speechless.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/that-moment-you-realize-it-worked-out-great.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/oooh-thats-nice.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/oh-wow-thats-nice.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/omg-awesome.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/whoohoow.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/yes-a-very-nice.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/mr-bean-approves.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/welllll-done.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/well-done-youve-kicked-ass.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/like/when-your-work-is-finally-approved.gif"
    ],
    'slap': [
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/slap/you-did-not-post-the-url-police.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/slap/you-did-not-post-the-url-batman.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/slap/you-did-not-post-the-url-butthead.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/slap/you-did-not-post-the-url-bears.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/slap/you-did-not-post-the-url-penguins.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/slap/you-did-not-post-the-url-forehead.gif"
    ],
    'sad': [
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/confession-bear.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/kim-jong-un-sad.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/happy-sad.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/sad-frog.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/kanye-sad.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/sad-donkey.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/michael-jordan-sad.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/denzel-happy-sad.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/disappointed-curry.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/disappointed-yoda.gif",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/sad/disappointed.gif"
    ],
    'facepalm': [
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/captain-picard-facepalm.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/double-facepalm.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/putin-facepalm.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/homer-facepalm.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/captain-kirk-facepalm.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/house-facepalm.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/vader-facepalm.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/batman-facepalm.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/one-does-not-simply-add-a-local-projectfolder-to-a-repo.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/oh-no.jpg",
      "https://vincentsijben.github.io/chrome-extension-github-pr-student-icons/images/facepalm/ohno.jpg"
    ]
  };

  // Student opened more than one PR. For now reuse slap + sad + facepalm;
  // dedicated images can be added to docs/images/multiple-pr/ later.
  IMAGES.multiple_pr = [
    ...IMAGES.slap,
    ...IMAGES.sad,
    ...IMAGES.facepalm
  ];

  // Robust dark-mode detection. GitHub commonly uses data-color-mode="auto" with
  // data-dark-theme / data-light-theme, so checking for "dark" alone is not enough.
  function isDarkMode() {
    try {
      const html = document.documentElement;
      const mode = (html.getAttribute('data-color-mode') || '').toLowerCase();
      if (mode === 'dark') return true;
      if (mode === 'light') return false;
      if (mode === 'auto') {
        return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      // Fallback: inspect the page background luminance
      const bg = getComputedStyle(document.body).backgroundColor || '';
      const m = bg.match(/\d+/g);
      if (m && m.length >= 3) {
        const [r, g, b] = m.map(Number);
        return (0.2126 * r + 0.7152 * g + 0.0722 * b) < 128;
      }
    } catch (e) {}
    return false;
  }

  function applyTheme(el) {
    el.classList.toggle('gh-pr-dark', isDarkMode());
  }

  function createOverlay() {
    let o = document.querySelector('.gh-pr-overlay');
    if (o) return o;
    o = document.createElement('div');
    o.className = 'gh-pr-overlay';
    applyTheme(o);
    document.documentElement.appendChild(o);

    // Re-apply theme when GitHub or the OS switches color scheme
    try {
      new MutationObserver(() => applyTheme(o)).observe(document.documentElement, {
        attributes: true, attributeFilter: ['data-color-mode', 'data-dark-theme', 'data-light-theme']
      });
      if (window.matchMedia) {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => applyTheme(o));
      }
    } catch (e) {}
    return o;
  }

  function showToast(msg, ms = 2200) {
    try {
      let t = document.querySelector('.gh-pr-toast');
      if (!t) {
        t = document.createElement('div');
        t.className = 'gh-pr-toast';
        document.documentElement.appendChild(t);
      }
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(t._hideTimer);
      t._hideTimer = setTimeout(() => t.classList.remove('show'), ms);
    } catch (e) { console.error('[gh-pr-icons] showToast error:', e); }
  }

  function makeCheckbox(id, labelText, storageKey, defaultChecked, onChange) {
    const row = document.createElement('label');
    row.className = 'gh-pr-check';
    row.htmlFor = id;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = id;
    input.checked = !!defaultChecked;
    try {
      chrome.storage.local.get([storageKey], (res) => {
        try { if (res && typeof res[storageKey] === 'boolean') input.checked = res[storageKey]; } catch (e) {}
      });
    } catch (e) {}
    input.addEventListener('change', () => onChange(input.checked));

    const text = document.createElement('span');
    text.textContent = labelText;

    row.appendChild(input);
    row.appendChild(text);
    return row;
  }

  function buildOverlay() {
    const o = createOverlay();
    o.textContent = '';

    // Header
    const header = document.createElement('div');
    header.className = 'gh-pr-header';
    const title = document.createElement('span');
    title.className = 'gh-pr-title';
    title.textContent = 'PR reply';
    const opt = document.createElement('button');
    opt.type = 'button';
    opt.className = 'gh-pr-btn gh-pr-btn-small';
    opt.textContent = 'Options';
    opt.title = 'Open extension options';
    opt.addEventListener('click', () => {
      try {
        chrome.runtime.sendMessage({ action: 'openOptions' }, (resp) => {
          if (!resp || !resp.ok) { try { chrome.runtime.openOptionsPage(); } catch (e) { window.open(chrome.runtime.getURL('options.html')); } }
        });
      } catch (e) { try { chrome.runtime.openOptionsPage(); } catch (e2) { window.open(chrome.runtime.getURL('options.html')); } }
    });
    header.appendChild(title);
    header.appendChild(opt);
    o.appendChild(header);

    // Settings
    const settings = document.createElement('div');
    settings.className = 'gh-pr-settings';
    settings.appendChild(makeCheckbox('gh-pr-auto-submit-toggle', 'Auto-submit', AUTO_SUBMIT_KEY, true, (v) => {
      setAutoSubmit(v); showToast(`Auto-submit ${v ? 'on' : 'off'}`);
    }));
    settings.appendChild(makeCheckbox('gh-pr-merge-after-like-toggle', 'Merge after like', MERGE_AFTER_LIKE_KEY, false, (v) => {
      try { chrome.storage.local.set({ [MERGE_AFTER_LIKE_KEY]: v }); } catch (e) {}
      showToast(`Merge after like ${v ? 'on' : 'off'}`);
    }));
    o.appendChild(settings);

    // Action buttons
    const iconsRow = document.createElement('div');
    iconsRow.className = 'gh-pr-icons';
    ACTIONS.forEach((action, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'gh-pr-icon-btn';
      btn.title = action.title;
      btn.setAttribute('aria-label', action.title);
      btn.style.background = action.color;
      btn.textContent = action.emoji;
      btn.addEventListener('click', async (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        await performAction(i + 1, findActiveForm());
      });
      iconsRow.appendChild(btn);
    });
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

  function pickRandomImage(key) {
    const list = IMAGES[key];
    if (!list || !list.length) return null;
    return list[Math.floor(Math.random() * list.length)];
  }

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

      const action = ACTIONS[idx - 1];
      if (action) {
        const ta = form.querySelector('textarea, textarea.js-comment-field, textarea[name="comment[body]"]');
        if (!ta) { showToast('No composer textarea found'); return; }
        const imgUrl = pickRandomImage(action.key);
        if (!imgUrl) { showToast('No images available'); return; }
        let markdown = '';

        if (action.key === 'like') {
          markdown = `![](${imgUrl})\n`;
        } else if (action.key === 'slap') {
          markdown = `URL? 🤷‍♂️ <BR><BR>![omg](${imgUrl})<BR>Plaats de GitHub Pages URL (via settings - pages te vinden) in de omschrijving van je comment. Plaats die URL **níet** in de title want dan is de link niet clickable!\n`;
        } else if (action.key === 'facepalm') {
          markdown = `❌❌ Aiiii, de URL werkt niet... ❌❌<BR><BR>![omg](${imgUrl})<BR>Heb je de juiste URL gepost (via settings - pages vind je de juiste URL)?<BR><BR>Controleer áltijd eerst zélf of de GitHub Pages URL wel werkt voordat je de Pull Request indient. Wellicht heb je de lokale projectmap óók mee geupload. Je moet énkel de ínhoud van je lokale projectmap uploaden naar de root van je branch.<BR><BR>`;
          markdown += `Check wat er mis is, fix de branch, controleer eerst zélf de GitHub Pages opnieuw en pas als deze het correcte resultaat toont, stuur je een nieuwe comment in deze Pull Request zodat ik een notify krijg 👍👍\n`;
        } else if (action.key === 'sad') {
          markdown = `🧐🤨😲😧😯 Hmm, de URL toont niet het juiste resultaat 💔<BR><BR>![omg](${imgUrl})<BR>Controleer áltijd eerst zélf of de GitHub Pages URL het juiste resultaat weergeeft voordat je de Pull Request indient.<BR><BR>`;
          markdown += `Check wat er mis is, fix de branch, controleer eerst zélf de GitHub Pages opnieuw en pas als deze het correcte resultaat toont, stuur je een nieuwe comment in deze Pull Request zodat ik een notify krijg 👍👍\n`;
        } else if (action.key === 'multiple_pr') {
          markdown = `✋ Stop! Nog een Pull Request? 🙅‍♂️<BR><BR>![omg](${imgUrl})<BR>Je hebt **slechts één** Pull Request nodig. Ook als je later nog fouten fixt in je bestanden: elke nieuwe commit op je branch wordt **automatisch** meegenomen in die ene, al openstaande Pull Request. Je hoeft dus nóóit een tweede PR aan te maken.<BR><BR>`;
          markdown += `Om dit netjes op te lossen: stuur **Vincent via Teams** even een bevestiging dat hij deze repo in z'n geheel mag verwijderen. Daarna kun je alles opnieuw, netjes, inleveren middels één enkele Pull Request 👍\n`;
        }
        
        // Always use DOM manipulation (no API posting)
        ta.value = markdown;
        dispatchInputChange(ta);
        ta.focus();

        const autoSubmit = getAutoSubmit();
        console.log('[gh-pr-icons] Auto-submit enabled:', autoSubmit);
        if (autoSubmit) {
          showToast('Submitting comment...');
          const didSubmit = await submitForm(form);
          console.log('[gh-pr-icons] Form submitted:', didSubmit);
          if (!didSubmit) { showToast('Failed to submit comment'); return; }
          
          // If this is the like button and merge-after-like is enabled, wait for comment then merge
          const mergeAfterLike = await getMergeAfterLike();
          console.log('[gh-pr-icons] Icon index:', idx, 'Merge-after-like setting:', mergeAfterLike);
          if (action.key === 'like' && mergeAfterLike) {
            console.log('[gh-pr-icons] Merge-after-like enabled, starting merge flow');
            showToast('Waiting for posted comment to appear...');
            const found = await waitForCommentPost(imgUrl, 12000);
            if (!found) { 
              console.log('[gh-pr-icons] Comment not detected, aborting');
              showToast('Posted comment not detected — aborting merge', 5000); 
              return; 
            }
            console.log('[gh-pr-icons] Comment detected, prompting user');
            showToast('Posted comment detected — prompting to merge');
            const ok = await showConfirmModal('Merge PR', 'Also merge this PR now?');
            if (!ok) { 
              console.log('[gh-pr-icons] User cancelled merge');
              showToast('Merge cancelled'); 
              return; 
            }
            
            console.log('[gh-pr-icons] User confirmed, searching for merge button');
            // Find the merge button
            const mergeSelectors = [
              '[aria-label*="Merge"]',
              'button[data-details-container=".js-merge-pr"]',
              '.merge-message button.btn-group-merge',
              'button.js-merge-commit-button'
            ];
            
            // Try to find merge button - GitHub's structure has changed
            // Look for buttons with merge-related text or attributes
            console.log('[gh-pr-icons] Searching for merge button...');
            const allButtons = Array.from(document.querySelectorAll('button, [role="button"]'));
            console.log('[gh-pr-icons] Found', allButtons.length, 'total buttons on page');
            
            const mergeButtons = allButtons.filter(btn => {
              const text = (btn.textContent || '').toLowerCase().trim();
              const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
              const dataAttrs = Array.from(btn.attributes || []).map(a => `${a.name}=${a.value}`).join(' ').toLowerCase();
              
              return text.includes('merge') || ariaLabel.includes('merge') || dataAttrs.includes('merge');
            });
            
            console.log('[gh-pr-icons] Found', mergeButtons.length, 'merge-related buttons:', mergeButtons.map(b => ({
              text: (b.textContent || '').trim().substring(0, 50),
              ariaLabel: b.getAttribute('aria-label'),
              classes: b.className,
              disabled: b.disabled,
              tag: b.tagName
            })));
            
            // Find the primary merge button (usually has "Merge pull request" text or aria-label)
            let mergeBtn = mergeButtons.find(btn => {
              const text = (btn.textContent || '').toLowerCase().trim();
              const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
              return (text === 'merge pull request' || text.startsWith('merge pull request') || 
                      ariaLabel === 'merge pull request' || ariaLabel.startsWith('merge pull request')) &&
                     !btn.disabled;
            });
            
            // Fallback: any button with "merge" that's not disabled
            if (!mergeBtn) {
              console.log('[gh-pr-icons] Primary merge button not found, trying fallback');
              mergeBtn = mergeButtons.find(btn => !btn.disabled);
            }
            
            if (mergeBtn) {
              console.log('[gh-pr-icons] Selected merge button:', {
                text: mergeBtn.textContent.trim().substring(0, 50),
                ariaLabel: mergeBtn.getAttribute('aria-label'),
                tag: mergeBtn.tagName
              });
            }
            
            if (mergeBtn && typeof mergeBtn.click === 'function') {
              console.log('[gh-pr-icons] Clicking merge button:', mergeBtn);
              mergeBtn.click();
              showToast('Merging...');
              
              // Wait for confirmation dialog and click confirm
              setTimeout(() => {
                console.log('[gh-pr-icons] Looking for confirmation button...');
                const allVisibleButtons = Array.from(document.querySelectorAll('button, input[type="submit"]')).filter(b => {
                  const style = window.getComputedStyle(b);
                  return style.display !== 'none' && style.visibility !== 'hidden' && b.offsetParent !== null;
                });
                console.log('[gh-pr-icons] Found', allVisibleButtons.length, 'visible buttons');
                
                let confirmBtn = allVisibleButtons.find(b => {
                  const text = (b.textContent || b.value || '').trim().toLowerCase();
                  return text === 'confirm merge' && !b.disabled;
                });
                
                if (!confirmBtn) {
                  console.log('[gh-pr-icons] Exact match not found, trying partial match');
                  confirmBtn = allVisibleButtons.find(b => {
                    const text = (b.textContent || b.value || '').trim().toLowerCase();
                    return text.includes('confirm') && text.includes('merge') && !b.disabled;
                  });
                }
                
                if (confirmBtn) {
                  console.log('[gh-pr-icons] Found confirm button:', confirmBtn.textContent.trim());
                }
                
                if (confirmBtn && typeof confirmBtn.click === 'function') {
                  console.log('[gh-pr-icons] Clicking confirm button');
                  confirmBtn.click();
                  showToast('PR merged!');
                } else {
                  console.log('[gh-pr-icons] Confirm button not found or not clickable');
                  showToast('Please confirm merge manually', 4000);
                }
              }, 800);
            } else {
              console.log('[gh-pr-icons] Merge button not found or not clickable');
              showToast('Merge button not found', 4000);
            }
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
    let filename = null;
    try { filename = (new URL(needle)).pathname.split('/').filter(Boolean).pop() || null; } catch (e) { filename = null; }
    
    const initialCommentCount = document.querySelectorAll('.timeline-comment').length;
    
    const selectors = [
      '.timeline-comment img',
      '.comment-body img',
      'img[src*="github.io"]'
    ];
    const start = Date.now();
    return await new Promise((resolve) => {
      const check = () => {
        const elapsed = Date.now() - start;
        
        const currentCommentCount = document.querySelectorAll('.timeline-comment').length;
        if (currentCommentCount > initialCommentCount) {
          const newComments = Array.from(document.querySelectorAll('.timeline-comment')).slice(initialCommentCount);
          for (const comment of newComments) {
            if (comment.querySelectorAll('img').length > 0) {
              resolve(true);
              return;
            }
          }
        }

        // Fallback: image src match
        try {
          const imgs = Array.from(document.querySelectorAll('img'));
          for (const im of imgs) {
            try {
              const src = im.src || '';
              if (src && ((needle && src.includes(needle)) || (filename && src.includes(filename)))) {
                resolve(true);
                return;
              }
            } catch (e) {}
          }
        } catch (e) {}

        if (elapsed > timeoutMs) { 
          resolve(false); 
          return; 
        }
        
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
        chrome.storage.local.get([MERGE_AFTER_LIKE_KEY], (res) => {
          resolve(!!(res && res[MERGE_AFTER_LIKE_KEY]));
        });
      } catch (e) { resolve(false); }
    });
  }

  const AUTO_SUBMIT_KEY = 'gh_pr_icons_auto_submit';
  const MERGE_AFTER_LIKE_KEY = 'gh_pr_icons_merge_after_like';
  let _autoSubmit = true;
  try { chrome.storage.local.get([AUTO_SUBMIT_KEY], (res) => { if (res && res[AUTO_SUBMIT_KEY] === false) _autoSubmit = false; }); } catch (e) {}
  function getAutoSubmit() { return _autoSubmit; }
  function setAutoSubmit(v) { try { _autoSubmit = !!v; chrome.storage.local.set({ [AUTO_SUBMIT_KEY]: _autoSubmit }); } catch (e) {} }

  function scheduleReinject() { /* no-op for overlay-only mode */ }

  function start() { 
    try {
      buildOverlay();
    } catch (e) {
      console.error('[gh-pr-icons] Error in start():', e);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();

})();
