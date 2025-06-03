import { useState, useEffect } from 'react'

interface WalletState {
  isConnected: boolean;
  address: string | null;
}

const App = () => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if wallet is already connected
    // @ts-ignore
    chrome.storage.local.get(['walletAddress'], (result: { walletAddress?: string }) => {
      if (result.walletAddress) {
        setWallet({
          isConnected: true,
          address: result.walletAddress
        });
      }
    });
  }, []);

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      // Send message to background script to handle wallet connection
      // @ts-ignore
      chrome.runtime.sendMessage(
        { action: 'connectWallet' },
        (response: { success: boolean; address?: string; error?: string }) => {
          if (response.success) {
            setWallet({
              isConnected: true,
              address: response.address || null
            });
          } else {
            console.error('Wallet connection failed:', response.error);
          }
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    // @ts-ignore
    chrome.storage.local.remove(['walletAddress'], () => {
      setWallet({ isConnected: false, address: null });
    });
  };

  const registerCurrentPage = () => {
    // @ts-ignore
    chrome.runtime.sendMessage({ action: 'registerCurrentPage' }, (response: { success: boolean; error?: string }) => {
      if (response.success) {
        alert('✅ Content registered successfully!');
      } else {
        alert('❌ Registration failed: ' + response.error);
      }
    });
  };

  const verifyCurrentPage = () => {
    // @ts-ignore
    chrome.runtime.sendMessage({ action: 'verifyCurrentPage' }, (response: { success: boolean; data?: { isRegistered: boolean }; error?: string }) => {
      if (response.success) {
        const message = response.data?.isRegistered 
          ? '✅ Content is verified on blockchain!' 
          : '❌ Content not found on blockchain';
        alert(message);
      } else {
        alert('❌ Verification failed: ' + response.error);
      }
    });
  };

  return (
    <div className='bg-gradient-to-br from-purple-600 to-blue-600 min-h-screen p-0 w-96'>
      <div className='bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 m-4 overflow-hidden'>
        {/* Header Section */}
        <div className='bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-center relative overflow-hidden'>
          <div className='absolute inset-0 bg-black/10'></div>
          <div className='relative z-10'>
            <div className='w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3'>
              <span className='text-2xl'>🔗</span>
            </div>
            <h1 className='text-2xl font-bold text-white mb-1'>
              TruthChain
            </h1>
            <p className='text-white/80 text-sm font-medium'>
              Blockchain Content Verification
            </p>
          </div>
        </div>
        
        <div className='p-6'>
          {/* Wallet Status Card */}
          <div className='bg-gray-50 rounded-xl p-4 mb-6 border border-gray-100'>
            <div className='flex items-center justify-between mb-3'>
              <span className='text-sm font-semibold text-gray-700'>Wallet Status</span>
              <div className={`w-3 h-3 rounded-full ${wallet.isConnected ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            </div>
            
            {!wallet.isConnected ? (
              <div className='text-center'>
                <div className='w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <svg className='w-6 h-6 text-purple-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' />
                  </svg>
                </div>
                <p className='text-gray-500 text-sm mb-4'>No wallet connected</p>
                <button
                  onClick={connectWallet}
                  disabled={isLoading}
                  className='w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                >
                  {isLoading ? (
                    <div className='flex items-center justify-center'>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                      Connecting...
                    </div>
                  ) : (
                    <div className='flex items-center justify-center'>
                      <span className='mr-2'>🔌</span>
                      Connect Xverse Wallet
                    </div>
                  )}
                </button>
              </div>
            ) : (
              <div className='text-center'>
                <div className='w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3'>
                  <svg className='w-6 h-6 text-green-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' />
                  </svg>
                </div>
                <p className='text-green-600 font-semibold text-sm mb-2'>Connected Successfully</p>
                <div className='bg-white rounded-lg p-3 border border-gray-200 mb-4'>
                  <p className='text-xs text-gray-500 mb-1'>Wallet Address</p>
                  <p className='font-mono text-sm text-gray-800 break-all'>
                    {wallet.address?.slice(0, 12)}...{wallet.address?.slice(-8)}
                  </p>
                </div>
                <button
                  onClick={disconnectWallet}
                  className='w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg text-sm hover:bg-gray-200 transition-colors duration-200'
                >
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {wallet.isConnected && (
            <div className='space-y-4'>
              <div className='text-center mb-4'>
                <h3 className='text-lg font-semibold text-gray-800 mb-1'>Content Actions</h3>
                <p className='text-gray-500 text-sm'>Secure your content on the blockchain</p>
              </div>
              
              <button
                onClick={registerCurrentPage}
                className='w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group'
              >
                <div className='flex items-center justify-center'>
                  <span className='text-xl mr-3 group-hover:scale-110 transition-transform duration-200'>📝</span>
                  <div className='text-left'>
                    <div className='font-bold'>Register Content</div>
                    <div className='text-xs text-green-100'>Secure current page on blockchain</div>
                  </div>
                </div>
              </button>
              
              <button
                onClick={verifyCurrentPage}
                className='w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group'
              >
                <div className='flex items-center justify-center'>
                  <span className='text-xl mr-3 group-hover:scale-110 transition-transform duration-200'>🔍</span>
                  <div className='text-left'>
                    <div className='font-bold'>Verify Content</div>
                    <div className='text-xs text-blue-100'>Check blockchain authenticity</div>
                  </div>
                </div>
              </button>
            </div>
          )}

          {!wallet.isConnected && (
            <div className='text-center py-6'>
              <div className='w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                <span className='text-2xl'>🔒</span>
              </div>
              <p className='text-gray-500 text-sm leading-relaxed'>
                Connect your Xverse wallet to start<br />
                registering and verifying content<br />
                on the blockchain
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className='bg-gray-50 px-6 py-4 border-t border-gray-100'>
          <div className='flex items-center justify-center text-xs text-gray-400'>
            <span>Powered by</span>
            <span className='mx-1 text-purple-500'>⚡</span>
            <span>Blockchain Technology</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App