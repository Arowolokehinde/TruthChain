// @ts-nocheck

console.log('Blog2Block content script loaded on:', window.location.hostname);

// Inject Web3 bridge UI
function injectBridgeUI(): void {
  if (document.getElementById('blog2block-ui')) {
    return;
  }

  // Auto-check for existing verification
  checkContentVerification();

  // Create container for UI elements
  const uiContainer = document.createElement('div');
  uiContainer.id = 'blog2block-ui';
  uiContainer.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;

  // Create floating action button
  const bridgeButton = createFloatingButton('🌉', 'Register Content', 0);
  bridgeButton.addEventListener('click', async () => {
    const content = await ContentDetector.extractContent();
    chrome.runtime.sendMessage({ 
      action: 'bridgeToWeb3', 
      contentData: content 
    }, handleBridgeResponse);
  });

  // Create verify button
  const verifyButton = createFloatingButton('🔍', 'Verify Authenticity', 0);
  verifyButton.addEventListener('click', async () => {
    const content = await ContentDetector.extractContent();
    chrome.runtime.sendMessage({ 
      action: 'verifyOnChain', 
      contentData: content 
    }, handleVerifyResponse);
  });

  uiContainer.appendChild(bridgeButton);
  uiContainer.appendChild(verifyButton);
  document.body.appendChild(uiContainer);
}

// Auto-verification on page load
async function checkContentVerification() {
  try {
    const content = await ContentDetector.extractContent();
    chrome.runtime.sendMessage({ 
      action: 'verifyOnChain', 
      contentData: content, 
      silent: true 
    }, (response) => {
      if (response?.success && response.data?.isRegistered) {
        injectVerificationBadge(response.data);
      }
    });
  } catch (error) {
    console.log('Auto-verification failed:', error);
  }
}

// Inject verification badge for proven content
function injectVerificationBadge(verificationData) {
  // Remove existing badge
  const existing = document.getElementById('truthchain-badge');
  if (existing) existing.remove();

  const badge = document.createElement('div');
  badge.id = 'truthchain-badge';
  badge.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 10000;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    padding: 12px 16px;
    border-radius: 25px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    animation: slideIn 0.5s ease-out;
  `;

  badge.innerHTML = `
    <div style="width: 20px; height: 20px; background: rgba(255,255,255,0.3); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
      ✓
    </div>
    <div>
      <div style="font-weight: bold; font-size: 12px;">TruthChain Verified</div>
      <div style="font-size: 10px; opacity: 0.9;">Registered ${new Date(verificationData.timestamp).toLocaleDateString()}</div>
    </div>
  `;

  badge.addEventListener('click', () => {
    showVerificationDetails(verificationData);
  });

  document.body.appendChild(badge);
}

function showVerificationDetails(data) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 10001;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  modal.innerHTML = `
    <div style="background: white; border-radius: 12px; padding: 24px; max-width: 500px; margin: 20px; box-shadow: 0 20px 25px rgba(0,0,0,0.1);">
      <div style="display: flex; align-items: center; margin-bottom: 20px;">
        <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 12px;">✓</div>
        <div>
          <h3 style="margin: 0; color: #1f2937; font-size: 18px;">Content Verified</h3>
          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Blockchain proof of authenticity</p>
        </div>
      </div>
      <div style="space-y: 12px;">
        <div><strong>Owner:</strong> ${data.owner.slice(0,12)}...${data.owner.slice(-8)}</div>
        <div><strong>Registered:</strong> ${new Date(data.timestamp).toLocaleString()}</div>
        ${data.txId ? `<div><strong>Transaction:</strong> <a href="https://explorer.hiro.so/txid/${data.txId}?chain=testnet" target="_blank" style="color: #10b981;">${data.txId.slice(0,12)}...</a></div>` : ''}
        <div><strong>Content Hash:</strong> <span style="font-family: monospace; font-size: 12px;">${data.cid || 'N/A'}</span></div>
      </div>
      <button onclick="this.closest('div[style*=\"position: fixed\"]').remove()" style="margin-top: 20px; background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%;">Close</button>
    </div>
  `;

  document.body.appendChild(modal);
  
  // Close on backdrop click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

function createFloatingButton(icon: string, title: string, topOffset: number): HTMLElement {
  const button = document.createElement('button');
  button.className = 'blog2block-btn';
  button.innerHTML = `<span style="font-size: 16px;">${icon}</span>`;
  button.title = title;
  button.style.cssText = `
    position: relative;
    top: ${topOffset}px;
    width: 50px;
    height: 50px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 50%;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.1)';
    button.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
  });

  return button;
}

