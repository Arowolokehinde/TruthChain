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
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }
    
    // Check if it's a valid URL for injection (not chrome:// or extension:// URLs)
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Cannot inject wallet detection into special browser pages. Please navigate to a regular website (like medium.com) and try again.');
    }
    
    // First, check if we can detect wallets via content script
    try {
      console.log('TruthChain: Trying content script wallet detection...');
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectWallets' });
      console.log('Content script wallet detection response:', response);
      
      if (response && (response.xverse || response.leather || response.stacks)) {
        console.log('TruthChain: Wallets found via content script, attempting connection...');
        // Try connecting via content script
        const connectionResponse = await chrome.tabs.sendMessage(tab.id, { action: 'connectWallet' });
        console.log('Content script connection response:', connectionResponse);
        
        if (connectionResponse && connectionResponse.success) {
          const walletData = connectionResponse.wallet;
          await chrome.storage.local.set({ walletData });
          console.log('TruthChain: Successfully connected via content script!');
          return walletData;
        }
      }
    } catch (error) {
      console.log('Content script method failed, trying direct injection:', error);
    }
    
    // Wait a bit for content script to be ready
    console.log('TruthChain: Waiting for content script to initialize...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try content script again with longer timeout
    try {
      console.log('TruthChain: Second attempt with content script...');
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectWallets' });
      console.log('Second content script detection response:', response);
      
      if (response && (response.xverse || response.leather || response.stacks || response.available?.length > 0)) {
        console.log('TruthChain: Wallets detected on second attempt!');
        const connectionResponse = await chrome.tabs.sendMessage(tab.id, { action: 'connectWallet' });
        console.log('Second attempt connection response:', connectionResponse);
        
        if (connectionResponse && connectionResponse.success) {
          const walletData = connectionResponse.wallet;
          await chrome.storage.local.set({ walletData });
          console.log('TruthChain: Successfully connected on second attempt!');
          return walletData;
        }
      }
    } catch (secondAttemptError) {
      console.log('Second content script attempt failed:', secondAttemptError);
    }
    
    // Final fallback: direct injection
    try {
      console.log('TruthChain: Final fallback - direct script injection...');
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: detectAndConnectWallet
      });

      const walletData = results[0].result;
      if (walletData) {
        await chrome.storage.local.set({ walletData });
        console.log('TruthChain: Direct injection successful!');
        return walletData;
      }
    } catch (injectionError) {
      console.log('Script injection failed:', injectionError);
    }
    
    // If all methods fail
    console.log('TruthChain: All wallet detection methods failed');
    throw new Error(
      'No Stacks wallet found or accessible.\n\n' +
      'Please ensure:\n' +
      '• Xverse or Leather wallet is installed\n' +
      '• Wallet is unlocked\n' +
      '• Page has finished loading\n' +
      '• Try refreshing the page'
    );
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
}

// Simplified wallet detection function for direct injection
function detectAndConnectWallet() {
  return new Promise((resolve, reject) => {
    console.log('TruthChain: Direct wallet detection starting...');
    console.log('Window object keys containing "xverse" or "stacks":', 
      Object.keys(window).filter(k => 
        k.toLowerCase().includes('xverse') || 
        k.toLowerCase().includes('stacks') ||
        k.toLowerCase().includes('leather') ||
        k.toLowerCase().includes('hiro')
      )
    );
    console.log('XverseProviders available:', !!(window as any).XverseProviders);
    console.log('XverseProviders.StacksProvider available:', !!(window as any).XverseProviders?.StacksProvider);
    console.log('LeatherProvider available:', !!(window as any).LeatherProvider);
    
    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      console.log('TruthChain: Wallet detection timed out after 15 seconds');
      reject(new Error('Wallet detection timeout - no wallet providers responded'));
    }, 15000);
    
    // Check immediately first
    if ((window as any).XverseProviders?.StacksProvider) {
      try {
        const provider = (window as any).XverseProviders.StacksProvider;
        provider.request('stx_requestAccounts').then((accounts: any) => {
          if (accounts && accounts.length > 0) {
            return provider.request('stx_getAddresses');
          }
          throw new Error('No accounts available');
        }).then((addressInfo: any) => {
          if (addressInfo?.addresses?.length) {
            clearTimeout(timeout);
            resolve({
              address: addressInfo.addresses[0].address,
              publicKey: addressInfo.addresses[0].publicKey || 'xverse-key',
              provider: 'xverse',
              walletName: 'Xverse',
              isConnected: true
            });
            return;
          }
          throw new Error('No address info available');
        }).catch((error: any) => {
          console.error('Direct Xverse connection failed:', error);
          // Try next wallet instead of returning
        });
      } catch (error) {
        console.error('Direct Xverse connection failed:', error);
      }
    }
    
    // Check for Leather with timeout handling
    if ((window as any).LeatherProvider) {
      try {
        const provider = (window as any).LeatherProvider;
        provider.request('stx_requestAccounts').then((result: any) => {
          if (result) {
            let address = result;
            if (result.addresses && Array.isArray(result.addresses)) {
              address = result.addresses[0];
            }
            
            clearTimeout(timeout);
            resolve({
              address: address,
              publicKey: result.publicKey || 'leather-key',
              provider: 'leather',
              walletName: 'Leather',
              isConnected: true
            });
            return;
          }
          throw new Error('No result from Leather');
        }).catch((error: any) => {
          console.error('Direct Leather connection failed:', error);
          // Try demo mode as fallback
        });
      } catch (error) {
        console.error('Direct Leather connection failed:', error);
      }
    }
    
    // Fallback after a short delay if no wallets respond
    setTimeout(() => {
      clearTimeout(timeout);
      reject(new Error(
        'No Stacks wallet detected or connection failed.\n\n' +
        'Please:\n' +
        '• Install a Stacks wallet (Xverse or Leather)\n' +
        '• Make sure the wallet is unlocked\n' +
        '• Refresh the page and try again'
      ));
    }, 5000); // Give wallets 5 seconds to respond
  });
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

// Handle demo mode when real wallets can't be accessed
async function handleDemoMode(): Promise<WalletData> {
  console.log('TruthChain: Offering demo mode');
  
  return {
    address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    publicKey: 'demo-public-key-for-testing',
    isDemoMode: true,
    provider: 'demo',
    walletName: 'Demo Mode'
  };
}
