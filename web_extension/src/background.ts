/// <reference types="chrome" />

console.log('TruthChain background script loaded');

interface ContentData {
  title: string;
  content: string;
  url: string;
  hostname?: string;
  timestamp?: string;
}

interface RegistrationResult {
  hash: string;
  timestamp: string;
  txId: string;
}

interface VerificationResult {
  hash: string;
  isRegistered: boolean;
  registration: RegistrationResult | null;
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('TruthChain extension installed');
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  switch (request.action) {
    case 'connectWallet':
      handleWalletConnection()
        .then(result => sendResponse({ success: true, address: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'registerCurrentPage':
      handleCurrentPageRegistration()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'verifyCurrentPage':
      handleCurrentPageVerification()
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'registerContent':
      handleContentRegistration(request.content)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'verifyContent':
      handleContentVerification(request.content)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command: string) => {
  console.log('Command received:', command);
  
  switch (command) {
    case 'verify-content':
      executeContentVerification();
      break;
    case 'register-content':
      executeContentRegistration();
      break;
  }
});

async function handleWalletConnection(): Promise<string> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: connectXverseWallet
    });

    const address = results[0].result;
    if (address) {
      await chrome.storage.local.set({ walletAddress: address });
      return address;
    } else {
      throw new Error('Failed to connect wallet');
    }
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
}

async function handleCurrentPageRegistration() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    function: extractAndRegisterContent
  });

  return results[0].result;
}

async function handleCurrentPageVerification() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id! },
    function: extractAndVerifyContent
  });

  return results[0].result;
}

async function handleContentRegistration(contentData: ContentData): Promise<RegistrationResult> {
  try {
    const contentHash = await generateContentHash(contentData);
    
    // Get connected wallet
    const storage = await chrome.storage.local.get('walletAddress');
    if (!storage.walletAddress) {
      throw new Error('No wallet connected');
    }

    // TODO: Replace with actual Stacks blockchain call
    // For now, simulate blockchain registration
    const registrationResult: RegistrationResult = {
      hash: contentHash,
      timestamp: new Date().toISOString(),
      txId: 'stx-tx-' + Date.now() // This should be actual transaction ID
    };
    
    // Store registration locally for verification
    await chrome.storage.local.set({
      [`registration_${contentHash}`]: {
        ...registrationResult,
        walletAddress: storage.walletAddress,
        contentData: contentData
      }
    });
    
    // Send notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'Truthchain.jpeg',
      title: 'Content Registered',
      message: `Content "${contentData.title}" has been registered on blockchain`
    });
    
    return registrationResult;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

async function handleContentVerification(contentData: ContentData): Promise<VerificationResult> {
  try {
    const contentHash = await generateContentHash(contentData);
    
    // Check local storage first
    const stored = await chrome.storage.local.get(`registration_${contentHash}`);
    const registration = stored[`registration_${contentHash}`];
    
    // TODO: Also check blockchain for verification
    
    return {
      hash: contentHash,
      isRegistered: !!registration,
      registration: registration || null
    };
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

async function generateContentHash(contentData: ContentData): Promise<string> {
  const contentString = JSON.stringify({
    title: contentData.title || '',
    content: contentData.content || '',
    url: contentData.url || ''
  });
  
  const hashBuffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(contentString)
  );
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Functions to be injected into web pages
function connectXverseWallet() {
  return new Promise((resolve, reject) => {
    // Check if Stacks Connect is already available
    // @ts-ignore
    if (window.StacksConnect) {
      initiateConnection();
    } else {
      // Load Stacks Connect dynamically
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/@stacks/connect@20.1.0/dist/index.umd.js';
      script.onload = initiateConnection;
      script.onerror = () => reject(new Error('Failed to load Stacks Connect'));
      document.head.appendChild(script);
    }

    function initiateConnection() {
      try {
        // @ts-ignore
        const { showConnect } = window.StacksConnect;
        
        showConnect({
          appDetails: {
            name: 'TruthChain Extension',
            icon: 'https://truth-chain.vercel.app/favicon.ico'
          },
          onFinish: (data: any) => {
            const address = data.userSession.loadUserData().profile.stxAddress.testnet;
            resolve(address);
          },
          onCancel: () => {
            reject(new Error('User cancelled wallet connection'));
          },
          userSession: false
        });
      } catch (error) {
        reject(error);
      }
    }
  });
}

function extractAndRegisterContent() {
  const content = {
    title: document.title,
    content: document.body.innerText.slice(0, 2000),
    url: window.location.href,
    hostname: window.location.hostname,
    timestamp: new Date().toISOString()
  };

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'registerContent',
      content: content
    }, resolve);
  });
}

function extractAndVerifyContent() {
  const content = {
    title: document.title,
    content: document.body.innerText.slice(0, 2000),
    url: window.location.href,
    hostname: window.location.hostname,
    timestamp: new Date().toISOString()
  };

  return new Promise((resolve) => {
    chrome.runtime.sendMessage({
      action: 'verifyContent',
      content: content
    }, resolve);
  });
}

async function executeContentVerification(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: () => {
        const content = {
          title: document.title,
          content: document.body.innerText.slice(0, 1000),
          url: window.location.href
        };
        
        chrome.runtime.sendMessage({
          action: 'verifyContent',
          content: content
        });
      }
    });
  } catch (error) {
    console.error('Failed to execute verification:', error);
  }
}

async function executeContentRegistration(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.scripting.executeScript({
      target: { tabId: tab.id! },
      function: () => {
        const content = {
          title: document.title,
          content: document.body.innerText.slice(0, 1000),
          url: window.location.href
        };
        
        chrome.runtime.sendMessage({
          action: 'registerContent',
          content: content
        });
      }
    });
  } catch (error) {
    console.error('Failed to execute registration:', error);
  }
}
