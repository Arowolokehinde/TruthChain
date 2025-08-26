// Comprehensive wallet integration for TruthChain extension
// Supports Xverse and Leather wallets in both development and production

export interface WalletConnection {
  address: string;
  publicKey: string;
  provider: 'xverse' | 'leather' | 'demo';
  walletName: string;
  isConnected: boolean;
  network?: 'mainnet' | 'testnet';
}

export interface WalletProvider {
  request(method: string, params?: any): Promise<any>;
  on?(event: string, handler: Function): void;
  removeListener?(event: string, handler: Function): void;
}

// Window interface types handled in page-script.ts to avoid conflicts

export class WalletIntegration {
  private static instance: WalletIntegration;
  private connectedWallet: WalletConnection | null = null;
  private isProduction = process.env.NODE_ENV === 'production';
  
  private constructor() {}
  
  static getInstance(): WalletIntegration {
    if (!WalletIntegration.instance) {
      WalletIntegration.instance = new WalletIntegration();
    }
    return WalletIntegration.instance;
  }
  
  /**
   * Detect available wallet providers
   * Returns list of detected wallets
   */
  detectWallets(): string[] {
    const detected: string[] = [];
    
    try {
      // Check for Xverse
      if ((window as any).XverseProviders?.StacksProvider) {
        detected.push('xverse');
      }
      
      // Check for Leather
      if ((window as any).LeatherProvider) {
        detected.push('leather');
      }
      
      // Check for generic Stacks provider
      if ((window as any).StacksProvider) {
        detected.push('stacks');
      }
      
      console.log(`TruthChain: Detected wallets: ${detected.join(', ')}`);
    } catch (error) {
      console.error('Wallet detection error:', error);
    }
    
    return detected;
  }
  
  /**
   * Wait for wallet providers to inject into page
   * Uses polling with exponential backoff
   */
  async waitForWalletProviders(timeoutMs: number = 30000): Promise<string[]> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let pollInterval = 500; // Start with 500ms intervals
      
      const checkWallets = () => {
        const detected = this.detectWallets();
        
        if (detected.length > 0) {
          console.log(`TruthChain: Wallets found after ${Date.now() - startTime}ms`);
          resolve(detected);
          return;
        }
        
        // Check timeout
        if (Date.now() - startTime >= timeoutMs) {
          console.log('TruthChain: Wallet detection timeout');
          resolve([]);
          return;
        }
        
        // Continue polling with exponential backoff (max 2 seconds)
        pollInterval = Math.min(pollInterval * 1.1, 2000);
        setTimeout(checkWallets, pollInterval);
      };
      
