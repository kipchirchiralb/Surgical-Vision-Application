import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// WebContainer-compatible configuration
// Disables service workers and configures proper proxying
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Required for WebContainer
    port: 5174, // Updated to match the port the browser is accessing
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Updated to match new backend port
        changeOrigin: true,
        secure: false
      }
    }
  },
  preview: {
    host: '0.0.0.0', // Required for WebContainer preview
    port: 4173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001', // Updated to match new backend port
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    sourcemap: true, // For debugging
    rollupOptions: {
      output: {
        // Prevent service worker generation
        manualChunks: undefined
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  },
  // Disable service worker registration
  define: {
    'import.meta.env.SW_ENABLED': false
  }
});