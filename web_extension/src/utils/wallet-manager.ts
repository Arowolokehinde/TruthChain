
import { config, ConfigUtils } from '../config/environment';

export interface WalletInfo {
  id: 'xverse' | 'leather' | 'generic';
  name: string;
  isDetected: boolean;
  isInstalled: boolean;
  downloadUrl: string;
  priority: number;
}

export interface WalletConnectionResult {
  success: boolean;
  wallet?: {
    address: string;
    publicKey: string;
    provider: string;
    walletName: string;
    network: string;
  };
  error?: string;
}

export class WalletManager {
  private static instance: WalletManager;
  
  private constructor() {}
  
  static getInstance(): WalletManager {
    if (!WalletManager.instance) {
      WalletManager.instance = new WalletManager();
    }
    return WalletManager.instance;
  }
  
  /**
   * Get available wallet information
   * This method returns the basic structure - real detection happens via content script
   */
  getAvailableWallets(): WalletInfo[] {
    const wallets: WalletInfo[] = [
      {
        id: 'xverse' as const,
        name: 'Xverse Wallet',
        isDetected: false, // Will be updated by real detection
        isInstalled: false, // Will be updated by real detection
        downloadUrl: 'https://chrome.google.com/webstore/detail/xverse-wallet/idnnbdplmphgjfnlezmnbdbpnpfggjjs',
        priority: config.wallets.xverse.priority
      },
      {
        id: 'leather' as const,
        name: 'Leather Wallet',
        isDetected: false, // Will be updated by real detection
        isInstalled: false, // Will be updated by real detection
        downloadUrl: 'https://leather.io/',
        priority: config.wallets.leather.priority
      },
      {
        id: 'generic' as const,
        name: 'Stacks Wallet',
        isDetected: false, // Will be updated by real detection
        isInstalled: false, // Will be updated by real detection
        downloadUrl: 'https://www.stacks.co/ecosystem/wallets',
        priority: 99
      }
    ];

    return wallets.sort((a, b) => a.priority - b.priority);
  }
  
  /**
   * Check if any supported wallets are detected
   * Note: This method returns false since service workers can't detect wallets directly
   * Real detection must be done via background script + content script communication
   */
  hasDetectedWallets(): boolean {
    return false; // Real detection happens via content script
  }

