// This script runs in the MAIN world context and can access window.XverseProviders
// It communicates with the content script via window.postMessage

console.log('TruthChain: Page script loaded in MAIN world');

interface WalletProviderInfo {
  name: string;
  isDetected: boolean;
  provider?: any;
}

interface WalletDetectionResult {
  providers: Record<string, WalletProviderInfo>;
  timestamp: number;
}

// Wallet provider detection
function detectWalletProviders(): WalletDetectionResult {
  const providers: Record<string, WalletProviderInfo> = {};
  
  // Check for Xverse
  if ((window as any).XverseProviders?.StacksProvider) {
    console.log('TruthChain: Xverse provider detected!', (window as any).XverseProviders);
    providers.xverse = {
      name: 'Xverse',
      isDetected: true,
      provider: (window as any).XverseProviders.StacksProvider
    };
  } else {
    providers.xverse = {
      name: 'Xverse',
      isDetected: false
    };
  }
  
  // Check for Leather
  if ((window as any).LeatherProvider) {
    console.log('TruthChain: Leather provider detected!', (window as any).LeatherProvider);
    providers.leather = {
      name: 'Leather',
      isDetected: true,
      provider: (window as any).LeatherProvider
    };
  } else {
    providers.leather = {
      name: 'Leather',
      isDetected: false
    };
  }
  
  // Check for generic Stacks provider
  if ((window as any).StacksProvider && !(window as any).XverseProviders && !(window as any).LeatherProvider) {
    console.log('TruthChain: Generic Stacks provider detected!', (window as any).StacksProvider);
    providers.stacks = {
      name: 'Stacks Wallet',
      isDetected: true,
      provider: (window as any).StacksProvider
    };
  } else {
    providers.stacks = {
      name: 'Stacks Wallet',
      isDetected: false
    };
  }
  
  return {
    providers,
    timestamp: Date.now()
  };
}

