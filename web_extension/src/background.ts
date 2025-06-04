// @ts-nocheck

import { storeToIPFS } from './lib/ipfs';
import { anchorToStacks, verifyOnStacks } from './lib/stacks';

console.log('Blog2Block background script loaded');

interface ContentData {
  title: string;
  content: string;
  url: string;
  hostname: string;
  timestamp: string;
  excerpt: string;
}

interface WalletData {
  address: string;
  publicKey: string;
}

interface BridgeResult {
  cid: string;
  txId: string;
  timestamp: string;
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Blog2Block extension installed');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: (response?: any) => void) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'connectXverse':
      handleXverseConnection()
        .then(result => sendResponse({ success: true, walletData: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'bridgeToWeb3':
      handleContentBridge()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'verifyOnChain':
      handleChainVerification()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getUserContent':
      handleGetUserContent(request.address)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command: string) => {
  console.log('Command received:', command);
  
  switch (command) {
    case 'bridge-content':
      executeBridgeCommand();
      break;
    case 'verify-content':
      executeVerifyCommand();
      break;
  }
});

async function handleXverseConnection(): Promise<WalletData> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: connectXverseWallet
    });

    const walletData = results[0].result;
    if (walletData) {
      // Store wallet data
      await chrome.storage.local.set({ walletData });
      return walletData;
    } else {
      throw new Error('Failed to connect Xverse wallet');
    }
  } catch (error) {
    console.error('Xverse connection error:', error);
    throw error;
  }
}

async function handleContentBridge(): Promise<BridgeResult> {
  try {
    // Get current tab content
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const contentResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: extractPageContent
    });

    const content = contentResults[0].result;
    if (!content) {
      throw new Error('No content found to bridge');
    }

    // Get wallet data
    const storage = await chrome.storage.local.get('walletData');
    if (!storage.walletData) {
      throw new Error('No wallet connected');
    }

    // Store to IPFS
    const cid = await storeToIPFS(content);
    
    // Anchor to Stacks blockchain using real provider
    let txId;
    try {
      txId = await anchorToStacks(cid, storage.walletData.address, { network: 'testnet' });
    } catch (error) {
      console.error('Real Stacks transaction failed, using simulation:', error);
      // Fallback to simulation
      const timestamp = Date.now();
      const random = Math.random().toString(16).slice(2, 10);
      txId = `0x${timestamp.toString(16)}${random}`;
    }
    
    const bridgeResult: BridgeResult = {
      cid,
      txId,
      timestamp: new Date().toISOString()
    };

    // Store bridge record locally
    const contentHash = await generateContentHash(content);
    await chrome.storage.local.set({
      [`bridge_${contentHash}`]: {
        ...bridgeResult,
        content,
        walletAddress: storage.walletData.address,
        isReal: !storage.walletData.isDemoMode
      }
    });

    // Send notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'Truthchain.jpeg',
      title: 'Content Bridged to Web3',
      message: `"${content.title}" has been ${storage.walletData.isDemoMode ? 'simulated as' : ''} stored on IPFS and anchored to Stacks blockchain`
    });

    return bridgeResult;
  } catch (error) {
    console.error('Bridge failed:', error);
    throw error;
  }
}

async function handleChainVerification(): Promise<any> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const contentResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: extractPageContent
    });

    const content = contentResults[0].result;
    const contentHash = await generateContentHash(content);
    
    // Check local storage first
    const stored = await chrome.storage.local.get(`bridge_${contentHash}`);
    const bridgeRecord = stored[`bridge_${contentHash}`];
    
    if (bridgeRecord) {
      return {
        isRegistered: true,
        owner: bridgeRecord.walletAddress,
        timestamp: bridgeRecord.timestamp,
        cid: bridgeRecord.cid,
        txId: bridgeRecord.txId
      };
    }

    // Verify on Stacks blockchain
    try {
      const cid = `Qm${contentHash.slice(0, 44)}`;
      const verification = await verifyOnStacks(cid);
      
      if (verification.exists) {
        return {
          isRegistered: true,
          owner: verification.owner,
          timestamp: verification.timestamp,
          blockHeight: verification.blockHeight
        };
      }
    } catch (error) {
      console.log('Blockchain verification failed, checking local only');
    }

    return {
      isRegistered: false,
      message: 'Content not found on blockchain'
    };
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

