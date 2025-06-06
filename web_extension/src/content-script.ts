// @ts-nocheck

console.log('Blog2Block content script loaded on:', window.location.hostname);

// Inject Web3 bridge UI
function injectBridgeUI(): void {
  if (document.getElementById('blog2block-ui')) {
    return;
  }

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
  const bridgeButton = createFloatingButton('🌉', 'Bridge to Web3', 0);
  bridgeButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'bridgeToWeb3' }, handleBridgeResponse);
  });

  // Create verify button
  const verifyButton = createFloatingButton('🔍', 'Verify on Chain', 0);
  verifyButton.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'verifyOnChain' }, handleVerifyResponse);
  });

  uiContainer.appendChild(bridgeButton);
  uiContainer.appendChild(verifyButton);
  document.body.appendChild(uiContainer);
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

// Content script to detect and interact with wallet providers
console.log('TruthChain content script loaded');

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
