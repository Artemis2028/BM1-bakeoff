(() => {
  if (!('serviceWorker' in navigator)) return;
  if (window.location.protocol === 'file:' || window.location.protocol === 'chrome-extension:') return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type !== 'BM2_OFFLINE_READY') return;
    localStorage.setItem('bm2OfflineReady', JSON.stringify({
      ready: true,
      assets: event.data.assets || 0,
      cachedAt: new Date().toISOString()
    }));
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((registration) => {
        registration.active?.postMessage({ type: 'BM2_CACHE_OFFLINE' });
      })
      .catch(() => {});
  });
})();
