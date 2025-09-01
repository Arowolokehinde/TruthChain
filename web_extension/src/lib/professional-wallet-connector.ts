// Professional-grade wallet connection system
// Addresses known issues with @stacks/connect v8 and Xverse detection

import { getAddress } from 'sats-connect';

interface WalletConnectionResult {
  success: boolean;
  address?: string;
  publicKey?: string;
  provider?: string;
  walletName?: string;
  network?: string;
  error?: string;
}

interface XverseProvider {
  request: (method: string, params?: any) => Promise<any>;
}

interface WindowWithProviders {
  XverseProviders?: any;
  LeatherProvider?: any;
  StacksProvider?: any;
  // Alternative naming patterns observed in production
  xverseProviders?: any;
  stacksProvider?: any;
  xverseProvider?: any;
}

export class ProfessionalWalletConnector {
  private static instance: ProfessionalWalletConnector;
  private detectionAttempts: number = 0;
  private maxDetectionAttempts: number = 60; // 30 seconds with 500ms intervals

  static getInstance(): ProfessionalWalletConnector {
    if (!ProfessionalWalletConnector.instance) {
      ProfessionalWalletConnector.instance = new ProfessionalWalletConnector();
    }
    return ProfessionalWalletConnector.instance;
  }

  /**
   * Professional-grade wallet connection using multiple methods
   * Method 1: Sats Connect (Recommended for Xverse)
   * Method 2: Direct XverseProviders detection with retry logic
   * Method 3: @stacks/connect v7 fallback
   */
  async connectWallet(): Promise<WalletConnectionResult> {
    console.log('🔗 Professional Wallet Connector: Starting multi-method connection...');

    // Method 1: Try Sats Connect (most reliable for Xverse in 2024)
    try {
      const satsResult = await this.connectViaSatsConnect();
      if (satsResult.success) {
        console.log('✅ Connected via Sats Connect');
        return satsResult;
      }
    } catch (error) {
      console.log('❌ Sats Connect failed:', error);
    }

    // Method 2: Direct provider detection with enhanced retry logic
    try {
      const directResult = await this.connectViaDirectProvider();
      if (directResult.success) {
        console.log('✅ Connected via Direct Provider');
        return directResult;
      }
    } catch (error) {
      console.log('❌ Direct Provider failed:', error);
    }

    // Method 3: @stacks/connect v7 fallback
    try {
      const stacksResult = await this.connectViaStacksConnect();
      if (stacksResult.success) {
        console.log('✅ Connected via @stacks/connect');
        return stacksResult;
      }
    } catch (error) {
      console.log('❌ @stacks/connect failed:', error);
    }

    return {
      success: false,
      error: 'All connection methods failed. Please ensure Xverse wallet is installed, unlocked, and up-to-date.'
    };
  }