function handleBridgeResponse(response: any): void {
  if (response && response.success) {
    showNotification(
      `✅ Content bridged to Web3!\nIPFS: ${response.data.cid.slice(0, 20)}...\nTX: ${response.data.txId.slice(0, 10)}...`,
      'success'
    );
  } else {
    showNotification('❌ Bridge failed: ' + (response?.error || 'Unknown error'), 'error');
  }
}

function handleVerifyResponse(response: any): void {
  if (response && response.success) {
    const message = response.data.isRegistered 
      ? `✅ Content verified on blockchain!\nOwner: ${response.data.owner.slice(0, 12)}...\nTimestamp: ${new Date(response.data.timestamp).toLocaleDateString()}`
      : '❌ Content not found on blockchain';
    showNotification(message, response.data.isRegistered ? 'success' : 'warning');
  } else {
    showNotification('❌ Verification failed: ' + (response?.error || 'Unknown error'), 'error');
  }
}

function showNotification(message: string, type: 'success' | 'error' | 'warning' = 'info'): void {
  // Remove existing notification
  const existing = document.getElementById('blog2block-notification');
  if (existing) {
    existing.remove();
  }

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };

  const notification = document.createElement('div');
  notification.id = 'blog2block-notification';
  notification.style.cssText = `
    position: fixed;
    top: 130px;
    right: 20px;
    z-index: 10001;
    background: ${colors[type]};
    color: white;
    padding: 16px 20px;
    border-radius: 12px;
    font-size: 14px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    max-width: 320px;
    word-wrap: break-word;
    white-space: pre-line;
    animation: slideIn 0.3s ease-out;
  `;

  // Add slide-in animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);

  notification.textContent = message;
  document.body.appendChild(notification);

  // Auto-remove after 6 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideIn 0.3s ease-out reverse';
      setTimeout(() => notification.remove(), 300);
    }
  }, 6000);
}

// Initialize when page loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectBridgeUI);
} else {
  injectBridgeUI();
}

// Handle dynamic content changes
const observer = new MutationObserver(() => {
  if (!document.getElementById('blog2block-ui')) {
    setTimeout(injectBridgeUI, 1000);
  }
});

observer.observe(document.body, { childList: true, subtree: true });

// Enhanced content detection for Truth-Chain workflows
console.log('TruthChain content script loaded');

// Content detection and hashing utilities
class ContentDetector {
  static async extractContent() {
    const hostname = window.location.hostname;
    let content = null;

    // Platform-specific extraction
    if (hostname.includes('medium.com')) {
      content = this.extractMediumContent();
    } else if (hostname.includes('dev.to')) {
      content = this.extractDevToContent();
    } else if (hostname.includes('substack.com')) {
      content = this.extractSubstackContent();
    } else if (hostname.includes('github.com')) {
      content = this.extractGitHubContent();
    } else {
      content = this.extractGenericContent();
    }

    return {
      ...content,
      url: window.location.href,
      hostname,
      timestamp: new Date().toISOString(),
      hash: await this.generateContentHash(content)
    };
  }

  static extractMediumContent() {
    const title = document.querySelector('h1')?.textContent || document.title;
    const article = document.querySelector('article') || document.querySelector('[data-testid="storyContent"]');
    const author = document.querySelector('[data-testid="authorName"]')?.textContent;
    
    return {
      title,
      content: article?.innerText || '',
      author,
      type: 'article'
    };
  }

  static extractDevToContent() {
    const title = document.querySelector('h1.crayons-title')?.textContent || document.title;
    const article = document.querySelector('#article-body') || document.querySelector('.crayons-article__body');
    const author = document.querySelector('.crayons-story__author')?.textContent;
    
    return {
      title,
      content: article?.innerText || '',
      author,
      type: 'article'
    };
  }

  static extractSubstackContent() {
    const title = document.querySelector('h1')?.textContent || document.title;
    const article = document.querySelector('.post-content') || document.querySelector('[class*="post"]');
    const author = document.querySelector('[class*="author"]')?.textContent;
    
    return {
      title,
      content: article?.innerText || '',
      author,
      type: 'newsletter'
    };
  }

  static extractGitHubContent() {
    if (window.location.pathname.includes('/blob/') || window.location.pathname.includes('/README')) {
      const title = document.querySelector('.js-navigation-open')?.textContent || document.title;
      const code = document.querySelector('.blob-wrapper')?.textContent;
      
      return {
        title,
        content: code || '',
        type: 'code',
        repository: window.location.pathname.split('/').slice(1, 3).join('/')
      };
    }
    
    return {
      title: document.title,
      content: document.body.innerText.slice(0, 1000),
      type: 'repository'
    };
  }

