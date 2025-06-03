import React, { useState, useEffect } from 'react'

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
    chrome.storage.local.get(['walletAddress'], (result) => {
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
      chrome.runtime.sendMessage(
        { action: 'connectWallet' },
        (response) => {
          if (response.success) {
            setWallet({
              isConnected: true,
              address: response.address
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
    chrome.storage.local.remove(['walletAddress'], () => {
      setWallet({ isConnected: false, address: null });
    });
  };

  const registerCurrentPage = () => {
    chrome.runtime.sendMessage({ action: 'registerCurrentPage' }, (response) => {
      if (response.success) {
        alert('✅ Content registered successfully!');
      } else {
        alert('❌ Registration failed: ' + response.error);
      }
    });
  };

  const verifyCurrentPage = () => {
    chrome.runtime.sendMessage({ action: 'verifyCurrentPage' }, (response) => {
      if (response.success) {
        const message = response.data.isRegistered 
          ? '✅ Content is verified on blockchain!' 
          : '❌ Content not found on blockchain';
        alert(message);
      } else {
        alert('❌ Verification failed: ' + response.error);
      }
    });
  };

  return (
    <div className='bg-gradient-to-br from-purple-600 to-blue-600 min-h-screen p-6 w-80'>
      <div className='bg-white rounded-lg shadow-xl p-6'>
        <h1 className='text-2xl font-bold text-gray-800 mb-4 text-center'>
          TruthChain
        </h1>
        
        {/* Wallet Connection */}
        <div className='mb-6'>
          {!wallet.isConnected ? (
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className='w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50'
            >
              {isLoading ? 'Connecting...' : 'Connect Xverse Wallet'}
            </button>
          ) : (
            <div className='space-y-3'>
              <div className='text-sm text-gray-600'>
                <strong>Connected:</strong>
                <br />
                <span className='font-mono text-xs'>
                  {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-4)}
                </span>
              </div>
              <button
                onClick={disconnectWallet}
                className='w-full bg-gray-500 text-white py-2 px-4 rounded-lg text-sm hover:bg-gray-600'
              >
                Disconnect
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {wallet.isConnected && (
          <div className='space-y-3'>
            <button
              onClick={registerCurrentPage}
              className='w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700'
            >
              📝 Register Content
            </button>
            
            <button
              onClick={verifyCurrentPage}
              className='w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700'
            >
              🔍 Verify Content
            </button>
          </div>
        )}

        {!wallet.isConnected && (
          <p className='text-gray-500 text-sm text-center'>
            Connect your wallet to register and verify content
          </p>
        )}
      </div>
    </div>
  )
}

export default App
