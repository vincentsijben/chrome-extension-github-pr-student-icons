// options.js
(function(){
  const tokenEl = document.getElementById('token');
  const saveBtn = document.getElementById('save');
  const clearBtn = document.getElementById('clear-token');
  const clearCaches = document.getElementById('clear-caches');
  const refetchBtn = document.getElementById('refetch-images');
  const checkRateLimitBtn = document.getElementById('checkRateLimitBtn');
  const status = document.getElementById('status');
  const tokenStatus = document.getElementById('token-status');
  
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
  // Repository structure: /docs/images/ (GitHub Pages served from /docs)
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
  function setTokenStatus(msg, ok=true){ tokenStatus.textContent = msg; tokenStatus.style.color = ok? 'green':'red'; tokenStatus.style.fontWeight = '500'; setTimeout(()=>{ tokenStatus.textContent=''; }, 3500); }

  function setCount(elementId, value, isLoading = false, isError = false, title = '') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.textContent = value;
    el.className = 'count-value';
    if (isLoading) el.classList.add('loading');
    if (isError) el.classList.add('error');
    try { el.title = title || ''; } catch (e) {}
  }

  async function checkRateLimit(token) {
    if (!token) {
      // Load from storage if no token provided
      const stored = await new Promise(r => chrome.storage.local.get(['gh_pr_rate_limit'], res => r(res.gh_pr_rate_limit || null)));
      console.log('[gh-pr-icons][options] Loading cached rate limit:', stored);
      displayRateLimit(stored);
      return null;
    }
    
    try {
      console.log('[gh-pr-icons][options] Fetching rate limit from API via background script...');
      
      // Keep a visible indicator that we're working
      const remainingEl = document.getElementById('rateLimitRemaining');
      remainingEl.textContent = 'Loading...';
      
      // Use background script to avoid throttling
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ 
          action: 'checkRateLimit', 
          token: token 
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('[gh-pr-icons][options] Runtime error:', chrome.runtime.lastError);
          }
          resolve(response);
        });
      });
      
      if (!response || !response.ok) {
        throw new Error(response?.error || 'No response from background script');
      }
      
      const data = response.data;
      const retryAfter = response.retryAfter;
      
      console.log('[gh-pr-icons][options] Rate limit API response:', data);
      console.log('[gh-pr-icons][options] Retry-after:', retryAfter);
      
      // Store full response data
      const rateLimitData = {
        core: data.core,
        search: data.search,
        graphql: data.graphql,
        integration_manifest: data.integration_manifest,
        lastUpdated: Date.now(),
        secondaryLimit: retryAfter ? {
          retryAfter: retryAfter,
          hitAt: Date.now()
        } : null
      };
      
      console.log('[gh-pr-icons][options] Saving rate limit data:', rateLimitData);
      
      // Display FIRST (synchronously) before any async operations
      console.log('[gh-pr-icons][options] Calling displayRateLimit with fresh data');
      displayRateLimit(rateLimitData);
      
      // Then save to storage (async, doesn't block display)
      chrome.storage.local.set({ gh_pr_rate_limit: rateLimitData }, () => {
        console.log('[gh-pr-icons][options] Rate limit data saved to storage');
      });
      
      return rateLimitData;
    } catch (err) {
      console.error('[gh-pr-icons][options] Rate limit check failed:', err);
      displayRateLimit({ error: err.message });
      return null;
    }
  }
  
  function displayRateLimit(data) {
    console.log('[gh-pr-icons][options] displayRateLimit called with:', data);
    const remainingEl = document.getElementById('rateLimitRemaining');
    const limitEl = document.getElementById('rateLimitLimit');
    const lastUpdatedEl = document.getElementById('rateLimitLastUpdated');
    
    // Helper to update resource section
    const updateResource = (prefix, resource) => {
      if (!resource) {
        document.getElementById(`${prefix}Remaining`).textContent = '-';
        document.getElementById(`${prefix}Limit`).textContent = '-';
        document.getElementById(`${prefix}Used`).textContent = '-';
        document.getElementById(`${prefix}Reset`).textContent = '-';
        return;
      }
      document.getElementById(`${prefix}Remaining`).textContent = resource.remaining;
      document.getElementById(`${prefix}Limit`).textContent = resource.limit;
      document.getElementById(`${prefix}Used`).textContent = resource.used || (resource.limit - resource.remaining);
      const resetDate = new Date(resource.reset * 1000);
      document.getElementById(`${prefix}Reset`).textContent = resetDate.toLocaleString();
    };
    
    if (!data) {
      remainingEl.textContent = '-';
      limitEl.textContent = '-';
      lastUpdatedEl.textContent = 'Never';
      remainingEl.style.color = '';
      updateResource('rateLimitCore', null);
      updateResource('rateLimitSearch', null);
      updateResource('rateLimitGraphql', null);
      updateResource('rateLimitIntegration', null);
      return;
    }
    
    if (data.error) {
      remainingEl.textContent = 'Error';
      remainingEl.style.color = 'red';
      limitEl.textContent = '-';
      lastUpdatedEl.textContent = data.error;
      updateResource('rateLimitCore', null);
      updateResource('rateLimitSearch', null);
      updateResource('rateLimitGraphql', null);
      updateResource('rateLimitIntegration', null);
      return;
    }
    
    // For backward compatibility with old stored data format
    if (data.remaining !== undefined && data.limit !== undefined) {
      // Force reflow by reading offsetHeight before update
      void remainingEl.offsetHeight;
      remainingEl.textContent = String(data.remaining);
      void remainingEl.offsetHeight;
      
      void limitEl.offsetHeight;
      limitEl.textContent = String(data.limit);
      void limitEl.offsetHeight;
      
      const resource = { remaining: data.remaining, limit: data.limit, reset: data.reset };
      updateResource('rateLimitCore', resource);
      updateResource('rateLimitSearch', null);
      updateResource('rateLimitGraphql', null);
      updateResource('rateLimitIntegration', null);
    } else {
      // New format with all resources
      const core = data.core || {};
      
      console.log('[gh-pr-icons][options] About to update remaining from', remainingEl.textContent, 'to', core.remaining);
      
      // More aggressive DOM manipulation to force render
      const parent = remainingEl.parentElement;
      const nextSibling = remainingEl.nextSibling;
      
      // Remove and re-insert to force re-render
      parent.removeChild(remainingEl);
      remainingEl.textContent = String(core.remaining || '-');
      parent.insertBefore(remainingEl, nextSibling);
      
      // Also update limit
      const limitParent = limitEl.parentElement;
      const limitNext = limitEl.nextSibling;
      limitParent.removeChild(limitEl);
      limitEl.textContent = String(core.limit || '-');
      limitParent.insertBefore(limitEl, limitNext);
      
      console.log('[gh-pr-icons][options] After update, remaining is:', remainingEl.textContent);
      
      updateResource('rateLimitCore', data.core);
      updateResource('rateLimitSearch', data.search);
      updateResource('rateLimitGraphql', data.graphql);
      updateResource('rateLimitIntegration', data.integration_manifest);
    }
    
    if (data.lastUpdated) {
      const lastUpdatedDate = new Date(data.lastUpdated);
      lastUpdatedEl.textContent = lastUpdatedDate.toLocaleString();
    }
    
    // Color code based on remaining calls
    const remaining = parseInt(remainingEl.textContent) || 0;
    if (remaining < 10) {
      remainingEl.style.color = 'red';
    } else if (remaining < 100) {
      remainingEl.style.color = 'orange';
    } else {
      remainingEl.style.color = 'green';
    }
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
    // Check if token exists first
    if (!currentToken || currentToken.trim() === '') {
      setStatus('GitHub token required — see instructions below', false);
      // Show detailed instructions
      const instructionsHTML = `
        <div style="margin-top: 16px; padding: 16px; background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; color: #856404;">
          <h3 style="margin: 0 0 12px 0; font-size: 15px; font-weight: 600;">GitHub Token Required</h3>
          <p style="margin: 0 0 12px 0; font-size: 13px;">To fetch images from the GitHub repository (${API_INFO.owner}/${API_INFO.repo}), you need a Personal Access Token.</p>
          
          <details open style="margin-bottom: 16px;">
            <summary style="cursor: pointer; font-weight: 600; font-size: 14px; margin-bottom: 8px;">Option 1: Fine-grained Token (Recommended)</summary>
            <p style="margin: 8px 0; font-size: 13px;">More secure - only grants access to specific repositories.</p>
            <ol style="margin: 0 0 12px 0; padding-left: 20px; font-size: 13px;">
              <li>Go to <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" style="color: #0366d6;">github.com/settings/personal-access-tokens/new</a></li>
              <li>Give it a name (e.g., "Chrome Extension Images")</li>
              <li>Set expiration (e.g., 90 days or custom)</li>
              <li>Under "Repository access", select <strong>"Only select repositories"</strong></li>
              <li>Choose: <strong>${API_INFO.owner}/${API_INFO.repo}</strong></li>
              <li>Under "Repository permissions", find <strong>"Contents"</strong> and set to <strong>"Read-only"</strong></li>
              <li>Click "Generate token" at the bottom</li>
              <li>Copy the token and paste it above, then click "Save token"</li>
            </ol>
          </details>
          
          <details style="margin-bottom: 16px;">
            <summary style="cursor: pointer; font-weight: 600; font-size: 14px; margin-bottom: 8px;">Option 2: Classic Token</summary>
            <p style="margin: 8px 0; font-size: 13px;">Simpler but gives broader access to all your repositories.</p>
            <ol style="margin: 0 0 12px 0; padding-left: 20px; font-size: 13px;">
              <li>Go to <a href="https://github.com/settings/tokens/new" target="_blank" style="color: #0366d6;">github.com/settings/tokens/new</a></li>
              <li>Give it a name (e.g., "Chrome Extension Images")</li>
              <li>Set expiration (e.g., 90 days)</li>
              <li>Check the <strong>"repo"</strong> scope — this is <strong>required for private repositories</strong> (Full control of private repositories)</li>
              <li>Scroll down and click "Generate token"</li>
              <li>Copy the token and paste it above, then click "Save token"</li>
            </ol>
            <p style="margin: 8px 0 0 0; padding: 8px; background: rgba(215, 58, 73, 0.1); border-left: 3px solid #d73a49; font-size: 12px;">
              <strong>Note:</strong> Since ${API_INFO.owner}/${API_INFO.repo} is a <strong>private repository</strong>, you must select the full <strong>"repo"</strong> scope. Partial scopes like "public_repo" will not work.
            </p>
          </details>
          
          <p style="margin: 12px 0 0 0; padding: 12px; background: #e7f3ff; border-left: 3px solid #0366d6; font-size: 13px;">
            <strong>Important:</strong> The extension needs to access images in the <code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 3px;">images/</code> folder (or <code style="background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 3px;">docs/images/</code> if using GitHub Pages from docs folder) in the repository.
          </p>
          
          <p style="margin: 8px 0 0 0; font-size: 12px; font-style: italic; color: #666;">Note: If images stop loading later, your token may have expired - just generate a new one.</p>
        </div>
      `;
      
      // Insert or update instructions
      let instructionsDiv = document.getElementById('token-instructions');
      if (!instructionsDiv) {
        instructionsDiv = document.createElement('div');
        instructionsDiv.id = 'token-instructions';
        const tokenSection = document.querySelector('section');
        if (tokenSection) {
          tokenSection.insertAdjacentElement('afterend', instructionsDiv);
        }
      }
      instructionsDiv.innerHTML = instructionsHTML;
      
      // Scroll to instructions
      instructionsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    
    // Check rate limit before fetching
    await checkRateLimit(currentToken);
    
    refetchBtn.disabled = true;
    refetchBtn.textContent = 'Fetching...';
    
    // Remove instructions if they exist
    const instructionsDiv = document.getElementById('token-instructions');
    if (instructionsDiv) {
      instructionsDiv.remove();
    }
    
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

    // Update rate limit after fetching (don't await - let it run in background)
    checkRateLimit(currentToken).catch(err => console.error('[gh-pr-icons][options] Rate limit check failed:', err));
    
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
      setTokenStatus('✓ Token saved');
    });
  });

  clearBtn.addEventListener('click', ()=>{
    chrome.storage.local.remove(['githubToken'], ()=>{
      tokenEl.value=''; currentToken=''; setTokenStatus('Token cleared');
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
  
  checkRateLimitBtn.addEventListener('click', async () => {
    console.log('[gh-pr-icons][options] Check Now clicked, currentToken:', currentToken ? 'exists' : 'missing');
    if (!currentToken || currentToken.trim() === '') {
      displayRateLimit({ error: 'No token set - save a token first' });
      return;
    }
    
    // Disable button during check
    checkRateLimitBtn.disabled = true;
    checkRateLimitBtn.textContent = 'Checking...';
    
    await checkRateLimit(currentToken);
    
    // Re-enable button
    checkRateLimitBtn.disabled = false;
    checkRateLimitBtn.textContent = 'Check Now';
  });
  
  // Load cached rate limit on page load
  checkRateLimit(null);

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

