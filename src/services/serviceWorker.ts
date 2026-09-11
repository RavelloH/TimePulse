export function registerTimePulseServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.error('ServiceWorker 注册失败:', error);
    });
  });
}

export function requestCacheUpdate(): boolean {
  if (!navigator.serviceWorker?.controller) return false;
  navigator.serviceWorker.controller.postMessage({ action: 'updateCache' });
  return true;
}
