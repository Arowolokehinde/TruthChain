/**
 * TruthChain API Service
 * Handles communication between web extension and backend API
 */

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ContentRegistrationRequest {
  content: string;
  title?: string;
  url?: string;
  contentType?: 'tweet' | 'blog_post' | 'page' | 'media' | 'document';
  metadata?: {
    author?: string;
    platform?: string;
    timestamp?: string;
  };
}

export interface ContentRegistrationResponse {
  registrationId: number;
  hash: string;
  author: string;
  blockHeight: number;
  timestamp: number;
  txId: string;
}

export interface ContentVerificationRequest {
  content?: string;
  hash?: string;
}

export interface ContentVerificationResponse {
  exists: boolean;
  author?: string;
  timestamp?: number;
  blockHeight?: number;
  contentType?: string;
  registrationId?: number;
}

export interface BatchVerificationRequest {
  hashes: string[];
}

export interface BatchVerificationResponse {
  results: Array<{
    hash: string;
    exists: boolean;
    author?: string;
    timestamp?: number;
  }>;
}

export class TruthChainAPIService {
  private static instance: TruthChainAPIService;
  private baseURL: string;
  private isProduction: boolean;

  private constructor() {
    // Determine if this is production or development
    this.isProduction = !chrome.runtime.getURL('').includes('chrome-extension://unpacked/');
    
    // Set API base URL based on environment
    this.baseURL = this.isProduction 
      ? 'https://truth-chain-api.onrender.com' // Replace with your deployed API URL
      : 'http://localhost:3000'; // Local development API
  }

  public static getInstance(): TruthChainAPIService {
    if (!TruthChainAPIService.instance) {
      TruthChainAPIService.instance = new TruthChainAPIService();
    }
    return TruthChainAPIService.instance;
  }

  /**
   * Register content on the blockchain
   */
  public async registerContent(request: ContentRegistrationRequest): Promise<APIResponse<ContentRegistrationResponse>> {
    try {
      console.log('🔗 TruthChain API: Registering content...', request);

      const response = await fetch(`${this.baseURL}/api/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          content: request.content,
          title: request.title || 'Untitled Content',
          url: request.url || window.location.href,
          contentType: request.contentType || 'page',
          metadata: {
            ...request.metadata,
            extensionVersion: '1.0.0',
            timestamp: new Date().toISOString(),
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ TruthChain API: Content registered successfully', data);

      return {
        success: true,
        data: data.data,
        message: 'Content registered successfully on blockchain'
      };

    } catch (error) {
      console.error('❌ TruthChain API: Registration failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Verify content on the blockchain
   */
  public async verifyContent(request: ContentVerificationRequest): Promise<APIResponse<ContentVerificationResponse>> {
    try {
      console.log('🔍 TruthChain API: Verifying content...', request);

      const response = await fetch(`${this.baseURL}/api/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          content: request.content,
          hash: request.hash,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ TruthChain API: Content verification completed', data);

      return {
        success: true,
        data: data.data,
        message: data.data?.exists ? 'Content verified on blockchain' : 'Content not found on blockchain'
      };

    } catch (error) {
      console.error('❌ TruthChain API: Verification failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Quick hash verification
   */
  public async verifyHash(hash: string): Promise<APIResponse<ContentVerificationResponse>> {
    try {
      console.log('🔍 TruthChain API: Quick hash verification...', hash);

      const response = await fetch(`${this.baseURL}/api/verify/${encodeURIComponent(hash)}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ TruthChain API: Hash verification completed', data);

      return {
        success: true,
        data: data.data,
        message: data.data?.exists ? 'Hash verified on blockchain' : 'Hash not found on blockchain'
      };

    } catch (error) {
      console.error('❌ TruthChain API: Hash verification failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Batch verify multiple hashes
   */
  public async batchVerify(request: BatchVerificationRequest): Promise<APIResponse<BatchVerificationResponse>> {
    try {
      console.log('🔍 TruthChain API: Batch verification...', request);

      const response = await fetch(`${this.baseURL}/api/verify/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          hashes: request.hashes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ TruthChain API: Batch verification completed', data);

      return {
        success: true,
        data: {
          results: data.data?.results || []
        },
        message: `Verified ${request.hashes.length} hashes`
      };

    } catch (error) {
      console.error('❌ TruthChain API: Batch verification failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Check API health
   */
  public async healthCheck(): Promise<APIResponse<{status: string; timestamp: string}>> {
    try {
      const response = await fetch(`${this.baseURL}/api/health`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        success: true,
        data: {
          status: data.status || 'healthy',
          timestamp: data.timestamp || new Date().toISOString()
        },
        message: 'API is healthy'
      };

    } catch (error) {
      console.error('❌ TruthChain API: Health check failed', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'API unavailable'
      };
    }
  }

  /**
   * Get API base URL (for debugging)
   */
  public getAPIUrl(): string {
    return this.baseURL;
  }

  /**
   * Set custom API URL (for development/testing)
   */
  public setAPIUrl(url: string): void {
    this.baseURL = url;
    console.log('🔗 TruthChain API: URL updated to', this.baseURL);
  }
}

export default TruthChainAPIService;
