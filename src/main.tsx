import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA service worker safely with auto-update
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      try {
        registerSW({
          immediate: true,
          onNeedRefresh() {
            console.log('ShiftMate new version available');
          },
          onOfflineReady() {
            console.log('ShiftMate is ready for offline work');
          },
        });
      } catch (err) {
        console.warn('ServiceWorker registration error:', err);
      }
    })
    .catch((err) => {
      console.warn('PWA registration module load skipped:', err);
    });
}

createRoot(document.getElementById('root')!).render(<App />);
