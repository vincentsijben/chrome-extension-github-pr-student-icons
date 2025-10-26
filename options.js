// options.js
(function(){
  const tokenEl = document.getElementById('token');
  const saveBtn = document.getElementById('save');
  const clearBtn = document.getElementById('clear-token');
  const clearCaches = document.getElementById('clear-caches');
  const refetchBtn = document.getElementById('refetch-images');
  const status = document.getElementById('status');
  
  console.log('[gh-pr-icons][options] script loaded');

  const CATEGORIES = [
    { id: 'like', url: 'https://vincentsijben.github.io/chrome-extension-github/images/like/', element: 'count-like' },
    { id: 'slap', url: 'https://vincentsijben.github.io/chrome-extension-github/images/slap/', element: 'count-slap' },
    { id: 'screenshot', url: 'https://vincentsijben.github.io/chrome-extension-github/images/missing-screenshot/', element: 'count-screenshot' },
    { id: 'profile', url: 'https://vincentsijben.github.io/chrome-extension-github/images/missing-profile-picture/', element: 'count-profile' },
    { id: 'sad', url: 'https://vincentsijben.github.io/chrome-extension-github/images/sad/', element: 'count-sad' },
    { id: 'facepalm', url: 'https://vincentsijben.github.io/chrome-extension-github/images/facepalm/', element: 'count-facepalm' }
  ];

  // Map categories to GitHub API paths (more reliable than scraping pages)
  const API_INFO = {
    owner: 'vincentsijben',
    repo: 'chrome-extension-github',
    paths: {
      like: 'docs/images/like',
      slap: 'docs/images/slap',
      screenshot: 'docs/images/missing-screenshot',
      profile: 'docs/images/missing-profile-picture',
      sad: 'docs/images/sad',
      facepalm: 'docs/images/facepalm'
    }
  };

  let currentToken = '';

  function setStatus(msg, ok=true){ status.textContent = msg; status.style.color = ok? 'green':'red'; setTimeout(()=>{ status.textContent=''; }, 3500); }

  function setCount(elementId, value, isLoading = false, isError = false, title = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = value;
    el.className = 'count-value';
    if (isLoading) el.classList.add('loading');
    if (isError) el.classList.add('error');
    try { el.title = title || ''; } catch (e) {}
  }

  async function updateImageCounts() {
    for (const cat of CATEGORIES) {
      const cacheKey = `gh_pr_images_${cat.url}`;
      chrome.storage.local.get([cacheKey], (res) => {
        if (res && res[cacheKey] && Array.isArray(res[cacheKey])) {
          setCount(cat.element, res[cacheKey].length);
        } else {
          setCount(cat.element, '0');
        }
      });
    }
  }

  async function refetchAllImages() {
    refetchBtn.disabled = true;
    refetchBtn.textContent = 'Fetching...';
    
    // Set all to loading state
    for (const cat of CATEGORIES) {
      setCount(cat.element, 'Loading...', true);
    }

    let successCount = 0;
    let errorCount = 0;

    for (const cat of CATEGORIES) {
      try {
        // Prefer GitHub API listing (more reliable), fall back to scraping pages if needed
        const path = API_INFO.paths[cat.id];
        const apiResp = await new Promise((resolve) => {
          try {
            chrome.runtime.sendMessage({ action: 'fetchImagesApi', owner: API_INFO.owner, repo: API_INFO.repo, path, token: currentToken }, (response) => {
              if (chrome.runtime.lastError) {
                console.warn('[gh-pr-icons][options] fetchImagesApi lastError:', chrome.runtime.lastError.message);
              }
              resolve(response);
            });
          } catch (e) { console.error('[gh-pr-icons][options] fetchImagesApi exception', e); resolve(null); }
        });

        let response = apiResp;
        if (!response || !response.ok || !Array.isArray(response.images)) {
          console.log('[gh-pr-icons][options] API failed, falling back to scraping', cat);
          response = await new Promise((resolve) => {
            try {
              chrome.runtime.sendMessage({ action: 'fetchImages', url: cat.url }, (resp) => {
                if (chrome.runtime.lastError) {
                  console.warn('[gh-pr-icons][options] fetchImages lastError:', chrome.runtime.lastError.message);
                }
                resolve(resp);
              });
            } catch (e) { console.error('[gh-pr-icons][options] fetchImages exception', e); resolve(null); }
          });
        }

        if (response && response.ok && Array.isArray(response.images)) {
          // Store the images in cache under the pages URL-based key (used by content script)
          const cacheKey = `gh_pr_images_${cat.url}`;
          await new Promise((resolve) => chrome.storage.local.set({ [cacheKey]: response.images }, resolve));
          setCount(cat.element, response.images.length);
          successCount++;
        } else {
          const errMsg = response && response.error ? response.error : 'Unknown error';
          console.error('[gh-pr-icons][options] Failed to fetch images for', cat.id, errMsg);
          setCount(cat.element, 'Error', false, true, errMsg);
          errorCount++;
        }
      } catch (e) {
        console.error('[gh-pr-icons][options] Exception during refetch', e);
        setCount(cat.element, 'Error', false, true);
        errorCount++;
      }
    }

    refetchBtn.disabled = false;
    refetchBtn.textContent = 'Refetch images';
    
    if (errorCount === 0) {
      setStatus(`Successfully fetched images from all ${CATEGORIES.length} categories`);
    } else {
      setStatus(`Fetched ${successCount} categories, ${errorCount} failed — check console for details`, false);
    }
  }

  // load existing token
  chrome.storage.local.get(['githubToken'], (res)=>{
    if(res && res.githubToken) {
      tokenEl.value = res.githubToken;
      currentToken = res.githubToken;
    }
  });

  // Load initial image counts
  updateImageCounts();

  saveBtn.addEventListener('click', ()=>{
    const token = tokenEl.value.trim();
    chrome.storage.local.set({ githubToken: token }, ()=>{
      currentToken = token;
      setStatus('Token saved');
    });
  });

  clearBtn.addEventListener('click', ()=>{
    chrome.storage.local.remove(['githubToken'], ()=>{
      tokenEl.value=''; currentToken=''; setStatus('Token cleared');
    });
  });

  clearCaches.addEventListener('click', ()=>{
    // remove keys starting with gh_pr_images_
    chrome.storage.local.get(null, (items)=>{
      const keys = Object.keys(items || {}).filter(k => k && k.startsWith && k.startsWith('gh_pr_images_'));
      if(keys.length===0){ setStatus('No caches found'); return; }
      chrome.storage.local.remove(keys, ()=>{ 
        setStatus('Cleared ' + keys.length + ' caches'); 
        // Reset all counts to 0
        for (const cat of CATEGORIES) {
          setCount(cat.element, '0');
        }
      });
    });
  });

  refetchBtn.addEventListener('click', refetchAllImages);

  // Reset button removed - users can clear caches via the 'Clear image caches' button
})();

// Backwards-compat: also clear any localStorage-based caches when Options UI is used
try {
  // clear localStorage caches on load if user clicks clear caches or reset
  document.getElementById('clear-caches').addEventListener('click', ()=>{
    try {
      for (const k in window.localStorage) {
        if (k && k.startsWith && k.startsWith('gh_pr_images_')) {
          try { localStorage.removeItem(k); } catch (e) {}
        }
      }
    } catch (e) {}
  });
  // Reset removed - no additional localStorage cleanup required here
} catch (e) {}

