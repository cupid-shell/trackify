import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Trackify Expense Tracker',
        short_name: 'Trackify',
        description: 'Personal finance tracking and AI prediction',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('recharts')) {
              return 'recharts';
            }
            if (id.includes('date-fns')) {
              return 'date-fns';
            }
            if (id.includes('@supabase')) {
              return 'supabase';
            }
          }
        }
      }
    }
  }
});
