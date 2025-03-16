import React, { useState, useEffect } from 'react';
import { Upload, Loader, CheckCircle, AlertCircle, Info, FileText, Shield, Lock } from 'lucide-react';

const RegisterContentComponent = () => {
  // Assume wallet is already connected and user data is available from sign-in
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [contentHash, setContentHash] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [transactionId, setTransactionId] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [contentName, setContentName] = useState('');
  const [contentDescription, setContentDescription] = useState('');
  
  // Mock user wallet data that would be passed from sign-in page
  const userWallet = {
    address: 'SP2J6ZY48GV1EZ5V2V5RB9MP66SW86PYKKNRV9EJ7',
    balance: '125.75 STX',
    isConnected: true
  };

  // Mock function to generate SHA-256 hash (in a real app, use actual crypto libraries)
  const generateContentHash = (file) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // This is a mock hash - in production use actual SHA-256
        const mockHash = '0x' + Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join('');
        resolve(mockHash);
      }, 1000);
    });
  };

  // Mock function to register content on blockchain
  const registerContent = async () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock transaction ID
        const txId = '0x' + Array(64).fill(0).map(() => 
          Math.floor(Math.random() * 16).toString(16)).join('');
        resolve(txId);
      }, 2000);
    });
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    handleFileSelection(selectedFile);
  };
  
  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files?.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };
  
  const handleFileSelection = async (selectedFile) => {
    setFile(selectedFile);
    setError('');
    
    // Generate preview if it's an image
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setFilePreview(e.target.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
    
    try {
      // Generate hash from the file
      const hash = await generateContentHash(selectedFile);
      setContentHash(hash);
      // Skip wallet connection step since wallet is already connected
      setCurrentStep(3);
    } catch (err) {
      setError('Failed to generate content hash. Please try again.');
    }
  };

  const handleRegisterContent = async () => {
    if (!userWallet.isConnected || !contentHash) {
      setError('Wallet connection issue or content hash not generated.');
      return;
    }
    
    if (!contentName.trim()) {
      setError('Please provide a name for your content before registering.');
      return;
    }

    setIsRegistering(true);
    setError('');

    try {
      // In a real implementation, would pass contentName and contentDescription to the blockchain
      const txId = await registerContent();
      setTransactionId(txId);
      setIsRegistered(true);
      setCurrentStep(4);
    } catch (err) {
      setError('Transaction failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Get file type icon
  const getFileIcon = () => {
    if (!file) return <Upload className="w-12 h-12" />;
    
    const fileType = file.type;
    if (fileType.startsWith('image/')) {
      return filePreview ? 
        <img src={filePreview} alt="Preview" className="w-16 h-16 object-cover rounded" /> : 
        <FileText className="w-12 h-12" />;
    }
    if (fileType.startsWith('video/')) return <FileText className="w-12 h-12" />;
    if (fileType.includes('pdf')) return <FileText className="w-12 h-12" />;
    return <FileText className="w-12 h-12" />;
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900/80 backdrop-blur-sm z-50 p-6 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white p-8 rounded-xl w-full max-w-2xl mx-auto shadow-xl border border-gray-800 relative overflow-hidden animate-float">
        {/* Animated background glow */}
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl animate-pulse"></div>
      
      <h2 className="text-2xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Register Content on Blockchain</h2>
      
      {/* Progress Steps */}
      <div className="flex justify-between mb-10 relative">
        <div className="absolute top-4 left-0 right-0 h-1 bg-gray-700 -z-10"></div>
        <div className={`absolute top-4 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-in-out -z-10`} style={{ width: `${(currentStep === 1 ? 0 : currentStep === 3 ? 50 : 100)}%` }}></div>
        
        {[1, 3, 4].map((step, index) => (
          <div key={step} className="flex flex-col items-center z-10 transition-transform duration-300 ease-in-out" style={{ transform: currentStep >= step ? 'scale(1.05)' : 'scale(1)' }}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
              currentStep > step 
                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                : currentStep === step
                ? 'bg-blue-500 ring-4 ring-blue-500/20'
                : 'bg-gray-700'
            }`}>
              {currentStep > step ? (
                <CheckCircle className="w-5 h-5 animate-fadeIn" />
              ) : (
                <span>{index + 1}</span>
              )}
            </div>
            <span className={`text-xs mt-2 font-medium transition-all duration-300 ${currentStep >= step ? 'text-blue-400' : 'text-gray-500'}`}>
              {step === 1 && "Upload"}
              {step === 3 && "Sign"}
              {step === 4 && "Confirm"}
            </span>
          </div>
        ))}
      </div>
      
      {/* Content */}
      <div className="mb-6 min-h-64">
        {currentStep === 1 && (
          <div className="flex flex-col items-center animate-fadeIn">
            <div 
              className={`border-2 ${isDragging ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 bg-gray-800/50'} border-dashed rounded-lg p-12 w-full text-center hover:border-blue-400 hover:bg-gray-800/80 transition-all duration-300 backdrop-blur-sm shadow-md cursor-pointer group`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="content-upload"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="content-upload" className="cursor-pointer flex flex-col items-center">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-4 transition-transform duration-300 group-hover:transform group-hover:scale-110">
                  <Upload className="w-10 h-10 text-blue-400" />
                </div>
                <p className="text-xl mb-2 font-medium bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">Upload Your Content</p>
                <p className="text-sm text-gray-400">Click to upload or drag and drop your file</p>
              </label>
            </div>
            <div className="mt-6 text-sm text-gray-400 bg-gray-800/30 p-4 rounded-lg border border-gray-700/50 w-full">
              <h4 className="font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Supported Content Types
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <p>Images (PNG, JPG, GIF)</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <p>Videos (MP4, WebM)</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <p>Documents (PDF, DOC)</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <p>Audio (MP3, WAV)</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Removing Step 2 since we're skipping directly to Step 3 after file upload */}
        
        {currentStep === 3 && (
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 shadow-lg backdrop-blur-sm transition-all duration-300 animate-fadeIn transform hover:shadow-2xl hover:shadow-blue-900/20 will-change-transform" 
          style={{transform: "translateY(-8px)", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2), 0 0 20px rgba(59, 130, 246, 0.1)"}}>
            <h3 className="text-xl mb-4 flex items-center gap-2 font-medium bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
              <Lock className="w-5 h-5 text-blue-400" />
              Register Content Details
            </h3>
            <p className="mb-6">Add information about your content before registering it on the Stacks blockchain.</p>
            
            <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="col-span-1 bg-gray-900/70 p-4 rounded-lg border border-gray-800 flex items-center justify-center">
                <div className="flex flex-col items-center text-center">
                  {getFileIcon()}
                  <p className="mt-3 text-sm text-gray-400 truncate max-w-full">{file?.name}</p>
                  <p className="text-xs text-gray-500">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              
              <div className="col-span-2 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="content-name" className="text-sm text-gray-300 font-medium">Content Name</label>
                  <input 
                    type="text" 
                    id="content-name" 
                    placeholder="Enter a name for your content" 
                    value={contentName}
                    onChange={(e) => setContentName(e.target.value)}
                    className="w-full bg-gray-900/70 border border-gray-800 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="content-description" className="text-sm text-gray-300 font-medium">Description</label>
                  <textarea 
                    id="content-description" 
                    placeholder="Describe your content (optional)" 
                    rows="3"
                    value={contentDescription}
                    onChange={(e) => setContentDescription(e.target.value)} 
                    className="w-full bg-gray-900/70 border border-gray-800 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none"
                  ></textarea>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-900/70 p-6 rounded-lg mb-6 border border-gray-800">
              <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-4 font-medium">Technical Details</h4>
              
              <div className="space-y-3">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm mb-1">Content Hash</span>
                  <div className="bg-gray-950 p-3 rounded-md font-mono text-xs break-all border border-gray-800">
                    {contentHash}
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-gray-400 text-sm mb-1">Wallet Address</span>
                  <div className="bg-gray-950 p-3 rounded-md font-mono text-xs border border-gray-800 flex justify-between items-center">
                    <span>{userWallet.address}</span>
                    <span className="bg-blue-900/30 text-blue-300 px-2 py-1 rounded text-xs">
                      Balance: {userWallet.balance}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-900/20 border border-blue-800/50 p-4 rounded-lg mb-6">
              <p className="text-sm font-medium text-blue-300 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Registration Information
              </p>
              <ul className="text-sm list-disc pl-5 space-y-1 text-gray-300">
                <li>Your content will be permanently registered on the Stacks blockchain</li>
                <li>This creates an immutable timestamp and proof of ownership</li>
                <li>Estimated gas fee: <span className="text-blue-300 font-medium">0.0001 STX</span></li>
                <li>Registration time: <span className="text-blue-300 font-medium">~2 minutes</span></li>
              </ul>
            </div>
            
            <div className="flex justify-between">
              <button 
                onClick={() => setCurrentStep(1)} 
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                Back
              </button>
              <button 
                onClick={handleRegisterContent} 
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 flex items-center gap-2 font-medium"
                disabled={isRegistering}
              >
                {isRegistering ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Sign & Register</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
        
        {currentStep === 4 && isRegistered && (
          <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 text-center shadow-lg backdrop-blur-sm animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center mx-auto mb-6 animate-pulse">
              <CheckCircle className="w-10 h-10 text-white animate-fadeIn" />
            </div>
            <h3 className="text-2xl mb-3 font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-blue-400">Content Registered Successfully!</h3>
            <p className="text-gray-300 mb-6">Your content has been permanently registered on the Stacks blockchain and is now verifiable.</p>
            
            <div className="bg-gray-900/70 p-6 rounded-lg mb-8 text-left border border-gray-800 shadow-inner">
              <h4 className="text-sm uppercase tracking-wider text-gray-400 mb-4 font-medium">Transaction Details</h4>
              
              <div className="space-y-4">
                <div className="flex flex-col">
                  <span className="text-gray-400 text-xs mb-1">Transaction ID</span>
                  <a 
                    href={`https://explorer.stacks.co/txid/${transactionId}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:text-blue-300 hover:underline font-mono text-sm bg-gray-950 p-3 rounded-md border border-gray-800 transition-colors"
                  >
                    {transactionId}
                  </a>
                </div>
                
                <div className="flex flex-col">
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-400 text-xs">Content Details</span>
                  </div>
                  <div className="bg-gray-950 p-4 rounded-md border border-gray-800">
                    <div className="mb-3">
                      <span className="text-xs text-gray-500">Name:</span>
                      <p className="font-medium text-sm">{contentName || file?.name || "Untitled Content"}</p>
                    </div>
                    
                    <div className="mb-3">
                      <span className="text-xs text-gray-500">Description:</span>
                      <p className="text-sm text-gray-300">{contentDescription || "No description provided"}</p>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Verification Link:</span>
                      <div className="flex items-center mt-1">
                        <input 
                          type="text" 
                          value={`https://verify.contentprovenance.io/${contentHash.substring(0, 16)}`} 
                          readOnly 
                          className="bg-gray-900 text-sm text-gray-300 font-mono w-full outline-none border border-gray-800 rounded-l-md p-2" 
                        />
                        <button className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-r-md transition-colors">
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                className="w-full px-4 py-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
              >
                <Shield className="w-4 h-4" />
                View Verification
              </button>
              <button 
                onClick={() => {
                  setFile(null);
                  setContentHash('');
                  setIsRegistered(false);
                  setTransactionId('');
                  setCurrentStep(1);
                }}
                className="w-full px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 font-medium"
              >
                Register New Content
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 p-4 rounded-lg flex items-start gap-3 mt-4 animate-fadeIn backdrop-blur-sm">
          <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-300 font-medium mb-1">Transaction Error</p>
            <p className="text-sm text-red-200">{error}</p>
          </div>
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-8 text-sm text-gray-500 flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          Need help? Learn more about <a href="#" className="text-blue-400 hover:underline transition-colors">content registration</a> or <a href="#" className="text-blue-400 hover:underline transition-colors">contact support</a>.
        </p>
      </div>
    </div>
    </div>
  );
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out forwards;
  }
  
  @keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 0.8; }
    100% { opacity: 0.5; }
  }
  
  .animate-pulse {
    animation: pulse 3s infinite;
  }
  
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  
  .animate-float {
    animation: float 6s ease-in-out infinite;
  }
`;

document.head.appendChild(style);

export default RegisterContentComponent;