import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // loadEnv also picks up variables already present in the process environment,
  // so the Docker build args (ENV VITE_BASE_PATH=/) work as well.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    // GitHub Pages serves the app from /student-marketplace/.
    // A normal server (Nginx in deploy/) serves it from the domain root: VITE_BASE_PATH=/
    base: env.VITE_BASE_PATH || '/student-marketplace/',
  };
});
