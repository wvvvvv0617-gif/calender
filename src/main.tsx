import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Register PWA service worker safely with aggressive auto-update on mobile PWA launch/resume
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const hadController = !!navigator.serviceWorker.controller;
  let isReloadingForUpdate = false;

  // Automatically reload once when a newly deployed service worker replaces an older one
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || isReloadingForUpdate) return;
    isReloadingForUpdate = true;
    window.location.reload();
  });

  import('virtual:pwa-register')
    .then(({ registerSW }) => {
      try {
        const updateSW = registerSW({
          immediate: true,
          onRegisteredSW(_swUrl, registration) {
            if (!registration) return;
            const checkForUpdate = () => {
              if (navigator.onLine === false) return;
              registration.update().catch(() => {
                // ignore offline or transient network errors
              });
            };

            // Check immediately on startup, when returning to foreground, on BFCache restore, or when back online
            checkForUpdate();
            document.addEventListener('visibilitychange', () => {
              if (document.visibilityState === 'visible') {
                checkForUpdate();
              }
            });
            window.addEventListener('pageshow', checkForUpdate);
            window.addEventListener('online', checkForUpdate);
            window.setInterval(checkForUpdate, 5 * 60 * 1000);
          },
          onNeedRefresh() {
            // Apply newly downloaded version right away
            updateSW(true);
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
