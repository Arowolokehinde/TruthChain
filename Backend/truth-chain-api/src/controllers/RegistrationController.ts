import { Request, Response } from 'express';
import { HashService } from '../services/HashService';
import { BlockchainService } from '../services/BlockchainService';

export interface RegisterTweetRequest {
  tweetContent: string;
  tweetUrl?: string;
  twitterHandle?: string;
  senderKey: string; // Private key for blockchain transaction
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
   * Register a new tweet on the blockchain
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

}