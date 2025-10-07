// Advanced wallet bridge that properly detects Stacks wallets in 2024/2025
// Uses the same proven patterns from professional-wallet-connector.ts

export interface WalletInfo {
  name: string;
  provider: string;
  isInstalled: boolean;
  version?: string;
  icon?: string;
}

export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  publicKey?: string;
  provider?: string;
  walletName?: string;
  network?: string;
  error?: string;
}

// Define custom types for sats-connect response
interface AddressInfo {
  purpose: string;
  address: string;
  publicKey?: string;
}

interface SatsConnectResponse {
  addresses: AddressInfo[];
}

export class AdvancedWalletBridge {
  private static instance: AdvancedWalletBridge;
  
  static getInstance(): AdvancedWalletBridge {
    if (!AdvancedWalletBridge.instance) {
      AdvancedWalletBridge.instance = new AdvancedWalletBridge();
    }
    return AdvancedWalletBridge.instance;
  }

  /**
   * Detect available Stacks wallets using multiple detection methods
   */
  async detectWallets(): Promise<WalletInfo[]> {
    console.log('🔍 Advanced wallet detection starting...');
    
    const detectedWallets: WalletInfo[] = [];
    
    try {
      // Method 1: Direct window object inspection
      const windowWallets = await this.detectWindowWallets();
      detectedWallets.push(...windowWallets);
      
      // Method 2: Extension manifest checking
      const extensionWallets = await this.detectInstalledExtensions();
      detectedWallets.push(...extensionWallets);
      
    } catch (error) {
      console.error('Wallet detection failed:', error);
    }
    
    // Remove duplicates and return
    const uniqueWallets = this.deduplicateWallets(detectedWallets);
    console.log('✅ Detected wallets:', uniqueWallets);
    return uniqueWallets;
  }

  /**
   * Method 1: Direct window object inspection
   */
  private async detectWindowWallets(): Promise<WalletInfo[]> {
    return new Promise((resolve) => {
      const wallets: WalletInfo[] = [];
      const win = window as unknown as Record<string, unknown>;
      
      // Check for Xverse (multiple detection patterns)
      const hasXverse = !!(
        (win.XverseProviders && typeof win.XverseProviders === 'object') ||
        win.StacksProvider ||
        win.xverse
      );
      
      if (hasXverse) {
        wallets.push({
          name: 'Xverse',
          provider: 'xverse',
          isInstalled: true,
          icon: 'https://www.xverse.app/favicon.ico'
        });
      }
      
      // Check for Leather
      const hasLeather = !!(win.LeatherProvider || win.HiroWalletProvider);
      
      if (hasLeather) {
        wallets.push({
          name: 'Leather',
          provider: 'leather',
          isInstalled: true,
          icon: 'https://leather.io/favicon.ico'
        });
      }
      
      resolve(wallets);
    });
  }

  /**
   * Method 2: Extension manifest checking via chrome.management API
   */
  private async detectInstalledExtensions(): Promise<WalletInfo[]> {
    const wallets: WalletInfo[] = [];
    
    try {
      if (typeof chrome !== 'undefined' && chrome.management) {
        const extensions = await chrome.management.getAll();
        
        for (const ext of extensions) {
          if (ext.enabled) {
            // Xverse extension ID patterns
            if (ext.id === 'idkppnahnmmggbmfkajkgdgepeaakbel' || 
                ext.name?.toLowerCase().includes('xverse')) {
              wallets.push({
                name: 'Xverse',
                provider: 'xverse',
                isInstalled: true,
                version: ext.version
              });
            }
            
            // Leather extension ID patterns
            if (ext.id === 'ldinpeekobnhjjdofggfgjlcehhmanlj' || 
                ext.name?.toLowerCase().includes('leather') ||
                ext.name?.toLowerCase().includes('hiro')) {
              wallets.push({
                name: 'Leather',
                provider: 'leather', 
                isInstalled: true,
                version: ext.version
              });
            }
          }
        }
      }
    } catch (error) {
      console.log('Chrome management API not available:', error);
    }
    
    return wallets;
  }

