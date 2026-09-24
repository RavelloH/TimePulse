import { createRoot } from 'react-dom/client';
import App from './app/App';
import '../styles/globals.css';

const INSIGHTFLARE_SCRIPT_URL = 'https://insightflare.ravelloh.top/script.js';

function disableDevelopmentServiceWorker() {
  if (!import.meta.env.DEV || !('serviceWorker' in navigator)) return;

  const reloadGuard = `timepulse:dev-sw-unregistered:${window.location.origin}`;

  void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
    const sameOriginRegistrations = registrations.filter(
      (registration) => new URL(registration.scope).origin === window.location.origin,
    );

    await Promise.all(sameOriginRegistrations.map((registration) => registration.unregister()));

    if (!navigator.serviceWorker.controller) {
      window.sessionStorage.removeItem(reloadGuard);
      return;
    }

    if (window.sessionStorage.getItem(reloadGuard) === '1') return;

    window.sessionStorage.setItem(reloadGuard, '1');
    window.location.reload();
  }).catch((error: unknown) => {
    console.warn('Unable to disable the service worker in development:', error);
  });
}

function loadAnalyticsScript() {
  if (!import.meta.env.PROD || document.querySelector(`script[src="${INSIGHTFLARE_SCRIPT_URL}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.src = INSIGHTFLARE_SCRIPT_URL;
  script.async = true;
  document.head.appendChild(script);
}

disableDevelopmentServiceWorker();
loadAnalyticsScript();

const root = document.getElementById('root');

if (!root) {
  throw new Error('TimePulse root element was not found');
}

createRoot(root).render(<App />);
