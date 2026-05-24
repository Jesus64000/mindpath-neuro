import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,   // Expone en la red local (WiFi) para probar en móvil
    port: 5173,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      manifest: {
        name: 'Mindpath Neuro',
        short_name: 'Mindpath',
        description: 'Plataforma integral de telemedicina y gestión clínica neurológica',
        theme_color: '#6366f1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'es',
        orientation: 'portrait-primary',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Aumentar límite a 10 MB para acomodar el bundle de ZegoCloud (videollamadas)
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // Cachear respuestas de la API (NetworkFirst: intenta red primero, cae a caché)
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 }
            }
          }
        ]
      }
    })
  ],

  build: {
    // Advertencia de chunk a partir de 1 MB (informativa, no bloquea)
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Code splitting: dividir el bundle en chunks más manejables
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Estado global
          'store': ['zustand'],
          // Gráficos
          'charts': ['recharts'],
          // Íconos
          'icons': ['lucide-react'],
          // PDF
          'pdf': ['@react-pdf/renderer'],
          // Google Auth
          'google-auth': ['@react-oauth/google'],
          // Video (el más grande — ZegoCloud queda en su propio chunk)
          'video': ['@zegocloud/zego-uikit-prebuilt'],
        }
      }
    }
  }
})
