import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(env => {
  const envars = loadEnv(env.mode, './');
  return {
    plugins: [vue()],
    server: {
      port: envars.VITE_PORT
    }
  }
})
