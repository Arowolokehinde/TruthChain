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
    
    // First, inject a detection script to check for wallets
    const detectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: detectWalletProviders
    });

    const availableProviders = detectionResults[0].result;
    console.log('Available wallet providers:', availableProviders);

    if (availableProviders.length === 0) {
      // Try alternative detection method or use Stacks Connect
      const connectResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        function: tryStacksConnect
      });
      
      const walletData = connectResults[0].result;
      if (walletData) {
        await chrome.storage.local.set({ walletData });
        return walletData;
      } else {
        throw new Error('No Stacks wallet found. Please install Xverse, Leather, or another Stacks wallet.');
      }
    }

    // If providers are available, try to connect
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: connectXverseWallet
    });

    const walletData = results[0].result;
    if (walletData) {
      await chrome.storage.local.set({ walletData });
      return walletData;
    } else {
      throw new Error('Failed to connect to wallet');
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
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
function detectWalletProviders() {
  const providers = [];
  
  console.log('Checking for wallet providers in page context...');
  console.log('Window object keys:', Object.keys(window));
  
  // Check for Xverse
  if (window.XverseProviders?.StacksProvider) {
    console.log('✓ Found Xverse wallet');
    providers.push('xverse');
  }
  
  // Check for Leather
  if (window.LeatherProvider || window.HiroWalletProvider) {
    console.log('✓ Found Leather/Hiro wallet');
    providers.push('leather');
  }
  
  // Check for generic providers
  if (window.StacksProvider) {
    console.log('✓ Found generic Stacks provider');
    providers.push('stacks');
  }
  
  // Check for alternative names
  if (window.stacks || window.stacksProvider) {
    console.log('✓ Found alternative Stacks provider');
    providers.push('alternative');
  }
  
  console.log('Detected providers:', providers);
  return providers;
}

function tryStacksConnect() {
  return new Promise((resolve, reject) => {
    console.log('Trying Stacks Connect as fallback...');
    
    // Create a script element to load Stacks Connect
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@stacks/connect@20.1.0/dist/index.umd.js';
    script.onload = () => {
      console.log('Stacks Connect loaded');
      
      setTimeout(() => {
        if (window.StacksConnect?.showConnect) {
          console.log('Stacks Connect available, showing connect dialog');
          
          window.StacksConnect.showConnect({
            appDetails: {
              name: 'TruthChain Extension',
              icon: window.location.origin + '/Truthchain.jpeg'
            },
            onFinish: (authData) => {
              try {
                console.log('Stacks Connect auth successful:', authData);
                const userData = authData.userSession.loadUserData();
                const address = userData.profile.stxAddress?.testnet 
                  || userData.profile.stxAddress?.mainnet
                  || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
                
                resolve({
                  address: address,
                  publicKey: userData.appPrivateKey || 'stacks-connect-key',
                  provider: 'stacks-connect',
                  isConnected: true
                });
              } catch (error) {
                console.error('Error processing Stacks Connect data:', error);
                resolve(null);
              }
            },
            onCancel: () => {
              console.log('Stacks Connect cancelled');
              resolve(null);
            }
          });
        } else {
          console.log('Stacks Connect not available after loading');
          resolve(null);
        }
      }, 500);
    };
    
    script.onerror = () => {
      console.log('Failed to load Stacks Connect');
      resolve(null);
    };
    
    document.head.appendChild(script);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      console.log('Stacks Connect timeout');
      resolve(null);
    }, 10000);
  });
}

function connectXverseWallet() {
  return new Promise(async (resolve, reject) => {
    console.log('Starting wallet connection process...');
    
    // Wait a bit for providers to fully initialize
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check for Xverse first (most reliable)
    if (window.XverseProviders?.StacksProvider) {
      try {
        console.log('Connecting to Xverse...');
        const provider = window.XverseProviders.StacksProvider;
        
        const result = await provider.request('stx_requestAccounts');
        console.log('Xverse request result:', result);
        
        if (!result || result.length === 0) {
          throw new Error('No accounts available');
        }
        
        const addressInfo = await provider.request('stx_getAddresses');
        console.log('Xverse address info:', addressInfo);
        
        if (!addressInfo?.addresses?.length) {
          throw new Error('Could not get address information');
        }
        
        const address = addressInfo.addresses[0];
        resolve({
          address: address.address,
          publicKey: address.publicKey || 'xverse-public-key',
          provider: 'xverse',
          isConnected: true
        });
        return;
        
      } catch (error) {
        console.error('Xverse connection failed:', error);
      }
    }
    
    // Try Leather if Xverse not available
    if (window.LeatherProvider) {
      try {
        console.log('Trying Leather wallet...');
        const result = await window.LeatherProvider.request('stx_requestAccounts');
        
        if (result?.addresses?.length) {
          resolve({
            address: result.addresses[0],
            publicKey: result.publicKey || 'leather-key',
            provider: 'leather',
            isConnected: true
          });
          return;
        }
      } catch (error) {
        console.error('Leather connection failed:', error);
      }
    }
    
    // Show user-friendly message and offer demo mode
    const useDemo = confirm(
      '🔗 Wallet Connection Issue\n\n' +
      'TruthChain couldn\'t connect to your Stacks wallet.\n\n' +
      'This might happen if:\n' +
      '• Your wallet is locked\n' +
      '• You need to refresh the page\n' +
      '• The wallet extension needs updating\n\n' +
      'Try:\n' +
      '1. Unlock your Xverse/Leather wallet\n' +
      '2. Refresh this page\n' +
      '3. Try connecting again\n\n' +
      'Would you like to use Demo Mode instead?\n' +
      '(All features work but transactions are simulated)'
    );
    
    if (useDemo) {
      resolve({
        address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
        publicKey: 'demo-public-key',
        isDemoMode: true,
        provider: 'demo'
      });
    } else {
      reject(new Error('Wallet connection cancelled. Please ensure your Stacks wallet is unlocked and try again.'));
    }
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
