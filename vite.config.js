import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Cela force React à ne pas chercher les fichiers de production bizarres
    'process.env.NODE_ENV': JSON.stringify('production')
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    }
  }
})