      checkWallets();
    });
  }
  
  /**
   * Connect to the first available wallet
   * Prioritizes Xverse, then Leather, then generic providers
   */
  async connectWallet(): Promise<WalletConnection> {
    console.log('TruthChain: Starting wallet connection process...');
    
    // Wait for wallets to be available
    const availableWallets = await this.waitForWalletProviders(10000);
    
    if (availableWallets.length === 0) {
      throw new Error(
        'No Stacks wallets detected. Please install Xverse or Leather wallet and refresh the page.'
      );
    }
    
    // Try connecting to wallets in priority order
    const connectionAttempts = [
      () => this.connectXverse(),
      () => this.connectLeather(),
      () => this.connectGeneric(),
    ];
    
    let lastError: Error | null = null;
    
    for (const attemptConnection of connectionAttempts) {
      try {
        const connection = await attemptConnection();
        this.connectedWallet = connection;
        
        // Store connection for persistence
        await this.storeWalletConnection(connection);
        
        console.log(`TruthChain: Successfully connected to ${connection.walletName}`);
        return connection;
      } catch (error) {
        lastError = error as Error;
        console.log(`Connection attempt failed: ${(error as Error).message}`);
        
        // If user explicitly rejected, don't try other wallets
        if ((error as Error).message?.includes('User rejected') || 
            (error as Error).message?.includes('denied') ||
            (error as Error).message?.includes('cancelled')) {
          throw error;
        }
      }
    }
    
    // If all connections failed and we're in development, offer demo mode
    if (!this.isProduction) {
      console.log('TruthChain: Offering demo mode for development');
      return this.getDemoConnection();
    }
    
    throw lastError || new Error('Failed to connect to any wallet');
  }
  
  /**
   * Connect to Xverse wallet
   */
  private async connectXverse(): Promise<WalletConnection> {
    if (!(window as any).XverseProviders?.StacksProvider) {
      throw new Error('Xverse provider not found');
    }
    
    const provider = (window as any).XverseProviders.StacksProvider;
    
    try {
      // Request account access
      const accounts = await provider.request('stx_requestAccounts');
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts available in Xverse');
      }
      
      // Get address information
      const addressInfo = await provider.request('stx_getAddresses');
      
      if (!addressInfo?.addresses?.length) {
        throw new Error('Could not retrieve address information');
      }
      
      const address = addressInfo.addresses[0];
      
      return {
        address: address.address,
        publicKey: address.publicKey || this.generateFallbackPublicKey('xverse'),
        provider: 'xverse',
        walletName: 'Xverse',
        isConnected: true,
        network: this.isProduction ? 'mainnet' : 'testnet'
      };
    } catch (error) {
      console.error('Xverse connection failed:', error);
      throw new Error(`Xverse connection failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Connect to Leather wallet
   */
  private async connectLeather(): Promise<WalletConnection> {
    if (!(window as any).LeatherProvider) {
      throw new Error('Leather provider not found');
    }
    
    const provider = (window as any).LeatherProvider;
    
    try {
      const result = await provider.request('stx_requestAccounts');
      
      if (!result) {
        throw new Error('No response from Leather wallet');
      }
      
      // Handle different response formats from Leather
      let address: string;
      let publicKey: string = this.generateFallbackPublicKey('leather');
      
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
        address,
        publicKey,
        provider: 'leather',
        walletName: 'Leather',
        isConnected: true,
        network: this.isProduction ? 'mainnet' : 'testnet'
      };
    } catch (error) {
      console.error('Leather connection failed:', error);
      throw new Error(`Leather connection failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Connect to generic Stacks provider (fallback)
   */
  private async connectGeneric(): Promise<WalletConnection> {
    if (!(window as any).StacksProvider) {
      throw new Error('Generic Stacks provider not found');
    }
    
    const provider = (window as any).StacksProvider;
    
    try {
      const accounts = await provider.request('stx_requestAccounts');
      const address = Array.isArray(accounts) ? accounts[0] : accounts;
      
      return {
        address,
        publicKey: this.generateFallbackPublicKey('generic'),
        provider: 'demo', // Mark as demo since we can't determine the actual provider
        walletName: 'Stacks Wallet',
        isConnected: true,
        network: this.isProduction ? 'mainnet' : 'testnet'
      };
    } catch (error) {
      console.error('Generic provider connection failed:', error);
      throw new Error(`Generic provider connection failed: ${(error as Error).message}`);
    }
  }
  
  /**
   * Get demo connection for development
   */
  private getDemoConnection(): WalletConnection {
    return {
      address: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
      publicKey: this.generateFallbackPublicKey('demo'),
      provider: 'demo',
      walletName: 'Demo Mode (Development)',
      isConnected: true,
      network: 'testnet'
    };
  }
  
  /**
   * Store wallet connection for persistence
   */
  private async storeWalletConnection(connection: WalletConnection): Promise<void> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.local.set({ 
          walletData: connection,
          walletConnectedAt: Date.now()
        });
      } catch (error) {
        console.warn('Could not store wallet connection:', error);
      }
    }
  }
  
  /**
   * Retrieve stored wallet connection
   */
  async getStoredWalletConnection(): Promise<WalletConnection | null> {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        const result = await chrome.storage.local.get(['walletData', 'walletConnectedAt']);
        
        if (result.walletData && result.walletConnectedAt) {
          // Check if connection is recent (within 24 hours)
          const maxAge = 24 * 60 * 60 * 1000; // 24 hours
          const connectionAge = Date.now() - result.walletConnectedAt;
          
          if (connectionAge < maxAge) {
            this.connectedWallet = result.walletData;
            return result.walletData;
          }
        }
      } catch (error) {
        console.warn('Could not retrieve stored wallet connection:', error);
      }
    }
    
    return null;
  }
  
  /**
   * Disconnect wallet
   */
  async disconnectWallet(): Promise<void> {
    this.connectedWallet = null;
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      try {
        await chrome.storage.local.remove(['walletData', 'walletConnectedAt']);
      } catch (error) {
        console.warn('Could not clear wallet storage:', error);
      }
    }
  }
  
  /**
   * Get current wallet connection
   */
  getCurrentConnection(): WalletConnection | null {
    return this.connectedWallet;
  }
  
  /**
   * Generate fallback public key when wallet doesn't provide one
   */
  private generateFallbackPublicKey(provider: string): string {
    const timestamp = Date.now().toString();
    return `${provider}-fallback-pubkey-${timestamp}`;
  }
  
  /**
   * Validate wallet connection
   */
  async validateConnection(connection: WalletConnection): Promise<boolean> {
    try {
      // Basic validation
      if (!connection.address || !connection.provider) {
        return false;
      }
      
      // For production, we might want to verify the connection is still active
      if (this.isProduction) {
        // TODO: Add actual wallet connectivity check
        return true;
      }
      
      return true;
    } catch (error) {
      console.error('Connection validation failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const walletIntegration = WalletIntegration.getInstance();

// Export utility functions for use in content scripts and background scripts
export const WalletUtils = {
  /**
   * Get network configuration based on environment
   */
  getNetworkConfig() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    return {
      network: isProduction ? 'mainnet' : 'testnet',
      apiUrl: isProduction 
        ? 'https://api.mainnet.hiro.so'
        : 'https://api.testnet.hiro.so',
      explorerUrl: isProduction
        ? 'https://explorer.hiro.so'
        : 'https://explorer.hiro.so',
      contractAddress: isProduction
        ? 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9' // Replace with actual mainnet address
        : 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM'
    };
  },
  
  /**
   * Format wallet address for display
   */
  formatAddress(address: string, length: number = 12): string {
    if (!address || address.length <= length) {
      return address;
    }
    
    const start = address.slice(0, length / 2);
    const end = address.slice(-length / 2);
    return `${start}...${end}`;
  },
  
  /**
   * Check if address is valid Stacks address
   */
  isValidStacksAddress(address: string): boolean {
    return /^[0-9A-Z]{28,41}$/.test(address) && 
           (address.startsWith('SP') || address.startsWith('SM') || address.startsWith('ST'));
  }
};