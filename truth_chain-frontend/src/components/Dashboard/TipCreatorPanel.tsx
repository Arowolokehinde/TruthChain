// src/components/Dashboard/TipCreatorPanel.tsx
import React, { useState, ChangeEvent } from 'react';

interface CreatorInfo {
  name: string;
  address: string;
  avatarUrl?: string;
  contentCount: number;
  verifiedContent: number;
}

interface RecentTip {
  id: string;
  creatorName: string;
  creatorAddress: string;
  amount: number;
  date: string;
  contentTitle: string;
}

const TipCreatorPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCreator, setSelectedCreator] = useState<CreatorInfo | null>(null);
  const [tipAmount, setTipAmount] = useState<string>('5');
  const [message, setMessage] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);
  const [recentTips, setRecentTips] = useState<RecentTip[]>([
    {
      id: '1',
      creatorName: 'Alex Johnson',
      creatorAddress: '0x9f8e7d6c5b4a3f2e1d0c9b8a',
      amount: 15,
      date: '2025-03-10T14:23:00Z',
      contentTitle: 'Climate Change Analysis: 2024 Projections'
    },
    {
      id: '2',
      creatorName: 'Maria Garcia',
      creatorAddress: '0x1a2b3c4d5e6f7a8b9c0d1e2f',
      amount: 8.5,
      date: '2025-03-08T09:15:00Z',
      contentTitle: 'Historic Election Photo Series'
    },
    {
      id: '3',
      creatorName: 'Sam Brown',
      creatorAddress: '0x5f4e3d2c1b0a9f8e7d6c5b4a',
      amount: 2,
      date: '2025-03-05T16:30:00Z',
      contentTitle: 'Financial Markets Report Q1 2025'
    }
  ]);

  // Mock suggested creators
  const suggestedCreators: CreatorInfo[] = [
    {
      name: 'Alex Johnson',
      address: '0x9f8e7d6c5b4a3f2e1d0c9b8a',
      avatarUrl: 'https://randomuser.me/api/portraits/men/32.jpg',
      contentCount: 42,
      verifiedContent: 36
    },
    {
      name: 'Maria Garcia',
      address: '0x1a2b3c4d5e6f7a8b9c0d1e2f',
      avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
      contentCount: 27,
      verifiedContent: 24
    },
    {
      name: 'Sam Brown',
      address: '0x5f4e3d2c1b0a9f8e7d6c5b4a',
      avatarUrl: 'https://randomuser.me/api/portraits/men/67.jpg',
      contentCount: 15,
      verifiedContent: 12
    }
  ];

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') return;
    
    setIsSearching(true);
    setSelectedCreator(null);
    
    // Simulate search with delay
    setTimeout(() => {
      // Mock search result - in a real app would come from API
      const mockResult = suggestedCreators.find(creator => 
        creator.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        creator.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
      
      setSelectedCreator(mockResult || null);
      setIsSearching(false);
    }, 1000);
  };

  const handleSelectCreator = (creator: CreatorInfo) => {
    setSelectedCreator(creator);
    setSearchQuery('');
  };

  const handleAmountChange = (e: ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and one decimal point
    const value = e.target.value;
    if (/^\d*\.?\d*$/.test(value)) {
      setTipAmount(value);
    }
  };

  const handleMessageChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
  };

  const handleSendTip = () => {
    if (!selectedCreator || !tipAmount || parseFloat(tipAmount) <= 0) return;
    
    setIsSending(true);
    
    // Simulate blockchain transaction with delay
    setTimeout(() => {
      // Add the new tip to recent tips
      const newTip: RecentTip = {
        id: Date.now().toString(),
        creatorName: selectedCreator.name,
        creatorAddress: selectedCreator.address,
        amount: parseFloat(tipAmount),
        date: new Date().toISOString(),
        contentTitle: 'Direct Support'
      };
      
      setRecentTips([newTip, ...recentTips]);
      setIsSending(false);
      setShowSuccess(true);
      
      // Reset form
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedCreator(null);
        setTipAmount('5');
        setMessage('');
      }, 3000);
    }, 2000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Tip Creator Form */}
      <div className="lg:col-span-2">
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Support Content Creators</h2>
          
          {showSuccess ? (
            <div className="bg-green-900 bg-opacity-20 border border-green-800 rounded-lg p-6 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">Tip Sent Successfully!</h3>
              <p className="text-green-300">
                Your tip of {tipAmount} STX has been sent to {selectedCreator?.name}.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                {/* Creator search */}
                <div>
                  <label htmlFor="creator-search" className="block text-sm font-medium text-blue-300 mb-1">
                    Find Creator
                  </label>
                  <div className="flex">
                    <input
                      type="text"
                      id="creator-search"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-l-lg text-white focus:outline-none focus:border-blue-500"
                      placeholder="Search by name or wallet address"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={isSearching || searchQuery.trim() === ''}
                      className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSearching ? (
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Suggested creators */}
                {!selectedCreator && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-3">Suggested Creators</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {suggestedCreators.map((creator) => (
                        <button
                          key={creator.address}
                          onClick={() => handleSelectCreator(creator)}
                          className="flex items-center p-3 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors text-left"
                        >
                          <div className="h-10 w-10 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                            {creator.avatarUrl ? (
                              <img src={creator.avatarUrl} alt={creator.name} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-blue-600 text-white font-bold">
                                {creator.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="ml-3 min-w-0">
                            <p className="text-white font-medium truncate">{creator.name}</p>
                            <p className="text-gray-400 text-xs truncate">{creator.address}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Selected creator */}
                {selectedCreator && (
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-gray-600 overflow-hidden flex-shrink-0">
                        {selectedCreator.avatarUrl ? (
                          <img src={selectedCreator.avatarUrl} alt={selectedCreator.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-blue-600 text-white font-bold">
                            {selectedCreator.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-medium truncate">{selectedCreator.name}</h3>
                          <button
                            onClick={() => setSelectedCreator(null)}
                            className="text-gray-400 hover:text-white"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-gray-400 text-sm font-mono truncate">{selectedCreator.address}</p>
                        <div className="flex mt-2 text-xs text-gray-400">
                          <span className="mr-3">{selectedCreator.contentCount} pieces of content</span>
                          <span>{selectedCreator.verifiedContent} verified</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Tip amount */}
                {selectedCreator && (
                  <>
                    <div>
                      <label htmlFor="tip-amount" className="block text-sm font-medium text-blue-300 mb-1">
                        Tip Amount (STX)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="tip-amount"
                          value={tipAmount}
                          onChange={handleAmountChange}
                          className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                          placeholder="Enter amount"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <span className="text-gray-400">STX</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between mt-2">
                        <button
                          type="button"
                          onClick={() => setTipAmount('2')}
                          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                        >
                          2 STX
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipAmount('5')}
                          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                        >
                          5 STX
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipAmount('10')}
                          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                        >
                          10 STX
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipAmount('25')}
                          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                        >
                          25 STX
                        </button>
                        <button
                          type="button"
                          onClick={() => setTipAmount('50')}
                          className="px-3 py-1 text-xs bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                        >
                          50 STX
                        </button>
                      </div>
                    </div>
                    
                    {/* Optional message */}
                    <div>
                      <label htmlFor="message" className="block text-sm font-medium text-blue-300 mb-1">
                        Message (optional)
                      </label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={handleMessageChange}
                        rows={3}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Add a message to the creator..."
                      />
                    </div>
                    
                    {/* Send button */}
                    <div>
                      <button
                        onClick={handleSendTip}
                        disabled={isSending || !tipAmount || parseFloat(tipAmount) <= 0}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isSending ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Tip...
                          </>
                        ) : (
                          <>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Send {tipAmount} STX Tip
                          </>
                        )}
                      </button>
                      
                      <p className="text-gray-400 text-xs mt-2 text-center">
                        A small network fee will be applied to process this transaction
                      </p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Recent Tips */}
      <div>
        <div className="bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Tips</h2>
          
          <div className="space-y-4">
            {recentTips.length > 0 ? (
              recentTips.map((tip) => (
                <div key={tip.id} className="border-b border-gray-700 pb-4 last:border-b-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-white font-medium">{tip.creatorName}</p>
                      <p className="text-gray-400 text-xs font-mono truncate">{tip.creatorAddress}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-teal-400 font-medium">{tip.amount} STX</p>
                      <p className="text-gray-400 text-xs">{formatDate(tip.date)}</p>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm mt-1">
                    <span className="text-gray-500">For: </span>
                    {tip.contentTitle}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center py-4">No tips yet</p>
            )}
          </div>
          
          <div className="mt-6 text-center">
            <button className="text-blue-400 hover:text-blue-300 text-sm">
              View All Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TipCreatorPanel;