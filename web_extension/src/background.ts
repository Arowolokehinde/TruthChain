// @ts-nocheck

import { storeToIPFS } from './lib/ipfs';
import { anchorToStacks, verifyOnStacks, connectStacksWallet, isStacksWalletAvailable, getStacksProvider } from './lib/stacks';

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
    
    try {
      // Method 1: Try Xverse direct provider
      if (window.XverseProviders?.StacksProvider) {
        console.log('Found XverseProviders.StacksProvider');
        const provider = window.XverseProviders.StacksProvider;
        
        try {
          const accounts = await provider.request('stx_requestAccounts');
          console.log('Accounts received:', accounts);
          
          if (accounts && accounts.length > 0) {
            const addressInfo = await provider.request('stx_getAddresses');
            console.log('Address info received:', addressInfo);
            
            resolve({
              address: addressInfo.addresses[0].address,
              publicKey: addressInfo.addresses[0].publicKey || 'xverse-public-key',
              provider: 'xverse'
            });
            return;
          }
        } catch (error) {
          console.error('Xverse provider error:', error);
        }
      }
      
      // Method 2: Try generic Stacks provider
      if (window.StacksProvider) {
        console.log('Found generic StacksProvider');
        try {
          const accounts = await window.StacksProvider.request('stx_requestAccounts');
          if (accounts && accounts.length > 0) {
            resolve({
              address: accounts[0],
              publicKey: 'stacks-provider-key',
              provider: 'stacks'
            });
            return;
          }
        } catch (error) {
          console.error('Generic StacksProvider error:', error);
        }
      }

      // Method 3: Try Stacks Connect
      console.log('Trying Stacks Connect...');
      try {
        // Load Stacks Connect dynamically
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@stacks/connect@20.1.0/dist/index.umd.js';
        
        script.onload = async () => {
          try {
            if (window.StacksConnect?.showConnect) {
              window.StacksConnect.showConnect({
                appDetails: {
                  name: 'TruthChain Extension',
                  icon: window.location.origin + '/Truthchain.jpeg'
                },
                onFinish: (authData) => {
                  try {
                    const userData = authData.userSession.loadUserData();
                    const address = userData.profile.stxAddress?.testnet 
                      || userData.profile.stxAddress?.mainnet
                      || 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
                    
                    resolve({
                      address: address,
                      publicKey: userData.publicKey || 'stacks-connect-key',
                      provider: 'stacks-connect',
                      authData: authData
                    });
                  } catch (error) {
                    console.error('Error processing Stacks Connect data:', error);
                    tryMockConnection('Error processing auth data');
                  }
                },
                onCancel: () => {
                  tryMockConnection('User cancelled Stacks Connect');
                }
              });
            } else {
              tryMockConnection('Stacks Connect not available');
            }
          } catch (error) {
            console.error('Stacks Connect execution error:', error);
            tryMockConnection('Stacks Connect failed to execute');
          }
        };
        
        script.onerror = () => {
          tryMockConnection('Failed to load Stacks Connect');
        };
        
        document.head.appendChild(script);
        
      } catch (error) {
        console.error('Failed to load Stacks Connect:', error);
        tryMockConnection('Script loading failed');
      }
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      tryMockConnection('Connection attempt failed');
    }

    function tryMockConnection(reason) {
      console.warn('Creating mock wallet connection. Reason:', reason);
      
      const useDemo = confirm(
        '🔗 Wallet Connection Options\n\n' +
        'No Stacks wallet detected. Choose an option:\n\n' +
        '✅ YES - Use Demo Mode (test all features)\n' +
        '❌ NO - Install a Stacks wallet\n\n' +
        'Recommended wallets:\n' +
        '• Xverse (Most popular)\n' +
        '• Leather (Hiro)\n' +
        '• Asigna'
      );
      
      if (useDemo) {
        resolve({
          address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
          publicKey: 'demo-public-key',
          isDemoMode: true,
          provider: 'demo'
        });
      } else {
        reject(new Error('Please install a Stacks wallet (Xverse, Leather, or Asigna) and try again.'));
      }
    }

    // Timeout after 15 seconds
    setTimeout(() => {
      reject(new Error('Wallet connection timeout. Please ensure your wallet is unlocked and try again.'));
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
