// src/components/Dashboard/ContentVerificationPanel.tsx
import React, { useState, ChangeEvent } from 'react';

interface VerificationResult {
  status: 'verified' | 'modified' | 'revoked' | 'notFound';
  hash?: string;
  registrationDate?: string;
  title?: string;
  author?: string;
  authorAddress?: string;
  contentType?: string;
}

const ContentVerificationPanel: React.FC = () => {
  const [url, setUrl] = useState<string>('');
  const [hash, setHash] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<string>('url');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  
  const handleUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };
  
  const handleHashChange = (e: ChangeEvent<HTMLInputElement>) => {
    setHash(e.target.value);
  };
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  const handleMethodChange = (method: string) => {
    setVerificationMethod(method);
    // Reset form when changing methods
    setUrl('');
    setHash('');
    setFile(null);
    setResult(null);
  };
  
  const verifyContent = () => {
    setIsVerifying(true);
    setResult(null);
    
    // Simulate verification process with a delay
    setTimeout(() => {
      let mockResult: VerificationResult;
      
      // Generate random verification result for demo purposes
      const randomOutcome = Math.random();
      
      if (randomOutcome > 0.7) {
        mockResult = {
          status: 'verified',
          hash: '0x8a5b9c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0',
          registrationDate: new Date().toISOString(),
          title: 'Climate Change Analysis: 2024 Projections',
          author: 'Jane Doe',
          authorAddress: '0x123456789abcdef...',
          contentType: 'article'
        };
      } else if (randomOutcome > 0.4) {
        mockResult = {
          status: 'modified',
          hash: '0x8a5b9c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0',
          registrationDate: new Date().toISOString(),
          title: 'Climate Change Analysis: 2024 Projections',
          author: 'Jane Doe',
          authorAddress: '0x123456789abcdef...',
          contentType: 'article'
        };
      } else if (randomOutcome > 0.2) {
        mockResult = {
          status: 'revoked',
          hash: '0x8a5b9c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0',
          registrationDate: new Date().toISOString(),
          title: 'Climate Change Analysis: 2024 Projections',
          author: 'Jane Doe',
          authorAddress: '0x123456789abcdef...',
          contentType: 'article'
        };
      } else {
        mockResult = {
          status: 'notFound'
        };
      }
      
      setResult(mockResult);
      setIsVerifying(false);
    }, 2000);
  };
  
  const getResultStatusColor = () => {
    if (!result) return '';
    switch (result.status) {
      case 'verified':
        return 'text-green-400 bg-green-900 bg-opacity-20 border-green-800';
      case 'modified':
        return 'text-orange-400 bg-orange-900 bg-opacity-20 border-orange-800';
      case 'revoked':
        return 'text-red-400 bg-red-900 bg-opacity-20 border-red-800';
      case 'notFound':
        return 'text-gray-400 bg-gray-700 bg-opacity-50 border-gray-600';
      default:
        return '';
    }
  };
  
  const getResultIcon = () => {
    if (!result) return null;
    switch (result.status) {
      case 'verified':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'modified':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'revoked':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        );
      case 'notFound':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const getResultMessage = () => {
    if (!result) return '';
    switch (result.status) {
      case 'verified':
        return 'Content Verified: This content matches the original registered version.';
      case 'modified':
        return 'Content Modified: This content has been altered from its original registered version.';
      case 'revoked':
        return 'Content Revoked: This content has been marked as revoked by its author.';
      case 'notFound':
        return 'Content Not Found: This content has not been registered on the blockchain.';
      default:
        return '';
    }
  };
  
  const isFormValid = () => {
    switch (verificationMethod) {
      case 'url':
        return url.trim() !== '';
      case 'hash':
        return hash.trim() !== '';
      case 'file':
        return file !== null;
      default:
        return false;
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Verify Content Authenticity</h2>
      
      <div className="mb-6">
        <p className="text-gray-300 mb-4">
          Verify the authenticity and integrity of content by checking if it matches the version registered on the blockchain.
        </p>
        
        {/* Verification method selector */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`py-2 px-4 ${verificationMethod === 'url' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => handleMethodChange('url')}
          >
            Verify by URL
          </button>
          <button
            className={`py-2 px-4 ${verificationMethod === 'hash' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => handleMethodChange('hash')}
          >
            Verify by Hash
          </button>
          <button
            className={`py-2 px-4 ${verificationMethod === 'file' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
            onClick={() => handleMethodChange('file')}
          >
            Verify by File
          </button>
        </div>
        
        {/* URL input */}
        {verificationMethod === 'url' && (
          <div>
            <label htmlFor="content-url" className="block text-sm font-medium text-blue-300 mb-1">
              Content URL
            </label>
            <input
              type="url"
              id="content-url"
              value={url}
              onChange={handleUrlChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="https://example.com/article.html"
            />
            <p className="text-gray-400 text-xs mt-2">
              Enter the URL of the content you want to verify
            </p>
          </div>
        )}
        
        {/* Hash input */}
        {verificationMethod === 'hash' && (
          <div>
            <label htmlFor="content-hash" className="block text-sm font-medium text-blue-300 mb-1">
              Content Hash
            </label>
            <input
              type="text"
              id="content-hash"
              value={hash}
              onChange={handleHashChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 font-mono"
              placeholder="0x8a5b9c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0"
            />
            <p className="text-gray-400 text-xs mt-2">
              Enter the SHA-256 hash of the content you want to verify
            </p>
          </div>
        )}
        
        {/* File input */}
        {verificationMethod === 'file' && (
          <div>
            <label htmlFor="content-file" className="block text-sm font-medium text-blue-300 mb-1">
              Content File
            </label>
            <input
              type="file"
              id="content-file"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="content-file"
              className="flex items-center justify-center w-full px-4 py-6 bg-gray-700 border border-gray-600 border-dashed rounded-lg text-gray-400 hover:bg-gray-600 hover:text-white transition-colors cursor-pointer"
            >
              {file ? (
                <span className="text-white">{file.name}</span>
              ) : (
                <div className="text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span>Drag and drop a file here, or click to select a file</span>
                </div>
              )}
            </label>
            <p className="text-gray-400 text-xs mt-2">
              Upload the file you want to verify (max size: 10MB)
            </p>
          </div>
        )}
        
        <div className="mt-6">
          <button
            onClick={verifyContent}
            disabled={!isFormValid() || isVerifying}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center w-full"
          >
            {isVerifying ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verifying Content...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verify Content
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Verification result */}
      {result && (
        <div className={`border rounded-lg p-6 ${getResultStatusColor()}`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {getResultIcon()}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium">
                {result.status === 'verified' ? 'Content Authentic' : 
                 result.status === 'modified' ? 'Content Modified' :
                 result.status === 'revoked' ? 'Content Revoked' : 'Content Not Found'}
              </h3>
              <p className="mt-1">
                {getResultMessage()}
              </p>
              
              {(result.status === 'verified' || result.status === 'modified' || result.status === 'revoked') && (
                <div className="mt-4 space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Content Details</h4>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <span className="text-gray-500 mr-2">Title:</span>
                          <span>{result.title}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-500 mr-2">Type:</span>
                          <span className="capitalize">{result.contentType}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-500 mr-2">Registered:</span>
                          <span>{result.registrationDate && new Date(result.registrationDate).toLocaleString()}</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-300 mb-1">Author Information</h4>
                      <ul className="text-sm space-y-1">
                        <li className="flex items-start">
                          <span className="text-gray-500 mr-2">Name:</span>
                          <span>{result.author}</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-gray-500 mr-2">Address:</span>
                          <span className="font-mono text-xs">{result.authorAddress}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-300 mb-1">Content Hash</h4>
                    <div className="bg-gray-700 bg-opacity-50 p-2 rounded font-mono text-xs break-all">
                      {result.hash}
                    </div>
                  </div>
                  
                  <div className="flex pt-3 gap-3">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none flex items-center text-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on Explorer
                    </button>
                    
                    {result.status === 'verified' && (
                      <button className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700 focus:outline-none flex items-center text-sm">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Tip Creator
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentVerificationPanel;