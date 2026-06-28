import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Output to dist/ for Vercel
    outDir: 'dist',
    // Generate source maps for debugging
    sourcemap: false,
    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Split vendor chunks for better caching
        manualChunks: {
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
  server: {
    // Local dev port
    port: 5173,
    // Open browser on start
    open: true,
  },
  define: {
    // Make env vars available
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
})
