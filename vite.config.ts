// vite.config.js

// 📦 Essential Imports
import { defineConfig } from 'vite'; // The main configuration helper from Vite
import react from '@vitejs/plugin-react'; // The official plugin to handle React projects (including Fast Refresh)
import path from 'path'; // Node.js utility for handling file paths (used for aliases)

/**
 * 🛠️ Vite Configuration Setup
 * This function tells Vite exactly how to build, run, and optimize your React application.
 * You can find the full documentation at: https://vitejs.dev/config/
 */
export default defineConfig({
  // --- 🧩 Plugins Section ---
  // Plugins extend Vite's core functionality.
  plugins: [
    // Enable the React plugin: This allows Vite to process JSX and provides 
    // essential features like Hot Module Replacement (HMR) for instant updates.
    react(),
  ],

  // --- 🔗 Resolution/Alias Section ---
  resolve: {
    // Aliases create shortcuts for module imports.
    alias: {
      // @: This is the most common alias. It maps '@' to the 'src' directory.
      // Instead of writing: import { Button } from '../../components/ui/button';
      // You can now write: import { Button } from '@/components/ui/button';
      '@': path.resolve(__dirname, './src'),
    },
  },

  // --- 🖥️ Development Server Section (When you run 'npm run dev') ---
  server: {
    // Set the development server to run on port 3000 (common standard for React)
    port: 3000,
    // Since this section is commented out in your original code:
    // We explicitly state that NO proxy is being used. 
    // The frontend connects to the backend API directly via its full address (e.g., http://localhost:5000).
    // Localhost backend is used directly - no proxy needed
  },

  // --- 🏗️ Build Section (When you run 'npm run build') ---
  // These settings are crucial for optimizing the final, production-ready output.
  build: {
    // 📦 Rollup Options: Advanced configuration for Rollup, the underlying module bundler.
    rollupOptions: {
      output: {
        // Manual Chunks: This is **optimization** for your production bundle size!
        // We manually tell Rollup to group specific, large dependencies into their own files (chunks).
        // This is important because it improves caching. If you only change your application code, 
        // the user's browser doesn't have to re-download the large vendor files (like React or Recharts).
        manualChunks: {
          // 'react-vendor': Core application libraries (React and its router)
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // 'ui-vendor': Grouping the heavy components from your UI library (Radix UI/shadcn/ui)
          'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-label', '@radix-ui/react-slot'],
          // 'chart-vendor': Grouping external data visualization libraries
          'chart-vendor': ['recharts'],
        },
      },
    },
    // Chunk Size Warning Limit: 
    // By default, Vite warns you if a single file is > 500kB. We increase this limit to 1000kB (1MB)
    // because modern apps often have larger vendor bundles, and we don't want false warnings.
    chunkSizeWarningLimit: 1000,
    
    // Minification: Compression setting for the final JavaScript code.
    // 'esbuild' is significantly faster than the default 'terser' minifier,
    // which speeds up your overall production build time.
    minify: 'esbuild',
  },
});
