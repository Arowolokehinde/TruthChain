import { useState, useEffect } from 'react'

interface WalletState {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
}

interface ContentState {
  isProcessing: boolean;
  lastAction: string | null;
  contentCID: string | null;
  txId: string | null;
  error: string | null;
  lastUpdate: string | null;
}

const App = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    publicKey: null
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

  useEffect(() => {
    // Check if wallet is already connected
    // @ts-ignore
    chrome.storage.local.get(['walletData'], (result: { walletData?: any }) => {
      if (result.walletData) {
        setWallet({
          isConnected: true,
          address: result.walletData.address,
          publicKey: result.walletData.publicKey
        });
      }
    });
  }, []);

  const connectXverseWallet = async () => {
    setIsLoading(true);
    try {
      console.log('Attempting to connect Stacks wallet...');
      
      // @ts-ignore
      chrome.runtime.sendMessage(
        { action: 'connectXverse' },
        (response: { success: boolean; walletData?: any; error?: string }) => {
          console.log('Wallet connection response:', response);
          
          if (response && response.success && response.walletData) {
            setWallet({
              isConnected: true,
              address: response.walletData.address,
              publicKey: response.walletData.publicKey
            });
            
            const walletName = response.walletData.walletName || 'Wallet';
            
            alert(
              `🎉 ${walletName} Connected!\n\n` +
              `📍 Address: ${response.walletData.address.slice(0, 8)}...${response.walletData.address.slice(-6)}\n\n` +
              `✅ Ready for real blockchain transactions`
            );
          } else {
            console.error('Wallet connection failed:', response?.error);
            
            const errorMsg = response?.error || 'Unknown error';
            
            if (errorMsg.includes('No Stacks wallet') || errorMsg.includes('not detected')) {
              alert(
                '🔗 Stacks Wallet Required\n\n' +
                'Please install a Stacks wallet:\n\n' +
                '🥇 Xverse Wallet (Recommended)\n' +
                '   → Chrome Web Store → "Xverse Wallet"\n\n' +
                '🥈 Leather Wallet\n' +
                '   → Visit leather.io\n\n' +
                'After installation:\n' +
                '1. Set up your wallet\n' +
                '2. Make sure it\'s unlocked\n' +
                '3. Refresh this page\n' +
                '4. Try connecting again'
              );
            } else if (errorMsg.includes('cancelled') || errorMsg.includes('rejected')) {
              alert('⚠️ Connection Cancelled\n\nYou cancelled the wallet connection. Please try again when ready.');
            } else {
              alert(`❌ Connection Failed\n\nError: ${errorMsg}\n\nTry:\n• Unlock your wallet\n• Refresh the page\n• Try again`);
            }
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('⚠️ Extension Error\n\nPlease refresh the extension and try again.');
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    // @ts-ignore
    chrome.storage.local.remove(['walletData'], () => {
      setWallet({ isConnected: false, address: null, publicKey: null });
    });
  };

  const registerContentOnTruthChain = () => {
    setContent(prev => ({ ...prev, isProcessing: true, lastAction: 'registering' }));
    
    // @ts-ignore
    chrome.runtime.sendMessage({ action: 'registerContent' }, (response: any) => {
      if (response.success) {
        setContent({
          isProcessing: false,
          lastAction: 'registered',
          contentCID: response.data.cid,
          txId: response.data.txId,
          error: null,
          lastUpdate: new Date().toLocaleTimeString()
        });
      } else {
        setContent(prev => ({ 
          ...prev, 
          isProcessing: false,
          error: response.error,
          lastUpdate: new Date().toLocaleTimeString()
        }));
      }
    });
  };

  const verifyContentOnTruthChain = () => {
    setContent(prev => ({ ...prev, isProcessing: true, lastAction: 'verifying' }));
    
    // @ts-ignore
    chrome.runtime.sendMessage({ action: 'verifyContent' }, (response: any) => {
      setContent(prev => ({ ...prev, isProcessing: false }));
      
      if (response.success) {
        const message = response.data.isRegistered 
          ? `✅ Content verified on TruthChain!\nOwner: ${response.data.owner}\nTimestamp: ${response.data.timestamp}` 
          : '❌ Content not found on TruthChain';
        alert(message);
      } else {
        alert('❌ Verification failed: ' + response.error);
      }
    });
  };

  const viewMyContent = () => {
    if (wallet.address) {
      // @ts-ignore
      chrome.runtime.sendMessage({ 
        action: 'getUserContent', 
        address: wallet.address 
      }, (response: any) => {
        if (response.success) {
          const contentList = response.data.map((item: any, index: number) => 
            `${index + 1}. CID: ${item.cid}\n   Date: ${item.timestamp}`
          ).join('\n\n');
          
          alert(`📚 Your TruthChain Content:\n\n${contentList || 'No content found'}`);
        } else {
          alert('❌ Failed to fetch content: ' + response.error);
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
                      Connect Xverse to access blockchain features
                    </p>
                  </div>
                  <button
                    onClick={connectXverseWallet}
                    disabled={isLoading}
                    className='w-full bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-teal-700 hover:via-cyan-700 hover:to-teal-700 disabled:opacity-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-teal-500/20'
                  >
                    {isLoading ? (
                      <div className='flex items-center justify-center'>
                        <div className='animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2'></div>
                        <span className='text-sm'>Connecting...</span>
                      </div>
                    ) : (
                      <div className='flex items-center justify-center'>
                        <svg className='w-4 h-4 mr-2' fill='currentColor' viewBox='0 0 20 20'>
                          <path fillRule='evenodd' d='M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z' clipRule='evenodd' />
                        </svg>
                        <span className='text-sm'>Connect Xverse Wallet</span>
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

          {/* Operations Section */}
          {wallet.isConnected && (
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h3 className='text-base font-bold text-slate-800'>Blockchain Operations</h3>
                <div className='flex items-center space-x-1 text-xs text-slate-500'>
                  <div className='w-2 h-2 bg-green-400 rounded-full animate-pulse'></div>
                  <span>Live</span>
                </div>
              </div>
              
              {/* Register Content Button */}
              <button
                onClick={registerContentOnTruthChain}
                disabled={content.isProcessing}
                className='w-full bg-gradient-to-r from-teal-600 via-cyan-600 to-teal-600 text-white py-4 px-5 rounded-xl font-semibold hover:from-teal-700 hover:via-cyan-700 hover:to-teal-700 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 border border-teal-500/20 group'
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
                      {content.isProcessing && content.lastAction === 'registering' ? 'Registering Content...' : 'Register Content'}
                    </div>
                    <div className='text-xs text-teal-100 font-medium opacity-90'>
                      Store content on IPFS + TruthChain blockchain
                    </div>
                  </div>
                  <svg className='w-4 h-4 text-white/80 group-hover:translate-x-1 transition-transform duration-200' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 5l7 7-7 7' />
                  </svg>
                </div>
              </button>
              
              {/* Verify Content Button */}
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
          )}

          {/* Empty State */}
          {!wallet.isConnected && (
            <div className='text-center py-8 space-y-4'>
              <div className='w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl flex items-center justify-center mx-auto border border-teal-200/50'>
                <div className='w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg opacity-60'></div>
              </div>
              <div className='space-y-2'>
                <h3 className='text-base font-bold text-slate-700'>TruthChain Ready</h3>
                <p className='text-slate-500 text-sm leading-relaxed max-w-sm mx-auto'>
                  Secure your digital content with blockchain-powered authenticity. Connect your wallet to begin.
                </p>
              </div>
              <div className='flex items-center justify-center space-x-6 pt-2'>
                <div className='flex items-center space-x-1.5 text-xs text-slate-400'>
                  <div className='w-2 h-2 bg-teal-400 rounded-full'></div>
                  <span>IPFS</span>
                </div>
                <div className='flex items-center space-x-1.5 text-xs text-slate-400'>
                  <div className='w-2 h-2 bg-cyan-400 rounded-full'></div>
                  <span>TruthChain</span>
                </div>
                <div className='flex items-center space-x-1.5 text-xs text-slate-400'>
                  <div className='w-2 h-2 bg-emerald-400 rounded-full'></div>
                  <span>Secure</span>
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
      </div>
    </div>
  )
}

export default App