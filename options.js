// options.js
(function(){
  const tokenEl = document.getElementById('token');
  const saveBtn = document.getElementById('save');
  const clearBtn = document.getElementById('clear-token');
  const clearCaches = document.getElementById('clear-caches');
  const status = document.getElementById('status');

  function setStatus(msg, ok=true){ status.textContent = msg; status.style.color = ok? 'green':'red'; setTimeout(()=>{ status.textContent=''; }, 3500); }

  // load existing
  chrome.storage.local.get(['githubToken'], (res)=>{
    if(res && res.githubToken) tokenEl.value = res.githubToken;
  });

  saveBtn.addEventListener('click', ()=>{
    const token = tokenEl.value.trim();
    chrome.storage.local.set({ githubToken: token }, ()=>{
      setStatus('Token saved');
    });
  });

  clearBtn.addEventListener('click', ()=>{
    chrome.storage.local.remove(['githubToken'], ()=>{
      tokenEl.value=''; setStatus('Token cleared');
    });
  });

  clearCaches.addEventListener('click', ()=>{
    // remove keys starting with gh_pr_images_
    chrome.storage.local.get(null, (items)=>{
      const keys = Object.keys(items || {}).filter(k => k && k.startsWith && k.startsWith('gh_pr_images_'));
      if(keys.length===0){ setStatus('No caches found'); return; }
      chrome.storage.local.remove(keys, ()=>{ setStatus('Cleared ' + keys.length + ' caches'); });
    });
  });

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