  /**
   * Detect available wallets via background script communication
   */
  async detectAvailableWallets(): Promise<{
    success: boolean;
    available: string[];
    xverse: boolean;
    leather: boolean;
    stacks: boolean;
    details?: Record<string, any>;
    error?: string;
  }> {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ action: 'detectWallets' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            success: false,
            available: [],
            xverse: false,
            leather: false,
            stacks: false,
            error: chrome.runtime.lastError.message
          });
          return;
        }
        
        resolve(response || {
          success: false,
          available: [],
          xverse: false,
          leather: false,
          stacks: false,
          error: 'No response from background script'
        });
      });
    });
  }
  
  /**
   * Get the best available wallet for connection
   */
  getBestAvailableWallet(): WalletInfo | null {
    const wallets = this.getAvailableWallets().filter(w => w.isDetected);
    return wallets.length > 0 ? wallets[0] : null;
  }
  
  /**
   * Connect to the best available wallet
   */
  async connectBestWallet(): Promise<WalletConnectionResult> {
    ConfigUtils.log('Starting wallet connection process...');
    
    const availableWallets = this.getAvailableWallets().filter(w => w.isDetected);
    
    if (availableWallets.length === 0) {
      return {
        success: false,
        error: 'No supported Stacks wallets found. Please install Xverse or Leather wallet.'
      };
    }
    
    // Try wallets in priority order
    for (const wallet of availableWallets) {
      try {
        ConfigUtils.log(`Attempting connection with ${wallet.name}...`);
        const result = await this.connectToWallet(wallet.id);
        
        if (result.success) {
          ConfigUtils.log(`Successfully connected to ${wallet.name}`);
          return result;
        } else {
          ConfigUtils.log(`Connection failed for ${wallet.name}:`, result.error);
        }
      } catch (error) {
        ConfigUtils.logError(`Error connecting to ${wallet.name}:`, error);
      }
    }
    
    return {
      success: false,
      error: 'Failed to connect to any available wallet. Please check your wallet is unlocked and try again.'
    };
  }
  
  /**
   * Connect to a specific wallet
   */
  async connectToWallet(walletId: 'xverse' | 'leather' | 'generic'): Promise<WalletConnectionResult> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]?.id) {
          resolve({
            success: false,
            error: 'No active tab found. Please navigate to a webpage and try again.'
          });
          return;
        }
        
        const tabId = tabs[0].id;
        
        // Send message to content script to handle wallet connection
        chrome.tabs.sendMessage(tabId, { 
          action: 'connectWallet', 
          preferredWallet: walletId 
        }, (response) => {
          if (chrome.runtime.lastError) {
            resolve({
              success: false,
              error: 'Cannot connect to wallet on this page. Please navigate to a regular website and try again.'
            });
            return;
          }
          
          if (response && response.success && response.walletData) {
            // Store wallet connection
            this.storeWalletConnection(response.walletData);
            
            resolve({
              success: true,
              wallet: response.walletData
            });
          } else {
            resolve({
              success: false,
              error: response?.error || 'Wallet connection failed'
            });
          }
        });
      });
    });
  }
  
  /**
   * Get stored wallet connection
   */
  async getStoredConnection(): Promise<WalletConnectionResult> {
    return new Promise((resolve) => {
      chrome.storage.local.get(['walletData', 'walletConnectedAt'], (result) => {
        if (result.walletData && result.walletConnectedAt) {
          // Check if connection is recent (within 24 hours)
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          const connectionAge = Date.now() - result.walletConnectedAt;
          
          if (connectionAge < maxAge) {
            resolve({
              success: true,
              wallet: result.walletData
            });
            return;
          }
        }
        
        resolve({
          success: false,
          error: 'No valid stored wallet connection found'
        });
      });
    });
  }
  
  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    return new Promise((resolve) => {
      chrome.storage.local.remove(['walletData', 'walletConnectedAt'], () => {
        ConfigUtils.log('Wallet disconnected');
        resolve();
      });
    });
  }
  
  /**
   * Validate wallet connection
   */
  async validateConnection(walletData: any): Promise<boolean> {
    if (!walletData?.address || !walletData?.provider) {
      return false;
    }
    
    // Basic Stacks address validation
    const addressRegex = /^[0-9A-Z]{28,41}$/;
    return addressRegex.test(walletData.address) && 
           (walletData.address.startsWith('SP') || 
            walletData.address.startsWith('SM') || 
            walletData.address.startsWith('ST'));
  }
  
  /**
   * Get wallet status for display
   */
  getWalletDisplayInfo(walletData: any): { 
    shortAddress: string; 
    network: string; 
    provider: string; 
    displayName: string; 
  } {
    const address = walletData?.address || '';
    const network = walletData?.network || 'testnet';
    const provider = walletData?.provider || 'unknown';
    const walletName = walletData?.walletName || 'Unknown Wallet';
    
    return {
      shortAddress: address ? `${address.slice(0, 8)}...${address.slice(-6)}` : '',
      network: network.charAt(0).toUpperCase() + network.slice(1),
      provider: provider.charAt(0).toUpperCase() + provider.slice(1),
      displayName: walletName
    };
  }
  
  /**
   * Get development recommendations
   */
  getDevelopmentInfo(): {
    network: string;
    faucetUrl: string;
    explorerUrl: string;
    recommendations: string[];
  } {
    const networkConfig = ConfigUtils.getNetwork();
    
    return {
      network: networkConfig.name,
      faucetUrl: networkConfig.name === 'testnet' 
        ? 'https://explorer.hiro.so/sandbox/faucet?chain=testnet' 
        : '',
      explorerUrl: networkConfig.explorerUrl,
      recommendations: config.isDevelopment ? [
        'Use testnet for development and testing',
        'Get free testnet STX from the faucet',
        'Test all features before mainnet deployment',
        'Check explorer for transaction status'
      ] : [
        'Using mainnet - real STX required',
        'Double-check all transactions',
        'Backup your wallet seed phrase',
        'Monitor gas fees and network status'
      ]
    };
  }
  
  
  private storeWalletConnection(walletData: any): void {
    chrome.storage.local.set({
      walletData,
      walletConnectedAt: Date.now()
    }, () => {
      ConfigUtils.log('Wallet connection stored');
    });
  }
}

// Export singleton instance
export const walletManager = WalletManager.getInstance();

// Utility functions for easy access
export const WalletUtils = {
  /**
   * Quick connection check
   */
  async isConnected(): Promise<boolean> {
    const result = await walletManager.getStoredConnection();
    return result.success;
  },
  
  /**
   * Get connection status
   */
  async getConnectionStatus(): Promise<{
    isConnected: boolean;
    walletInfo?: any;
    error?: string;
  }> {
    const result = await walletManager.getStoredConnection();
    return {
      isConnected: result.success,
      walletInfo: result.wallet,
      error: result.error
    };
  },
  
  /**
   * Format address for display
   */
  formatAddress(address: string, length = 16): string {
    if (!address || address.length <= length) return address;
    const start = Math.floor(length / 2);
    const end = length - start;
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  },
  
  /**
   * Get explorer URL for address
   */
  getAddressUrl(address: string): string {
    const network = config.network.name === 'mainnet' ? 'mainnet' : 'testnet';
    return `${config.network.explorerUrl}/address/${address}?chain=${network}`;
  }
};