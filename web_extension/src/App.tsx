import { useState, useEffect } from 'react'
import TruthChainUsernameManager, { type TruthChainUser } from './utils/username-manager'
import { professionalWalletConnector } from './lib/professional-wallet-connector'

interface WalletState {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  username?: string | null;
  bnsName?: string | null;
  fullBNSName?: string | null;
}

interface ContentState {
  isProcessing: boolean;
  lastAction: string | null;
  contentCID: string | null;
  txId: string | null;
  error: string | null;
  lastUpdate: string | null;
}

interface ChromeStorageResult {
  walletData?: {
    address: string;
    publicKey: string;
    bnsName?: string;
    fullBNSName?: string;
  };
}

interface ContentItem {
  cid?: string;
  txId?: string;
  isRegistered?: boolean;
  owner?: string;
  timestamp?: string;
}

interface ChromeRuntimeResponse {
  success: boolean;
  data?: {
    cid?: string;
    txId?: string;
    isRegistered?: boolean;
    owner?: string;
    timestamp?: string;
  }[];
  error?: string;
}

const App = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    publicKey: null,
    username: null,
    bnsName: null,
    fullBNSName: null
  });
  const [content, setContent] = useState<ContentState>({
    isProcessing: false,
    lastAction: null,
    contentCID: null,
    txId: null,
    error: null,
    lastUpdate: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const [showUsernameSetup, setShowUsernameSetup] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [currentUser, setCurrentUser] = useState<TruthChainUser | null>(null);
  const [showDebugMode, setShowDebugMode] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected and get username
    chrome.storage.local.get(['walletData'], async (result: ChromeStorageResult) => {
      if (result.walletData) {
        setWallet({
          isConnected: true,
          address: result.walletData.address,
          publicKey: result.walletData.publicKey,
          username: null,
          bnsName: result.walletData.bnsName || null,
          fullBNSName: result.walletData.fullBNSName || null
        });

        // Check for existing username
        const usernameManager = TruthChainUsernameManager.getInstance();
        const user = await usernameManager.getUserByWallet(result.walletData.address);
        if (user) {
          setCurrentUser(user);
          setWallet(prev => ({ ...prev, username: user.username }));
        }
      }
    });
  }, []);

  const connectStacksWallet = async () => {
    setIsLoading(true);
    
    try {
      // Use professional wallet connector for Chrome extension context
      const result = await professionalWalletConnector.connectWallet();
      
      if (result.success && result.address) {
        const walletData = {
          address: result.address,
          publicKey: result.publicKey || `wallet-${Date.now()}`,
          provider: result.provider || 'stacks-wallet',
          walletName: result.walletName || 'Stacks Wallet',
          isConnected: true,
          network: result.network || 'mainnet'
        };
        
        setWallet({
          isConnected: true,
          address: walletData.address,
          publicKey: walletData.publicKey,
          username: null,
          bnsName: result.bnsName,
          fullBNSName: result.fullBNSName
        });

        // Store wallet data for persistence (including BNS info)
        const extendedWalletData = {
          ...walletData,
          bnsName: result.bnsName,
          fullBNSName: result.fullBNSName
        };
        chrome.storage.local.set({ walletData: extendedWalletData });

        let hasExistingUser = false;
        
        // Check for existing username after wallet connection
        const checkUsername = async () => {
          const usernameManager = TruthChainUsernameManager.getInstance();
          const user = await usernameManager.getUserByWallet(walletData.address);
          if (user) {
            hasExistingUser = true;
            setCurrentUser(user);
            setWallet(prev => ({ ...prev, username: user.username }));
          } else {
            // Pre-populate username input with BNS name if available
            if (result.bnsName) {
              setUsernameInput(result.bnsName);
              setUsernameError(''); // Clear any previous errors
            } else {
              setUsernameInput(''); // Clear input if no BNS name
            }
            setShowUsernameSetup(true);
          }
        };
        await checkUsername();
        
        alert(
          `🎉 ${walletData.walletName} Connected Successfully!\n\n` +
          `📍 Address: ${walletData.address.slice(0, 12)}...${walletData.address.slice(-8)}\n` +
          `🌐 Network: ${walletData.network}\n` +
          `🔗 Provider: ${walletData.provider}\n` +
          (result.bnsName ? `🏷️ BNS Name: ${result.fullBNSName}\n` : '') +
          (result.bnsName && !hasExistingUser ? `\n💡 Your BNS name will be suggested as your TruthChain username!\n` : '') +
          `\n✅ Ready for TruthChain operations!`
        );
        
        setIsLoading(false);
      } else {
        setIsLoading(false);
        if (result.error && !result.error.includes('cancelled')) {
          alert(`❌ Connection Failed\n\n${result.error}`);
        }
      }
      
    } catch (error) {
      setIsLoading(false);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`❌ Wallet Connection Error\n\n${errorMsg}\n\nPlease try again.`);
    }
  };

  const disconnectWallet = () => {
    chrome.storage.local.remove(['walletData'], () => {
      setWallet({ 
        isConnected: false, 
        address: null, 
        publicKey: null, 
        username: null,
        bnsName: null,
        fullBNSName: null
      });
      setCurrentUser(null);
      setShowUsernameSetup(false);
    });
  };

  const createUsername = async () => {
    if (!wallet.address || !usernameInput.trim()) {
      setUsernameError('Username is required');
      return;
    }

    setIsLoading(true);
    setUsernameError('');

    try {
      const usernameManager = TruthChainUsernameManager.getInstance();
      
      // Validate format
      const validation = usernameManager.validateUsernameFormat(usernameInput.trim());
      if (!validation.isValid) {
        setUsernameError(validation.error || 'Invalid username format');
        setIsLoading(false);
        return;
      }

      // Create username
      const user = await usernameManager.createUsername(usernameInput.trim(), wallet.address);
      
      setCurrentUser(user);
      setWallet(prev => ({ ...prev, username: user.username }));
      setShowUsernameSetup(false);
      setUsernameInput('');
      
      alert(`🎉 Username Created Successfully!\n\n` +
            `👤 Username: ${user.username}\n` +
            `🔗 Tied to: ${wallet.address.slice(0, 12)}...${wallet.address.slice(-8)}\n\n` +
            `✅ Your TruthChain identity is now ready!`);
    } catch (error: unknown) {
      setUsernameError((error as Error).message || 'Failed to create username');
    } finally {
      setIsLoading(false);
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) return;
    
    try {
      const usernameManager = TruthChainUsernameManager.getInstance();
      const isAvailable = await usernameManager.checkUsernameAvailability(username.trim());
      
      if (!isAvailable) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError('');
      }
    } catch (error) {
      console.error('Username availability check failed:', error);
    }
  };

  const runWalletDiagnostics = async () => {
    // Stacks Connect handles wallet detection automatically
    const results = [
      `🔍 WALLET DIAGNOSTIC RESULTS`,
      ``,
      `Connection Method: Stacks Connect (Official)`,
      `Supported Wallets: All Stacks-compatible wallets`,
      ``,
      `📋 Notes:`,
      `• Stacks Connect shows official wallet selection modal`,
      `• Supports Xverse, Leather, Hiro, and other Stacks wallets`,
    ].join('\n');
    
    alert(results);
  };

  const testBNSLookup = async () => {
    try {
      if (wallet.address) {
        alert(
          `🧪 BNS Info\n\n` +
          `Address: ${wallet.address.slice(0, 12)}...${wallet.address.slice(-8)}\n` +
          (wallet.bnsName 
            ? `✅ BNS Name: ${wallet.fullBNSName}\n` 
            : `ℹ️ No BNS name found for this address\n`)
        );
      } else {
        alert('⚠️ Please connect wallet first');
      }
    } catch (error) {
      alert(`❌ BNS Test Failed\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const registerContentOnTruthChain = () => {
    setContent(prev => ({ ...prev, isProcessing: true, lastAction: 'registering' }));
    
    chrome.runtime.sendMessage({ action: 'registerContent' }, (response: ChromeRuntimeResponse) => {
      if (response.success) {
        setContent({
          isProcessing: false,
          lastAction: 'registered',
          contentCID: response.data?.[0]?.cid || null,
          txId: response.data?.[0]?.txId || null,
          error: null,
          lastUpdate: new Date().toLocaleTimeString()
        });
      } else {
        setContent(prev => ({ 
          ...prev, 
          isProcessing: false,
          error: response.error || 'Registration failed',
          lastUpdate: new Date().toLocaleTimeString()
        }));
      }
    });
  };

  const verifyContentOnTruthChain = () => {
    setContent(prev => ({ ...prev, isProcessing: true, lastAction: 'verifying' }));
    
    chrome.runtime.sendMessage({ action: 'verifyContent' }, (response: ChromeRuntimeResponse) => {
      setContent(prev => ({ ...prev, isProcessing: false }));
      
      if (response.success && response.data?.[0]) {
        const data = response.data[0];
        const message = data.isRegistered 
          ? `✅ Content verified on TruthChain!\nOwner: ${data.owner}\nTimestamp: ${data.timestamp}` 
          : '❌ Content not found on TruthChain';
        alert(message);
      } else {
        alert('❌ Verification failed: ' + (response.error || 'Unknown error'));
      }
    });
  };

  const viewMyContent = () => {
    if (wallet.address) {
      chrome.runtime.sendMessage({ 
        action: 'getUserContent', 
        address: wallet.address 
      }, (response: ChromeRuntimeResponse) => {
        if (response.success && response.data) {
          const contentList = response.data.map((item: ContentItem, index: number) => 
            `${index + 1}. CID: ${item.cid || 'N/A'}\n   Date: ${item.timestamp || 'N/A'}`
          ).join('\n\n');
          
          alert(`📚 Your TruthChain Content:\n\n${contentList || 'No content found'}`);
        } else {
          alert('❌ Failed to fetch content: ' + (response.error || 'Unknown error'));
        }
      });
    }
  };

  return (
    <div className='bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50 min-h-screen p-0 w-[420px]'>
      <div className='bg-white/95 backdrop-blur-lg rounded-none shadow-2xl border-0 overflow-hidden'>
        
        {/* TruthChain Branded Header */}
        <div className='bg-gradient-to-r from-slate-800 via-teal-800 to-cyan-800 relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-r from-teal-600/10 via-cyan-600/10 to-teal-600/10'></div>
          <div className='relative px-6 py-5'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20'>
                  <div className='w-6 h-6 bg-gradient-to-br from-teal-400 to-cyan-400 rounded-lg'></div>
                </div>
                <div>
                  <h1 className='text-lg font-bold text-white tracking-tight'>TruthChain</h1>
                  <p className='text-xs text-teal-100 font-medium'>Content provenance on the blockchain</p>
                </div>
              </div>
              <div className='text-right'>
                <div className='flex items-center space-x-1.5 mb-1'>
                  <div className={`w-2 h-2 rounded-full ${wallet.isConnected ? 'bg-emerald-400' : 'bg-gray-400'}`}></div>
                  <span className='text-xs text-gray-300 font-medium'>
                    {wallet.isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
                <p className='text-xs text-gray-400'>Stacks Blockchain</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className='p-6 space-y-5'>
          
          {/* Wallet Connection Section */}
          <div className='bg-gradient-to-br from-slate-50 to-teal-50/50 rounded-2xl border border-slate-200/60 overflow-hidden'>
            <div className='bg-white/60 px-4 py-3 border-b border-slate-200/50'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <svg className='w-4 h-4 text-slate-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z' clipRule='evenodd' />
                  </svg>
                  <span className='text-sm font-semibold text-slate-700'>Wallet Status</span>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  wallet.isConnected 
                    ? 'bg-teal-100 text-teal-700 border border-teal-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}>
                  {wallet.isConnected ? 'Active' : 'Inactive'}
                </div>
              </div>
            </div>
            
            <div className='p-4'>
              {!wallet.isConnected ? (
                <div className='text-center space-y-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto border border-teal-200/50'>
                    <svg className='w-6 h-6 text-teal-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={1.5} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
                    </svg>
                  </div>
                  <div>
                    <p className='text-slate-600 text-sm font-medium mb-1'>No Wallet Connected</p>
                    <p className='text-slate-500 text-xs leading-relaxed'>
                      Connect Xverse or Leather to access blockchain features
                    </p>
                  </div>
                  <button
                    onClick={connectStacksWallet}
                    disabled={isLoading}
                    className='w-full bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-teal-700 hover:via-cyan-700 hover:to-teal-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-teal-500/20'
                  >
                    {isLoading ? (
                      <div className='flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2'></div>
                        <span className='text-sm'>Detecting Wallets...</span>
                      </div>
                    ) : (
                      <div className='flex items-center justify-center'>
                        <svg className='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clipRule='evenodd' />
                        </svg>
                        <span className='text-sm'>Connect Stacks Wallet</span>
                      </div>
                    )}
                  </button>
                </div>
              ) : (
                <div className='space-y-4'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-10 h-10 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center border border-teal-300/50'>
                      <svg className='w-5 h-5 text-teal-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    </div>
                    <div className='flex-1'>
                      <p className='text-teal-700 font-semibold text-sm'>Wallet Connected</p>
                      <p className='text-teal-600 text-xs'>Ready for Web3 operations</p>
                    </div>
                  </div>
                  
                  {/* Username Display or Setup */}
                  {currentUser ? (
                    <div className='bg-white/80 rounded-xl p-3 border border-slate-200/60 mb-3'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>TruthChain Username</span>
                        <div className='flex items-center space-x-1'>
                          <div className='w-2 h-2 bg-green-400 rounded-full'></div>
                          <span className='text-xs text-green-600 font-medium'>Verified</span>
                        </div>
                      </div>
                      <p className='font-semibold text-sm text-teal-700 bg-teal-50 rounded-lg p-2 border border-teal-200/50'>
                        @{currentUser.username}
                      </p>
                    </div>
                  ) : (
                    <div className='bg-yellow-50 border border-yellow-200/60 rounded-xl p-3 mb-3'>
                      <div className='flex items-center space-x-2 mb-2'>
                        <div className='w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center'>
                          <span className='text-xs text-white'>!</span>
                        </div>
                        <span className='text-xs font-semibold text-yellow-800'>Username Required</span>
                      </div>
                      <p className='text-xs text-yellow-700 mb-2'>Create a unique username to use TruthChain features</p>
                      <button
                        onClick={() => {
                          // Pre-populate with BNS name if available
                          if (wallet.bnsName) {
                            setUsernameInput(wallet.bnsName);
                            setUsernameError('');
                          } else {
                            setUsernameInput('');
                          }
                          setShowUsernameSetup(true);
                        }}
                        className='w-full bg-yellow-200 text-yellow-800 py-2 px-3 rounded-lg text-xs font-semibold hover:bg-yellow-300 transition-colors duration-200'
                      >
                        Create Username
                      </button>
                    </div>
                  )}

                  <div className='bg-white/80 rounded-xl p-3 border border-slate-200/60'>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>STX Address</span>
                      <button 
                        onClick={() => {
                          if (wallet.address) {
                            navigator.clipboard.writeText(wallet.address);
                            setCopySuccess('Address copied!');
                            setTimeout(() => setCopySuccess(''), 2000);
                          }
                        }}
                        className='text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline'
                      >
                        {copySuccess === 'Address copied!' ? '✓ Copied' : 'Copy'}
                      </button>
                    </div>
                    <p className='font-mono text-xs text-slate-700 break-all leading-relaxed bg-slate-50 rounded-lg p-2'>
                      {wallet.address?.slice(0, 16)}...{wallet.address?.slice(-16)}
                    </p>
                  </div>

                  {/* BNS Name Display */}
                  {wallet.bnsName && (
                    <div className='bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-3 border border-teal-200/60'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-xs font-medium text-teal-700 uppercase tracking-wide'>🏷️ BNS Name</span>
                        <button 
                          onClick={() => {
                            if (wallet.fullBNSName) {
                              navigator.clipboard.writeText(wallet.fullBNSName);
                              setCopySuccess('BNS name copied!');
                              setTimeout(() => setCopySuccess(''), 2000);
                            }
                          }}
                          className='text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline'
                        >
                          {copySuccess === 'BNS name copied!' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <p className='font-mono text-sm font-semibold text-teal-800 bg-white/80 rounded-lg p-2 border border-teal-200/50'>
                        {wallet.fullBNSName}
                      </p>
                      <p className='text-xs text-teal-600 mt-1'>
                        Bitcoin Name Service identity for this wallet
                      </p>
                    </div>
                  )}
                  
                  <div className='flex space-x-2'>
                    <button
                      onClick={viewMyContent}
                      className='flex-1 bg-teal-50 text-teal-700 py-2.5 px-3 rounded-lg text-xs font-semibold hover:bg-teal-100 transition-colors duration-200 border border-teal-200/60'
                    >
                      My Content
                    </button>
                    <button
                      onClick={disconnectWallet}
                      className='flex-1 bg-slate-50 text-slate-700 py-2.5 px-3 rounded-lg text-xs font-semibold hover:bg-slate-100 transition-colors duration-200 border border-slate-200/60'
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Operations Section - Always Available */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <h3 className='text-base font-bold text-slate-800'>TruthChain Operations</h3>
              <div className='flex items-center space-x-1 text-xs text-slate-500'>
                <div className={`w-2 h-2 rounded-full ${wallet.isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`}></div>
                <span>{wallet.isConnected ? 'Live' : 'Read-Only'}</span>
              </div>
            </div>
              
              {/* Register Content Button */}
              <button
                onClick={wallet.isConnected ? registerContentOnTruthChain : () => alert('Please connect your Stacks wallet to register content on the blockchain')}
                disabled={content.isProcessing}
                className={`w-full py-4 px-5 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 border group ${
                  wallet.isConnected 
                    ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 text-white hover:from-teal-700 hover:via-cyan-700 hover:to-teal-700 border-teal-500/20'
                    : 'bg-gradient-to-r from-gray-400 via-gray-500 to-gray-400 text-white hover:from-gray-500 hover:via-gray-600 hover:to-gray-500 border-gray-400/20'
                }`}
              >
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform duration-200'>
                    {content.isProcessing && content.lastAction === 'registering' ? (
                      <div className='animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white'></div>
                    ) : (
                      <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    )}
                  </div>
                  <div className='text-left flex-1'>
                    <div className='font-bold text-sm'>
                      {content.isProcessing && content.lastAction === 'registering' 
                        ? 'Registering Content...' 
                        : wallet.isConnected 
                          ? 'Register Content' 
                          : 'Register Content (Wallet Required)'}
                    </div>
                    <div className='text-xs font-medium opacity-90'>
                      {wallet.isConnected 
                        ? 'Store content on IPFS + TruthChain blockchain'
                        : 'Connect wallet to register content on blockchain'}
                    </div>
                  </div>
                  <svg className='w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </div>
              </button>
              
              {/* Verify Content Button - Always Available */}
              <button
                onClick={verifyContentOnTruthChain}
                disabled={content.isProcessing}
                className='w-full bg-gradient-to-r from-slate-600 via-teal-600 to-slate-600 text-white py-4 px-5 rounded-xl font-semibold hover:from-slate-700 hover:via-teal-700 hover:to-slate-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 border border-slate-500/20 group'
              >
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center mr-4 group-hover:scale-105 transition-transform duration-200'>
                    {content.isProcessing && content.lastAction === 'verifying' ? (
                      <div className='animate-spin rounded-full h-5 w-5 border-2 border-white/50 border-t-white'></div>
                    ) : (
                      <svg className='w-5 h-5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                        <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                      </svg>
                    )}
                  </div>
                  <div className='text-left flex-1'>
                    <div className='font-bold text-sm'>
                      {content.isProcessing && content.lastAction === 'verifying' ? 'Verifying Content...' : 'Verify Authenticity'}
                    </div>
                    <div className='text-xs text-slate-100 font-medium opacity-90'>
                      Check TruthChain ownership proof
                    </div>
                  </div>
                  <svg className='w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </div>
              </button>

              {/* Error Display */}
              {content.error && (
                <div className='bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/60 rounded-xl overflow-hidden'>
                  <div className='bg-red-100/60 px-4 py-2 border-b border-red-200/50'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 bg-red-500 rounded-full flex items-center justify-center'>
                        <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z' clipRule='evenodd' />
                        </svg>
                      </div>
                      <span className='text-sm font-semibold text-red-800'>Operation Failed</span>
                    </div>
                  </div>
                  <div className='p-4'>
                    <p className='text-red-700 text-sm'>{content.error}</p>
                    {content.lastUpdate && (
                      <p className='text-red-500 text-xs mt-2'>Last updated: {content.lastUpdate}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Success Status Display */}
              {content.contentCID && !content.error && (
                <div className='bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/60 rounded-xl overflow-hidden'>
                  <div className='bg-teal-100/60 px-4 py-2 border-b border-teal-200/50'>
                    <div className='flex items-center space-x-2'>
                      <div className='w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center'>
                        <svg className='w-2.5 h-2.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                        </svg>
                      </div>
                      <span className='text-sm font-semibold text-teal-800'>Content Successfully Registered</span>
                      {content.lastUpdate && (
                        <span className='text-xs text-teal-600 ml-auto'>{content.lastUpdate}</span>
                      )}
                    </div>
                  </div>
                  <div className='p-4 space-y-3'>
                    <div>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-xs font-medium text-teal-700 uppercase tracking-wide'>IPFS Content ID</span>
                        <button 
                          onClick={() => {
                            if (content.contentCID) {
                              navigator.clipboard.writeText(content.contentCID);
                              setCopySuccess('CID copied!');
                              setTimeout(() => setCopySuccess(''), 2000);
                            }
                          }}
                          className='text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline'
                        >
                          {copySuccess === 'CID copied!' ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className='text-xs text-teal-600 font-mono bg-white/80 rounded-lg p-2 break-all border border-teal-200/50'>
                        {content.contentCID}
                      </div>
                    </div>
                    {content.txId && (
                      <div>
                        <div className='flex items-center justify-between mb-1'>
                          <span className='text-xs font-medium text-teal-700 uppercase tracking-wide'>Transaction Hash</span>
                          <button 
                            onClick={() => {
                              if (content.txId) {
                                const url = `https://explorer.hiro.so/txid/${content.txId}?chain=testnet`;
                                chrome.tabs.create({ url });
                              }
                            }}
                            className='text-xs text-teal-600 hover:text-teal-700 font-medium hover:underline'
                          >
                            View Explorer
                          </button>
                        </div>
                        <div className='text-xs text-teal-600 font-mono bg-white/80 rounded-lg p-2 break-all border border-teal-200/50'>
                          {content.txId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          {/* Debug Section - Shows when wallet connection fails */}
          {showDebugMode && !wallet.isConnected && (
            <div className='bg-gradient-to-br from-orange-50 to-yellow-50 border border-orange-200/60 rounded-xl overflow-hidden'>
              <div className='bg-orange-100/60 px-4 py-3 border-b border-orange-200/50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-2'>
                    <svg className='w-4 h-4 text-orange-600' fill='currentColor' viewBox='0 0 20 20'>
                      <path fillRule='evenodd' d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                    </svg>
                    <span className='text-sm font-semibold text-orange-800'>Wallet Debug Mode</span>
                  </div>
                  <button
                    onClick={() => setShowDebugMode(false)}
                    className='text-orange-600 hover:text-orange-700 p-1'
                  >
                    <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              </div>
              <div className='p-4 space-y-4'>
                <p className='text-orange-700 text-sm'>
                  <strong>Debug mode enabled</strong> - Use these tools to diagnose wallet connection issues specific to your setup.
                </p>
                
                <div className='space-y-3'>
                  <button
                    onClick={runWalletDiagnostics}
                    className='w-full bg-orange-200 text-orange-800 py-3 px-4 rounded-lg font-semibold hover:bg-orange-300 transition-colors duration-200 flex items-center justify-center'
                  >
                    <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' />
                    </svg>
                    Run Provider Diagnostics
                  </button>

                  <button
                    onClick={testBNSLookup}
                    className='w-full bg-teal-200 text-teal-800 py-3 px-4 rounded-lg font-semibold hover:bg-teal-300 transition-colors duration-200 flex items-center justify-center'
                  >
                    <svg className='w-4 h-4 mr-2' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' />
                    </svg>
                    🧪 Test BNS Lookup
                  </button>
                  
                  <div className='bg-white/80 rounded-lg p-3 border border-orange-200/60'>
                    <h4 className='text-sm font-semibold text-orange-800 mb-2'>Your Configuration:</h4>
                    <div className='space-y-1 text-xs'>
                      <div className='flex justify-between'>
                        <span className='text-orange-700'>Chrome Version:</span>
                        <span className='text-orange-600 font-mono'>{navigator.userAgent.includes('Chrome') ? navigator.userAgent.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/)?.[1] || 'Unknown' : 'Not Chrome'}</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-orange-700'>Expected Xverse:</span>
                        <span className='text-orange-600 font-mono'>v1.3.0+</span>
                      </div>
                      <div className='flex justify-between'>
                        <span className='text-orange-700'>Detection Methods:</span>
                        <span className='text-orange-600 font-mono'>3 fallbacks</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-3'>
                    <div className='flex items-start space-x-2'>
                      <div className='w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                        <span className='text-xs text-white font-bold'>!</span>
                      </div>
                      <div>
                        <p className='text-sm text-yellow-800 font-semibold'>Troubleshooting Tips:</p>
                        <ul className='text-xs text-yellow-700 mt-1 space-y-1'>
                          <li>• Check browser console (F12) for detailed logs</li>
                          <li>• Ensure Xverse is unlocked and not just installed</li>
                          <li>• Try disabling other wallet extensions temporarily</li>
                          <li>• Test in Chrome incognito mode</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Read-Only Info */}
          {!wallet.isConnected && (
            <div className='bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200/60 rounded-xl overflow-hidden'>
              <div className='bg-blue-100/60 px-4 py-3 border-b border-blue-200/50'>
                <div className='flex items-center space-x-2'>
                  <svg className='w-4 h-4 text-blue-600' fill='currentColor' viewBox='0 0 20 20'>
                    <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                  </svg>
                  <span className='text-sm font-semibold text-blue-800'>Read-Only Mode</span>
                </div>
              </div>
              <div className='p-4'>
                <p className='text-blue-700 text-sm mb-3'>
                  TruthChain works in <strong>read-only mode</strong> without a wallet connection. You can:
                </p>
                <ul className='text-blue-600 text-sm space-y-1 mb-4'>
                  <li className='flex items-center'><span className='text-green-500 mr-2'>✓</span>Verify existing content</li>
                  <li className='flex items-center'><span className='text-green-500 mr-2'>✓</span>Analyze content hashes</li>
                  <li className='flex items-center'><span className='text-green-500 mr-2'>✓</span>Check content authenticity</li>
                  <li className='flex items-center'><span className='text-orange-500 mr-2'>⚠</span>Register new content (requires wallet)</li>
                </ul>
                <div className='flex items-center justify-center space-x-6 pt-2 border-t border-blue-200/50'>
                  <div className='flex items-center space-x-1.5 text-xs text-blue-500'>
                    <div className='w-2 h-2 bg-teal-400 rounded-full'></div>
                    <span>IPFS</span>
                  </div>
                  <div className='flex items-center space-x-1.5 text-xs text-blue-500'>
                    <div className='w-2 h-2 bg-cyan-400 rounded-full'></div>
                    <span>TruthChain</span>
                  </div>
                  <div className='flex items-center space-x-1.5 text-xs text-blue-500'>
                    <div className='w-2 h-2 bg-emerald-400 rounded-full'></div>
                    <span>Stacks</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* TruthChain Footer */}
        <div className='bg-slate-50/80 border-t border-slate-200/60 px-6 py-3'>
          <div className='flex items-center justify-between text-xs text-slate-500'>
            <div className='flex items-center space-x-2'>
              <div className='w-3 h-3 bg-gradient-to-br from-teal-500 to-cyan-500 rounded opacity-60'></div>
              <span className='font-medium'>TruthChain</span>
            </div>
            <div className='flex items-center space-x-1'>
              <span>v1.0.0</span>
              <span className='w-1 h-1 bg-slate-400 rounded-full'></span>
              <span>Stacks</span>
            </div>
          </div>
        </div>

        {/* Username Setup Modal */}
        {showUsernameSetup && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/60 overflow-hidden'>
              {/* Header */}
              <div className='bg-gradient-to-r from-teal-600 to-cyan-600 px-6 py-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center space-x-3'>
                    <div className='w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center'>
                      <span className='text-lg'>👤</span>
                    </div>
                    <div>
                      <h3 className='text-lg font-bold text-white'>Create Username</h3>
                      <p className='text-xs text-teal-100'>Your unique TruthChain identity</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowUsernameSetup(false);
                      setUsernameInput('');
                      setUsernameError('');
                    }}
                    className='text-white/80 hover:text-white p-1'
                  >
                    <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                      <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className='p-6 space-y-4'>
                <div className='bg-blue-50 border border-blue-200/60 rounded-xl p-4'>
                  <div className='flex items-start space-x-3'>
                    <div className='w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                      <svg className='w-3.5 h-3.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z' clipRule='evenodd' />
                      </svg>
                    </div>
                    <div>
                      <p className='text-sm text-blue-800 font-semibold mb-1'>One-Time Setup</p>
                      <p className='text-xs text-blue-700 leading-relaxed'>
                        Your username will be permanently tied to your wallet address. Choose carefully - it cannot be changed later.
                      </p>
                    </div>
                  </div>
                </div>

                {/* BNS Name Suggestion Notice */}
                {wallet.bnsName && usernameInput === wallet.bnsName && (
                  <div className='bg-emerald-50 border border-emerald-200/60 rounded-xl p-4'>
                    <div className='flex items-start space-x-3'>
                      <div className='w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5'>
                        <svg className='w-3.5 h-3.5 text-white' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
                        </svg>
                      </div>
                      <div>
                        <p className='text-sm text-emerald-800 font-semibold mb-1'>🏷️ BNS Name Detected</p>
                        <p className='text-xs text-emerald-700 leading-relaxed'>
                          We've automatically suggested your BNS name <strong>{wallet.fullBNSName}</strong> as your TruthChain username. You can keep it or enter a different one.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className='block text-sm font-semibold text-slate-700 mb-2'>
                    Username
                  </label>
                  <div className='relative'>
                    <input
                      type='text'
                      value={usernameInput}
                      onChange={(e) => {
                        setUsernameInput(e.target.value);
                        setUsernameError('');
                      }}
                      onBlur={() => checkUsernameAvailability(usernameInput)}
                      placeholder={wallet.bnsName ? `Suggested: ${wallet.bnsName}` : 'Enter your username'}
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm ${
                        wallet.bnsName && usernameInput === wallet.bnsName 
                          ? 'border-emerald-300 bg-emerald-50/50' 
                          : 'border-slate-200'
                      }`}
                      maxLength={20}
                    />
                    <div className='absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1'>
                      {wallet.bnsName && usernameInput === wallet.bnsName && (
                        <span className='text-xs text-emerald-600 font-semibold'>🏷️</span>
                      )}
                      <span className='text-xs text-slate-400'>@</span>
                    </div>
                  </div>
                  {usernameError && (
                    <p className='text-xs text-red-600 mt-1 flex items-center'>
                      <svg className='w-3 h-3 mr-1' fill='currentColor' viewBox='0 0 20 20'>
                        <path fillRule='evenodd' d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z' clipRule='evenodd' />
                      </svg>
                      {usernameError}
                    </p>
                  )}
                  <div className='text-xs text-slate-500 mt-1'>
                    3-20 characters, letters, numbers, hyphens, underscores
                  </div>
                </div>

                {/* Wallet Info */}
                <div className='bg-slate-50 rounded-xl p-3 border border-slate-200/60'>
                  <div className='flex items-center justify-between mb-1'>
                    <span className='text-xs font-medium text-slate-600'>Wallet Address</span>
                  </div>
                  <p className='font-mono text-xs text-slate-700'>
                    {wallet.address?.slice(0, 20)}...{wallet.address?.slice(-12)}
                  </p>
                </div>

                {/* Actions */}
                <div className='flex space-x-3 pt-2'>
                  <button
                    onClick={() => {
                      setShowUsernameSetup(false);
                      setUsernameInput('');
                      setUsernameError('');
                    }}
                    className='flex-1 bg-slate-100 text-slate-700 py-3 px-4 rounded-xl font-semibold hover:bg-slate-200 transition-colors duration-200'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createUsername}
                    disabled={isLoading || !usernameInput.trim() || !!usernameError}
                    className='flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 transition-all duration-200'
                  >
                    {isLoading ? (
                      <div className='flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2'></div>
                        Creating...
                      </div>
                    ) : (
                      'Create Username'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App