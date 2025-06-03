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

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Background received message:', request);
  
  if (request.action === 'registerContent') {
    handleContentRegistration(request.content)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Will respond asynchronously
  }
  
  if (request.action === 'verifyContent') {
    handleContentVerification(request.content)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    
    return true; // Will respond asynchronously
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

async function handleContentRegistration(contentData: ContentData): Promise<RegistrationResult> {
  try {
    const contentHash = await generateContentHash(contentData);
    
    // TODO: Integrate with Stacks blockchain
    const registrationResult: RegistrationResult = {
      hash: contentHash,
      timestamp: new Date().toISOString(),
      txId: 'simulated-tx-' + Date.now()
    };
    
    await chrome.storage.local.set({
      [`registration_${contentHash}`]: registrationResult
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
    const stored = await chrome.storage.local.get(`registration_${contentHash}`);
    const registration = stored[`registration_${contentHash}`];
    
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
