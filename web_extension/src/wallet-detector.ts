// Comprehensive Wallet Detection System for Chrome Extensions
// Addresses context isolation, timing issues, and provider detection problems

console.log('TruthChain: Advanced Wallet Detector Loading...');

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
      
      for (const prop of walletProps) {
        try {
          const obj = (window as any)[prop];
          if (obj && typeof obj === 'object') {
            if (prop.toLowerCase().includes('xverse') && obj.StacksProvider) {
              results.push({
                name: 'Xverse (Property Enumeration)',
                provider: 'xverse-enum',
                detected: true,
                available: true,
                version: obj.version
              });
            } else if (prop.toLowerCase().includes('leather') && obj.request) {
              results.push({
                name: 'Leather (Property Enumeration)',
                provider: 'leather-enum',
                detected: true,
                available: true,
                version: obj.version
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
    return Array.from(this.detected.values()).filter(w => w.detected);
  }

  public async connectWallet(providerType: string): Promise<WalletConnectionResult> {
    console.log(`TruthChain: Attempting to connect to ${providerType}`);
    
    const detected = this.detected.get(providerType);
    if (!detected || !detected.detected) {
      throw new Error(`Wallet provider ${providerType} not detected`);
    }
    
    try {
      switch (providerType) {
        case 'xverse':
          return await this.connectXverse();
        case 'leather':
          return await this.connectLeather();
        case 'stacks':
          return await this.connectGenericStacks();
        default:
          throw new Error(`Unsupported wallet provider: ${providerType}`);
      }
    } catch (error) {
      console.error(`TruthChain: Connection to ${providerType} failed:`, error);
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
    const xverse = (window as any).XverseProviders?.StacksProvider;
    if (!xverse) {
      throw new Error('Xverse provider not available');
    }

    // Request accounts with timeout
    const accounts = await Promise.race([
      xverse.request('stx_requestAccounts'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      )
    ]) as string[];

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available');
    }

    // Get address details
    const addressInfo = await xverse.request('stx_getAddresses');
    
    if (!addressInfo?.addresses?.length) {
      throw new Error('Could not retrieve address information');
    }

    const primaryAddress = addressInfo.addresses[0];

    return {
      success: true,
      provider: 'xverse',
      address: primaryAddress.address,
      publicKey: primaryAddress.publicKey || `xverse-${Date.now()}`,
      network: 'testnet'
    };
  }

  private async connectLeather(): Promise<WalletConnectionResult> {
    const leather = (window as any).LeatherProvider;
    if (!leather) {
      throw new Error('Leather provider not available');
    }

    const result = await Promise.race([
      leather.request('stx_requestAccounts'),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 30000)
      )
    ]);

    if (!result) {
      throw new Error('No response from Leather');
    }

    let address: string;
    let publicKey = `leather-${Date.now()}`;

    if (typeof result === 'string') {
      address = result;
    } else if (result.addresses && Array.isArray(result.addresses)) {
      address = result.addresses[0];
      publicKey = result.publicKey || publicKey;
    } else if (result.address) {
      address = result.address;
      publicKey = result.publicKey || publicKey;
    } else {
      throw new Error('Invalid response format');
    }

    return {
      success: true,
      provider: 'leather',
      address,
      publicKey,
      network: 'testnet'
    };
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
const walletDetector = new AdvancedWalletDetector();

// Export for use by content scripts
(window as any).__truthchain_wallet_detector = walletDetector;

// Listen for messages from content script
window.addEventListener('message', async (event) => {
  if (event.origin !== window.location.origin) return;
  if (!event.data?.type?.startsWith('TRUTHCHAIN_ADVANCED_')) return;

  const { type, requestId } = event.data;

  try {
    switch (type) {
      case 'TRUTHCHAIN_ADVANCED_DETECT':
        const detected = walletDetector.getDetectedWallets();
        window.postMessage({
          type: 'TRUTHCHAIN_ADVANCED_DETECT_RESULT',
          requestId,
          success: true,
          data: detected
        }, '*');
        break;

      case 'TRUTHCHAIN_ADVANCED_CONNECT':
        const { provider } = event.data;
        const result = await walletDetector.connectWallet(provider);
        window.postMessage({
          type: 'TRUTHCHAIN_ADVANCED_CONNECT_RESULT',
          requestId,
          success: result.success,
          data: result
        }, '*');
        break;
    }
  } catch (error) {
    window.postMessage({
      type: type.replace('TRUTHCHAIN_ADVANCED_', 'TRUTHCHAIN_ADVANCED_') + '_RESULT',
      requestId,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, '*');
  }
});

console.log('TruthChain: Advanced Wallet Detector Initialized');

export default walletDetector;