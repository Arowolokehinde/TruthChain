import { Request, Response } from 'express';
import { HashService } from '../services/HashService';
import { BlockchainService } from '../services/BlockchainService';

// For development/testing with Postman (includes senderKey)
export interface RegisterTweetRequest {
  tweetContent: string;
  tweetUrl?: string;
  twitterHandle?: string;
  senderKey: string; // Private key for blockchain transaction
}

// For secure frontend integration (no senderKey)
export interface SecureRegisterRequest {
  tweetContent: string;
  tweetUrl?: string;
  twitterHandle?: string;
  txId?: string; // Optional transaction ID if already submitted
}

export interface RegisterTweetResponse {
  success: boolean;
  message: string;
  data?: {
    hash: string;
    txId?: string;
    registrationId?: number;
    tweetUrl?: string;
    twitterHandle?: string;
  };
  error?: string;
}

export class RegistrationController {
  private blockchainService: BlockchainService;

  constructor(blockchainService: BlockchainService) {
    this.blockchainService = blockchainService;
  }

  /**
   * Register a new tweet on the blockchain (Development/Testing)
   * POST /api/register
   */
  async registerTweet(req: Request, res: Response): Promise<Response<RegisterTweetResponse>> {
    try {
      const { tweetContent, tweetUrl, twitterHandle, senderKey }: RegisterTweetRequest = req.body;

      // Validation
      if (!tweetContent || !senderKey) {
        return res.status(400).json({
          success: false,
          message: 'Tweet content and sender key are required',
          error: 'Missing required fields'
        });
      }

      if (tweetContent.length > 280) {
        return res.status(400).json({
          success: false,
          message: 'Tweet content exceeds 280 characters',
          error: 'Content too long'
        });
      }

      // Generate content hash
      const contentHash = HashService.generateContentHash(tweetContent);
      const hashHex = HashService.generateContentHashHex(tweetContent);

      // Check if content already exists
      const exists = await this.blockchainService.hashExists(contentHash);
      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'This content has already been registered',
          error: 'Duplicate content',
          data: {
            hash: hashHex,
            tweetUrl,
            twitterHandle
          }
        });
      }

      // Register on blockchain
      const registrationResult = await this.blockchainService.registerTweet(
        contentHash,
        senderKey
      );

      if (!registrationResult.success) {
        return res.status(500).json({
          success: false,
          message: 'Failed to register tweet on blockchain',
          error: registrationResult.error
        });
      }


      return res.status(201).json({
        success: true,
        message: 'Tweet registered successfully',
        data: {
          hash: hashHex,
          txId: registrationResult.txId,
          registrationId: registrationResult.registrationId,
          tweetUrl,
          twitterHandle
        }
      });

    } catch (error) {
      console.error('Error registering tweet:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Check if a tweet can be registered (pre-validation)
   * POST /api/check-registration
   */
  async checkRegistration(req: Request, res: Response): Promise<Response> {
    try {
      const { tweetContent }: { tweetContent: string } = req.body;

      if (!tweetContent) {
        return res.status(400).json({
          success: false,
          message: 'Tweet content is required'
        });
      }

      // Generate hash and check existence
      const contentHash = HashService.generateContentHash(tweetContent);
      const hashHex = HashService.generateContentHashHex(tweetContent);
      const exists = await this.blockchainService.hashExists(contentHash);

      return res.json({
        success: true,
        data: {
          hash: hashHex,
          exists: exists,
          canRegister: !exists,
          message: exists 
            ? 'Content already registered' 
            : 'Content available for registration'
        }
      });

    } catch (error) {
      console.error('Error checking registration:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error checking registration status',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }


  /**
   * Get registration by transaction ID
   * GET /api/registration/:txId
   */
  async getRegistrationByTxId(req: Request, res: Response): Promise<Response> {
    try {
      const { txId } = req.params;

      if (!txId) {
        return res.status(400).json({
          success: false,
          message: 'Transaction ID is required'
        });
      }
      return res.json({
        success: true,
        message: 'Registration lookup by transaction ID',
        data: {
          txId,
        }
      });

    } catch (error) {
      console.error('Error getting registration:', error);
      
      return res.status(500).json({
        success: false,
        message: 'Error retrieving registration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Secure registration for frontend integration (no senderKey)
   * POST /api/secure/register
   */
  async secureRegisterTweet(req: Request, res: Response): Promise<Response> {
    try {
      const { tweetContent, tweetUrl, twitterHandle, txId }: SecureRegisterRequest = req.body;

      // Validation
      if (!tweetContent) {
        return res.status(400).json({
          success: false,
          message: 'Tweet content is required',
          error: 'Missing required fields'
        });
      }

      if (tweetContent.length > 280) {
        return res.status(400).json({
          success: false,
          message: 'Tweet content exceeds 280 characters',
          error: 'Content too long'
        });
      }

      // Generate content hash
      const contentHash = HashService.generateContentHash(tweetContent);
      const hashHex = HashService.generateContentHashHex(tweetContent);

      // Check if content already exists
      const exists = await this.blockchainService.hashExists(contentHash);
      if (exists) {
        return res.status(409).json({
          success: false,
          message: 'This content has already been registered',
          error: 'Duplicate content',
          data: {
            hash: hashHex,
            tweetUrl,
            twitterHandle
          }
        });
      }

      // Return hash and metadata for frontend to handle blockchain transaction
      return res.status(200).json({
        success: true,
        message: 'Content ready for blockchain registration',
        data: {
          hash: hashHex,
          tweetUrl,
          twitterHandle,
          txId,
          instructions: 'Use this hash with your wallet to register on-chain'
        }
      });

    } catch (error) {
      console.error('Error in secure registration:', error);

      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Confirm registration after blockchain transaction
   * POST /api/secure/confirm-registration
   */
  async confirmRegistration(req: Request, res: Response): Promise<Response> {
    try {
      const { tweetContent, txId }: { tweetContent: string; txId: string } = req.body;

      if (!tweetContent || !txId) {
        return res.status(400).json({
          success: false,
          message: 'Tweet content and transaction ID are required'
        });
      }

      // Generate hash and verify it exists on blockchain
      const contentHash = HashService.generateContentHash(tweetContent);
      const hashHex = HashService.generateContentHashHex(tweetContent);

      // Wait a moment for transaction to be confirmed
      await new Promise(resolve => setTimeout(resolve, 2000));

      const verification = await this.blockchainService.verifyTweet(contentHash);

      if (!verification) {
        return res.status(404).json({
          success: false,
          message: 'Registration not found on blockchain. Transaction may still be pending.',
          data: {
            hash: hashHex,
            txId
          }
        });
      }

      return res.json({
        success: true,
        message: 'Registration confirmed on blockchain',
        data: {
          hash: hashHex,
          txId,
          author: verification.author,
          registeredAt: new Date(verification.timestamp > 1000000000000 ? verification.timestamp : verification.timestamp * 1000).toISOString(),
          blockHeight: verification.blockHeight,
          registrationId: verification.registrationId,
        }
      });

    } catch (error) {
      console.error('Error confirming registration:', error);

      return res.status(500).json({
        success: false,
        message: 'Error confirming registration',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

}