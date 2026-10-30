import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  // Resolve base path supporting VITE_BASE_PATH (GitHub Actions deploy.yml),
  // VITE_BASE, GITHUB_REPOSITORY (e.g. username/calender -> /calender/), or default '/calender/' on build
  const getBasePath = () => {
    let raw = process.env.VITE_BASE_PATH || process.env.VITE_BASE || process.env.BASE_URL;
    if (!raw && process.env.GITHUB_REPOSITORY) {
      const parts = process.env.GITHUB_REPOSITORY.split('/');
      const repo = parts[1];
      if (repo && !repo.endsWith('.github.io')) {
        raw = `/${repo}/`;
      }
    }
    // Default to /calender/ on build so manual local builds and GitHub Pages work out of the box
    if (!raw && command === 'build') {
      raw = '/calender/';
    }
    if (!raw) return '/';
    let formatted = raw.trim();
    if (!formatted.startsWith('/')) formatted = '/' + formatted;
    if (!formatted.endsWith('/')) formatted = formatted + '/';
    return formatted;
  };

  const basePath = getBasePath();
  const normalizePath = (file: string) => {
    const cleanFile = file.replace(/^\//, '');
    if (basePath === '/') return `/${cleanFile}`;
    return `${basePath}${cleanFile}`;
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
