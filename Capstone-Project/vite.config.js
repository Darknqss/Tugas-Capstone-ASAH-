import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Get BASE_URL from .env, default to production if not set
  // Format di .env: BASE_URL=https://capsdc-09.vercel.app/
  // (tanpa /api di akhir, akan ditambahkan otomatis di api.js)
  const baseUrl = env.BASE_URL || 'https://capsdc-09.vercel.app/';

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

