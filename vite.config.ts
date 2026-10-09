/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

// BASE_PATH lets you deploy under a sub-path (e.g. GitHub Pages: /Diyetbot/).
const base = process.env.BASE_PATH ?? '/'
// CAPACITOR=1 → build for the Android app (no service worker inside the WebView).
const native = process.env.CAPACITOR === '1'

export default defineConfig({
  base,
  plugins: [
    vue(),
    VitePWA({
      disable: native,
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Diyetbot – Beslenme & Antrenman',
        short_name: 'Diyetbot',
        description: 'Kişisel beslenme ve antrenman planlayıcı',
        lang: 'tr',
        theme_color: '#2f5d50',
        background_color: '#f6f3ea',
        display: 'standalone',
        orientation: 'portrait',
        start_url: base,
        scope: base,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
