import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import commonjs from 'vite-plugin-commonjs';

// The API (src/StateBallot.Api) listens on 5080. Proxying keeps the browser on one origin.
// state-roster-pipeline's docker-compose.yml sets API_URL to the api service.
const api = { '/api': process.env.API_URL ?? 'http://localhost:5080' };

export default defineConfig({
  // src/js/common is shared with WebApp, which builds with webpack. Some of its files (logging.js) use require().
  plugins: [react(), commonjs()],
  server: { port: 5173, proxy: api },
  preview: { proxy: api },
});