  /**
   * Method 1: Sats Connect - Most reliable for Xverse in 2024
   */
  private async connectViaSatsConnect(): Promise<WalletConnectionResult> {
    console.log('🎯 Attempting Sats Connect method...');
    
    try {
      const response: any = await getAddress({
        payload: {
          purposes: ['payment' as any, 'ordinals' as any, 'stacks' as any],
          message: 'Connect your Xverse wallet to TruthChain',
          network: {
            type: 'Mainnet' as any
          }
        },
        onFinish: (response: any) => {
          console.log('Sats Connect response:', response);
        },
        onCancel: () => {
          throw new Error('User cancelled connection');
        },
      });

      if (response?.addresses?.length > 0) {
        // Find Stacks address
        const stacksAddress = response.addresses.find(
          (addr: any) => addr.purpose === 'stacks'
        );
        
        if (stacksAddress) {
          return {
            success: true,
            address: stacksAddress.address,
            publicKey: stacksAddress.publicKey || `sats-connect-${Date.now()}`,
            provider: 'xverse',
            walletName: 'Xverse Wallet',
            network: 'mainnet'
          };
        }
      }

      throw new Error('No Stacks address found in response');
    } catch (error) {
      throw new Error(`Sats Connect failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Method 2: Direct provider detection with professional retry logic
   */
  private async connectViaDirectProvider(): Promise<WalletConnectionResult> {
    console.log('🎯 Attempting direct provider detection...');

    // Enhanced provider detection with retry logic
    const provider = await this.detectXverseProvider();
    
    if (!provider) {
      throw new Error('Xverse provider not detected after retry attempts');
    }

    try {
      // Request accounts
      const accounts = await provider.request('stx_requestAccounts');
      console.log('Direct provider accounts:', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from provider');
      }

      // Try to get detailed address info
      let addressInfo;
      try {
        addressInfo = await provider.request('stx_getAddresses');
      } catch (e) {
        // Fallback to basic account info
        addressInfo = { addresses: [{ address: accounts[0] }] };
      }

      const primaryAddress = addressInfo.addresses?.[0];
      if (!primaryAddress?.address) {
        throw new Error('Could not extract address from provider response');
      }

      return {
        success: true,
        address: primaryAddress.address,
        publicKey: primaryAddress.publicKey || `xverse-direct-${Date.now()}`,
        provider: 'xverse',
        walletName: 'Xverse Wallet',
        network: 'mainnet'
      };
    } catch (error) {
      throw new Error(`Direct provider connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhanced provider detection with multiple patterns and retry logic
   */
  private async detectXverseProvider(): Promise<XverseProvider | null> {
    return new Promise((resolve) => {
      const checkProvider = () => {
        this.detectionAttempts++;
        const win = window as WindowWithProviders;

        // Check all known patterns for Xverse injection
        const patterns = [
          () => win.XverseProviders?.StacksProvider,
          () => win.xverseProviders?.StacksProvider,
          () => win.stacksProvider,
          () => win.xverseProvider,
          // Additional patterns observed in production
          () => (win as any).xverse?.stacks,
          () => (win as any).Xverse?.StacksProvider,
        ];

        for (const pattern of patterns) {
          try {
            const provider = pattern();
            if (provider && typeof provider.request === 'function') {
              console.log(`🎉 Found Xverse provider (pattern ${patterns.indexOf(pattern) + 1})`);
              resolve(provider);
              return;
            }
          } catch (e) {
            // Continue to next pattern
          }
        }

        // Continue retrying if under limit
        if (this.detectionAttempts < this.maxDetectionAttempts) {
          setTimeout(checkProvider, 500);
        } else {
          console.log(`❌ Xverse provider not found after ${this.maxDetectionAttempts} attempts`);
          resolve(null);
        }
      };

      checkProvider();
    });
  }

  /**
   * Method 3: @stacks/connect v7 fallback
   */
  private async connectViaStacksConnect(): Promise<WalletConnectionResult> {
    console.log('🎯 Attempting @stacks/connect fallback...');

    try {
      // Import @stacks/connect dynamically
      const { showConnect } = await import('@stacks/connect');
      
      const response: any = await new Promise((resolve, reject) => {
        showConnect({
          appDetails: {
            name: 'TruthChain',
            icon: 'https://truthchain.app/icon.png',
          },
          onFinish: (data: any) => {
            resolve(data);
          },
          onCancel: () => {
            reject(new Error('User cancelled connection'));
          },
          userSession: undefined
        });
      });
      
      if (response?.userSession?.loadUserData) {
        const userData = response.userSession.loadUserData();
        const address = userData.profile?.stxAddress?.mainnet || userData.profile?.stxAddress?.testnet;
        
        if (address) {
          return {
            success: true,
            address: address,
            publicKey: userData.publicKey || `stacks-connect-${Date.now()}`,
            provider: 'stacks-connect',
            walletName: 'Stacks Wallet',
            network: 'mainnet'
          };
        }
      }

      throw new Error('No addresses returned from @stacks/connect');
    } catch (error) {
      throw new Error(`@stacks/connect failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detect available wallets without connecting
   */
  async detectWallets(): Promise<{ available: string[]; xverse: boolean; leather: boolean }> {
    const available: string[] = [];
    let xverse = false;
    let leather = false;

    // Check for Xverse
    const xverseProvider = await this.detectXverseProvider();
    if (xverseProvider) {
      available.push('xverse');
      xverse = true;
    }

    // Check for Leather
    const win = window as WindowWithProviders;
    if (win.LeatherProvider && typeof win.LeatherProvider.request === 'function') {
      available.push('leather');
      leather = true;
    }

    return { available, xverse, leather };
  }
}

// Export singleton instance
export const professionalWalletConnector = ProfessionalWalletConnector.getInstance();