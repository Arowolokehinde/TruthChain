// Professional-grade wallet connection system
// Addresses known issues with @stacks/connect v8 and Xverse detection

interface WalletConnectionResult {
  success: boolean;
  address?: string;
  publicKey?: string;
  provider?: string;
  walletName?: string;
  network?: string;
  error?: string;
}



export class ProfessionalWalletConnector {
  private static instance: ProfessionalWalletConnector;

  static getInstance(): ProfessionalWalletConnector {
    if (!ProfessionalWalletConnector.instance) {
      ProfessionalWalletConnector.instance = new ProfessionalWalletConnector();
    }
    return ProfessionalWalletConnector.instance;
  }

  /**
   * Professional-grade wallet connection using background script communication
   * Updated to work from service worker context (popup)
   */
  async connectWallet(): Promise<WalletConnectionResult> {
    console.log('🔗 Professional Wallet Connector: Starting connection via background script...');

    try {
      // First detect available wallets
      const detection = await this.detectWallets();
      console.log('🔍 Wallet detection result:', detection);
      
      if (detection.available.length === 0) {
        const errorMessage = detection.error || 'No Stacks wallets detected. Please install Xverse or Leather wallet and ensure it\'s unlocked.';
        console.log('🔍 Professional Wallet Connector: No wallets available:', errorMessage);
        return {
          success: false,
          error: errorMessage
        };
      }

      // Use background script to handle the actual connection
      const response = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'connectWallet', preferredWallet: detection.available[0] }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });

      if (response && response.success && response.walletData) {
        console.log('✅ Professional wallet connection successful:', response);
        return {
          success: true,
          address: response.walletData.address,
          publicKey: response.walletData.publicKey,
          provider: response.walletData.provider || response.provider,
          walletName: response.walletData.walletName || response.walletName,
          network: response.walletData.network || 'mainnet'
        };
      } else {
        return {
          success: false,
          error: response?.error || 'Wallet connection failed via background script'
        };
      }
    } catch (error) {
      console.error('❌ Professional wallet connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Professional wallet connection failed'
      };
    }
  }





  // Note: Original modal approach disabled due to detection issues
  // Will be re-enabled if needed for specific use cases


  /**
   * Detect available wallets without connecting
   * Updated to work from service worker context via background script communication
   */
  async detectWallets(): Promise<{ available: string[]; xverse: boolean; leather: boolean; stacks?: boolean; error?: string }> {
    console.log('🔍 Professional Wallet Connector: Detecting wallets via background script...');
    
    try {
      // Use chrome.runtime.sendMessage to communicate with background script
      // Background script will handle content script communication
      const response = await new Promise<any>((resolve, reject) => {
        chrome.runtime.sendMessage({ action: 'detectWallets' }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(response);
        });
      });

      if (response && response.success) {
        console.log('✅ Wallet detection successful:', response);
        return {
          available: response.available || [],
          xverse: response.xverse || false,
          leather: response.leather || false,
          stacks: response.stacks || false
        };
      } else {
        console.log('⚠️ Wallet detection failed or no wallets found:', response);
        return {
          available: [],
          xverse: false,
          leather: false,
          stacks: false,
          error: response?.error || 'Background script wallet detection failed'
        };
      }
    } catch (error) {
      console.error('❌ Professional wallet detector communication failed:', error);
      return {
        available: [],
        xverse: false,
        leather: false,
        stacks: false,
        error: error instanceof Error ? error.message : 'Communication with background script failed'
      };
    }
  }

  /**
   * Debug method to analyze provider injection
   * Updated to work from service worker context
   */
  debugProviderInjection(): void {
    console.log('🔍 TruthChain Provider Debug Analysis (Professional Wallet Connector):');
    console.log('Chrome Version:', navigator.userAgent);
    console.log('Context: Service Worker (cannot access window object directly)');
    
    // Since we're in service worker context, we need to communicate with background script
    // which will then communicate with content script for actual provider detection
    console.log('🔗 Initiating background script communication for provider analysis...');
    
    chrome.runtime.sendMessage({ action: 'detectWallets' }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('❌ Background script communication failed:', chrome.runtime.lastError.message);
        return;
      }
      
      console.log('📊 Wallet Detection Results from Background Script:');
      console.log('  Available wallets:', response?.available || []);
      console.log('  Xverse detected:', response?.xverse || false);
      console.log('  Leather detected:', response?.leather || false);
      console.log('  Stacks detected:', response?.stacks || false);
      console.log('  Detection success:', response?.success || false);
      
      if (response?.error) {
        console.error('  Detection error:', response.error);
      }
      
      if (response?.details) {
        console.log('  Detection details:', response.details);
      }
      
      console.log('💡 Professional Recommendation:');
      if (!response?.success || response?.available?.length === 0) {
        console.log('  - Install Xverse or Leather wallet extension');
        console.log('  - Ensure wallet is unlocked');
        console.log('  - Navigate to a regular webpage (not chrome:// or extension pages)');
        console.log('  - Check browser console on the webpage for detailed provider logs');
      } else {
        console.log('  - Wallet providers detected successfully');
        console.log('  - Ready for connection attempts');
      }
    });
  }
}

// Export singleton instance
export const professionalWalletConnector = ProfessionalWalletConnector.getInstance();