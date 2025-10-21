// This script runs in the MAIN world context and can access window.XverseProviders
// It communicates with the content script via window.postMessage

console.log('TruthChain: Page script loaded in MAIN world');

// Network configuration - set to mainnet
const NETWORK_CONFIG = {
  name: 'mainnet',
  stacksApi: 'https://api.mainnet.hiro.so',
  explorerUrl: 'https://explorer.hiro.so',
  contractAddress: 'SP1S7KX8TVSAWJ8CVJZQSFERBQ8BNCDXYFHXT21Z9',
  contractName: 'truthchain_v1'
};

// Import advanced wallet detector functionality

interface WalletDetectionResult {
  name: string;
  provider: string;
  detected: boolean;
  available: boolean;
  version?: string;
  methods?: string[];
}

interface WalletConnectionResult {
  success: boolean;
  provider: string;
  address: string;
  publicKey: string;
  network?: string;
  error?: string;
}

interface LegacyWalletDetectionResult {
  providers: Record<string, WalletProviderInfo>;
  timestamp: number;
}

interface WalletProviderInfo {
  name: string;
  isDetected: boolean;
  provider?: any;
}

// Advanced Wallet Detector Class
class AdvancedWalletDetector {
  private detectionAttempts = 0;
  private maxAttempts = 50; // 50 attempts over 25 seconds
  private detectionInterval: NodeJS.Timeout | null = null;
  private callbacks: Function[] = [];
  private detected: Map<string, WalletDetectionResult> = new Map();