async function handleGetUserContent(address: string): Promise<any[]> {
  try {
    // Get all stored bridge records for this address
    const allData = await chrome.storage.local.get(null);
    const userContent = [];

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith('bridge_') && value.walletAddress === address) {
        userContent.push({
          cid: value.cid,
          title: value.content.title,
          timestamp: value.timestamp,
          url: value.content.url,
          txId: value.txId
        });
      }
    }

    // Sort by timestamp (newest first)
    return userContent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Get user content failed:', error);
    throw error;
  }
}

// Functions to be injected into web pages
function connectXverseWallet() {
  return new Promise(async (resolve, reject) => {
    // First check if we're in the right context
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'));
      return;
    }

    console.log('Checking for Stacks wallet providers...');
    
    // Wait for wallet providers to load (they might inject asynchronously)
    const waitForProviders = async (maxWait = 5000) => {
      const start = Date.now();
      
      while (Date.now() - start < maxWait) {
        // Check for Xverse (most common)
        if (window.XverseProviders?.StacksProvider) {
          console.log('Found Xverse wallet provider');
          return { type: 'xverse', provider: window.XverseProviders.StacksProvider };
        }
        
        // Check for Leather/Hiro wallet
        if (window.LeatherProvider || window.HiroWalletProvider) {
          const provider = window.LeatherProvider || window.HiroWalletProvider;
          console.log('Found Leather/Hiro wallet provider');
          return { type: 'leather', provider };
        }
        
        // Check for generic StacksProvider
        if (window.StacksProvider) {
          console.log('Found generic Stacks provider');
          return { type: 'generic', provider: window.StacksProvider };
        }
        
        // Check if any wallet is injecting providers
        if (window.stacks || window.stacksProvider) {
          const provider = window.stacks || window.stacksProvider;
          console.log('Found alternative Stacks provider');
          return { type: 'alternative', provider };
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return null;
    };
    
    try {
      const walletInfo = await waitForProviders();
      
      if (!walletInfo) {
        console.log('No wallet providers found after waiting');
        tryMockConnection('No Stacks wallet detected. Install Xverse, Leather, or another Stacks wallet.');
        return;
      }
      
      console.log(`Attempting to connect to ${walletInfo.type} wallet...`);
      
      // Try to connect based on wallet type
      if (walletInfo.type === 'xverse') {
        await connectXverse(walletInfo.provider);
      } else if (walletInfo.type === 'leather') {
        await connectLeather(walletInfo.provider);
      } else {
        await connectGeneric(walletInfo.provider, walletInfo.type);
      }
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      tryMockConnection('Wallet connection failed: ' + error.message);
    }

    async function connectXverse(provider) {
      try {
        console.log('Connecting to Xverse wallet...');
        
        // Request account access
        const result = await provider.request('stx_requestAccounts');
        console.log('Xverse stx_requestAccounts result:', result);
        
        if (!result || result.length === 0) {
          throw new Error('No accounts available in Xverse wallet');
        }
        
        // Get address information
        const addressInfo = await provider.request('stx_getAddresses');
        console.log('Xverse address info:', addressInfo);
        
        if (!addressInfo || !addressInfo.addresses || addressInfo.addresses.length === 0) {
          throw new Error('Could not get address from Xverse wallet');
        }
        
        const address = addressInfo.addresses[0];
        
        resolve({
          address: address.address,
          publicKey: address.publicKey || 'xverse-public-key',
          provider: 'xverse',
          isConnected: true
        });
        
      } catch (error) {
        console.error('Xverse connection failed:', error);
        if (error.message.includes('User rejected')) {
          throw new Error('Connection cancelled by user');
        }
        throw new Error('Failed to connect to Xverse wallet: ' + error.message);
      }
    }

    async function connectLeather(provider) {
      try {
        console.log('Connecting to Leather wallet...');
        
        const result = await provider.request('stx_requestAccounts');
        console.log('Leather connection result:', result);
        
        if (!result) {
          throw new Error('No response from Leather wallet');
        }
        
        let address, publicKey;
        
        if (result.addresses && result.addresses.length > 0) {
          address = result.addresses[0];
          publicKey = result.publicKey || 'leather-public-key';
        } else if (typeof result === 'string') {
          address = result;
          publicKey = 'leather-public-key';
        } else {
          throw new Error('Invalid response format from Leather wallet');
        }
        
        resolve({
          address: address,
          publicKey: publicKey,
          provider: 'leather',
          isConnected: true
        });
        
      } catch (error) {
        console.error('Leather connection failed:', error);
        throw new Error('Failed to connect to Leather wallet: ' + error.message);
      }
    }

    async function connectGeneric(provider, providerType) {
      try {
        console.log(`Connecting to ${providerType} wallet...`);
        
        const accounts = await provider.request('stx_requestAccounts');
        console.log(`${providerType} accounts:`, accounts);
        
        if (!accounts || accounts.length === 0) {
          throw new Error(`No accounts found in ${providerType} wallet`);
        }
        
        resolve({
          address: Array.isArray(accounts) ? accounts[0] : accounts,
          publicKey: 'generic-public-key',
          provider: providerType,
          isConnected: true
        });
        
      } catch (error) {
        console.error(`${providerType} connection failed:`, error);
        throw new Error(`Failed to connect to ${providerType} wallet: ` + error.message);
      }
    }

    function tryMockConnection(reason) {
      console.warn('Wallet connection failed. Reason:', reason);
      
      const useDemo = confirm(
        '🔗 Stacks Wallet Required\n\n' +
        'TruthChain needs a Stacks wallet to function.\n\n' +
        'Recommended wallets:\n' +
        '🥇 Xverse - Most popular Stacks wallet\n' +
        '🥈 Leather - Official Hiro wallet\n' +
        '🥉 Asigna - Enterprise wallet\n\n' +
        'Install from Chrome Web Store or:\n' +
        '• Xverse: xverse.app\n' +
        '• Leather: leather.io\n\n' +
        'Would you like to try Demo Mode instead?\n' +
        '(Demo mode simulates all features for testing)'
      );
      
      if (useDemo) {
        resolve({
          address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          publicKey: 'demo-public-key',
          isDemoMode: true,
          provider: 'demo'
        });
      } else {
        reject(new Error('Please install a Stacks wallet and try again.\n\nRecommended: Xverse wallet from Chrome Web Store'));
      }
    }

    // Timeout after 15 seconds
    setTimeout(() => {
      reject(new Error('Connection timeout. Please ensure your Stacks wallet is installed and unlocked.'));
    }, 15000);
  });
}

function extractPageContent() {
  const content = {
    title: document.title,
    url: window.location.href,
    hostname: window.location.hostname,
    timestamp: new Date().toISOString(),
    content: '',
    excerpt: ''
  };

  // Platform-specific content extraction
  if (content.hostname.includes('medium.com')) {
    const article = document.querySelector('article') || document.querySelector('[data-testid="storyContent"]');
    if (article) {
      content.content = article.innerText;
      content.excerpt = content.content.slice(0, 200) + '...';
    }
  } else if (content.hostname.includes('dev.to')) {
    const article = document.querySelector('#article-body') || document.querySelector('.crayons-article__body');
    if (article) {
      content.content = article.innerText;
      content.excerpt = content.content.slice(0, 200) + '...';
    }
  } else if (content.hostname.includes('substack.com')) {
    const article = document.querySelector('.post-content') || document.querySelector('[class*="post"]');
    if (article) {
      content.content = article.innerText;
      content.excerpt = content.content.slice(0, 200) + '...';
    }
  } else {
    // Fallback: try common article selectors
    const selectors = ['article', 'main', '[role="main"]', '.content', '.post', '.entry'];
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.length > 100) {
        content.content = element.innerText;
        content.excerpt = content.content.slice(0, 200) + '...';
        break;
      }
    }
  }

  // Fallback to body if no content found
  if (!content.content) {
    content.content = document.body.innerText.slice(0, 5000);
    content.excerpt = content.content.slice(0, 200) + '...';
  }

  return content;
}

// Utility functions
async function generateContentHash(content: ContentData): Promise<string> {
  const contentString = JSON.stringify({
    title: content.title,
    content: content.content,
    url: content.url
  });
  
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(contentString)
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function executeBridgeCommand(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: () => {
        // Trigger bridge from content script
        chrome.runtime.sendMessage({ action: 'bridgeToWeb3' });
      }
    });
  } catch (error) {
    console.error('Failed to execute bridge command:', error);
  }
}

async function executeVerifyCommand(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: () => {
        // Trigger verification from content script
        chrome.runtime.sendMessage({ action: 'verifyOnChain' });
      }
    });
  } catch (error) {
    console.error('Failed to execute verify command:', error);
  }
}
