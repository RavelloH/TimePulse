import { createRoot } from 'react-dom/client';
import App from './app/App';
import '../styles/globals.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('TimePulse root element was not found');
}

createRoot(root).render(<App />);
