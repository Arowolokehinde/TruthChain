/**
 * BNS (Bitcoin Name Service) Integration Service
 * 
 * This service provides BNS name lookup functionality for Stacks addresses.
 * It can resolve BNS names from wallet addresses and vice versa.
 */

export interface BNSName {
  name: string;
  namespace: string;
  address: string;
  zonefile?: string;
  expire_block?: number;
  grace_period?: number;
  renewal_deadline?: number;
  resolver?: string;
}

export interface BNSLookupResult {
  success: boolean;
  bnsName?: string;
  fullName?: string;
  namespace?: string;
  address?: string;
  error?: string;
  data?: BNSName;
}

export class BNSService {
  private static instance: BNSService;
  private readonly testnetApiUrl = 'https://api.testnet.hiro.so';
  private readonly mainnetApiUrl = 'https://api.mainnet.hiro.so';
  private isMainnet = false; // Default to testnet for development

  private constructor() {}

  public static getInstance(): BNSService {
    if (!BNSService.instance) {
      BNSService.instance = new BNSService();
    }
    return BNSService.instance;
  }

  /**
   * Set network (mainnet or testnet)
   */
  public setNetwork(isMainnet: boolean): void {
    this.isMainnet = isMainnet;
    console.log(`🌐 BNS Service: Network set to ${isMainnet ? 'mainnet' : 'testnet'}`);
  }

  /**
   * Get the appropriate API URL based on network
   */
  private getApiUrl(): string {
    return this.isMainnet ? this.mainnetApiUrl : this.testnetApiUrl;
  }

  /**
   * Lookup BNS name by Stacks address
   */
  public async lookupNameByAddress(address: string): Promise<BNSLookupResult> {
    try {
      console.log(`🔍 BNS Lookup: Searching for BNS name for address ${address}`);
      
      const apiUrl = this.getApiUrl();
      const response = await fetch(`${apiUrl}/v1/addresses/stacks/${address}`);
      
      if (!response.ok) {
        throw new Error(`BNS API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the response contains BNS name information
      if (data.names && data.names.length > 0) {
        const bnsName = data.names[0]; // Get the first/primary BNS name
        
        return {
          success: true,
          bnsName: bnsName.split('.')[0], // Name part (before the dot)
          fullName: bnsName,
          namespace: bnsName.split('.')[1], // Namespace part (after the dot)
          address: address
        };
      }
      
      // No BNS name found for this address
      return {
        success: true,
        bnsName: undefined,
        error: 'No BNS name found for this address'
      };
      
    } catch (error) {
      console.error('❌ BNS Lookup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during BNS lookup'
      };
    }
  }

  /**
   * Lookup Stacks address by BNS name
   */
  public async lookupAddressByName(name: string, namespace: string = 'btc'): Promise<BNSLookupResult> {
    try {
      const fullName = `${name}.${namespace}`;
      console.log(`🔍 BNS Lookup: Searching for address for BNS name ${fullName}`);
      
      const apiUrl = this.getApiUrl();
      const response = await fetch(`${apiUrl}/v1/names/${fullName}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            error: `BNS name ${fullName} not found`
          };
        }
        throw new Error(`BNS API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.address) {
        return {
          success: true,
          bnsName: name,
          fullName: fullName,
          namespace: namespace,
          address: data.address,
          data: data
        };
      }
      
      return {
        success: true,
        error: `No address found for BNS name ${fullName}`
      };
      
    } catch (error) {
      console.error('❌ BNS Lookup by name failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during BNS lookup'
      };
    }
  }

  /**
   * Get detailed BNS information for a name
   */
  public async getBNSDetails(name: string, namespace: string = 'btc'): Promise<BNSLookupResult> {
    try {
      const fullName = `${name}.${namespace}`;
      console.log(`📋 BNS Details: Getting detailed info for ${fullName}`);
      
      const apiUrl = this.getApiUrl();
      const response = await fetch(`${apiUrl}/v1/names/${fullName}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            error: `BNS name ${fullName} not found`
          };
        }
        throw new Error(`BNS API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        bnsName: name,
        fullName: fullName,
        namespace: namespace,
        address: data.address,
        data: data
      };
      
    } catch (error) {
      console.error('❌ BNS Details lookup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during BNS details lookup'
      };
    }
  }

  /**
   * Check if a BNS name is available
   */
  public async isBNSNameAvailable(name: string, namespace: string = 'btc'): Promise<boolean> {
    try {
      const result = await this.lookupAddressByName(name, namespace);
      // If we get an error about "not found", the name is available
      return !result.success || (result.success && Boolean(result.error?.includes('not found')));
    } catch (error) {
      console.error('Error checking BNS name availability:', error);
      return false; // Assume unavailable on error
    }
  }

  /**
   * Format BNS name for display
   */
  public formatBNSName(name: string, namespace: string = 'btc'): string {
    return `${name}.${namespace}`;
  }

  /**
   * Extract name and namespace from full BNS name
   */
  public parseBNSName(fullName: string): { name: string; namespace: string } {
    const parts = fullName.split('.');
    return {
      name: parts[0] || '',
      namespace: parts[1] || 'btc'
    };
  }

  /**
   * Validate BNS name format
   */
  public validateBNSName(name: string): { isValid: boolean; error?: string } {
    // BNS name validation rules
    if (!name || name.length === 0) {
      return { isValid: false, error: 'Name cannot be empty' };
    }
    
    if (name.length < 1 || name.length > 37) {
      return { isValid: false, error: 'Name must be 1-37 characters long' };
    }
    
    // BNS names can contain letters, numbers, and hyphens
    const validPattern = /^[a-zA-Z0-9-]+$/;
    if (!validPattern.test(name)) {
      return { isValid: false, error: 'Name can only contain letters, numbers, and hyphens' };
    }
    
    // Cannot start or end with hyphen
    if (name.startsWith('-') || name.endsWith('-')) {
      return { isValid: false, error: 'Name cannot start or end with a hyphen' };
    }
    
    return { isValid: true };
  }

  /**
   * Get popular BNS namespaces
   */
  public getPopularNamespaces(): string[] {
    return ['btc', 'stx', 'id', 'app'];
  }

  /**
   * Search for BNS names containing a keyword
   */
  public async searchBNSNames(keyword: string, namespace: string = 'btc', limit: number = 10): Promise<BNSLookupResult[]> {
    try {
      console.log(`🔍 BNS Search: Searching for names containing "${keyword}" in namespace "${namespace}"`);
      
      const apiUrl = this.getApiUrl();
      const response = await fetch(`${apiUrl}/v1/names?page=0&namespace=${namespace}`);
      
      if (!response.ok) {
        throw new Error(`BNS search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      const results: BNSLookupResult[] = [];
      
      // Filter results that contain the keyword
      if (data.names && Array.isArray(data.names)) {
        const filteredNames = data.names
          .filter((name: string) => name.toLowerCase().includes(keyword.toLowerCase()))
          .slice(0, limit);
        
        for (const name of filteredNames) {
          const parsed = this.parseBNSName(name);
          results.push({
            success: true,
            bnsName: parsed.name,
            fullName: name,
            namespace: parsed.namespace
          });
        }
      }
      
      return results;
      
    } catch (error) {
      console.error('❌ BNS Search failed:', error);
      return [{
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during BNS search'
      }];
    }
  }
}

// Export singleton instance
export const bnsService = BNSService.getInstance();
