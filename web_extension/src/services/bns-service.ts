import { config } from '../config/environment';

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
  private isMainnet = config.network.name === 'mainnet'; // Initialize based on environment config

  private constructor() {
    console.log(`🌐 BNS Service initialized: Network set to ${this.isMainnet ? 'mainnet' : 'testnet'}`);
  }

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
   * Now checks both regular BNS names and BNS NFTs
   */
  public async lookupNameByAddress(address: string): Promise<BNSLookupResult> {
    try {
      console.log(`🔍 BNS Lookup: Searching for BNS name for address ${address}`);
      
      const apiUrl = this.getApiUrl();
      
      // First, try regular BNS names
      const response = await fetch(`${apiUrl}/v1/addresses/stacks/${address}`);
      
      if (!response.ok) {
        throw new Error(`BNS API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if the response contains BNS name information
      if (data.names && data.names.length > 0) {
        const bnsName = data.names[0]; // Get the first/primary BNS name
        
        console.log(`✅ BNS: Found regular BNS name: ${bnsName}`);
        return {
          success: true,
          bnsName: bnsName.split('.')[0], // Name part (before the dot)
          fullName: bnsName,
          namespace: bnsName.split('.')[1], // Namespace part (after the dot)
          address: address
        };
      }
      
      // If no regular BNS name, check for BNS NFTs
      console.log(`🔍 BNS: No regular name found, checking for BNS NFTs...`);
      const nftResult = await this.lookupBNSNFT(address, apiUrl);
      if (nftResult.success && nftResult.bnsName) {
        return nftResult;
      }
      
      // No BNS name found for this address
      console.log(`⚠️ BNS: No BNS name or NFT found for address`);
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
   * Lookup BNS NFT names for an address
   * BNS NFTs are stored differently and require NFT endpoint
   */
  private async lookupBNSNFT(address: string, apiUrl: string): Promise<BNSLookupResult> {
    try {
      console.log(`🔍 BNS NFT: Checking for BNS NFTs at ${apiUrl}`);
      
      // Query NFT holdings for the address
      // BNS NFTs are in the SP000000000000000000002Q6VF78.bns contract
      const nftResponse = await fetch(
        `${apiUrl}/extended/v1/tokens/nft/holdings?principal=${address}&limit=50`
      );
      
      if (!nftResponse.ok) {
        console.log(`⚠️ BNS NFT: API request failed: ${nftResponse.status}`);
        return {
          success: false,
          error: 'NFT lookup failed'
        };
      }
      
      const nftData = await nftResponse.json();
      console.log(`🔍 BNS NFT: Found ${nftData.results?.length || 0} NFTs for address`);
      
      // Look for BNS NFTs in the holdings
      if (nftData.results && nftData.results.length > 0) {
        for (const nft of nftData.results) {
          console.log(`🔍 BNS NFT: Checking NFT:`, {
            assetId: nft.asset_identifier,
            value: nft.value?.repr
          });
          
          // Check if this is a BNS NFT (contract: SP000000000000000000002Q6VF78.bns)
          if (nft.asset_identifier && nft.asset_identifier.includes('::bns::')) {
            console.log(`✅ BNS NFT: Found BNS NFT for address ${address}`);
            
            // Extract BNS name from the NFT value
            // The value is typically encoded, we need to decode it
            if (nft.value && nft.value.repr) {
              console.log(`🔍 BNS NFT: Parsing repr:`, nft.value.repr);
              
              // Parse the BNS name from the repr value
              // Example: (tuple (name 0x68656e7279) (namespace 0x627463))
              const nameMatch = nft.value.repr.match(/name\s+0x([0-9a-f]+)/i);
              const namespaceMatch = nft.value.repr.match(/namespace\s+0x([0-9a-f]+)/i);
              
              if (nameMatch && namespaceMatch) {
                const nameHex = nameMatch[1];
                const namespaceHex = namespaceMatch[1];
                
                // Convert hex to string
                const name = this.hexToString(nameHex);
                const namespace = this.hexToString(namespaceHex);
                const fullName = `${name}.${namespace}`;
                
                console.log(`✅ BNS NFT: Decoded name: ${fullName}`);
                
                return {
                  success: true,
                  bnsName: name,
                  fullName: fullName,
                  namespace: namespace,
                  address: address
                };
              } else {
                console.log(`⚠️ BNS NFT: Could not match name/namespace in repr`);
              }
            } else {
              console.log(`⚠️ BNS NFT: No repr value found`);
            }
          }
        }
      } else {
        console.log(`⚠️ BNS NFT: No NFTs found for address`);
      }
      
      return {
        success: false,
        error: 'No BNS NFT found'
      };
      
    } catch (error) {
      console.error('❌ BNS NFT Lookup failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during BNS NFT lookup'
      };
    }
  }

  /**
   * Convert hex string to ASCII string
   */
  private hexToString(hex: string): string {
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
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
