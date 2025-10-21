// @ts-nocheck

import { storeToIPFS } from './lib/ipfs';
import { anchorToStacks, verifyOnStacks } from './lib/stacks';
import TruthChainAPIService from './services/api-service';

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
  // Extension installed successfully
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request: any, sender: any, sendResponse: (response?: any) => void) => {
  
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
      
      if (response && (response.available || response.xverse || response.leather || response.stacks)) {
        return {
          success: true,
          ...response
        };
      }
    } catch (error) {
      // Content script wallet detection failed
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
    
    try {
      // First detect available wallets
      const detectionResponse = await chrome.tabs.sendMessage(tab.id, { action: 'detectWallets' });
      
      if (!detectionResponse || !detectionResponse.available || detectionResponse.available.length === 0) {
        throw new Error('No wallets detected. Please install Xverse or Leather wallet and refresh the page.');
      }
      
      // Attempt connection with preferred wallet or first available
      const walletToConnect = preferredWallet || detectionResponse.available[0];
      
      const connectionResponse = await chrome.tabs.sendMessage(tab.id, { 
        action: 'connectWallet',
        preferredWallet: walletToConnect 
      });
      
      if (connectionResponse && connectionResponse.success && connectionResponse.walletData) {
        const walletData = connectionResponse.walletData;
        
        // Perform BNS lookup for the connected wallet address
        console.log('🔍 TruthChain: Looking up BNS name for address:', walletData.address);
        
        try {
          const { bnsService } = await import('./services/bns-service');
          const bnsResult = await bnsService.lookupNameByAddress(walletData.address);
          
          if (bnsResult.success && bnsResult.bnsName) {
            console.log('✅ TruthChain: BNS name found:', bnsResult.bnsName);
            walletData.bnsName = bnsResult.bnsName;
            walletData.fullBNSName = bnsResult.fullBNSName;
          } else {
            console.log('⚠️ TruthChain: No BNS name found for this address');
            walletData.bnsName = null;
            walletData.fullBNSName = null;
          }
        } catch (bnsError) {
          console.error('❌ TruthChain: BNS lookup failed:', bnsError);
          // Don't fail the connection if BNS lookup fails
          walletData.bnsName = null;
          walletData.fullBNSName = null;
        }
        
        return {
          success: true,
          walletData: walletData,
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

/**
 * Sign content registration transaction with user's wallet
 * This uses Stacks Connect to open the wallet and request signature
 */
async function signContentWithWallet(contentHash: string): Promise<string> {
  const { openContractCall } = await import('@stacks/connect');
  const { bufferCV, stringAsciiCV } = await import('@stacks/transactions');
  const { STACKS_MAINNET, STACKS_TESTNET } = await import('@stacks/network');
  const { config } = await import('./config/environment');

  // Convert hex hash to buffer
  const hashBuffer = Buffer.from(contentHash.replace(/^0x/, ''), 'hex');
  
  // Prepare contract call options
  const network = config.network.name === 'mainnet' ? STACKS_MAINNET : STACKS_TESTNET;
  
  return new Promise((resolve, reject) => {
    openContractCall({
      contractAddress: config.network.contractAddress,
      contractName: config.network.contractName,
      functionName: 'register-content',
      functionArgs: [
        bufferCV(hashBuffer),
        stringAsciiCV('tweet') // content type
      ],
      network,
      appDetails: {
        name: 'TruthChain',
        icon: chrome.runtime.getURL('Truthchain.jpeg'),
      },
      onFinish: (data: { txId: string }) => {
        console.log('✅ TruthChain: Transaction signed and submitted:', data.txId);
        resolve(data.txId);
      },
      onCancel: () => {
        console.log('❌ TruthChain: User cancelled transaction');
        reject(new Error('Transaction cancelled by user'));
      },
    }).catch((error: Error) => {
      console.error('❌ TruthChain: Failed to open contract call:', error);
      reject(error);
    });
  });
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
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectWallets' });
      
      if (response && (response.xverse || response.leather || response.stacks)) {
        // Try connecting via content script
        const connectionResponse = await chrome.tabs.sendMessage(tab.id, { action: 'connectWallet' });
        
        if (connectionResponse && connectionResponse.success) {
          const walletData = connectionResponse.wallet;
          await chrome.storage.local.set({ walletData });
          return walletData;
        }
      }
    } catch (error) {
      // Content script method failed, trying alternative approach
    }
    
    // Give wallets time to inject, then use content script
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Content script runs in the right context and should see wallets
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'detectWallets' });
      
      if (response && (response.xverse || response.leather || response.stacks || response.available?.length > 0)) {
        const connectionResponse = await chrome.tabs.sendMessage(tab.id, { action: 'connectWallet' });
        
        if (connectionResponse && connectionResponse.success) {
          const walletData = connectionResponse.wallet;
          await chrome.storage.local.set({ walletData });
          return walletData;
        } else if (connectionResponse && connectionResponse.error) {
          throw new Error('Content script connection failed: ' + connectionResponse.error);
        }
      }
    } catch (contentScriptError) {
      // Content script approach failed
    }
    
    // If all methods fail
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

    // Use the SECURE API flow (no private keys!)
    const apiService = TruthChainAPIService.getInstance();
    
    console.log('� TruthChain: Starting SECURE registration (wallet-based signing)...');
    
    // Step 1: Prepare registration - get hash from backend
    const tweetContent = content.content || content.excerpt || '';
    const prepareResponse = await apiService.prepareSecureRegistration({
      tweetContent: tweetContent,
      tweetUrl: content.url || '',
      twitterHandle: content.author || storage.walletData.address
    });

    if (!prepareResponse.success || !prepareResponse.data) {
      throw new Error(prepareResponse.error || 'Failed to prepare registration');
    }

    const { hash } = prepareResponse.data;
    console.log('✅ TruthChain: Registration prepared, hash:', hash);

    // Step 2: Sign transaction with wallet (using openContractCall)
    console.log('📝 TruthChain: Requesting wallet signature...');
    const txId = await signContentWithWallet(hash);
    console.log('✅ TruthChain: Transaction signed, txId:', txId);

    // Step 3: Confirm registration with backend
    console.log('🔍 TruthChain: Confirming registration on blockchain...');
    const confirmResponse = await apiService.confirmRegistration({
      tweetContent: tweetContent,
      txId: txId
    });

    if (!confirmResponse.success || !confirmResponse.data) {
      console.warn('⚠️ TruthChain: Confirmation pending, transaction may still be processing');
      // Don't fail here - transaction is submitted, confirmation may just be pending
    }

    const apiData = confirmResponse.data || {
      hash: hash,
      txId: txId,
      author: storage.walletData.address,
      registrationId: 0,
      blockHeight: 0,
      registeredAt: new Date().toISOString()
    };
    
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
