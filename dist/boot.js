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
  const timeout = setTimeout(() => {
    if (document.documentElement.dataset.bootState !== 'ready') {
      showFailure(new Error('游戏加载超时。请检查网络连接后重试。'));
    }
  }, 30000);
  import('./main.js?v=48').then(() => clearTimeout(timeout)).catch(error => {
    clearTimeout(timeout);
    console.error('Game startup failed', error);
    showFailure(error);
  });
})();
