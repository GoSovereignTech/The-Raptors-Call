// vite.config.js (at project root, NOT in src/)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Enable in dev mode so you can test in Codespaces
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: [
        'ssim.html', 
        'favicon.ico',
        'apple-touch-icon.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'android-chrome-192x192.png',
        'android-chrome-512x512.png',
      ],
      manifest: {
        name: 'The Raptors Call',
        short_name: 'The Raptors',
        description: 'Tactical spatial mapping dashboard for decentralized LoRa mesh networks',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#f26928',
        background_color: '#182b66',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,ico,jpg,mp3}'],
        runtimeCaching: [
        {
          urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'openstreetmap-tiles',
            expiration: {
              maxEntries: 5000,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5MB for the MP3
      },
    }),
  ],
});