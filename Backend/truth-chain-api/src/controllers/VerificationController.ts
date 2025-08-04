import { Request, Response } from 'express';
import { HashService } from '../services/HashService';
import { BlockchainService } from '../services/BlockchainService';

export interface VerifyTweetRequest {
  tweetContent?: string;
  hash?: string;
}

export interface VerifyTweetResponse {
  success: boolean;
  verified: boolean;
  message: string;
  data?: {
    hash: string;
    author: string;
    registeredAt: string;
    blockHeight: number;
    registrationId: number;
    txId?: string;
    // Rich metadata from database (when implemented)
    tweetUrl?: string;
    twitterHandle?: string;
    fullText?: string;
  };
  error?: string;
}

export class VerificationController {
  private blockchainService: BlockchainService;

  constructor(blockchainService: BlockchainService) {
    this.blockchainService = blockchainService;
  }

  /**
   * Verify tweet content or hash
   * POST /api/verify
   */
  async verifyTweet(req: Request, res: Response): Promise<Response<VerifyTweetResponse>> {
    try {
      const { tweetContent, hash }: VerifyTweetRequest = req.body;

      // Must provide either content or hash
      if (!tweetContent && !hash) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Either tweet content or hash is required',
          error: 'Missing required fields'
        });
      }

      let contentHash: Buffer;
      let hashHex: string;

      if (tweetContent) {
        // Generate hash from content
        contentHash = HashService.generateContentHash(tweetContent);
        hashHex = HashService.generateContentHashHex(tweetContent);
      } else {
        // Use provided hash
        hashHex = hash!;
        contentHash = HashService.hexToBuffer(hash!);
      }

      // Verify on blockchain
      const verification = await this.blockchainService.verifyTweet(contentHash);

      if (!verification) {
        return res.json({
          success: true,
          verified: false,
          message: 'Content not found on blockchain',
          data: {
            hash: hashHex
          }
        });
      }

      return res.json({
        success: true,
        verified: true,
        message: 'Content verified successfully',
        data: {
          hash: hashHex,
          author: verification.author,
          registeredAt: new Date(verification.timestamp * 1000).toISOString(),
          blockHeight: verification.blockHeight,
          registrationId: verification.registrationId,
        }
      });

    } catch (error) {
      console.error('Error verifying tweet:', error);
      
      return res.status(500).json({
        success: false,
        verified: false,
        message: 'Error during verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

    /**
   * Quick hash existence check
   * GET /api/verify/:hash
   */
  async quickVerify(req: Request, res: Response): Promise<Response> {
    try {
      const { hash } = req.params;

      if (!hash) {
        return res.status(400).json({
          success: false,
          verified: false,
          message: 'Hash parameter is required'
        });
      }

      const contentHash = HashService.hexToBuffer(hash);
      const exists = await this.blockchainService.hashExists(contentHash);

      return res.json({
        success: true,
        verified: exists,
        message: exists ? 'Content verified' : 'Content not found',
        data: {
          hash: hash,
          exists: exists
        }
      });

    } catch (error) {
      console.error('Error in quick verify:', error);
      
      return res.status(500).json({
        success: false,
        verified: false,
        message: 'Error during quick verification',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
}