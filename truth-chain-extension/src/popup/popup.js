// src/popup/popup.js
// Remove this import
// import { StacksTestnet } from '@stacks/network';

// Import showConnect only
import { showConnect } from '@stacks/connect';

document.addEventListener('DOMContentLoaded', function() {
  const connectWalletBtn = document.getElementById('connect-wallet');
  const walletAddressSpan = document.getElementById('wallet-address');
  
  // Check if wallet is already connected
  chrome.storage.local.get('connectedWallet', function(data) {
    if (data.connectedWallet) {
      walletAddressSpan.textContent = formatAddress(data.connectedWallet);
      connectWalletBtn.textContent = 'Disconnect Wallet';
      connectWalletBtn.dataset.connected = 'true';
    }
  });
  
  // Handle connect/disconnect wallet
  connectWalletBtn.addEventListener('click', function() {
    if (this.dataset.connected === 'true') {
      // Disconnect wallet
      chrome.storage.local.remove('connectedWallet', function() {
        walletAddressSpan.textContent = 'Not connected';
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.dataset.connected = 'false';
      });
    } else {
      // Connect wallet using Stacks Connect
      showConnect({
        appDetails: {
          name: 'Content Provenance Registrar',
          icon: chrome.runtime.getURL('assets/icon128.png')
        },
        redirectTo: '/',
        onFinish: (data) => {
          const address = data.userSession.loadUserData().profile.stxAddress.testnet;
          // Store the connected wallet address
          chrome.storage.local.set({ connectedWallet: address }, function() {
            walletAddressSpan.textContent = formatAddress(address);
            connectWalletBtn.textContent = 'Disconnect Wallet';
            connectWalletBtn.dataset.connected = 'true';
          });
        },
        userSession: false, // create a new session
        network: 'testnet' // Use string literal instead of StacksTestnet object
      });
    }
  });
  
  // Helper function to format wallet address
  function formatAddress(address) {
    if (address.length > 12) {
      return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
    }
    return address;
  }
});