  constructor() {
    this.startDetection();
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen for provider injection events
    window.addEventListener('load', () => {
      console.log('TruthChain: Window loaded, rechecking providers...');
      this.forceRecheck();
    });

    // Listen for DOM changes that might indicate provider injection
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        console.log('TruthChain: DOM loaded, rechecking providers...');
        setTimeout(() => this.forceRecheck(), 1000);
      });
    }

    // Custom events that some wallets fire
    window.addEventListener('xverse-provider-ready', () => {
      console.log('TruthChain: Xverse provider ready event received');
      this.forceRecheck();
    });

    window.addEventListener('leather-provider-ready', () => {
      console.log('TruthChain: Leather provider ready event received');
      this.forceRecheck();
    });
  }

  private startDetection() {
    console.log('TruthChain: Starting advanced wallet detection...');
    
    // Initial immediate check
    this.performDetection();
    
    // Aggressive detection for first 25 seconds
    this.detectionInterval = setInterval(() => {
      this.detectionAttempts++;
      this.performDetection();
      
      if (this.detectionAttempts >= this.maxAttempts) {
        this.stopDetection();
        console.log('TruthChain: Detection completed after', this.detectionAttempts, 'attempts');
      }
    }, 500);
  }

  private stopDetection() {
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
      this.detectionInterval = null;
    }
  }

  private forceRecheck() {
    this.performDetection();
  }

  private performDetection() {
    const results: WalletDetectionResult[] = [];
    
    // Debug: Log current window state
    if (this.detectionAttempts % 10 === 0) { // Every 10th attempt
      console.log(`TruthChain: Detection attempt ${this.detectionAttempts}, checking window properties...`);
      console.log('TruthChain: window.XverseProviders =', (window as any).XverseProviders);
      console.log('TruthChain: window.LeatherProvider =', (window as any).LeatherProvider);
      console.log('TruthChain: window.StacksProvider =', (window as any).StacksProvider);
    }
    
    // Method 1: Direct window object detection
    results.push(this.detectXverseDirect());
    results.push(this.detectLeatherDirect());
    results.push(this.detectGenericStacks());
    
    // Method 2: Property enumeration detection
    results.push(...this.detectByPropertyEnumeration());
    
    // Method 3: Try-catch detection (some providers might throw on access)
    results.push(...this.detectByTryCatch());
    
    // Update detected map and notify callbacks
    let hasChanges = false;
    for (const result of results) {
      const key = result.provider;
      const existing = this.detected.get(key);
      
      if (!existing || existing.detected !== result.detected) {
        this.detected.set(key, result);
        hasChanges = true;
        
        if (result.detected) {
          console.log(`TruthChain: ${result.name} detected!`, result);
        }
      }
    }
    
    if (hasChanges) {
      this.notifyCallbacks();
    }
  }

  private detectXverseDirect(): WalletDetectionResult {
    try {
      // Check multiple patterns for Xverse injection
      const patterns = [
        () => (window as any).XverseProviders?.StacksProvider,
        () => (window as any).xverseProviders?.StacksProvider,
        () => (window as any).stacksProvider, // Some versions use this
        () => (window as any).xverseProvider,
      ];
      
      for (const pattern of patterns) {
        try {
          const provider = pattern();
          if (provider && typeof provider === 'object') {
            console.log('TruthChain: Found Xverse provider via pattern:', provider);
            return {
              name: 'Xverse Wallet',
              provider: 'xverse',
              detected: true,
              available: true,
              version: provider.version || 'unknown',
              methods: Object.getOwnPropertyNames(provider)
            };
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
      
      // Check for classic XverseProviders
      const xverse = (window as any).XverseProviders;
      if (xverse && xverse.StacksProvider) {
        return {
          name: 'Xverse Wallet',
          provider: 'xverse',
          detected: true,
          available: true,
          version: xverse.version || 'unknown',
          methods: Object.getOwnPropertyNames(xverse.StacksProvider)
        };
      }
    } catch (error) {
      console.log('TruthChain: Xverse detection error:', error);
    }
    
    return {
      name: 'Xverse Wallet',
      provider: 'xverse',
      detected: false,
      available: false
    };
  }

  private detectLeatherDirect(): WalletDetectionResult {
    try {
      const leather = (window as any).LeatherProvider;
      if (leather && typeof leather.request === 'function') {
        return {
          name: 'Leather Wallet',
          provider: 'leather',
          detected: true,
          available: true,
          version: leather.version || 'unknown',
          methods: Object.getOwnPropertyNames(leather)
        };
      }
    } catch (error) {
      console.log('TruthChain: Leather detection error:', error);
    }
    
    return {
      name: 'Leather Wallet',
      provider: 'leather',
      detected: false,
      available: false
    };
  }

  private detectGenericStacks(): WalletDetectionResult {
    try {
      const stacks = (window as any).StacksProvider;
      if (stacks && typeof stacks.request === 'function' && 
          !(window as any).XverseProviders && !(window as any).LeatherProvider) {
        return {
          name: 'Stacks Wallet',
          provider: 'stacks',
          detected: true,
          available: true,
          methods: Object.getOwnPropertyNames(stacks)
        };
      }
    } catch (error) {
      console.log('TruthChain: Generic Stacks detection error:', error);
    }
    
    return {
      name: 'Stacks Wallet',
      provider: 'stacks',
      detected: false,
      available: false
    };
  }

  private detectByPropertyEnumeration(): WalletDetectionResult[] {
    const results: WalletDetectionResult[] = [];
    
    try {
      const allProps = Object.getOwnPropertyNames(window);
      const walletProps = allProps.filter(prop => {
        const lowerProp = prop.toLowerCase();
        return lowerProp.includes('xverse') || 
               lowerProp.includes('leather') || 
               lowerProp.includes('stacks') ||
               lowerProp.includes('wallet');
      });
      
      console.log('TruthChain: Found wallet-related properties:', walletProps);
      
      // Also check for common wallet-related descriptors
      const descriptors = Object.getOwnPropertyDescriptors(window);
      const walletDescriptors = Object.keys(descriptors).filter(prop => {
        const lowerProp = prop.toLowerCase();
        return lowerProp.includes('xverse') || lowerProp.includes('leather') || lowerProp.includes('stacks');
      });
      
      if (walletDescriptors.length > 0) {
        console.log('TruthChain: Found wallet descriptors:', walletDescriptors);
      }
      
      for (const prop of walletProps) {
        try {
          const obj = (window as any)[prop];
          if (obj && typeof obj === 'object') {
            console.log(`TruthChain: Examining property ${prop}:`, Object.keys(obj));
            
            // Enhanced Xverse detection
            if (prop.toLowerCase().includes('xverse')) {
              if (obj.StacksProvider || (typeof obj.request === 'function')) {
                results.push({
                  name: 'Xverse (Property Enumeration)',
                  provider: 'xverse-enum',
                  detected: true,
                  available: true,
                  version: obj.version || 'unknown',
                  methods: Object.getOwnPropertyNames(obj)
                });
              }
            } 
            // Enhanced Leather detection
            else if (prop.toLowerCase().includes('leather') && obj.request) {
              results.push({
                name: 'Leather (Property Enumeration)',
                provider: 'leather-enum',
                detected: true,
                available: true,
                version: obj.version || 'unknown',
                methods: Object.getOwnPropertyNames(obj)
              });
            }
            // Generic Stacks provider
            else if (prop.toLowerCase().includes('stacks') && obj.request) {
              results.push({
                name: 'Stacks (Property Enumeration)',
                provider: 'stacks-enum',
                detected: true,
                available: true,
                version: obj.version || 'unknown',
                methods: Object.getOwnPropertyNames(obj)
              });
            }
          }
        } catch (e) {
          // Property might be getter that throws
          console.log(`TruthChain: Cannot access property ${prop}:`, (e as Error).message);
        }
      }
    } catch (error) {
      console.log('TruthChain: Property enumeration failed:', error);
    }
    
    return results;
  }

  private detectByTryCatch(): WalletDetectionResult[] {
    const results: WalletDetectionResult[] = [];
    
    // Try various window property access patterns
    const patterns = [
      () => (window as any)['XverseProviders'],
      () => (window as any)['xverseProviders'],
      () => (window as any)['XVERSE_PROVIDERS'],
      () => (window as any)['LeatherProvider'],
      () => (window as any)['leatherProvider'],
      () => (window as any)['LEATHER_PROVIDER'],
      () => (window as any)['StacksProvider'],
      () => (window as any)['stacksProvider'],
      () => (window as any)['STACKS_PROVIDER']
    ];
    
    patterns.forEach((pattern, index) => {
      try {
        const result = pattern();
        if (result && typeof result === 'object') {
          console.log(`TruthChain: Pattern ${index} found object:`, Object.keys(result));
        }
      } catch (error) {
        // Some patterns might throw, that's expected
      }
    });
    
    return results;
  }

  public onDetection(callback: Function) {
    this.callbacks.push(callback);
    // Immediately call with current state
    if (this.detected.size > 0) {
      callback(Array.from(this.detected.values()));
    }
  }

  private notifyCallbacks() {
    const detectedWallets = Array.from(this.detected.values()).filter(w => w.detected);
    this.callbacks.forEach(callback => {
      try {
        callback(detectedWallets);
      } catch (error) {
        console.error('TruthChain: Callback error:', error);
      }
    });
  }

  public getDetectedWallets(): WalletDetectionResult[] {
    return Array.from(this.detected.values()).filter(w => w.detected && w.available);
  }

  public async connectWallet(providerType: string): Promise<WalletConnectionResult> {
    console.log(`TruthChain: [CONNECT] Attempting to connect to ${providerType}`);
    console.log(`TruthChain: [CONNECT] Current detected wallets:`, Array.from(this.detected.entries()));
    
    const detected = this.detected.get(providerType);
    if (!detected || !detected.detected || !detected.available) {
      console.error(`TruthChain: [CONNECT] ${providerType} not in detected list or not detected/available`);
      console.error(`TruthChain: [CONNECT] Wallet status:`, detected ? {detected: detected.detected, available: detected.available} : 'not found');
      throw new Error(`Wallet provider ${providerType} not detected`);
    }
    
    console.log(`TruthChain: [CONNECT] ${providerType} found in detected list:`, detected);
    
    try {
      switch (providerType) {
        case 'xverse':
          console.log(`TruthChain: [CONNECT] Calling connectXverse()`);
          return await this.connectXverse();
        case 'leather':
          console.log(`TruthChain: [CONNECT] Calling connectLeather()`);
          return await this.connectLeather();
        case 'stacks':
          console.log(`TruthChain: [CONNECT] Calling connectGenericStacks()`);
          return await this.connectGenericStacks();
        default:
          throw new Error(`Unsupported wallet provider: ${providerType}`);
      }
    } catch (error) {
      console.error(`TruthChain: [CONNECT] Connection to ${providerType} failed:`, error);
      return {
        success: false,
        provider: providerType,
        address: '',
        publicKey: '',
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  private async connectXverse(): Promise<WalletConnectionResult> {
    console.log(`TruthChain: [XVERSE] Starting Xverse connection - using direct XverseProviders approach`);
    
    // Use the working XverseProviders method directly
    // This avoids any module loading or compatibility issues
    return await this.connectXverseLegacy();
  }

  // Modern APIs removed for simplicity - using direct XverseProviders only

  private async connectXverseLegacy(): Promise<WalletConnectionResult> {
    console.log(`TruthChain: [XVERSE] Using Xverse connection with proper API`);
    
    // Xverse uses a different API structure - check for XverseProviders
    const xverseProviders = (window as any).XverseProviders || (window as any).xverseProviders;
    
    if (!xverseProviders || !xverseProviders.StacksProvider) {
      throw new Error('Xverse wallet not found. Please install Xverse extension and refresh the page.');
    }

    console.log(`TruthChain: [XVERSE] XverseProviders found, attempting connection`);
    
    try {
      const stacksProvider = xverseProviders.StacksProvider;
      
      // Request account access - this opens the Xverse popup
      console.log(`TruthChain: [XVERSE] Requesting accounts (this should open Xverse popup)...`);
      
      const response = await Promise.race([
        stacksProvider.request('stx_requestAccounts', null),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Xverse connection timeout after 60 seconds')), 60000)
        )
      ]) as any;

      console.log(`TruthChain: [XVERSE] Request accounts response:`, response);

      // Xverse returns an object with addresses array
      if (!response || !response.addresses || response.addresses.length === 0) {
        throw new Error('No Xverse accounts available - please unlock your wallet and approve the connection');
      }

      const address = response.addresses[0];
      console.log(`TruthChain: [XVERSE] Successfully connected! Address:`, address);

      return {
        success: true,
        provider: 'xverse',
        address: address.address || address,
        publicKey: address.publicKey || `xverse-${Date.now()}`,
        network: 'mainnet'
      };
    } catch (error: any) {
      console.error(`TruthChain: [XVERSE] Connection error:`, error);
      
      // Provide helpful error messages
      if (error.message?.includes('timeout')) {
        throw new Error('Xverse connection timed out. Please check if:\n1. Xverse extension is installed\n2. Xverse wallet is unlocked\n3. You approved the connection request');
      } else if (error.message?.includes('User rejected') || error.code === 4001) {
        throw new Error('Connection cancelled by user');
      } else {
        throw new Error(`Xverse connection failed: ${error.message || 'Unknown error'}`);
      }
    }
  }

  private async connectLeather(): Promise<WalletConnectionResult> {
    console.log(`TruthChain: [LEATHER] Starting Leather connection`);
    const leather = (window as any).LeatherProvider;
    if (!leather) {
      throw new Error('Leather provider not available');
    }

    console.log(`TruthChain: [LEATHER] Leather provider found:`, typeof leather, !!leather.request);
    console.log(`TruthChain: [LEATHER] Available methods:`, Object.getOwnPropertyNames(leather));
    
    // Enhanced debugging - check if Leather is actually loaded and ready
    console.log(`TruthChain: [LEATHER] Leather object details:`, {
      hasRequest: typeof leather.request === 'function',
      isObject: typeof leather === 'object',
      keys: Object.keys(leather),
      prototype: Object.getPrototypeOf(leather)
    });
    
    try {
      // Use the documented Leather wallet API method: getAddresses
      // According to Leather documentation, this is the official method to get addresses
      console.log(`TruthChain: [LEATHER] Attempting connection using getAddresses method...`);
      
      let result;
      try {
        // Try the standard getAddresses method (most reliable for Leather)
        // Removed timeout to allow user time to approve the popup
        console.log(`TruthChain: [LEATHER] Calling getAddresses method (waiting for user approval)...`);
        console.log(`TruthChain: [LEATHER] 👉 Please check for a Leather popup and approve the connection!`);
        
        result = await leather.request('getAddresses');
        console.log(`TruthChain: [LEATHER] ✅ getAddresses successful:`, result);
        
      } catch (getAddrError) {
        console.log(`TruthChain: [LEATHER] getAddresses failed:`, getAddrError);
        
        // Try Stacks-specific method as fallback
        try {
          console.log(`TruthChain: [LEATHER] Trying stacks_getAddresses method...`);
          result = await leather.request('stacks_getAddresses');
          console.log(`TruthChain: [LEATHER] ✅ stacks_getAddresses successful:`, result);
          
        } catch (addressError) {
          console.error(`TruthChain: [LEATHER] Both connection methods failed.`);
          console.error(`TruthChain: [LEATHER] getAddresses error:`, getAddrError);  
          console.error(`TruthChain: [LEATHER] stacks_getAddresses error:`, addressError);
          
          // Check if user rejected
          const isRejection = (getAddrError as any)?.code === 4001 || 
                             (addressError as any)?.code === 4001 ||
                             (addressError as any)?.error?.message?.includes('reject');
          
          if (isRejection) {
            throw new Error('Connection rejected. Please click "Connect" again and approve the Leather popup.');
          }
          
          throw new Error('Unable to connect to Leather wallet. Please ensure:\n• Leather is unlocked\n• You have a Stacks account\n• Popups are not blocked\n• Try refreshing the page');
        }
      }
      
      console.log(`TruthChain: [LEATHER] Connection result:`, result);
      console.log(`TruthChain: [LEATHER] Result type:`, typeof result);
      console.log(`TruthChain: [LEATHER] Result is array:`, Array.isArray(result));

      // Helper function to check if address is a Stacks address
      const isStacksAddress = (addr: string): boolean => {
        return !!(addr && (addr.startsWith('SP') || addr.startsWith('ST')));
      };

      // Helper function to extract Stacks address from address list
      const findStacksAddress = (addresses: any[]): any => {
        console.log(`TruthChain: [LEATHER] Searching ${addresses.length} addresses for Stacks address...`);
        addresses.forEach((addr, i) => {
          const addrStr = typeof addr === 'string' ? addr : addr?.address;
          console.log(`  [${i}] ${addrStr} - ${isStacksAddress(addrStr) ? '✅ STACKS' : '❌ not stacks'}`);
        });
        
        return addresses.find((addr: any) => {
          const addrStr = typeof addr === 'string' ? addr : addr?.address;
          return isStacksAddress(addrStr);
        });
      };

      // Parse Leather wallet response format based on official documentation
      let address: string;
      let publicKey = `leather-${Date.now()}`;

      console.log(`TruthChain: [LEATHER] Parsing Leather response format...`);

      // Leather getAddresses returns an object with addresses array
      // Expected format: { addresses: [{ address: "...", publicKey: "..." }] }
      if (result && typeof result === 'object') {
        
        // Check for result.addresses (standard Leather format)
        if ('addresses' in result && Array.isArray(result.addresses) && result.addresses.length > 0) {
          console.log(`TruthChain: [LEATHER] Found addresses array with ${result.addresses.length} addresses`);
          
          // ALWAYS look for Stacks address first (STX addresses start with 'ST' or 'SP')
          const stacksAddr = findStacksAddress(result.addresses);
          
          if (stacksAddr) {
            console.log(`TruthChain: [LEATHER] ✅ Found Stacks address:`, stacksAddr);
            address = typeof stacksAddr === 'string' ? stacksAddr : stacksAddr.address;
            publicKey = (stacksAddr.publicKey || stacksAddr.pubkey) || publicKey;
          } else {
            console.error(`TruthChain: [LEATHER] ❌ NO STACKS ADDRESS FOUND! Only non-Stacks addresses available.`);
            throw new Error('No Stacks address found in Leather wallet. Please ensure your Leather wallet has a Stacks account configured.');
          }
        }
        // Check for direct address field
        else if ('address' in result) {
          console.log(`TruthChain: [LEATHER] Found direct address field:`, result.address);
          if (isStacksAddress(result.address)) {
            address = result.address;
            publicKey = result.publicKey || result.pubkey || publicKey;
          } else {
            throw new Error(`Address is not a Stacks address: ${result.address}. Please ensure you're using a Stacks account in Leather.`);
          }
        }
        // Check for result field (nested response)
        else if ('result' in result) {
          console.log(`TruthChain: [LEATHER] Found nested result field`);
          const nestedResult = result.result;
          if (nestedResult && typeof nestedResult === 'object' && 'addresses' in nestedResult) {
            const addresses = nestedResult.addresses;
            if (Array.isArray(addresses) && addresses.length > 0) {
              const stacksAddr = findStacksAddress(addresses);
              if (stacksAddr) {
                console.log(`TruthChain: [LEATHER] ✅ Found Stacks address in nested result:`, stacksAddr);
                address = typeof stacksAddr === 'string' ? stacksAddr : stacksAddr.address;
                publicKey = (stacksAddr.publicKey || stacksAddr.pubkey) || publicKey;
              } else {
                throw new Error('No Stacks address found in nested result');
              }
            } else {
              throw new Error('No addresses found in nested result');
            }
          } else if (typeof nestedResult === 'string') {
            if (isStacksAddress(nestedResult)) {
              address = nestedResult;
            } else {
              throw new Error(`Nested result is not a Stacks address: ${nestedResult}`);
            }
          } else {
            throw new Error('Unexpected nested result format from Leather');
          }
        }
        // Handle array format
        else if (Array.isArray(result) && result.length > 0) {
          console.log(`TruthChain: [LEATHER] Found array format with ${result.length} addresses`);
          const stacksAddr = findStacksAddress(result);
          if (stacksAddr) {
            console.log(`TruthChain: [LEATHER] ✅ Found Stacks address in array:`, stacksAddr);
            address = typeof stacksAddr === 'string' ? stacksAddr : stacksAddr.address;
            publicKey = (stacksAddr.publicKey || stacksAddr.pubkey) || publicKey;
          } else {
            throw new Error('No Stacks address found in address array');
          }
        }
        else {
          console.error(`TruthChain: [LEATHER] Unexpected response structure:`, result);
          console.error(`TruthChain: [LEATHER] Response keys:`, Object.keys(result));
          throw new Error('Unexpected response format from Leather wallet. Please check console for details.');
        }
      }
      // Handle string response
      else if (typeof result === 'string') {
        console.log(`TruthChain: [LEATHER] Got string address directly:`, result);
        if (isStacksAddress(result)) {
          address = result;
        } else {
          throw new Error(`Direct address is not a Stacks address: ${result}`);
        }
      }
      // Handle array response
      else if (Array.isArray(result) && result.length > 0) {
        console.log(`TruthChain: [LEATHER] Got array of addresses`);
        const stacksAddr = findStacksAddress(result);
        if (stacksAddr) {
          console.log(`TruthChain: [LEATHER] ✅ Found Stacks address in top-level array:`, stacksAddr);
          address = typeof stacksAddr === 'string' ? stacksAddr : stacksAddr.address;
          publicKey = (stacksAddr.publicKey || stacksAddr.pubkey) || publicKey;
        } else {
          throw new Error('No Stacks address found in top-level array');
        }
      }
      else {
        console.error(`TruthChain: [LEATHER] Invalid or empty result:`, result);
        throw new Error('No valid address data received from Leather wallet');
      }

      if (!address) {
        throw new Error('No valid address found in Leather response');
      }
      
      // Final validation - make absolutely sure it's a Stacks address
      if (!isStacksAddress(address)) {
        throw new Error(`Final validation failed: ${address} is not a Stacks address (must start with SP or ST)`);
      }

      console.log(`TruthChain: [LEATHER] ✅ Successfully connected with Stacks address: ${address}`);

      return {
        success: true,
        provider: 'leather',
        address,
        publicKey,
        network: NETWORK_CONFIG.name === 'mainnet' ? 'mainnet' : 'testnet'
      };
      
    } catch (error) {
      console.error(`TruthChain: [LEATHER] Connection failed:`, error);
      
      // Enhanced error reporting
      if (error && typeof error === 'object') {
        if ('code' in error && 'message' in error) {
          // JSON-RPC error format
          const code = (error as any).code;
          const message = (error as any).message;
          console.error(`TruthChain: [LEATHER] RPC Error - Code: ${code}, Message: ${message}`);
          
          if (code === -32002) {
            throw new Error('User rejected the connection request in Leather wallet');
          } else if (code === -32603) {
            throw new Error('Internal error in Leather wallet. Try refreshing the page and reconnecting.');
          } else {
            throw new Error(`Leather wallet error: ${message} (Code: ${code})`);
          }
        } else if ('error' in error) {
          // Nested error structure
          const nestedError = (error as any).error;
          console.error(`TruthChain: [LEATHER] Nested error:`, nestedError);
          throw new Error(`Leather connection error: ${nestedError.message || 'Unknown nested error'}`);
        }
      }
      
      // Re-throw with original error message if no specific handling
      throw error instanceof Error ? error : new Error('Unknown error connecting to Leather wallet');
    }
  }

  private async connectGenericStacks(): Promise<WalletConnectionResult> {
    const stacks = (window as any).StacksProvider;
    if (!stacks) {
      throw new Error('Generic Stacks provider not available');
    }

    const accounts = await Promise.race([
      stacks.request('stx_requestAccounts'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      )
    ]);

    const address = Array.isArray(accounts) ? accounts[0] : accounts;

    if (!address) {
      throw new Error('No address returned');
    }

    return {
      success: true,
      provider: 'stacks',
      address,
      publicKey: `stacks-${Date.now()}`,
      network: NETWORK_CONFIG.name === 'mainnet' ? 'mainnet' : 'testnet'
    };
  }
}

// Create global instance
const advancedWalletDetector = new AdvancedWalletDetector();

// Legacy function for backward compatibility
function detectWalletProviders(): LegacyWalletDetectionResult {
  const detectedWallets = advancedWalletDetector.getDetectedWallets();
  const providers: Record<string, WalletProviderInfo> = {};
  
  // Convert advanced detection results to legacy format
  // Only include wallets that are both detected AND available
  for (const wallet of detectedWallets) {
    const key = wallet.provider.includes('-') ? wallet.provider.split('-')[0] : wallet.provider;
    providers[key] = {
      name: wallet.name,
      isDetected: wallet.detected && wallet.available, // Must be both detected and available
      provider: wallet
    };
  }
  
  // Ensure all expected providers are present
  if (!providers.xverse) {
    providers.xverse = { name: 'Xverse', isDetected: false };
  }
  if (!providers.leather) {
    providers.leather = { name: 'Leather', isDetected: false };
  }
  if (!providers.stacks) {
    providers.stacks = { name: 'Stacks Wallet', isDetected: false };
  }
  
  return {
    providers,
    timestamp: Date.now()
  };
}

// Connect to wallet provider using advanced detector
async function connectWallet(providerType: string): Promise<any> {
  console.log(`TruthChain: Attempting to connect to ${providerType} wallet via advanced detector`);
  
  try {
    const result = await advancedWalletDetector.connectWallet(providerType);
    
    if (result.success) {
      return {
        success: true,
        provider: result.provider,
        walletName: result.provider.charAt(0).toUpperCase() + result.provider.slice(1),
        walletData: {
          address: result.address,
          publicKey: result.publicKey,
          provider: result.provider,
          walletName: result.provider.charAt(0).toUpperCase() + result.provider.slice(1),
          isConnected: true,
          network: result.network || NETWORK_CONFIG.name || 'mainnet'
        }
      };
    } else {
      return {
        success: false,
        error: result.error,
        provider: providerType
      };
    }
    
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

    case 'TRUTHCHAIN_ADVANCED_DETECT':
      try {
        const detected = advancedWalletDetector.getDetectedWallets();
        window.postMessage({
          type: 'TRUTHCHAIN_ADVANCED_DETECT_RESULT',
          requestId: event.data.requestId,
          success: true,
          data: detected
        }, '*');
      } catch (error) {
        console.error('TruthChain: Advanced wallet detection failed:', error);
        window.postMessage({
          type: 'TRUTHCHAIN_ADVANCED_DETECT_RESULT',
          requestId: event.data.requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Advanced detection failed'
        }, '*');
      }
      break;

    case 'TRUTHCHAIN_ADVANCED_CONNECT':
      try {
        const { provider } = event.data;
        const result = await advancedWalletDetector.connectWallet(provider);
        window.postMessage({
          type: 'TRUTHCHAIN_ADVANCED_CONNECT_RESULT',
          requestId: event.data.requestId,
          success: result.success,
          data: result
        }, '*');
      } catch (error) {
        console.error('TruthChain: Advanced wallet connection failed:', error);
        window.postMessage({
          type: 'TRUTHCHAIN_ADVANCED_CONNECT_RESULT',
          requestId: event.data.requestId,
          success: false,
          error: error instanceof Error ? error.message : 'Advanced connection failed'
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

// Export for debugging
(window as any).__truthchain_advanced_detector = advancedWalletDetector;

// Add manual diagnostic function
(window as any).__truthchain_diagnose_wallets = function() {
  console.log('=== TruthChain Wallet Diagnostic ===');
  console.log('Current timestamp:', new Date().toISOString());
  
  // Check all possible Xverse locations
  console.log('1. Xverse Locations:');
  console.log('  - window.XverseProviders:', (window as any).XverseProviders);
  console.log('  - window.xverseProviders:', (window as any).xverseProviders);
  console.log('  - window.stacksProvider:', (window as any).stacksProvider);
  console.log('  - window.xverseProvider:', (window as any).xverseProvider);
  
  // Check Leather
  console.log('2. Leather Locations:');
  console.log('  - window.LeatherProvider:', (window as any).LeatherProvider);
  console.log('  - window.leatherProvider:', (window as any).leatherProvider);
  
  // Check generic Stacks
  console.log('3. Generic Stacks:');
  console.log('  - window.StacksProvider:', (window as any).StacksProvider);
  
  // Get all wallet-related window properties
  const allProps = Object.getOwnPropertyNames(window);
  const walletProps = allProps.filter(prop => {
    const lowerProp = prop.toLowerCase();
    return lowerProp.includes('xverse') || lowerProp.includes('leather') || lowerProp.includes('stacks') || lowerProp.includes('wallet');
  });
  
  console.log('4. All wallet-related window properties:', walletProps);
  
  // Check current detection state
  console.log('5. Current Advanced Detector State:');
  const detected = advancedWalletDetector.getDetectedWallets();
  console.log('  - Detected wallets:', detected);
  
  console.log('===================================');
  
  return {
    xverseProviders: (window as any).XverseProviders,
    leatherProvider: (window as any).LeatherProvider,
    stacksProvider: (window as any).StacksProvider,
    allWalletProps: walletProps,
    detectedWallets: detected
  };
};

// Set up automatic detection updates
advancedWalletDetector.onDetection((detectedWallets: WalletDetectionResult[]) => {
  // Convert to legacy format for compatibility
  const legacyDetection = detectWalletProviders();
  
  window.postMessage({
    type: 'TRUTHCHAIN_WALLET_DETECTION_UPDATE',
    data: legacyDetection
  }, '*');
  
  console.log('TruthChain: Detection update sent to content script', legacyDetection);
  console.log('TruthChain: Advanced wallets detected:', detectedWallets);
});

// Periodic wallet detection for legacy compatibility
let detectionInterval: NodeJS.Timeout;

function startLegacyWalletDetection() {
  // Initial detection
  setTimeout(() => {
    const detection = detectWalletProviders();
    window.postMessage({
      type: 'TRUTHCHAIN_WALLET_DETECTION_UPDATE',
      data: detection
    }, '*');
  }, 1000);
  
  // Slower periodic detection every 10 seconds since advanced detector is more aggressive
  let detectionCount = 0;
  detectionInterval = setInterval(() => {
    detectionCount++;
    const detection = detectWalletProviders();
    
    window.postMessage({
      type: 'TRUTHCHAIN_WALLET_DETECTION_UPDATE',
      data: detection
    }, '*');
    
    // Stop after 6 attempts (1 minute)
    if (detectionCount >= 6) {
      clearInterval(detectionInterval);
      console.log('TruthChain: Legacy detection stopped, advanced detector continues');
    }
  }, 10000);
}

// Start detection when page is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startLegacyWalletDetection);
} else {
  startLegacyWalletDetection();
}

console.log('TruthChain: Advanced page script initialized with comprehensive wallet detection');