  static extractGenericContent() {
    const title = document.title;
    const selectors = ['article', 'main', '[role="main"]', '.content', '.post', '.entry'];
    let content = '';
    
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element && element.innerText.length > 100) {
        content = element.innerText;
        break;
      }
    }
    
    if (!content) {
      content = document.body.innerText.slice(0, 2000);
    }
    
    return { title, content, type: 'webpage' };
  }

  static async generateContentHash(content) {
    const contentString = JSON.stringify({
      title: content.title,
      content: content.content.slice(0, 5000), // Limit for consistency
      type: content.type
    });
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(contentString));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}

// Wait for wallet providers to inject
let walletCheckInterval: NodeJS.Timeout;
let walletDetected = false;

// Check for wallet providers periodically
const checkForWallets = () => {
  if (walletDetected) return;
  
  const wallets = [];
  
  // Check for Xverse
  if ((window as any).XverseProviders?.StacksProvider) {
    wallets.push('xverse');
    walletDetected = true;
  }
  
  // Check for Leather
  if ((window as any).LeatherProvider) {
    wallets.push('leather');
    walletDetected = true;
  }
  
  // Check for other providers
  if ((window as any).StacksProvider) {
    wallets.push('stacks');
    walletDetected = true;
  }
  
  if (wallets.length > 0) {
    console.log('TruthChain: Detected wallets:', wallets);
    clearInterval(walletCheckInterval);
    
    // Store wallet availability in page context
    (window as any).__truthchain_wallets_available = wallets;
  }
};

// Start checking immediately and periodically
checkForWallets();
walletCheckInterval = setInterval(checkForWallets, 1000);

// Stop checking after 30 seconds
setTimeout(() => {
  if (walletCheckInterval) {
    clearInterval(walletCheckInterval);
  }
}, 30000);

// Listen for messages from extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'detectWallets') {
    sendResponse({
      available: (window as any).__truthchain_wallets_available || [],
      xverse: !!(window as any).XverseProviders?.StacksProvider,
      leather: !!(window as any).LeatherProvider,
      stacks: !!(window as any).StacksProvider
    });
  }
  
  if (request.action === 'connectWallet') {
    connectWalletInPage().then(sendResponse).catch(error => {
      sendResponse({ error: error.message });
    });
    return true; // Keep message channel open for async response
  }
});

async function connectWalletInPage() {
  console.log('TruthChain: Attempting wallet connection in page context');
  
  // Try Xverse first
  if ((window as any).XverseProviders?.StacksProvider) {
    try {
      console.log('TruthChain: Connecting to Xverse...');
      const provider = (window as any).XverseProviders.StacksProvider;
      
      const accounts = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Xverse accounts:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available in Xverse');
      }
      
      const addressInfo = await provider.request('stx_getAddresses');
      console.log('TruthChain: Xverse address info:', addressInfo);
      
      if (!addressInfo?.addresses?.length) {
        throw new Error('Could not get address information');
      }
      
      return {
        success: true,
        wallet: {
          address: addressInfo.addresses[0].address,
          publicKey: addressInfo.addresses[0].publicKey || 'xverse-key',
          provider: 'xverse',
          walletName: 'Xverse',
          isConnected: true
        }
      };
    } catch (error) {
      console.error('TruthChain: Xverse connection failed:', error);
      if (error.message?.includes('User rejected') || error.message?.includes('denied')) {
        throw new Error('Connection cancelled by user');
      }
      // Try next wallet
    }
  }
  
  // Try Leather
  if ((window as any).LeatherProvider) {
    try {
      console.log('TruthChain: Connecting to Leather...');
      const provider = (window as any).LeatherProvider;
      
      const result = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Leather result:', result);
      
      if (!result) {
        throw new Error('No response from Leather');
      }
      
      let address = result;
      if (result.addresses && Array.isArray(result.addresses)) {
        address = result.addresses[0];
      } else if (result.address) {
        address = result.address;
      }
      
      return {
        success: true,
        wallet: {
          address: address,
          publicKey: result.publicKey || 'leather-key',
          provider: 'leather',
          walletName: 'Leather',
          isConnected: true
        }
      };
    } catch (error) {
      console.error('TruthChain: Leather connection failed:', error);
      // Try next wallet
    }
  }
  
  // Try generic Stacks provider
  if ((window as any).StacksProvider) {
    try {
      console.log('TruthChain: Connecting to generic Stacks provider...');
      const provider = (window as any).StacksProvider;
      
      const accounts = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Generic provider accounts:', accounts);
      
      return {
        success: true,
        wallet: {
          address: Array.isArray(accounts) ? accounts[0] : accounts,
          publicKey: 'stacks-key',
          provider: 'stacks',
          walletName: 'Stacks Wallet',
          isConnected: true
        }
      };
    } catch (error) {
      console.error('TruthChain: Generic provider connection failed:', error);
    }
  }
  
  throw new Error('No wallet providers found or all connections failed');
}
