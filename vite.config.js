import { defineConfig } from 'vite'

export default defineConfig({
  define: {
    global: 'globalThis'
  },
  resolve: {
    alias: {
      // Help Vite resolve ArcGIS modules properly
      '@arcgis/core': '@arcgis/core'
    }
  },
  assetsInclude: ['**/*.wasm'],
  optimizeDeps: {
    // Don't pre-bundle ArcGIS - let it load dynamically
    exclude: ['@arcgis/core'],
    include: [
      '@esri/calcite-components',
      '@supabase/supabase-js'
    ]
  },
  build: {
    target: 'es2020',
    minify: 'terser',
    rollupOptions: {
      external: [
        // Keep ArcGIS external to avoid bundling issues
        /^@arcgis\/core\/.*/
      ],
      output: {
        manualChunks: {
          'calcite': ['@esri/calcite-components'],
          'supabase': ['@supabase/supabase-js']
        }
      }
    },
    sourcemap: process.env.NODE_ENV !== 'production',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true
      }
    }
  },
  server: {
    fs: {
      allow: ['..']
    },
    port: 5173,
    host: true
  }
})