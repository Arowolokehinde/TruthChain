import express from 'express';
import { RegistrationController } from '../controllers/RegistrationController';
import { VerificationController } from '../controllers/VerificationController';
import { BlockchainService } from '../services/BlockchainService';

const router = express.Router();

// Initialize blockchain service
const blockchainConfig = {
  contractAddress: process.env.CONTRACT_ADDRESS || 'SP1S7KX8TVSAWJ8CVJZQSFERBQ8BNCDXYFHXT21Z9',
  contractName: process.env.CONTRACT_NAME || 'truthchain_v1',
  network: (process.env.NETWORK as 'mainnet' | 'mainnet') || 'mainnet'
};

const blockchainService = new BlockchainService(blockchainConfig);

// Initialize controllers
const registrationController = new RegistrationController(blockchainService);
const verificationController = new VerificationController(blockchainService);

// Registration Routes (Development/Testing with senderKey)
router.post('/register', registrationController.registerTweet.bind(registrationController));
router.post('/check-registration', registrationController.checkRegistration.bind(registrationController));
router.get('/registration/:txId', registrationController.getRegistrationByTxId.bind(registrationController));

// Secure Registration Routes (Frontend Integration - no senderKey)
router.post('/secure/register', registrationController.secureRegisterTweet.bind(registrationController));
router.post('/secure/confirm-registration', registrationController.confirmRegistration.bind(registrationController));

// Verification Routes
router.post('/verify', verificationController.verifyTweet.bind(verificationController));
router.get('/verify/:hash', verificationController.quickVerify.bind(verificationController));
router.post('/verify/batch', verificationController.batchVerify.bind(verificationController));

// Health check
router.get('/health', async (req, res) => {
  try {
    const stats = await blockchainService.getContractStats();
    res.json({
      success: true,
      message: 'TruthChain API is running',
      blockchain: {
        connected: !!stats,
        network: blockchainConfig.network,
        contract: `${blockchainConfig.contractAddress}.${blockchainConfig.contractName}`
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'API running but blockchain connection failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;