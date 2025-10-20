// Environment configuration for TruthChain extension
// Handles development and production settings

export interface NetworkConfig {
  name: 'mainnet' | 'testnet' | 'devnet';
  stacksApi: string;
  explorerUrl: string;
  contractAddress: string;
  contractName: string;
}

export interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  network: NetworkConfig;
  features: {
    demoMode: boolean;
    debugLogging: boolean;
    simulatedTransactions: boolean;
  };
  wallets: {
    xverse: {
      enabled: boolean;
      priority: number;
    };
    leather: {
      enabled: boolean;
      priority: number;
    };
  };
}

// Determine environment
const isDevelopment = !chrome.runtime.getURL('').startsWith('chrome-extension://') || 
                     process.env.NODE_ENV === 'development';

// Network configurations
const NETWORKS: Record<string, NetworkConfig> = {
  mainnet: {
    name: 'mainnet',
    stacksApi: 'https://api.mainnet.hiro.so',
    explorerUrl: 'https://explorer.hiro.so',
    contractAddress: 'SP2PABAF9FTAJYNFZH93XENAJ8FVY99RRM50D2JG9', // Replace with actual mainnet address
    contractName: 'truth-chain'
  },
  testnet: {
    name: 'testnet',
    stacksApi: 'https://api.testnet.hiro.so',
    explorerUrl: 'https://explorer.hiro.so',
    contractAddress: 'ST3S9E18YKY18RQBR6WVZQ816C19R3FB3K3M0K3XX',
    contractName: 'Truth-Chain'
  },
  devnet: {
    name: 'devnet',
    stacksApi: 'http://localhost:3999',
    explorerUrl: 'http://localhost:8000',
    contractAddress: 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM',
    contractName: 'truth-chain'
  }
};

// Main configuration
export const config: EnvironmentConfig = {
  isDevelopment,
  isProduction: !isDevelopment,
  network: NETWORKS['testnet'], // Using testnet with deployed contract
  features: {
    demoMode: false, // Disable demo mode for production
    debugLogging: isDevelopment,
    simulatedTransactions: false // Disable simulated transactions for production
  },
  wallets: {
    xverse: {
      enabled: true,
      priority: 1
    },
    leather: {
      enabled: true,
      priority: 2
    }
  }
};

// Utility functions
export const ConfigUtils = {
  /**
   * Get current network configuration
   */
  getNetwork(): NetworkConfig {
    return config.network;
  },
  
  /**
   * Check if feature is enabled
   */
  isFeatureEnabled(feature: keyof typeof config.features): boolean {
    return config.features[feature];
  },
  
  /**
   * Get wallet configuration
   */
  getWalletConfig(wallet: 'xverse' | 'leather') {
    return config.wallets[wallet];
  },
  
  /**
   * Get API endpoint for service
   */
  getApiEndpoint(service: 'stacks' | 'explorer' | 'ipfs'): string {
    switch (service) {
      case 'stacks':
        return config.network.stacksApi;
      case 'explorer':
        return config.network.explorerUrl;
      case 'ipfs':
        return config.isDevelopment 
          ? 'https://api.web3.storage'
          : 'https://api.web3.storage';
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  },
  
  /**
   * Get transaction explorer URL
   */
  getTransactionUrl(txId: string): string {
    const baseUrl = config.network.explorerUrl;
    const network = config.network.name === 'mainnet' ? 'mainnet' : 'testnet';
    return `${baseUrl}/txid/${txId}?chain=${network}`;
  },
  
  /**
   * Get contract explorer URL
   */
  getContractUrl(): string {
    const baseUrl = config.network.explorerUrl;
    const network = config.network.name === 'mainnet' ? 'mainnet' : 'testnet';
    return `${baseUrl}/address/${config.network.contractAddress}?chain=${network}`;
  },
  
  /**
   * Log debug message if debugging is enabled
   */
  log(...args: any[]): void {
    if (config.features.debugLogging) {
      console.log('[TruthChain Debug]', ...args);
    }
  },
  
  /**
   * Log error message
   */
  logError(...args: any[]): void {
    console.error('[TruthChain Error]', ...args);
  },
  
  /**
   * Get contract call parameters
   */
  getContractParams() {
    return {
      contractAddress: config.network.contractAddress,
      contractName: config.network.contractName,
      network: config.network.name
    };
  },
  
  /**
   * Check if simulated transactions should be used
   */
  shouldSimulateTransactions(): boolean {
    return config.features.simulatedTransactions;
  },
  
  /**
   * Get wallet connection timeout
   */
  getWalletTimeout(): number {
    return config.isDevelopment ? 30000 : 15000; // 30s dev, 15s prod
  },
  
  /**
   * Get polling intervals
   */
  getPollingConfig() {
    return {
      walletDetection: config.isDevelopment ? 1000 : 500,
      transactionStatus: config.isDevelopment ? 5000 : 3000,
      contentVerification: config.isDevelopment ? 2000 : 1000
    };
  }
};

// Export default configuration
export default config;