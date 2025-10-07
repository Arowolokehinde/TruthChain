/**
 * Professional Wallet Integration Service
 * 
 * This service implements proper wallet integration using official libraries:
 * - @stacks/connect for Stacks wallet support (using v7.x API)
 * - sats-connect for Xverse-specific functionality
 * 
 * Following official documentation and best practices.
 */

import { showConnect, disconnect, UserSession, AppConfig } from '@stacks/connect';
import { request as satsRequest, AddressPurpose } from 'sats-connect';
import { bnsService } from './bns-service';

export interface WalletAddress {
  address: string;
  publicKey?: string;
  bnsName?: string;
  fullBNSName?: string;
}

export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  publicKey?: string;
  bnsName?: string;
  fullBNSName?: string;
  error?: string;
  walletType: 'xverse' | 'leather' | 'unknown';
}

export class ProfessionalWalletService {
  private static instance: ProfessionalWalletService;
  private userSession: UserSession | null = null;
  
  private constructor() {
    // Initialize UserSession for @stacks/connect
    const appConfig = new AppConfig(['store_write', 'publish_data']);
    this.userSession = new UserSession({ appConfig });
  }
  
  public static getInstance(): ProfessionalWalletService {
    if (!ProfessionalWalletService.instance) {
      ProfessionalWalletService.instance = new ProfessionalWalletService();
    }
    return ProfessionalWalletService.instance;
  }

  /**
   * Lookup BNS name for a given Stacks address
   */
  private async lookupBNSName(address: string): Promise<{ bnsName?: string; fullBNSName?: string }> {
    try {
      console.log(`🔍 Looking up BNS name for address: ${address}`);
      const bnsResult = await bnsService.lookupNameByAddress(address);
      
      if (bnsResult.success && bnsResult.bnsName) {
        console.log(`✅ Found BNS name: ${bnsResult.fullName} for address ${address}`);
        return {
          bnsName: bnsResult.bnsName,
          fullBNSName: bnsResult.fullName
        };
      } else {
        console.log(`ℹ️ No BNS name found for address ${address}`);
        return {};
      }
    } catch (error) {
      console.error('❌ BNS lookup failed:', error);
      return {};
    }
  }

  /**
   * Connect to Xverse wallet using official sats-connect library
   */
  public async connectXverse(): Promise<WalletConnectionResult> {
    try {
      console.log('🔌 Connecting to Xverse wallet using sats-connect...');
      
      // Use official sats-connect library for Xverse
      const response = await satsRequest('getAccounts', {
        purposes: [AddressPurpose.Stacks],
        message: 'TruthChain would like to connect to your Xverse wallet'
      });
      
      console.log('✅ Xverse connection response:', response);
      
      if (response.status === 'success' && response.result && response.result.length > 0) {
        const account = response.result[0];
        
        // Lookup BNS name for the connected address
        const bnsInfo = await this.lookupBNSName(account.address);
        
        return {
          success: true,
          address: account.address,
          publicKey: account.publicKey,
          bnsName: bnsInfo.bnsName,
          fullBNSName: bnsInfo.fullBNSName,
          walletType: 'xverse'
        };
      } else {
        throw new Error('No accounts returned from Xverse');
      }
      
    } catch (error) {
      console.error('❌ Xverse connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error connecting to Xverse',
        walletType: 'xverse'
      };
    }
  }

