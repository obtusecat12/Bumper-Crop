// This entrypoint remains independent of the 3D module graph so import errors
// produce an actionable message instead of an empty background.
(() => {
  let failed = false;
  function showFailure(error) {
    if (failed) return;
    failed = true;
    document.documentElement.dataset.bootState = 'failed';
    const panel = document.createElement('section');
    panel.className = 'fatal';
    panel.setAttribute('role', 'alert');
    const title = document.createElement('h1');
    title.textContent = error?.userTitle || '麦田未能启动';
    const message = document.createElement('p');
    message.textContent = error?.userMessage || '游戏加载时出现错误，请重新加载。';
    const retry = document.createElement('button');
    retry.textContent = '重新加载';
    retry.addEventListener('click', () => location.reload());
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = '错误详情';
    const detail = document.createElement('p');
    detail.textContent = error?.message || String(error || '加载超时');
    details.append(summary, detail);
    panel.append(title, message, retry, details);
    document.querySelector('#game').append(panel);
  }
  window.addEventListener('error', event => {
    if (event.filename && event.filename.startsWith(location.origin + '/') && event.error) {
      showFailure(event.error);
    }
  });
  // V99: transient network errors on any of the hundreds of startup requests
  // used to abort the whole boot. Retry idempotent GETs with backoff first.
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const method = (init && init.method) || (input && input.method) || 'GET';
    if (method !== 'GET') return nativeFetch(input, init);
    for (let attempt = 0; ; attempt++) {
      try {
        const response = await nativeFetch(input, init);
        if (response.status < 500 || attempt >= 3) return response;
      } catch (error) {
        if (attempt >= 3 || (init && init.signal && init.signal.aborted)) throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 600 * 2 ** attempt));
    }
  };
  // The watchdog only fires after a long stretch with no download progress,
  // so a slow connection keeps loading instead of failing at a fixed 30 s.
  let lastProgress = performance.now();
  const bump = () => { lastProgress = performance.now(); };
  try { new PerformanceObserver(bump).observe({ type: 'resource', buffered: false }); } catch {}
  performance.setResourceTimingBufferSize && performance.setResourceTimingBufferSize(4000);
  const watcher = new MutationObserver(bump);
  watcher.observe(document.documentElement, { attributes: true, subtree: true, childList: true, characterData: true });
  const timeout = setInterval(() => {
    const state = document.documentElement.dataset.bootState;
    if (state === 'ready' || state === 'failed') { clearInterval(timeout); watcher.disconnect(); return; }
    if (performance.now() - lastProgress > 60000) {
      clearInterval(timeout);
      showFailure(new Error('游戏加载超时。请检查网络连接后重试。'));
    }
  }, 2000);
  import('./main.js?v=ui-v102').then(() => { clearInterval(timeout); watcher.disconnect(); }).catch(error => {
    clearInterval(timeout);
    console.error('Game startup failed', error);
    showFailure(error);
  });
})();
