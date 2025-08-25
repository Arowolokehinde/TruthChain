export interface TruthChainUser {
  username: string;
  walletAddress: string;
  walletAddressHash: string;
  createdAt: string;
  isVerified: boolean;
}

export interface UsernameValidationResult {
  isValid: boolean;
  error?: string;
  suggestions?: string[];
}

export class TruthChainUsernameManager {
  private static instance: TruthChainUsernameManager;
  private apiBaseUrl: string = 'https://api.truthchain.io'; // TODO: Update with actual API URL
  
  private constructor() {}
  
  public static getInstance(): TruthChainUsernameManager {
    if (!TruthChainUsernameManager.instance) {
      TruthChainUsernameManager.instance = new TruthChainUsernameManager();
    }
    return TruthChainUsernameManager.instance;
  }

  /**
   * Generate wallet address hash for username mapping
   */
  public async generateWalletHash(walletAddress: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(walletAddress + 'truthchain_salt');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate username format and availability
   */
  public validateUsernameFormat(username: string): UsernameValidationResult {
    // Username rules based on use case requirements
    const rules = {
      minLength: 3,
      maxLength: 20,
      allowedChars: /^[a-zA-Z0-9_-]+$/,
      noConsecutiveSpecial: /^(?!.*[-_]{2,})/,
      startsWithAlpha: /^[a-zA-Z]/,
      reservedWords: ['admin', 'truthchain', 'support', 'help', 'api', 'www', 'mail', 'email']
    };

    if (!username || username.length < rules.minLength) {
      return {
        isValid: false,
        error: `Username must be at least ${rules.minLength} characters long`
      };
    }

    if (username.length > rules.maxLength) {
      return {
        isValid: false,
        error: `Username cannot exceed ${rules.maxLength} characters`
      };
    }

    if (!rules.startsWithAlpha.test(username)) {
      return {
        isValid: false,
        error: 'Username must start with a letter'
      };
    }

    if (!rules.allowedChars.test(username)) {
      return {
        isValid: false,
        error: 'Username can only contain letters, numbers, hyphens, and underscores'
      };
    }

    if (!rules.noConsecutiveSpecial.test(username)) {
      return {
        isValid: false,
        error: 'Username cannot have consecutive special characters'
      };
    }

    if (rules.reservedWords.includes(username.toLowerCase())) {
      return {
        isValid: false,
        error: 'Username is reserved and cannot be used',
        suggestions: [
          `${username}1`,
          `${username}_user`,
          `user_${username}`
        ]
      };
    }

    return { isValid: true };
  }

  /**
   * Check if username is available via API
   */
  public async checkUsernameAvailability(username: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/usernames/check/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Failed to check username availability');
      }

      const result = await response.json();
      return result.available === true;
    } catch (error) {
      console.error('Username availability check failed:', error);
      // Fallback to local storage check if API fails
      return this.checkUsernameLocalFallback(username);
    }
  }

  /**
   * Create new username for wallet address
   */
  public async createUsername(username: string, walletAddress: string): Promise<TruthChainUser> {
    // Validate format first
    const formatValidation = this.validateUsernameFormat(username);
    if (!formatValidation.isValid) {
      throw new Error(formatValidation.error);
    }

    // Check availability
    const isAvailable = await this.checkUsernameAvailability(username);
    if (!isAvailable) {
      throw new Error('Username is already taken');
    }

    // Generate wallet hash
    const walletAddressHash = await this.generateWalletHash(walletAddress);

    // Check if wallet already has a username
    const existingUser = await this.getUserByWallet(walletAddress);
    if (existingUser) {
      throw new Error('This wallet already has a username registered');
    }

    try {
      const response = await fetch(`${this.apiBaseUrl}/usernames/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          walletAddress,
          walletAddressHash,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create username');
      }

      const userData = await response.json();
      
      // Store locally for quick access
      await this.storeUserLocally(userData);
      
      return userData;
    } catch (error) {
      console.error('Username creation failed:', error);
      throw error;
    }
  }

  /**
   * Get user by username
   */
  public async getUserByUsername(username: string): Promise<TruthChainUser | null> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/usernames/${encodeURIComponent(username)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch user');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get user by username:', error);
      return null;
    }
  }

  /**
   * Get user by wallet address
   */
  public async getUserByWallet(walletAddress: string): Promise<TruthChainUser | null> {
    try {
      const walletAddressHash = await this.generateWalletHash(walletAddress);
      const response = await fetch(`${this.apiBaseUrl}/users/by-wallet-hash/${encodeURIComponent(walletAddressHash)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch user by wallet');
      }

      const userData = await response.json();
      
      // Store locally for quick access
      await this.storeUserLocally(userData);
      
      return userData;
    } catch (error) {
      console.error('Failed to get user by wallet:', error);
      return this.getUserLocalFallback(walletAddress);
    }
  }

  /**
   * Verify username ownership with signature
   */
  public async verifyUsernameOwnership(username: string, walletAddress: string, signature?: string): Promise<boolean> {
    try {
      const user = await this.getUserByUsername(username);
      if (!user) {
        return false;
      }

      // Basic verification: check if wallet matches
      if (user.walletAddress === walletAddress) {
        return true;
      }

      // If signature provided, verify it
      if (signature) {
        // TODO: Implement signature verification
        console.log('Signature verification not yet implemented');
      }

      return false;
    } catch (error) {
      console.error('Username ownership verification failed:', error);
      return false;
    }
  }

  /**
   * Get current user from wallet connection
   */
  public async getCurrentUser(): Promise<TruthChainUser | null> {
    try {
      // Get current wallet from storage
      const walletData = await new Promise<any>((resolve) => {
        chrome.storage.local.get(['walletData'], (result) => {
          resolve(result.walletData);
        });
      });

      if (!walletData?.address) {
        return null;
      }

      return await this.getUserByWallet(walletData.address);
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  /**
   * Store user data locally for quick access
   */
  private async storeUserLocally(userData: TruthChainUser): Promise<void> {
    try {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({
          [`user_${userData.walletAddressHash}`]: userData,
          [`username_${userData.username}`]: userData
        }, () => resolve());
      });
    } catch (error) {
      console.error('Failed to store user locally:', error);
    }
  }

  /**
   * Local fallback for username availability check
   */
  private async checkUsernameLocalFallback(username: string): Promise<boolean> {
    try {
      const result = await new Promise<any>((resolve) => {
        chrome.storage.local.get([`username_${username}`], (result) => {
          resolve(result);
        });
      });
      
      return !result[`username_${username}`];
    } catch (error) {
      console.error('Local username check failed:', error);
      return false;
    }
  }

  /**
   * Local fallback for getting user by wallet
   */
  private async getUserLocalFallback(walletAddress: string): Promise<TruthChainUser | null> {
    try {
      const walletAddressHash = await this.generateWalletHash(walletAddress);
      const result = await new Promise<any>((resolve) => {
        chrome.storage.local.get([`user_${walletAddressHash}`], (result) => {
          resolve(result);
        });
      });
      
      return result[`user_${walletAddressHash}`] || null;
    } catch (error) {
      console.error('Local user lookup failed:', error);
      return null;
    }
  }

  /**
   * Generate username suggestions
   */
  public generateUsernameSuggestions(baseUsername: string): string[] {
    const suggestions = [];
    const base = baseUsername.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    
    // Add numbers
    for (let i = 1; i <= 5; i++) {
      suggestions.push(`${base}${i}`);
    }
    
    // Add descriptive suffixes
    const suffixes = ['user', 'dev', 'crypto', 'stx', 'web3'];
    suffixes.forEach(suffix => {
      suggestions.push(`${base}_${suffix}`);
      if (base.length <= 15) {
        suggestions.push(`${base}${suffix}`);
      }
    });
    
    // Add random elements
    const randomElements = ['21', '99', 'x', 'z', 'pro', 'og'];
    randomElements.forEach(element => {
      if (base.length + element.length <= 20) {
        suggestions.push(`${base}${element}`);
      }
    });
    
    return suggestions.slice(0, 8); // Return top 8 suggestions
  }
}

export default TruthChainUsernameManager;