// src/components/Dashboard/BlockchainTransactionsPanel.tsx
import React, { useState } from 'react';

interface Transaction {
  id: string;
  type: 'registration' | 'verification' | 'tip' | 'revocation';
  contentTitle?: string;
  amount?: number;
  status: 'confirmed' | 'pending' | 'failed';
  timestamp: string;
  hash: string;
  fee: number;
}

const BlockchainTransactionsPanel: React.FC = () => {
  // Mock transactions - in a real app, this would come from the blockchain
  const [transactions, _setTransactions] = useState<Transaction[]>([
    {
      id: '1',
      type: 'registration',
      contentTitle: 'Climate Change Analysis: 2024 Projections',
      status: 'confirmed',
      timestamp: '2025-02-15T10:30:00Z',
      hash: '0x8a5b9c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0',
      fee: 0.00042
    },
    {
      id: '2',
      type: 'verification',
      contentTitle: 'Exclusive Interview with Tech Innovator',
      status: 'confirmed',
      timestamp: '2025-02-28T14:20:00Z',
      hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      fee: 0.00021
    },
    {
      id: '3',
      type: 'tip',
      contentTitle: 'Financial Markets Report Q1 2025',
      amount: 5.5,
      status: 'confirmed',
      timestamp: '2025-03-05T09:15:00Z',
      hash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
      fee: 0.00036
    },
    {
      id: '4',
      type: 'registration',
      contentTitle: 'Historic Election Photo Series',
      status: 'confirmed',
      timestamp: '2025-01-20T16:45:00Z',
      hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
      fee: 0.00042
    },
    {
      id: '5',
      type: 'revocation',
      contentTitle: 'Debunked: Viral Misinformation Campaign',
      status: 'pending',
      timestamp: '2025-03-10T11:30:00Z',
      hash: '0x5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e',
      fee: 0.00038
    },
    {
      id: '6',
      type: 'tip',
      contentTitle: 'Podcast: Future of Blockchain Technology',
      amount: 10,
      status: 'confirmed',
      timestamp: '2025-03-12T08:00:00Z',
      hash: '0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      fee: 0.00032
    },
    {
      id: '7',
      type: 'verification',
      contentTitle: 'AI Ethics Framework: A New Approach',
      status: 'failed',
      timestamp: '2025-03-08T13:20:00Z',
      hash: '0x7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b',
      fee: 0.00021
    }
  ]);

  const [filter, setFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<string>('newest');
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'bg-blue-500 text-white';
      case 'verification':
        return 'bg-green-500 text-white';
      case 'tip':
        return 'bg-purple-500 text-white';
      case 'revocation':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };
  
  const getTransactionTypeIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'verification':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'tip':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'revocation':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      default:
        return null;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <div className="flex items-center text-green-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Confirmed
          </div>
        );
      case 'pending':
        return (
          <div className="flex items-center text-yellow-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Pending
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center text-red-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Failed
          </div>
        );
      default:
        return null;
    }
  };
  
  // Filter and sort transactions
  const filteredTransactions = transactions
    .filter(tx => {
      if (filter === 'all') return true;
      return tx.type === filter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Blockchain Transactions</h2>
      
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
        {/* Filter options */}
        <div className="flex-1">
          <label htmlFor="filter" className="block text-sm font-medium text-blue-300 mb-1">
            Filter Transactions
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Transactions</option>
            <option value="registration">Content Registrations</option>
            <option value="verification">Content Verifications</option>
            <option value="tip">Tips Sent/Received</option>
            <option value="revocation">Content Revocations</option>
          </select>
        </div>
        
        {/* Sort options */}
        <div className="sm:w-48">
          <label htmlFor="sort" className="block text-sm font-medium text-blue-300 mb-1">
            Sort Order
          </label>
          <select
            id="sort"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
      
      {/* Transaction stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-white">{transactions.length}</div>
          <div className="text-xs text-gray-400">Total Transactions</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-white">
            {transactions.filter(tx => tx.type === 'registration').length}
          </div>
          <div className="text-xs text-gray-400">Registrations</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-white">
            {transactions.filter(tx => tx.type === 'verification').length}
          </div>
          <div className="text-xs text-gray-400">Verifications</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3 text-center">
          <div className="text-xl font-bold text-white">
            {transactions.filter(tx => tx.type === 'tip').reduce((sum, tx) => sum + (tx.amount || 0), 0).toFixed(2)}
          </div>
          <div className="text-xs text-gray-400">STX Sent/Received</div>
        </div>
      </div>
      
      {/* Transactions table */}
      <div className="bg-gray-700 overflow-hidden rounded-lg shadow mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-600">
            <thead className="bg-gray-800">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Transaction
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Content
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-700 divide-y divide-gray-600">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-650">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full mr-3 ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeIcon(transaction.type)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white capitalize">
                            {transaction.type}
                          </div>
                          <div className="text-xs text-gray-400 font-mono truncate" style={{ maxWidth: '150px' }}>
                            {transaction.hash.substring(0, 10)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-white truncate" style={{ maxWidth: '200px' }}>
                        {transaction.contentTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {formatDate(transaction.timestamp)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {getStatusIcon(transaction.status)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm font-medium text-white">
                        {transaction.type === 'tip' 
                          ? (transaction.amount?.toFixed(2) || '0') + ' STX' 
                          : '-'}
                      </div>
                      <div className="text-xs text-gray-400">
                        Fee: {transaction.fee.toFixed(5)} STX
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <p className="text-gray-400">No transactions found</p>
                    {filter !== 'all' && (
                      <button 
                        onClick={() => setFilter('all')} 
                        className="mt-2 text-blue-400 hover:text-blue-300"
                      >
                        Show all transactions
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Export options */}
      <div className="flex justify-end space-x-3">
        <button className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 focus:outline-none flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export CSV
        </button>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View on Explorer
        </button>
      </div>
    </div>
  );
};

export default BlockchainTransactionsPanel;