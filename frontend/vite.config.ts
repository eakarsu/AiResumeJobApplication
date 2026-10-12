import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

const frontendPort = Number(process.env.VITE_FRONT_PORT || 3000);
const backendPort = Number(process.env.VITE_BACKEND_PORT || 5001);

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, resolve(__dirname, '..'), '');
  const allowDemo = mode !== 'production' && rootEnv.ENABLE_DEMO_CREDENTIAL_AUTOFILL === 'true';
  const demoEmail = allowDemo ? rootEnv.DEMO_EMAIL || '' : '';
  const demoPassword = allowDemo && demoEmail ? rootEnv.DEMO_PASSWORD || '' : '';
  return {
  plugins: [react()],
  define: {
    'import.meta.env.VITE_DEMO_EMAIL': JSON.stringify(demoPassword ? demoEmail : ''),
    'import.meta.env.VITE_DEMO_PASSWORD': JSON.stringify(demoPassword),
  },
  server: {
    host: process.env.FRONTEND_HOST || '127.0.0.1',
    port: frontendPort,
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${backendPort}`,
        changeOrigin: true
      }
    }
  }
  };
});
