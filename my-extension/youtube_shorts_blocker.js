function isShortsUrl() {
    // /shorts or /shorts/<id>
    return location.pathname === "/shorts" || location.pathname.startsWith("/shorts/");
  }
  
  function goBlocked() {
    // Redirect inside the tab to your extension page
    const blockedUrl = chrome.runtime.getURL("blocked.html");
    if (location.href !== blockedUrl) {
      location.replace(blockedUrl);
    }
  }
  
  function check() {
    if (isShortsUrl()) goBlocked();
  }
  
  // Hook SPA navigation
  (function hookHistory() {
    const _pushState = history.pushState;
    const _replaceState = history.replaceState;
  
    history.pushState = function (...args) {
      _pushState.apply(this, args);
      queueMicrotask(check);
    };
  
    history.replaceState = function (...args) {
      _replaceState.apply(this, args);
      queueMicrotask(check);
    };
  
    window.addEventListener("popstate", () => queueMicrotask(check));
  })();
  
  // Also watch for other route changes / delays
  const obs = new MutationObserver(() => check());
  obs.observe(document.documentElement, { childList: true, subtree: true });
  
  // Initial check
  check();
  