// Connect to wallet provider
async function connectWallet(providerType: string): Promise<any> {
  console.log(`TruthChain: Attempting to connect to ${providerType} wallet`);
  
  try {
    if (providerType === 'xverse' && (window as any).XverseProviders?.StacksProvider) {
      const provider = (window as any).XverseProviders.StacksProvider;
      
      // Request account access
      const accounts = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Xverse accounts:', accounts);
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available in Xverse');
      }
      
      // Get detailed address information
      const addressInfo = await provider.request('stx_getAddresses');
      console.log('TruthChain: Xverse address info:', addressInfo);
      
      if (!addressInfo?.addresses?.length) {
        throw new Error('Could not retrieve address information from Xverse');
      }
      
      const primaryAddress = addressInfo.addresses[0];
      
      return {
        success: true,
        provider: 'xverse',
        walletName: 'Xverse',
        walletData: {
          address: primaryAddress.address,
          publicKey: primaryAddress.publicKey || `xverse-key-${Date.now()}`,
          provider: 'xverse',
          walletName: 'Xverse',
          isConnected: true,
          network: 'testnet',
          accounts: addressInfo.addresses
        }
      };
    }
    
    if (providerType === 'leather' && (window as any).LeatherProvider) {
      const provider = (window as any).LeatherProvider;
      
      const result = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Leather result:', result);
      
      if (!result) {
        throw new Error('No response from Leather wallet');
      }
      
      // Handle different response formats
      let address: string;
      let publicKey = `leather-key-${Date.now()}`;
      
      if (typeof result === 'string') {
        address = result;
      } else if (result.addresses && Array.isArray(result.addresses)) {
        address = result.addresses[0];
        publicKey = result.publicKey || publicKey;
      } else if (result.address) {
        address = result.address;
        publicKey = result.publicKey || publicKey;
      } else {
        throw new Error('Invalid response format from Leather');
      }
      
      return {
        success: true,
        provider: 'leather',
        walletName: 'Leather',
        walletData: {
          address,
          publicKey,
          provider: 'leather',
          walletName: 'Leather',
          isConnected: true,
          network: 'testnet',
          rawResponse: result
        }
      };
    }
    
    if (providerType === 'stacks' && (window as any).StacksProvider) {
      const provider = (window as any).StacksProvider;
      
      const accounts = await provider.request('stx_requestAccounts');
      console.log('TruthChain: Generic Stacks provider accounts:', accounts);
      
      const address = Array.isArray(accounts) ? accounts[0] : accounts;
      
      if (!address) {
        throw new Error('No address returned from provider');
      }
      
      return {
        success: true,
        provider: 'stacks',
        walletName: 'Stacks Wallet',
        walletData: {
          address,
          publicKey: `stacks-key-${Date.now()}`,
          provider: 'stacks',
          walletName: 'Stacks Wallet',
          isConnected: true,
          network: 'testnet',
          accounts
        }
      };
    }
    
    throw new Error(`Provider ${providerType} not available`);
    
  } catch (error) {
    console.error(`TruthChain: ${providerType} connection failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      provider: providerType
    };
  }
}

// Message handler for communication with content script
window.addEventListener('message', async (event) => {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }
  
  // Only handle TruthChain messages
  if (!event.data?.type?.startsWith('TRUTHCHAIN_')) {
    return;
  }
  
  console.log('TruthChain: Page script received message:', event.data);
  
  switch (event.data.type) {
    case 'TRUTHCHAIN_DETECT_WALLETS':
      try {
        const detection = detectWalletProviders();
        window.postMessage({
          type: 'TRUTHCHAIN_WALLET_DETECTION_RESULT',
          requestId: event.data.requestId,
          success: true,
          data: detection
        }, '*');
      } catch (error) {
        console.error('TruthChain: Wallet detection failed:', error);
        window.postMessage({
          type: 'TRUTHCHAIN_WALLET_DETECTION_RESULT',
          requestId: event.data.requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Detection failed'
        }, '*');
      }
      break;
      
    case 'TRUTHCHAIN_CONNECT_WALLET':
      try {
        const result = await connectWallet(event.data.provider);
        window.postMessage({
          type: 'TRUTHCHAIN_WALLET_CONNECTION_RESULT',
          requestId: event.data.requestId,
          success: result.success,
          data: result.success ? result : null,
          error: result.success ? null : result.error
        }, '*');
      } catch (error) {
        console.error('TruthChain: Wallet connection failed:', error);
        window.postMessage({
          type: 'TRUTHCHAIN_WALLET_CONNECTION_RESULT',
          requestId: event.data.requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Connection failed'
        }, '*');
      }
      break;
  }
});

// Periodic wallet detection
let detectionInterval: NodeJS.Timeout;

function startWalletDetection() {
  // Initial detection
  setTimeout(() => {
    const detection = detectWalletProviders();
    window.postMessage({
      type: 'TRUTHCHAIN_WALLET_DETECTION_UPDATE',
      data: detection
    }, '*');
  }, 1000);
  
  // Periodic detection every 5 seconds for first minute
  let detectionCount = 0;
  detectionInterval = setInterval(() => {
    detectionCount++;
    const detection = detectWalletProviders();
    
    window.postMessage({
      type: 'TRUTHCHAIN_WALLET_DETECTION_UPDATE',
      data: detection
    }, '*');
    
    // Stop after 12 attempts (1 minute)
    if (detectionCount >= 12) {
      clearInterval(detectionInterval);
      
      // Continue with slower detection every 30 seconds
      setInterval(() => {
        const detection = detectWalletProviders();
        window.postMessage({
          type: 'TRUTHCHAIN_WALLET_DETECTION_UPDATE',
          data: detection
        }, '*');
      }, 30000);
    }
  }, 5000);
}

// Start detection when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startWalletDetection);
} else {
  startWalletDetection();
}

console.log('TruthChain: Page script initialized, wallet detection started');