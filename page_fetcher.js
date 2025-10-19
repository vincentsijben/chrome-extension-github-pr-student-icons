(() => {
  // page_fetcher.js
  // Runs in the page's main world. Listens for window messages to perform
  // fetch(url, { credentials: 'include' }) and posts back the HTML. This avoids
  // Content Security Policy issues that block inline scripts.
  if (window.__ghPrIconsPageFetcherInstalled) return;
  window.__ghPrIconsPageFetcherInstalled = true;

  window.addEventListener('message', async (ev) => {
    try {
      const m = ev.data || {};
      if (m && m.__ghPrIconsFetchHtml) {
        const id = m.id;
        const url = m.url;
        try {
          const res = await fetch(url, { credentials: 'include' });
          const text = await res.text();
          window.postMessage({ __ghPrIconsFetchHtmlResponse: true, id, ok: true, html: text }, '*');
        } catch (e) {
          window.postMessage({ __ghPrIconsFetchHtmlResponse: true, id, ok: false, error: String(e) }, '*');
        }
      }
    } catch (e) {}
  });

})();
