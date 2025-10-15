import { defineConfig } from 'vite';

export default defineConfig({
    // Base public path when served in production
    base: './',

    // Development server configuration
    server: {
        port: 3000,
        open: true,
        cors: true,
        host: true
    },

    // Preview server configuration
    preview: {
        port: 8080,
        open: true
    },

    // Build configuration
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        // Generate source maps for production debugging
        sourcemap: true,
        // Minify the output
        minify: 'terser',
        terserOptions: {
            compress: {
                drop_console: false, // Keep console logs for debugging
                drop_debugger: true
            }
        },
        // Chunk size warnings
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            external: [
                // External dependencies that are loaded via CDN
                'mapbox-gl',
                '@supabase/supabase-js'
            ],
            output: {
                // Manual chunk splitting for better caching
                manualChunks: {}
            }
        }
    },

    // Optimize dependencies
    optimizeDeps: {
        include: []
    }
});

