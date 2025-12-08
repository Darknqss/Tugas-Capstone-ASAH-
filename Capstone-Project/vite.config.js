import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get BASE_URL from .env, default to production if not set
  // Format di .env: BASE_URL=https://backendsw.vercel.app/api
  const baseUrl = env.BASE_URL || 'https://backendsw.vercel.app/api'; 
  
  return {
    define: {
      // Expose BASE_URL from .env to frontend as VITE_BASE_URL
      'import.meta.env.VITE_BASE_URL': JSON.stringify(baseUrl),
    },
    server: {
      hmr: {
        clientPort: 5173,
      },
    },
  };
});

