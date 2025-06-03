// @ts-nocheck
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background.ts'),
        'content-script': resolve(__dirname, 'src/content-script.ts'),
        ipfs: resolve(__dirname, 'src/lib/ipfs.ts'),
        stacks: resolve(__dirname, 'src/lib/stacks.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background' || chunkInfo.name === 'content-script') {
            return '[name].js'
          }
          if (chunkInfo.name === 'ipfs' || chunkInfo.name === 'stacks') {
            return 'lib/[name].js'
          }
          return 'assets/[name]-[hash].js'
        }
      }
    },
    copyPublicDir: true
  },
  publicDir: 'public'
})
