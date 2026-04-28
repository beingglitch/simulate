import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import cesium from 'vite-plugin-cesium'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss(), cesium()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
