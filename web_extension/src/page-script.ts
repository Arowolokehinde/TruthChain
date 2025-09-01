// This script runs in the MAIN world context and can access window.XverseProviders
// It communicates with the content script via window.postMessage

console.log('TruthChain: Page script loaded in MAIN world');

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
    console.log(`TruthChain: [XVERSE] Using enhanced XverseProviders method`);
    
    // Try multiple provider patterns for Xverse
    let xverse: any = null;
    const patterns = [
      () => (window as any).XverseProviders?.StacksProvider,
      () => (window as any).xverseProviders?.StacksProvider,
      () => (window as any).stacksProvider,
      () => (window as any).xverseProvider,
    ];
    
    for (const pattern of patterns) {
      try {
        const provider = pattern();
        if (provider && typeof provider === 'object' && typeof provider.request === 'function') {
          xverse = provider;
          console.log(`TruthChain: [XVERSE] Found working provider pattern:`, pattern.toString());
          break;
        }
      } catch (e) {
        // Continue to next pattern
      }
    }
    
    console.log(`TruthChain: [XVERSE] Provider available:`, !!xverse);
    
    if (!xverse) {
      throw new Error('Xverse wallet not found. Please install Xverse extension and refresh the page.');
    }

    console.log(`TruthChain: [XVERSE] Calling stx_requestAccounts - this should trigger popup`);
    
    try {
      const accounts = await Promise.race([
        xverse.request('stx_requestAccounts'),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout - popup may have been blocked')), 30000)
        )
      ]) as string[];

      console.log(`TruthChain: [XVERSE] Accounts response:`, accounts);

      if (!accounts || accounts.length === 0) {
        throw new Error('No Xverse accounts available - please unlock your wallet');
      }

      // Try to get detailed address info
      let primaryAddress: any;
      try {
        const addressInfo = await xverse.request('stx_getAddresses');
        console.log(`TruthChain: [XVERSE] Address info:`, addressInfo);
        
        if (addressInfo?.addresses?.length) {
          primaryAddress = addressInfo.addresses[0];
        } else {
          // Fallback: use first account as address
          primaryAddress = { address: accounts[0] };
        }
      } catch (addressError) {
        console.log(`TruthChain: [XVERSE] Address info failed, using account directly:`, addressError);
        primaryAddress = { address: accounts[0] };
      }
      
      console.log(`TruthChain: [XVERSE] Connection successful! Address:`, primaryAddress.address);

      return {
        success: true,
        provider: 'xverse',
        address: primaryAddress.address,
        publicKey: primaryAddress.publicKey || `xverse-${Date.now()}`,
        network: 'mainnet'
      };
    } catch (error) {
      console.error(`TruthChain: [XVERSE] Connection failed:`, error);
      throw error;
    }
  }

  private async connectLeather(): Promise<WalletConnectionResult> {
    console.log(`TruthChain: [LEATHER] Starting Leather connection`);
    const leather = (window as any).LeatherProvider;
    if (!leather) {
      throw new Error('Leather provider not available');
    }

    console.log(`TruthChain: [LEATHER] Leather provider found, requesting accounts...`);
    
    try {
      // Try multiple Leather API methods in order of preference
      let result;
      
      console.log(`TruthChain: [LEATHER] Available methods:`, Object.getOwnPropertyNames(leather));
      
      try {
        // Method 1: Try stx_requestAccounts (standard)
        console.log(`TruthChain: [LEATHER] Trying stx_requestAccounts method`);
        result = await Promise.race([
          leather.request('stx_requestAccounts', null),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
          )
        ]);
      } catch (firstError) {
        console.log(`TruthChain: [LEATHER] stx_requestAccounts failed, trying getAddresses:`, firstError);
        
        try {
          // Method 2: Try getAddresses (Leather-specific)
          result = await Promise.race([
            leather.request('getAddresses', null),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
            )
          ]);
        } catch (secondError) {
          console.log(`TruthChain: [LEATHER] getAddresses failed, trying stx_getAddresses:`, secondError);
          
          // Method 3: Try stx_getAddresses
          result = await Promise.race([
            leather.request('stx_getAddresses', null),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
            )
          ]);
        }
      }

      console.log(`TruthChain: [LEATHER] Raw result from Leather:`, result);

      if (!result) {
        throw new Error('No response from Leather');
      }

      let address: string;
      let publicKey = `leather-${Date.now()}`;

      if (typeof result === 'string') {
        address = result;
      } else if ((result as any).addresses && Array.isArray((result as any).addresses)) {
        address = (result as any).addresses[0];
        publicKey = (result as any).publicKey || publicKey;
      } else if ((result as any).address) {
        address = (result as any).address;
        publicKey = (result as any).publicKey || publicKey;
      } else {
        throw new Error('Invalid response format');
      }

      console.log(`TruthChain: [LEATHER] Successfully connected, address: ${address}`);

      return {
        success: true,
        provider: 'leather',
        address,
        publicKey,
        network: 'testnet'
      };
      
    } catch (error) {
      console.error(`TruthChain: [LEATHER] Connection failed:`, error);
      
      // Check if it's a JSON-RPC error and provide more details
      if (error && typeof error === 'object' && 'error' in error) {
        const rpcError = (error as any).error;
        console.error(`TruthChain: [LEATHER] RPC Error Details:`, rpcError);
        throw new Error(`Leather RPC Error: ${rpcError.message || 'Unknown error'} (Code: ${rpcError.code || 'N/A'})`);
      }
      
      throw error;
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
      network: 'testnet'
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
          network: result.network || 'testnet'
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