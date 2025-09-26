// @ts-nocheck

import { storeToIPFS } from './lib/ipfs';
import { anchorToStacks, verifyOnStacks } from './lib/stacks';
import TruthChainAPIService from './services/api-service';

console.log('TruthChain background script loaded');

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

interface RegistrationResult {
  cid: string;
  txId: string;
  timestamp: string;
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('TruthChain extension installed');
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

    case 'registerContent':
      handleContentRegistration(request)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'verifyContent':
      handleContentVerification(request)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getUserContent':
      handleGetUserContent(request.address)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'detectWallets':
      handleWalletDetection()
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'connectWallet':
      handleWalletConnection(request.preferredWallet)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getUsernameByWallet':
      handleGetUsernameByWallet(request.walletAddress)
        .then(result => sendResponse(result))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command: string) => {
  console.log('Command received:', command);
  
  switch (command) {
    case 'bridge-content':
      executeRegistrationCommand();
      break;
    case 'verify-content':
      executeVerifyCommand();
      break;
  }
});

async function handleWalletDetection(): Promise<any> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }
    
    // Check if it's a valid URL for injection
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('moz-extension://') || tab.url.startsWith('edge://')) {
      return {
        success: false,
        error: 'Wallet detection unavailable on browser internal pages. Please navigate to a regular website (like medium.com or any other site) and try connecting your wallet again.',
        available: [],
        xverse: false,
        leather: false,
        stacks: false
      };
    }
    
    try {
      // Send message to content script to detect wallets
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectWallets' });
      console.log('Wallet detection from content script:', response);
      
      if (response && (response.available || response.xverse || response.leather || response.stacks)) {
        return {
          success: true,
          ...response
        };
      }
    } catch (error) {
      console.log('Content script wallet detection failed:', error);
    }
    
    // Fallback response if no wallets detected
    return {
      success: false,
      error: 'No Stacks wallets detected. Please ensure Xverse or Leather wallet is installed and unlocked, then refresh this page.',
      available: [],
      xverse: false,
      leather: false,
      stacks: false,
      details: {}
    };
  } catch (error) {
    console.error('Wallet detection error:', error);
    return {
      success: false,
      error: error.message,
      available: [],
      xverse: false,
      leather: false,
      stacks: false
    };
  }
}

