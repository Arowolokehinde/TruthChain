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
   * Method 1: Direct XverseProviders detection (Most reliable for Xverse 1.3.0+)
   * Method 2: Sats Connect fallback
   * Method 3: @stacks/connect v7 (last resort, bypasses modal issues)
   */
  async connectWallet(): Promise<WalletConnectionResult> {
    console.log('🔗 Professional Wallet Connector: Starting multi-method connection...');
    console.log('🎯 Prioritizing direct provider detection for Xverse 1.3.0+');

    // Method 1: Direct provider detection FIRST (most reliable for Xverse 1.3.0+)
    try {
      console.log('🚀 Attempting direct provider detection (Method 1)...');
      const directResult = await this.connectViaDirectProvider();
      if (directResult.success) {
        console.log('✅ Connected via Direct Provider Detection');
        return directResult;
      }
    } catch (error) {
      console.log('❌ Direct Provider failed:', error);
    }

    // Method 2: Try Sats Connect as fallback
    try {
      console.log('🚀 Attempting Sats Connect (Method 2)...');
      const satsResult = await this.connectViaSatsConnect();
      if (satsResult.success) {
        console.log('✅ Connected via Sats Connect');
        return satsResult;
      }
    } catch (error) {
      console.log('❌ Sats Connect failed:', error);
    }

    // Method 3: @stacks/connect with modal bypass (last resort)
    try {
      console.log('🚀 Attempting @stacks/connect with modal bypass (Method 3)...');
      const stacksResult = await this.connectViaStacksConnectDirect();
      if (stacksResult.success) {
        console.log('✅ Connected via @stacks/connect direct');
        return stacksResult;
      }
    } catch (error) {
      console.log('❌ @stacks/connect direct failed:', error);
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
      // Add timeout for sats-connect
      const response: any = await Promise.race([
        getAddress({
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
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Sats Connect timeout after 30 seconds')), 30000)
        )
      ]);

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
   * Method 1: Direct provider detection with professional retry logic (Enhanced for Xverse 1.3.0)
   */
  private async connectViaDirectProvider(): Promise<WalletConnectionResult> {
    console.log('🎯 Attempting enhanced direct provider detection for Xverse 1.3.0+...');

    // Reset detection attempts for this connection attempt
    this.detectionAttempts = 0;

    // Enhanced provider detection with retry logic
    const provider = await this.detectXverseProvider();
    
    if (!provider) {
      console.log('❌ No Xverse provider detected. Trying immediate window injection check...');
      
      // Try immediate check for recently injected providers
      const win = window as any;
      const immediateProvider = win.XverseProviders?.StacksProvider || 
                              win.StacksProvider || 
                              win.stacksProvider;
      
      if (immediateProvider && typeof immediateProvider.request === 'function') {
        console.log('🎉 Found immediate provider injection!');
        return await this.connectToProvider(immediateProvider);
      }
      
      throw new Error('Xverse provider not detected. Ensure Xverse wallet is installed, unlocked, and properly injected.');
    }

    return await this.connectToProvider(provider);
  }

  /**
   * Helper method to connect to a detected provider
   */
  private async connectToProvider(provider: XverseProvider): Promise<WalletConnectionResult> {
    console.log('🔗 Connecting to detected provider...');
    
    try {
      // Request accounts with timeout
      console.log('📝 Requesting wallet accounts...');
      const accountsPromise = provider.request('stx_requestAccounts');
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Account request timeout after 15 seconds')), 15000)
      );
      
      const accounts = await Promise.race([accountsPromise, timeoutPromise]);
      console.log('✅ Direct provider accounts received:', accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from provider - wallet may be locked');
      }

      // Try to get detailed address info with fallback
      let addressInfo;
      try {
        console.log('📍 Requesting detailed address information...');
        addressInfo = await provider.request('stx_getAddresses');
        console.log('✅ Address info received:', addressInfo);
      } catch (e) {
        console.log('⚠️ Detailed address request failed, using fallback:', e);
        // Fallback to basic account info
        addressInfo = { addresses: [{ address: accounts[0] }] };
      }

      const primaryAddress = addressInfo.addresses?.[0];
      if (!primaryAddress?.address) {
        throw new Error('Could not extract valid address from provider response');
      }

      console.log('🎉 Successfully connected via direct provider!');
      console.log('📍 Address:', primaryAddress.address);

      return {
        success: true,
        address: primaryAddress.address,
        publicKey: primaryAddress.publicKey || `xverse-direct-${Date.now()}`,
        provider: 'xverse',
        walletName: 'Xverse Wallet',
        network: 'mainnet'
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Direct provider connection failed:', errorMsg);
      throw new Error(`Direct provider connection failed: ${errorMsg}`);
    }
  }

  /**
   * Enhanced provider detection with multiple patterns and retry logic
   * Updated for Xverse v1.3.0 injection patterns
   */
  private async detectXverseProvider(): Promise<XverseProvider | null> {
    return new Promise((resolve) => {
      const checkProvider = () => {
        this.detectionAttempts++;
        const win = window as any;

        // Log available providers for debugging
        console.log('🔍 Checking available providers:', {
          XverseProviders: !!win.XverseProviders,
          xverseProviders: !!win.xverseProviders,
          stacksProvider: !!win.stacksProvider,
          xverseProvider: !!win.xverseProvider,
          xverse: !!win.xverse,
          Xverse: !!win.Xverse,
          // New patterns for Xverse 1.3.0
          LeatherProvider: !!win.LeatherProvider,
          HiroWalletProvider: !!win.HiroWalletProvider
        });

        // Check all known patterns for Xverse injection (Updated for v1.3.0)
        const patterns = [
          // Xverse 1.3.0+ patterns
          () => win.XverseProviders?.StacksProvider,
          () => win.XverseProviders?.BitcoinProvider?.stacksProvider,
          () => win.StacksProvider, // Direct injection pattern
          () => win.stacksProvider, // Legacy pattern
          
          // Alternative patterns
          () => win.xverseProviders?.StacksProvider,
          () => win.xverseProvider,
          () => win.xverse?.stacks,
          () => win.Xverse?.StacksProvider,
          
          // Provider discovery patterns
          () => {
            // Check if any provider has stacks methods
            const providers = [win.XverseProviders, win.xverseProviders, win.stacksProvider];
            for (const provider of providers) {
              if (provider && typeof provider === 'object') {
                // Look for stacks-specific methods
                const stacksMethods = ['stx_requestAccounts', 'stx_getAddresses', 'request'];
                for (const method of stacksMethods) {
                  if (typeof provider[method] === 'function' || 
                      (provider.StacksProvider && typeof provider.StacksProvider.request === 'function')) {
                    return provider.StacksProvider || provider;
                  }
                }
              }
            }
            return null;
          },
          
          // Fallback: Search for any object with stacks methods
          () => {
            const keys = Object.keys(win).filter(key => 
              key.toLowerCase().includes('xverse') || 
              key.toLowerCase().includes('stacks') ||
              key.toLowerCase().includes('provider')
            );
            
            for (const key of keys) {
              try {
                const obj = win[key];
                if (obj && typeof obj.request === 'function') {
                  return obj;
                }
                if (obj && obj.StacksProvider && typeof obj.StacksProvider.request === 'function') {
                  return obj.StacksProvider;
                }
              } catch (e) {
                // Continue
              }
            }
            return null;
          }
        ];

        for (let i = 0; i < patterns.length; i++) {
          try {
            const provider = patterns[i]();
            if (provider && typeof provider.request === 'function') {
              console.log(`🎉 Found Xverse provider (pattern ${i + 1}/StacksProvider)`);
              console.log('Provider details:', {
                type: typeof provider,
                methods: Object.getOwnPropertyNames(provider).filter(name => typeof provider[name] === 'function')
              });
              resolve(provider);
              return;
            }
          } catch (e) {
            console.log(`Pattern ${i + 1} failed:`, e);
            // Continue to next pattern
          }
        }

        // Continue retrying if under limit
        if (this.detectionAttempts < this.maxDetectionAttempts) {
          setTimeout(checkProvider, 500);
        } else {
          console.log(`❌ Xverse provider not found after ${this.maxDetectionAttempts} attempts`);
          console.log('Available window properties:', Object.keys(win).filter(k => 
            k.toLowerCase().includes('xverse') || 
            k.toLowerCase().includes('stacks') || 
            k.toLowerCase().includes('provider')
          ));
          resolve(null);
        }
      };

      checkProvider();
    });
  }

  // Note: Original modal approach disabled due to detection issues
  // Will be re-enabled if needed for specific use cases

  /**
   * Method 4: @stacks/connect direct provider bypass (avoids modal detection issues)
   */
  private async connectViaStacksConnectDirect(): Promise<WalletConnectionResult> {
    console.log('🎯 Attempting @stacks/connect with direct provider bypass...');

    try {
      // First detect if we have any provider available
      const provider = await this.detectXverseProvider();
      if (!provider) {
        throw new Error('No wallet provider detected for direct bypass');
      }

      console.log('🔍 Provider detected, attempting direct @stacks/connect integration...');

      // Import @stacks/connect and auth
      const { authenticate } = await import('@stacks/connect');
      const { UserSession } = await import('@stacks/auth');
      
      // Create a user session
      const userSession = new UserSession();
      
      // Try authentication approach instead of showConnect
      const authOptions = {
        appDetails: {
          name: 'TruthChain',
          icon: 'https://truthchain.app/icon.png',
        },
        userSession,
        onFinish: (data: any) => {
          console.log('Auth finished:', data);
        },
        onCancel: () => {
          console.log('Auth cancelled');
        }
      };

      // Use authenticate instead of showConnect to bypass modal
      const authResult = await new Promise<any>((resolve, reject) => {
        authenticate({
          ...authOptions,
          onFinish: (data: any) => {
            console.log('Direct auth result:', data);
            resolve(data);
          },
          onCancel: () => {
            reject(new Error('User cancelled direct authentication'));
          }
        });
      });

      if (authResult?.userSession?.loadUserData) {
        const userData = authResult.userSession.loadUserData();
        const address = userData.profile?.stxAddress?.mainnet || userData.profile?.stxAddress?.testnet;
        
        if (address) {
          return {
            success: true,
            address: address,
            publicKey: userData.publicKey || `stacks-direct-${Date.now()}`,
            provider: 'stacks-direct',
            walletName: 'Xverse Wallet (via Stacks)',
            network: 'mainnet'
          };
        }
      }

      throw new Error('No addresses returned from direct @stacks/connect');
    } catch (error) {
      throw new Error(`Direct @stacks/connect failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    const win = window as any;
    if (win.LeatherProvider && typeof win.LeatherProvider.request === 'function') {
      available.push('leather');
      leather = true;
    }

    return { available, xverse, leather };
  }

  /**
   * Debug method to analyze provider injection
   */
  debugProviderInjection(): void {
    const win = window as any;
    console.log('🔍 TruthChain Provider Debug Analysis:');
    console.log('Chrome Version:', navigator.userAgent);
    
    // Check all possible provider locations
    const checks = {
      'XverseProviders': win.XverseProviders,
      'XverseProviders.StacksProvider': win.XverseProviders?.StacksProvider,
      'XverseProviders.BitcoinProvider': win.XverseProviders?.BitcoinProvider,
      'StacksProvider (direct)': win.StacksProvider,
      'stacksProvider (legacy)': win.stacksProvider,
      'xverseProviders': win.xverseProviders,
      'xverseProvider': win.xverseProvider,
      'xverse.stacks': win.xverse?.stacks,
      'LeatherProvider': win.LeatherProvider,
    };

    for (const [name, provider] of Object.entries(checks)) {
      if (provider) {
        console.log(`✅ ${name}:`, {
          type: typeof provider,
          hasRequest: typeof provider.request === 'function',
          methods: typeof provider === 'object' ? Object.getOwnPropertyNames(provider) : 'N/A'
        });
      } else {
        console.log(`❌ ${name}: Not found`);
      }
    }

    // Search for any wallet-like objects
    const walletKeys = Object.keys(win).filter(key => 
      key.toLowerCase().includes('xverse') || 
      key.toLowerCase().includes('stacks') || 
      key.toLowerCase().includes('provider') ||
      key.toLowerCase().includes('wallet')
    );
    
    console.log('🔎 Wallet-related window properties:', walletKeys);
    
    // Check if extension is properly loaded
    const extensionCheck = document.querySelector('script[src*="xverse"]') || 
                          document.querySelector('script[src*="extension"]');
    console.log('📦 Extension script injection:', !!extensionCheck);
  }
}

// Export singleton instance
export const professionalWalletConnector = ProfessionalWalletConnector.getInstance();