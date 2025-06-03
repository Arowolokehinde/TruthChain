// Main entry point for TruthChain Chrome Extension
// Exports all major components and utilities

// Background script functionality
export { default as backgroundScript } from './background.js';

// Utility functions that might be shared across components
export const extensionUtils = {
  // Content hash generation utility
  generateContentHash: async (contentData) => {
    try {
      const contentString = JSON.stringify({
        title: contentData.title,
        content: contentData.content,
        timestamp: contentData.timestamp,
        source: contentData.source
      });
      
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256', 
        new TextEncoder().encode(contentString)
      );
      
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (error) {
      console.error('Error generating hash:', error);
      throw new Error('Failed to generate content hash');
    }
  },

  // Storage utilities
  storage: {
    setWallet: async (walletAddress) => {
      return await chrome.storage.local.set({ connectedWallet: walletAddress });
    },
    
    getWallet: async () => {
      const result = await chrome.storage.local.get('connectedWallet');
      return result.connectedWallet;
    },
    
    clearWallet: async () => {
      return await chrome.storage.local.remove('connectedWallet');
    }
  },

  // Message passing utilities
  messaging: {
    sendToBackground: (action, data) => {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action, ...data }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    }
  }
};

// Extension configuration
export const extensionConfig = {
  name: 'TruthChain Content Verification',
  version: '1.0.0',
  contractDetails: {
    address: 'ST3S9E18YKY18RQBR6WVZQ816C19R3FB3K3M0K3XX.truth_chain',
    name: 'truth_chain',
    network: 'testnet'
  },
  supportedContentTypes: [
    'article',
    'image',
    'video',
    'document',
    'code'
  ]
};

// Main extension class
export class TruthChainExtension {
  constructor() {
    this.config = extensionConfig;
    this.utils = extensionUtils;
  }

  async initialize() {
    console.log('TruthChain Extension initialized');
    // Add any initialization logic here
  }

  async registerContent(contentData) {
    try {
      return await extensionUtils.messaging.sendToBackground('registerContent', {
        content: contentData
      });
    } catch (error) {
      console.error('Content registration failed:', error);
      throw error;
    }
  }
}

// Default export
export default TruthChainExtension;
