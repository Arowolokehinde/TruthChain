// src/components/Dashboard/ContentRegistrationPanel.tsx
import React, { useState, ChangeEvent } from 'react';

interface ContentFormData {
  title: string;
  description: string;
  contentUrl: string;
  contentType: string;
  tags: string[];
  file: File | null;
}

const ContentRegistrationPanel: React.FC = () => {
  const [formData, setFormData] = useState<ContentFormData>({
    title: '',
    description: '',
    contentUrl: '',
    contentType: 'article',
    tags: [],
    file: null,
  });
  
  const [currentTag, setCurrentTag] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [contentHash, setContentHash] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Simulate the registration progress steps
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [_isHashVerified, setIsHashVerified] = useState<boolean>(false);
  const [_registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const [transactionId, setTransactionId] = useState<string>('');
  
  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleTagAddition = () => {
    if (currentTag.trim() !== '' && !formData.tags.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, currentTag.trim()],
      });
      setCurrentTag('');
    }
  };
  
  const handleTagRemoval = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove),
    });
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Display image preview if it's an image
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviewImage(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
      
      setFormData({
        ...formData,
        file,
      });
    }
  };
  
  const generateContentHash = () => {
    setIsSubmitting(true);
    
    // Simulate hash generation with a delay
    setTimeout(() => {
      // Generate a fake SHA-256 hash for demo purposes
      const fakeHash = Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setContentHash(fakeHash);
      setCurrentStep(2);
      setIsSubmitting(false);
    }, 1500);
  };
  
  const verifyHash = () => {
    setIsSubmitting(true);
    
    // Simulate verification process with a delay
    setTimeout(() => {
      setIsHashVerified(true);
      setCurrentStep(3);
      setIsSubmitting(false);
    }, 1500);
  };
  
  const submitToBlockchain = () => {
    setIsSubmitting(true);
    
    // Simulate blockchain transaction with a delay
    setTimeout(() => {
      // Generate a fake transaction ID
      const fakeTxId = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
      setTransactionId(fakeTxId);
      setRegistrationSuccess(true);
      setCurrentStep(4);
      setIsSubmitting(false);
    }, 3000);
  };
  
  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      contentUrl: '',
      contentType: 'article',
      tags: [],
      file: null,
    });
    setCurrentTag('');
    setContentHash('');
    setPreviewImage(null);
    setCurrentStep(1);
    setIsHashVerified(false);
    setRegistrationSuccess(false);
    setTransactionId('');
  };
  
  const isFormValid = () => {
    return formData.title.trim() !== '' && 
          (formData.file !== null || formData.contentUrl.trim() !== '');
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Register Content on Blockchain</h2>
      
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-400">Content Details</div>
          <div className="text-xs text-gray-400">Hash Generation</div>
          <div className="text-xs text-gray-400">Wallet Signing</div>
          <div className="text-xs text-gray-400">Blockchain Registration</div>
        </div>
        <div className="relative pt-4">
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-700">
            <div
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-teal-500"
              style={{ width: `${currentStep * 25}%` }}
            ></div>
          </div>
          {/* Step indicators */}
          <div className="flex justify-between -mt-2">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-teal-500' : 'bg-gray-600'}`}>
              <span className="text-white text-xs">1</span>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-teal-500' : 'bg-gray-600'}`}>
              <span className="text-white text-xs">2</span>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-teal-500' : 'bg-gray-600'}`}>
              <span className="text-white text-xs">3</span>
            </div>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-teal-500' : 'bg-gray-600'}`}>
              <span className="text-white text-xs">4</span>
            </div>
          </div>
        </div>
      </div>
      
      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-blue-300 mb-1">
              Content Title
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter title of your content"
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-blue-300 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Describe your content"
            />
          </div>
          
          <div>
            <label htmlFor="contentType" className="block text-sm font-medium text-blue-300 mb-1">
              Content Type
            </label>
            <select
              id="contentType"
              name="contentType"
              value={formData.contentType}
              onChange={handleInputChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="article">Article</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="document">Document</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contentUrl" className="block text-sm font-medium text-blue-300 mb-1">
                Content URL (optional)
              </label>
              <input
                type="text"
                id="contentUrl"
                name="contentUrl"
                value={formData.contentUrl}
                onChange={handleInputChange}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="URL where content is published"
              />
            </div>
            
            <div>
              <label htmlFor="file" className="block text-sm font-medium text-blue-300 mb-1">
                Upload File (optional)
              </label>
              <input
                type="file"
                id="file"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="file"
                className="flex items-center justify-center w-full px-4 py-2 bg-gray-700 border border-gray-600 border-dashed rounded-lg text-gray-400 hover:bg-gray-600 hover:text-white transition-colors cursor-pointer"
              >
                {formData.file ? formData.file.name : "Choose a file"}
              </label>
              {previewImage && (
                <div className="mt-2">
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full max-h-40 object-contain rounded"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-blue-300 mb-2">
              Content Tags
            </label>
            <div className="flex">
              <input
                type="text"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleTagAddition();
                  }
                }}
                className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Add tag and press Enter"
              />
              <button
                type="button"
                onClick={handleTagAddition}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap mt-2 gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-900 text-blue-200"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleTagRemoval(tag)}
                    className="ml-2 text-blue-300 hover:text-white"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              type="button"
              onClick={generateContentHash}
              disabled={!isFormValid() || isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                'Generate Content Hash'
              )}
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Generated Content Hash</h3>
            <p className="text-gray-400 mb-2">
              This unique hash represents your content. It will be stored on the blockchain to verify authenticity.
            </p>
            <div className="bg-gray-800 p-4 rounded-lg break-all font-mono text-teal-400 text-sm">
              {contentHash}
            </div>
          </div>
          
          <div className="bg-blue-900 bg-opacity-20 p-4 rounded-lg border border-blue-800">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-200 font-medium">
                  Please verify that the hash appears correct before proceeding.
                </p>
                <p className="text-blue-300 text-sm mt-1">
                  In the next step, you'll sign this hash with your wallet to prove ownership.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:outline-none"
            >
              Back
            </button>
            <button
              type="button"
              onClick={verifyHash}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Verifying...
                </>
              ) : (
                'Continue to Sign'
              )}
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
            <h3 className="text-xl font-semibold text-white mb-4">Sign Content with Your Wallet</h3>
            <p className="text-gray-400 mb-4">
              Your wallet will now sign the content hash to prove ownership. This connects your identity to the content without revealing private keys.
            </p>
            
            <div className="bg-teal-900 bg-opacity-20 p-4 rounded-lg border border-teal-800 mb-4">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-400 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-teal-200 font-medium">
                    Hash Verified Successfully
                  </p>
                  <p className="text-teal-300 text-sm mt-1">
                    The content hash has been verified and is ready to be signed.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-gray-400 text-sm">Content Hash</p>
                  <p className="font-mono text-blue-400 text-sm truncate">{contentHash.substring(0, 20)}...</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Gas Fee (estimated)</p>
                  <p className="text-white">0.00042 STX</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:outline-none"
            >
              Back
            </button>
            <button
              type="button"
              onClick={submitToBlockchain}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting to Blockchain...
                </>
              ) : (
                'Sign & Register on Blockchain'
              )}
            </button>
          </div>
        </div>
      )}

      {currentStep === 4 && (
        <div className="space-y-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-teal-900 bg-opacity-20 rounded-full mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Registration Successful!</h3>
            <p className="text-gray-400 mb-6">
              Your content has been successfully registered on the blockchain.
            </p>
            
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 text-left mb-6 max-w-lg mx-auto">
              <div className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Transaction ID</p>
                  <p className="font-mono text-blue-400 text-sm break-all">{transactionId}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Content Hash</p>
                  <p className="font-mono text-blue-400 text-sm break-all">{contentHash}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Registration Time</p>
                  <p className="text-white">{new Date().toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Verification Link
              </button>
              <button
                type="button"
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 focus:outline-none flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                View on Explorer
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:outline-none flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Register New Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentRegistrationPanel;