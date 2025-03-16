


import { useState, useCallback } from 'react';
import { showConnect } from '@stacks/connect';
import { useConnect } from '@stacks/connect-react';
import { APP_CONFIG } from '@/lib/constants';
// import { NETWORK } from '@/config/stacks';

interface WalletState {
  walletConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
}

const useWallet = () => {
  const { authOptions } = useConnect();
  const [walletState, setWalletState] = useState<WalletState>({
    walletConnected: !!authOptions?.userSession?.isUserSignedIn(),
    walletAddress: authOptions?.userSession?.loadUserData()?.profile?.stxAddress?.testnet || null,
    walletType: null
  });

  const connectWallet = useCallback((walletType = 'Stacks') => {
    showConnect({
      appDetails: {
        name: APP_CONFIG.NAME,
        icon: window.location.origin + APP_CONFIG.ICON,
      },
      onFinish: () => {
        // Get the wallet address from user session
        const address = authOptions?.userSession?.loadUserData()?.profile?.stxAddress?.testnet || null;
        
        setWalletState({
          walletConnected: true,
          walletAddress: address,
          walletType: walletType // Set the wallet type that was selected
        });
      },
      onCancel: () => {
        console.log('User canceled wallet connection');
      },
      userSession: authOptions?.userSession,
      // network: NETWORK,
    });
  }, [authOptions?.userSession]);

  const disconnectWallet = useCallback(() => {
    if (authOptions?.userSession) {
      authOptions.userSession.signUserOut();
    }
    
    setWalletState({
      walletConnected: false,
      walletAddress: null,
      walletType: null
    });
  }, [authOptions?.userSession]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
};

export default useWallet;