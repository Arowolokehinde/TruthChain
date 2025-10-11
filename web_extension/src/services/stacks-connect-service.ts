/**
 * Stacks Connect Service
 * Handles wallet connection using the official Stacks Connect modal
 */

import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { config } from '../config/environment';
import { bnsService } from './bns-service';

export interface ConnectWalletResult {
  success: boolean;
  address?: string;
  publicKey?: string;
  provider?: string;
  walletName?: string;
  network?: string;
  bnsName?: string;
  fullBNSName?: string;
  error?: string;
}

class StacksConnectService {
  private userSession: UserSession;
  private appConfig: AppConfig;

  constructor() {
    // Initialize App Config
    this.appConfig = new AppConfig(['store_write', 'publish_data']);
    this.userSession = new UserSession({ appConfig: this.appConfig });
  }

  /**
   * Connect wallet using Stacks Connect modal
   */
  async connectWallet(): Promise<ConnectWalletResult> {
    return new Promise((resolve) => {
      try {
        showConnect({
          appDetails: {
            name: 'TruthChain',
            icon: chrome.runtime.getURL('Truthchain.jpeg'),
          },
          redirectTo: '/',
          onFinish: async (payload) => {
            try {
              const userData = payload.userSession.loadUserData();
              const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
              const publicKey = userData.appPrivateKey;

              // Try to fetch BNS name for this address
              let bnsName: string | undefined;
              let fullBNSName: string | undefined;

              try {
                const bnsResult = await bnsService.lookupNameByAddress(address);
                if (bnsResult.success && bnsResult.fullName) {
                  fullBNSName = bnsResult.fullName;
                  // Extract just the name part (before .btc or .id.stx)
                  bnsName = bnsResult.bnsName || fullBNSName.split('.')[0];
                }
              } catch (error) {
                console.error('BNS lookup failed:', error);
                // Continue without BNS name
              }

              resolve({
                success: true,
                address,
                publicKey,
                provider: 'stacks-connect',
                walletName: 'Stacks Wallet',
                network: config.network.name,
                bnsName,
                fullBNSName
              });
            } catch (error) {
              console.error('Error processing wallet data:', error);
              resolve({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to process wallet connection'
              });
            }
          },
          onCancel: () => {
            resolve({
              success: false,
              error: 'User cancelled the connection'
            });
          },
          userSession: this.userSession,
        });
      } catch (error) {
        console.error('Stacks Connect error:', error);
        resolve({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to show connect modal'
        });
      }
    });
  }

  /**
   * Check if user is already signed in
   */
  isUserSignedIn(): boolean {
    return this.userSession.isUserSignedIn();
  }

  /**
   * Get current user data if signed in
   */
  async getCurrentUser(): Promise<ConnectWalletResult | null> {
    if (!this.isUserSignedIn()) {
      return null;
    }

    try {
      const userData = this.userSession.loadUserData();
      const address = userData.profile.stxAddress.mainnet || userData.profile.stxAddress.testnet;
      const publicKey = userData.appPrivateKey;

      // Try to fetch BNS name
      let bnsName: string | undefined;
      let fullBNSName: string | undefined;

      try {
        const bnsResult = await bnsService.lookupNameByAddress(address);
        if (bnsResult.success && bnsResult.fullName) {
          fullBNSName = bnsResult.fullName;
          bnsName = bnsResult.bnsName || fullBNSName.split('.')[0];
        }
      } catch (error) {
        console.error('BNS lookup failed:', error);
      }

      return {
        success: true,
        address,
        publicKey,
        provider: 'stacks-connect',
        walletName: 'Stacks Wallet',
        network: config.network.name,
        bnsName,
        fullBNSName
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  /**
   * Sign out current user
   */
  signOut(): void {
    this.userSession.signUserOut();
  }

  /**
   * Get user session for advanced operations
   */
  getUserSession(): UserSession {
    return this.userSession;
  }
}

// Export singleton instance
export const stacksConnectService = new StacksConnectService();
export default stacksConnectService;