  /**
   * Connect to Leather wallet using @stacks/connect
   */
  public async connectLeather(): Promise<WalletConnectionResult> {
    try {
      console.log('🔌 Connecting to Leather wallet using @stacks/connect...');
      
      return new Promise((resolve) => {
        // Use @stacks/connect v7.x API
        showConnect({
          appDetails: {
            name: 'TruthChain',
            icon: window.location.origin + '/icon48.png'
          },
          onFinish: async (authData) => {
            console.log('✅ Leather connection successful:', authData);
            
            if (this.userSession) {
              const userData = this.userSession.loadUserData();
              const address = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
              
              // Lookup BNS name for the connected address
              const bnsInfo = await this.lookupBNSName(address);
              
              resolve({
                success: true,
                address: address,
                bnsName: bnsInfo.bnsName,
                fullBNSName: bnsInfo.fullBNSName,
                walletType: 'leather'
              });
            } else {
              resolve({
                success: false,
                error: 'Failed to load user data',
                walletType: 'leather'
              });
            }
          },
          onCancel: () => {
            console.log('❌ Leather connection cancelled');
            resolve({
              success: false,
              error: 'User cancelled connection',
              walletType: 'leather'
            });
          }
        });
      });
      
    } catch (error) {
      console.error('❌ Leather connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error connecting to Leather',
        walletType: 'leather'
      };
    }
  }

  /**
   * Universal connect method that tries specific wallet methods
   */
  public async connectUniversal(preferredWallet?: 'xverse' | 'leather'): Promise<WalletConnectionResult> {
    try {
      console.log('🔌 Universal wallet connection started...', { preferredWallet });
      
      // If specific wallet requested, use dedicated method
      if (preferredWallet === 'xverse') {
        return await this.connectXverse();
      }
      
      if (preferredWallet === 'leather') {
        return await this.connectLeather();
      }
      
      // Try Xverse first, then Leather as fallback
      const xverseResult = await this.connectXverse();
      if (xverseResult.success) {
        return xverseResult;
      }
      
      console.log('Xverse failed, trying Leather...');
      return await this.connectLeather();
      
    } catch (error) {
      console.error('❌ Universal wallet connection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'All wallet connection methods failed',
        walletType: 'unknown'
      };
    }
  }

  /**
   * Get current connection status
   */
  public async getConnectionStatus(): Promise<{ connected: boolean; address?: string; walletType?: string }> {
    try {
      // Check @stacks/connect session
      if (this.userSession && this.userSession.isUserSignedIn()) {
        const userData = this.userSession.loadUserData();
        return {
          connected: true,
          address: userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet,
          walletType: 'leather'
        };
      }
      
      return { connected: false };
    } catch (error) {
      console.error('Error checking connection status:', error);
      return { connected: false };
    }
  }

  /**
   * Disconnect from wallet
   */
  public async disconnectWallet(): Promise<void> {
    try {
      // Disconnect from @stacks/connect
      if (this.userSession && this.userSession.isUserSignedIn()) {
        this.userSession.signUserOut();
      }
      
      // Call disconnect function
      disconnect();
      
      // Clear any local storage or state
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('walletType');
      
      console.log('✅ Wallet disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  }

  /**
   * Get the current user session
   */
  public getUserSession(): UserSession | null {
    return this.userSession;
  }

  /**
   * Get current user address
   */
  public getCurrentAddress(): string | null {
    try {
      if (this.userSession && this.userSession.isUserSignedIn()) {
        const userData = this.userSession.loadUserData();
        return userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
      }
      return null;
    } catch (error) {
      console.error('Error getting current address:', error);
      return null;
    }
  }

  /**
   * Get BNS name for the currently connected wallet
   */
  public async getCurrentWalletBNSName(): Promise<{ bnsName?: string; fullBNSName?: string; error?: string }> {
    try {
      const currentAddress = this.getCurrentAddress();
      if (!currentAddress) {
        return { error: 'No wallet connected' };
      }
      
      return await this.lookupBNSName(currentAddress);
    } catch (error) {
      console.error('Error getting current wallet BNS name:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get BNS name for any Stacks address
   */
  public async getBNSNameForAddress(address: string): Promise<{ bnsName?: string; fullBNSName?: string; error?: string }> {
    try {
      return await this.lookupBNSName(address);
    } catch (error) {
      console.error('Error getting BNS name for address:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if wallet is currently connected
   */
  public isConnected(): boolean {
    try {
      return this.userSession ? this.userSession.isUserSignedIn() : false;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  }
}

// Export singleton instance
export const professionalWalletService = ProfessionalWalletService.getInstance();
