import { defineConfig } from 'vite';
import webExtension from '@samrum/vite-plugin-web-extension';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Create placeholder icons if they don't exist
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, 'src/assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Ensure icon files exist
const iconSizes = [16, 48, 128];
iconSizes.forEach(size => {
  const iconPath = path.resolve(assetsDir, `icon${size}.png`);
  if (!fs.existsSync(iconPath)) {
    // If you have placeholder code to generate icons, use it here
    console.warn(`Warning: Icon file ${iconPath} missing. Extension will not load properly.`);
  }
});

export default defineConfig({
  plugins: [
    webExtension({
      manifest: {
        manifest_version: 3,
        name: 'Truth Chain',
        version: '1.0.0',
        description: 'Register content provenance on the Stacks blockchain',
        action: {
          default_popup: 'src/popup.html',
          default_icon: {
            // Update paths to point to the correct location after build
            '16': 'src/assets/icon16.png',
            '48': 'src/assets/icon48.png',
            '128': 'src/assets/icon128.png'
          }
        },
        // Rest of your manifest configuration
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
  build: {
    rollupOptions: {
      input: {
        popup: path.resolve(__dirname, 'src/popup.html'),
        background: path.resolve(__dirname, 'src/background.js'),
        content: path.resolve(__dirname, 'src/content.js')
      }
    }
  }
});