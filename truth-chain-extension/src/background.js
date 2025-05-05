// // Background script - handles blockchain interactions
// console.log('Content Provenance Extension background script initialized');

// // Handle messages from content script
// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   console.log('Background script received message:', request);
  
//   if (request.action === 'registerContent') {
//     registerOnBlockchain(request.content)
//       .then(result => {
//         console.log('Registration successful:', result);
//         sendResponse({success: true, txId: result.txId});
//       })
//       .catch(error => {
//         console.error('Registration failed:', error);
//         sendResponse({success: false, error: error.message});
//       });
    
//     // Return true to indicate we will send a response asynchronously
//     return true;
//   }
// });

// // Function to generate a SHA-256 hash of content
// async function generateContentHash(contentData) {
//   try {
//     // Create a string representation of the content
//     const contentString = JSON.stringify({
//       title: contentData.title,
//       content: contentData.content,
//       timestamp: contentData.timestamp,
//       source: contentData.source
//     });
    
//     // Generate the hash using Web Crypto API
//     const hashBuffer = await crypto.subtle.digest(
//       'SHA-256', 
//       new TextEncoder().encode(contentString)
//     );
    
//     // Convert hash to hex string
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
//     return contentHash;
//   } catch (error) {
//     console.error('Error generating hash:', error);
//     throw new Error('Failed to generate content hash');
//   }
// }

// // Function to register content on the blockchain
// async function registerOnBlockchain(contentData) {
//   try {
//     console.log('Registering content:', contentData);
    
//     // Generate the content hash
//     const contentHash = await generateContentHash(contentData);
//     console.log('Content hash:', contentHash);
    
//     // In a real implementation, you would:
//     // 1. Connect to the user's Stacks wallet
//     // 2. Prepare the transaction parameters
//     // 3. Call your smart contract's register-content function
//     // 4. Return the transaction result
    
//     // For now, we'll simulate the blockchain interaction
//     // This should be replaced with actual Stacks.js code
    
//     // Simulate blockchain registration (replace with actual implementation)
//     return new Promise((resolve) => {
//       setTimeout(() => {
//         resolve({
//           txId: 'simulated-tx-' + Math.random().toString(36).substring(2, 15),
//           contentHash: contentHash
//         });
//       }, 1500); // Simulate network delay
//     });
    
//     /* 
//     // Example of actual Stacks.js implementation (to be implemented later)
//     const userSession = new UserSession();
    
//     if (!userSession.isUserSignedIn()) {
//       throw new Error('User not signed in. Please connect your wallet first.');
//     }
    
//     const options = {
//       contractAddress: 'YOUR_CONTRACT_ADDRESS',
//       contractName: 'content-provenance',
//       functionName: 'register-content',
//       functionArgs: [
//         stringAsciiCV(contentHash),
//         stringAsciiCV(contentData.contentType),
//         bufferCV(userSignature), // You'd need to implement signature generation
//         stringAsciiCV(contentData.title),
//         someCV(contentData.url) // Use appropriate CV type
//       ],
//       network: new StacksTestnet(), // Or StacksMainnet for production
//     };
    
//     const result = await openContractCall(options);
//     return {
//       txId: result.txId,
//       contentHash: contentHash
//     };
//     */
//   } catch (error) {
//     console.error('Error in blockchain registration:', error);
//     throw error;
//   }
// }


// src/background.js with Stacks.js integration
import { StacksTestnet } from '@stacks/network';
import { 
  makeSTXTokenTransfer,
  broadcastTransaction,
  bufferCV,
  stringAsciiCV,
  standardPrincipalCV,
  callReadOnlyFunction,
  cvToHex
} from '@stacks/transactions';
import { openContractCall, getStacksProvider } from '@stacks/connect';

// Keep the existing message listener
// Handle messages from content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Background script received message:', request);
    
    if (request.action === 'registerContent') {
      registerOnBlockchain(request.content)
        .then(result => {
          console.log('Registration successful:', result);
          sendResponse({success: true, txId: result.txId});
        })
        .catch(error => {
          console.error('Registration failed:', error);
          sendResponse({success: false, error: error.message});
        });
      
      // Return true to indicate we will send a response asynchronously
      return true;
    }
  });
  


// Function to register content on the blockchain (replace the simulation)
async function registerOnBlockchain(contentData) {
  try {
    console.log('Registering content:', contentData);
    
    // Generate the content hash
    const contentHash = await generateContentHash(contentData);
    console.log('Content hash:', contentHash);
    
    // Get the connected wallet from storage
    const walletData = await chrome.storage.local.get('connectedWallet');
    const walletAddress = walletData.connectedWallet;
    
    if (!walletAddress) {
      throw new Error('No wallet connected. Please connect your wallet in the extension popup.');
    }
    
    // Contract details - replace with your actual contract details
    const contractAddress = 'ST3S9E18YKY18RQBR6WVZQ816C19R3FB3K3M0K3XX.truth_chain';
    const contractName = 'truth_chain';
    const functionName = 'register-content';
    
    // Prepare function arguments
    // Note: Adjust these to match your smart contract's expected parameters
    const functionArgs = [
      bufferCV(Buffer.from(contentHash, 'hex')), // content-hash
      stringAsciiCV(contentData.contentType),    // content-type
      bufferCV(Buffer.from('signature-placeholder')), // signature (placeholder)
      stringAsciiCV(contentData.title),          // title
      stringAsciiCV(contentData.url)             // storage-url
    ];
    
    // Set up the contract call
    const options = {
      contractAddress,
      contractName,
      functionName,
      functionArgs,
      network: new StacksTestnet(), // Use StacksMainnet for production
      appDetails: {
        name: 'Content Provenance Registrar',
        icon: chrome.runtime.getURL('assets/icon128.png')
      },
      onFinish: (data) => {
        console.log('Transaction submitted:', data);
        return {
          txId: data.txId,
          contentHash: contentHash
        };
      }
    };
    
    // Execute the contract call
    return await openContractCall(options);
  } catch (error) {
    console.error('Error in blockchain registration:', error);
    throw error;
  }
}

// Keep the existing generateContentHash function...
// Function to generate a SHA-256 hash of content
async function generateContentHash(contentData) {
    try {
      // Create a string representation of the content
      const contentString = JSON.stringify({
        title: contentData.title,
        content: contentData.content,
        timestamp: contentData.timestamp,
        source: contentData.source
      });
      
      // Generate the hash using Web Crypto API
      const hashBuffer = await crypto.subtle.digest(
        'SHA-256', 
        new TextEncoder().encode(contentString)
      );
      
      // Convert hash to hex string
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const contentHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      return contentHash;
    } catch (error) {
      console.error('Error generating hash:', error);
      throw new Error('Failed to generate content hash');
    }
  }