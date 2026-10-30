import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const basePath = process.env.VITE_BASE || '/';
  const normalizePath = (file: string) => {
    if (basePath === '/') return `/${file}`;
    return `${basePath.endsWith('/') ? basePath : basePath + '/'}${file}`;
  };

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.png',
          'apple-touch-icon.png',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
        ],
        manifest: {
          id: basePath,
          name: 'ShiftMate - 시프트메이트',
          short_name: 'ShiftMate',
          description: '스마트한 근무 스케줄 관리 및 주휴수당·실수령액 자동 정산 앱',
          theme_color: '#004ac6',
          background_color: '#faf8ff',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: basePath,
          scope: basePath,
          icons: [
            {
              src: normalizePath('pwa-192x192.png'),
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: normalizePath('pwa-512x512.png'),
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: normalizePath('pwa-maskable-512x512.png'),
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
            {
              src: normalizePath('icon.svg'),
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
