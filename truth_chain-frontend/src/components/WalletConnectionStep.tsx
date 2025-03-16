import React from 'react';
import { Link } from 'react-router-dom';

interface WalletConnectionStepProps {
  walletConnected: boolean;
  walletAddress: string | null;
  walletType: string | null;
  handleConnectWallet: (walletType: string) => void;
  handleContinue: () => void;
  signupError: string;
}

const WalletConnectionStep: React.FC<WalletConnectionStepProps> = ({
  walletConnected,
  walletAddress,
  walletType,
  handleConnectWallet,
  handleContinue,
  signupError
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <p className="text-white font-medium mb-1">Step 1: Connect Your Wallet</p>
        <p className="text-sm text-blue-200">
          Please connect your Stacks wallet to continue with registration
        </p>
      </div>
      
      {signupError && (
        <div className="p-3 text-sm text-white bg-red-500 bg-opacity-80 rounded-lg" role="alert">
          {signupError}
        </div>
      )}
      
      <div className="relative">
        <div className="flex flex-col space-y-3">
          <button 
            onClick={() => handleConnectWallet('Stacks')}
            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Connect Stacks Wallet
          </button>
          <button 
            onClick={() => handleConnectWallet('Metamask')}
            className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Connect with Metamask
          </button>
        </div>
      </div>
      
      {walletConnected && (
        <div className="bg-blue-900 bg-opacity-25 p-4 rounded-lg border border-blue-800">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-teal-400 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-teal-300 font-medium">Wallet Successfully Connected</span>
          </div>
          <p className="text-blue-200 text-sm mt-2">
            Wallet Type: <span className="text-white">{walletType}</span>
          </p>
          <p className="text-blue-200 text-sm">
            Address: <span className="text-white font-mono text-xs">{walletAddress}</span>
          </p>
        </div>
      )}
      
      <button
        type="button"
        onClick={handleContinue}
        disabled={!walletConnected}
        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white 
        bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 
        transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        Continue to Account Setup
      </button>
      
      <p className="text-center text-sm text-blue-200">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blue-300 hover:text-blue-200 transition-colors">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default WalletConnectionStep;