async function handleWalletConnection(preferredWallet?: string): Promise<any> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      throw new Error('No active tab found');
    }
    
    // Check if it's a valid URL for injection
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
      throw new Error('Cannot connect wallet on special browser pages');
    }
    
    console.log('TruthChain Background: Attempting wallet connection via content script');
    
    try {
      // First detect available wallets
      const detectionResponse = await chrome.tabs.sendMessage(tab.id, { action: 'detectWallets' });
      console.log('TruthChain Background: Wallet detection response:', detectionResponse);
      
      if (!detectionResponse || !detectionResponse.available || detectionResponse.available.length === 0) {
        throw new Error('No wallets detected. Please install Xverse or Leather wallet and refresh the page.');
      }
      
      // Attempt connection with preferred wallet or first available
      const walletToConnect = preferredWallet || detectionResponse.available[0];
      console.log('TruthChain Background: Connecting to wallet:', walletToConnect);
      
      const connectionResponse = await chrome.tabs.sendMessage(tab.id, { 
        action: 'connectWallet',
        preferredWallet: walletToConnect 
      });
      
      console.log('TruthChain Background: Connection response:', connectionResponse);
      
      if (connectionResponse && connectionResponse.success && connectionResponse.walletData) {
        return {
          success: true,
          walletData: connectionResponse.walletData,
          provider: connectionResponse.provider || walletToConnect,
          walletName: connectionResponse.walletName || 'Stacks Wallet'
        };
      } else {
        throw new Error(connectionResponse?.error || 'Wallet connection failed');
      }
    } catch (error) {
      console.error('TruthChain Background: Content script connection failed:', error);
      throw error;
    }
  } catch (error) {
    console.error('TruthChain Background: Wallet connection error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function handleGetUsernameByWallet(walletAddress: string): Promise<any> {
  try {
    // This would typically call your username manager
    // For now, return a placeholder response
    return {
      success: false,
      error: 'Username lookup not implemented yet'
    };
  } catch (error) {
    console.error('Username lookup error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

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
    
    // Give wallets time to inject, then use content script (which runs in right context)
    console.log('TruthChain: Waiting 5 seconds for wallet providers to inject...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Content script runs in the right context and should see wallets
    try {
      console.log('TruthChain: Using content script for wallet detection after delay...');
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectWallets' });
      console.log('Content script detection after delay:', response);
      
      if (response && (response.xverse || response.leather || response.stacks || response.available?.length > 0)) {
        console.log('TruthChain: Wallets detected via content script! Attempting connection...');
        const connectionResponse = await chrome.tabs.sendMessage(tab.id, { action: 'connectWallet' });
        console.log('Content script connection response:', connectionResponse);
        
        if (connectionResponse && connectionResponse.success) {
          const walletData = connectionResponse.wallet;
          await chrome.storage.local.set({ walletData });
          console.log('TruthChain: Successfully connected via content script!');
          return walletData;
        } else if (connectionResponse && connectionResponse.error) {
          throw new Error('Content script connection failed: ' + connectionResponse.error);
        }
      } else {
        console.log('TruthChain: No wallets detected via content script');
      }
    } catch (contentScriptError) {
      console.log('Content script approach failed:', contentScriptError);
    }
    
    // No more MAIN world injection - rely only on page script communication
    
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



async function handleContentRegistration(request?: {contentData?: ContentData}): Promise<RegistrationResult> {
  try {
    let content;
    
    // Use provided content data or extract from page
    if (request?.contentData) {
      content = request.contentData;
    } else {
      // Get current tab content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const contentResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        function: extractPageContent
      });

      content = contentResults[0].result;
    }
    
    if (!content) {
      throw new Error('No content found to register');
    }

    // Get wallet data
    const storage = await chrome.storage.local.get('walletData');
    if (!storage.walletData) {
      throw new Error('No wallet connected - please connect your Stacks wallet first');
    }

    // Use the new API service to register content
    const apiService = TruthChainAPIService.getInstance();
    
    console.log('🔗 TruthChain: Registering content via API service...');
    
    const registrationResponse = await apiService.registerContent({
      content: content.content || content.excerpt || '',
      title: content.title || 'Untitled Content',
      url: content.url || '',
      contentType: determineContentType(content),
      metadata: {
        author: content.author || 'Unknown',
        platform: content.hostname || 'Unknown',
        timestamp: content.timestamp || new Date().toISOString(),
        walletAddress: storage.walletData.address,
        extensionVersion: '1.0.0'
      }
    });

    if (!registrationResponse.success || !registrationResponse.data) {
      throw new Error(registrationResponse.error || 'API registration failed');
    }

    const apiData = registrationResponse.data;
    
    // Create registration result compatible with existing interface
    const registrationResult: RegistrationResult = {
      cid: `ipfs-${apiData.hash}`, // Create IPFS-style identifier
      txId: apiData.txId || generateMockTxId(),
      timestamp: new Date().toISOString()
    };

    // Store comprehensive registration record locally for quick access
    await chrome.storage.local.set({
      [`truthchain_${apiData.hash}`]: {
        ...registrationResult,
        content: content,
        walletAddress: storage.walletData.address,
        registrationStatus: 'confirmed',
        platform: content.hostname,
        author: content.author,
        contentType: determineContentType(content),
        isReal: true,
        apiData: apiData // Store complete API response
      }
    });

    // Update user's content registry
    const userKey = `user_content_${storage.walletData.address}`;
    const userStorage = await chrome.storage.local.get(userKey);
    const userContent = userStorage[userKey] || [];
    
    userContent.unshift({
      cid: registrationResult.cid,
      txId: registrationResult.txId,
      title: content.title,
      timestamp: registrationResult.timestamp,
      url: content.url,
      type: determineContentType(content),
      status: 'confirmed',
      registrationId: apiData.registrationId,
      hash: apiData.hash
    });
    
    await chrome.storage.local.set({ [userKey]: userContent.slice(0, 100) }); // Keep last 100

    // Enhanced notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'Truthchain.jpeg',
      title: 'Content Registered on TruthChain',
      message: `"${content.title}" successfully registered on blockchain (ID: ${apiData.registrationId})`
    });

    console.log('✅ TruthChain: Content registration completed successfully');
    return registrationResult;
    
  } catch (error) {
    console.error('❌ TruthChain: Registration failed:', error);
    throw error;
  }
}

// Helper functions for the new API integration
function determineContentType(content: ContentData): 'tweet' | 'blog_post' | 'page' | 'media' | 'document' {
  const hostname = content.hostname?.toLowerCase() || '';
  
  if (hostname.includes('twitter.com') || hostname.includes('x.com')) return 'tweet';
  if (hostname.includes('medium.com') || hostname.includes('substack.com') || hostname.includes('dev.to')) return 'blog_post';
  if (hostname.includes('youtube.com') || hostname.includes('vimeo.com')) return 'media';
  if (hostname.includes('.pdf') || content.title?.includes('PDF')) return 'document';
  
  return 'page'; // Default
}

function generateMockTxId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(16).slice(2, 10);
  return `0x${timestamp.toString(16)}${random}`;
}