  /**
   * Remove duplicate wallet entries
   */
  private deduplicateWallets(wallets: WalletInfo[]): WalletInfo[] {
    const seen = new Set<string>();
    return wallets.filter(wallet => {
      const key = wallet.provider;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * Connect to a specific wallet
   */
  async connectWallet(provider: string): Promise<WalletConnectionResult> {
    console.log(`🔗 Connecting to ${provider}...`);
    
    switch (provider) {
      case 'xverse':
        return await this.connectXverse();
      case 'leather':
        return await this.connectLeather();
      default:
        return {
          success: false,
          error: `Unsupported wallet provider: ${provider}`
        };
    }
  }

  /**
   * Connect to Xverse wallet using latest API
   * Uses same method as professional-wallet-connector.ts
   */
  private async connectXverse(): Promise<WalletConnectionResult> {
    try {
      // Method 1: Try sats-connect (most reliable for 2024/2025)
      try {
        const { getAddress } = await import('sats-connect');
        
        const response = await new Promise<SatsConnectResponse>((resolve, reject) => {
          getAddress({
            payload: {
              purposes: ['payment' as never, 'ordinals' as never, 'stacks' as never],
              message: 'Connect your Xverse wallet to TruthChain',
              network: {
                type: 'Mainnet' as never
              }
            },
            onFinish: (response: SatsConnectResponse) => {
              resolve(response);
            },
            onCancel: () => {
              reject(new Error('User cancelled connection'));
            },
          });
        });

        const stacksAddress = response.addresses?.find(
          (addr: AddressInfo) => addr.purpose === 'stacks'
        );
        
        if (stacksAddress) {
          return {
            success: true,
            address: stacksAddress.address,
            publicKey: stacksAddress.publicKey || `xverse-${Date.now()}`,
            provider: 'xverse',
            walletName: 'Xverse Wallet',
            network: 'mainnet'
          };
        }
        
        throw new Error('No Stacks address found in response');
      } catch (satsError) {
        console.log('Sats-connect failed, trying direct provider...', satsError);
      }

      // Method 2: Direct provider access
      const win = window as unknown as Record<string, unknown>;
      const xverseProviders = win.XverseProviders as { StacksProvider?: { request: (method: string) => Promise<unknown> } } | undefined;
      const provider = xverseProviders?.StacksProvider || 
                      (win.StacksProvider as { request: (method: string) => Promise<unknown> } | undefined);
      
      if (provider && typeof provider.request === 'function') {
        const accounts = await provider.request('stx_requestAccounts') as string[];
        if (accounts && accounts.length > 0) {
          const addressInfo = await provider.request('stx_getAddresses') as { addresses: Array<{ address: string; publicKey?: string }> };
          const primaryAddress = addressInfo?.addresses?.[0];
          
          if (primaryAddress) {
            return {
              success: true,
              address: primaryAddress.address,
              publicKey: primaryAddress.publicKey || `xverse-direct-${Date.now()}`,
              provider: 'xverse',
              walletName: 'Xverse Wallet',
              network: 'mainnet'
            };
          }
        }
      }

      throw new Error('Xverse wallet not accessible');
    } catch (error) {
      return {
        success: false,
        error: `Xverse connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Connect to Leather wallet
   */
  private async connectLeather(): Promise<WalletConnectionResult> {
    try {
      const win = window as unknown as Record<string, unknown>;
      const provider = (win.LeatherProvider || win.HiroWalletProvider) as { request: (method: string) => Promise<unknown> } | undefined;
      
      if (!provider) {
        throw new Error('Leather wallet not found');
      }

      const result = await provider.request('stx_requestAccounts') as string | { addresses: string[] };
      
      if (result) {
        let address = result as string;
        if (typeof result === 'object' && 'addresses' in result && Array.isArray(result.addresses)) {
          address = result.addresses[0];
        }
        
        return {
          success: true,
          address: address,
          publicKey: `leather-${Date.now()}`,
          provider: 'leather',
          walletName: 'Leather Wallet',
          network: 'mainnet'
        };
      }

      throw new Error('No account returned from Leather');
    } catch (error) {
      return {
        success: false,
        error: `Leather connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

export default AdvancedWalletBridge;
