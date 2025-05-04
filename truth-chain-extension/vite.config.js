import { defineConfig } from 'vite';
import webExtension from '@samrum/vite-plugin-web-extension';
import path from 'path';

export default defineConfig({
  plugins: [
    webExtension({
      manifest: {
        manifest_version: 3,
        name: 'Truth-Chainr',
        version: '1.0.0',
        description: 'Truth-Chain: Register content provenance on the Stacks blockchain',
        action: {
          default_popup: 'popup.html',
          default_icon: {
            '16': 'assets/icon16.png',
            '48': 'assets/icon48.png',
            '128': 'assets/icon128.png'
          }
        },
        permissions: ['activeTab', 'storage'],
        host_permissions: [
          "https://*.medium.com/*",
          "https://*.quora.com/*"
        ],
        background: {
          service_worker: 'src/background.js',
          type: 'module'
        },
        content_scripts: [
          {
            matches: [
              "https://*.medium.com/*",
              "https://*.quora.com/*"
            ],
            js: ['src/content.js']
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});