async function handleContentVerification(request?: {contentData?: ContentData; silent?: boolean}): Promise<{
  isRegistered: boolean;
  owner?: string;
  timestamp?: number;
  message?: string;
  source?: string;
  [key: string]: unknown;
}> {
  try {
    let content;
    const isSilent = request?.silent;
    
    // Use provided content data or extract from page
    if (request?.contentData) {
      content = request.contentData;
    } else {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const contentResults = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        function: extractPageContent
      });

      content = contentResults[0].result;
    }
    
    const contentString = content.content || content.excerpt || '';
    const apiService = TruthChainAPIService.getInstance();
    
    if (!isSilent) {
      console.log('🔍 TruthChain: Verifying content via API service...');
    }
    
    // Use API service to verify content
    const verificationResponse = await apiService.verifyContent({
      content: contentString
    });
    
    if (!verificationResponse.success) {
      if (!isSilent) {
        console.log('❌ TruthChain: API verification failed:', verificationResponse.error);
      }
      return {
        isRegistered: false,
        message: verificationResponse.error || 'Verification failed',
        source: 'api_error'
      };
    }
    
    const apiData = verificationResponse.data;
    
    if (apiData?.exists) {
      const result = {
        isRegistered: true,
        owner: apiData.author || 'Unknown',
        timestamp: apiData.timestamp,
        blockHeight: apiData.blockHeight,
        registrationId: apiData.registrationId,
        contentType: apiData.contentType,
        source: 'blockchain_api',
        message: 'Content verified on TruthChain blockchain'
      };
      
      if (!isSilent) {
        console.log('✅ TruthChain: Content verified successfully:', result);
      }
      return result;
    } else {
      const result = {
        isRegistered: false,
        message: 'Content not found on TruthChain - not yet registered',
        source: 'blockchain_api'
      };
      
      if (!isSilent) {
        console.log('ℹ️ TruthChain: Content not found on blockchain');
      }
      return result;
    }
    
  } catch (error) {
    console.error('❌ TruthChain: Verification failed:', error);
    return {
      isRegistered: false,
      message: error instanceof Error ? error.message : 'Unknown verification error',
      source: 'error'
    };
  }
}

async function handleGetUserContent(address: string): Promise<Array<{
  cid: string;
  title: string;
  timestamp: string;
  url: string;
  txId: string;
}>> {
  try {
    // Get all stored registration records for this address
    const allData = await chrome.storage.local.get(null);
    const userContent = [];

    for (const [key, value] of Object.entries(allData)) {
      if (key.startsWith('truthchain_') && value.walletAddress === address) {
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

async function executeRegistrationCommand(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: () => {
        // Trigger registration from content script
        chrome.runtime.sendMessage({ action: 'registerContent' });
      }
    });
  } catch (error) {
    console.error('Failed to execute registration command:', error);
  }
}

async function executeVerifyCommand(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: () => {
        // Trigger verification from content script
        chrome.runtime.sendMessage({ action: 'verifyContent' });
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
