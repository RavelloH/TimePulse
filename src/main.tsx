import { createRoot } from 'react-dom/client';
import App from './app/App';
import '../styles/globals.css';

const INSIGHTFLARE_SCRIPT_URL = 'https://insightflare.ravelloh.top/script.js';

function loadAnalyticsScript() {
  if (!import.meta.env.PROD || document.querySelector(`script[src="${INSIGHTFLARE_SCRIPT_URL}"]`)) {
    return;
  }

  const script = document.createElement('script');
  script.src = INSIGHTFLARE_SCRIPT_URL;
  script.async = true;
  document.head.appendChild(script);
}

loadAnalyticsScript();

const root = document.getElementById('root');

if (!root) {
  throw new Error('TimePulse root element was not found');
}

createRoot(root).render(<App />);
