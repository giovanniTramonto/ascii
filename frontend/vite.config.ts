import { URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig((env : any) => {
  const envars = loadEnv(env.mode, './');
  const serverURL = new URL(envars.VITE_SERVER_URL);
  const serverAPIPath = envars.VITE_SERVER_API_PATH;
  const wssPath = envars.VITE_WSS_PATH;
  return {
    plugins: [vue()],
    envDir: './',
    define: {
      __API_PATH__: JSON.stringify(serverAPIPath),
      __WSS_PATH__: JSON.stringify(wssPath)
    },
    server: {
      port: envars.VITE_PORT,
      proxy: {
        // <http://localhost:3001/api> -> <http://localhost:3000/api>
        [serverAPIPath]: serverURL.origin,
      },
    }
  }
})
