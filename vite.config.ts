import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' sayesinde build çıktısı herhangi bir alt dizinden (ör. intranet/buzkiran/) servis edilebilir.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173 },
})
