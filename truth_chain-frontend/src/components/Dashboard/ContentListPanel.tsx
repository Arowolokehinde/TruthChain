// src/components/Dashboard/ContentListPanel.tsx
import React, { useState } from 'react';
import ContentListItem from './ContentListItem';
import ContentListFilters from './ContentListFilters';
import ContentStats from './ContentStats';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  contentType: string;
  status: 'active' | 'revoked';
  registrationDate: string;
  hash: string;
  views: number;
  verifications: number;
  thumbnailUrl?: string;
}

const ContentListPanel: React.FC = () => {
  // Mock data - in a real app, this would come from an API
  const [contentItems, setContentItems] = useState<ContentItem[]>([
    {
      id: '1',
      title: 'Climate Change Analysis: 2024 Projections',
      description: 'A detailed analysis of climate change patterns and projections for 2024',
      contentType: 'article',
      status: 'active',
      registrationDate: '2025-02-15T10:30:00Z',
      hash: '0x8a5b9c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0',
      views: 523,
      verifications: 48,
      thumbnailUrl: 'https://via.placeholder.com/300x200'
    },
    {
      id: '2',
      title: 'Exclusive Interview with Tech Innovator',
      description: 'An in-depth interview with a leading tech innovator about emerging technologies',
      contentType: 'video',
      status: 'active',
      registrationDate: '2025-02-28T14:20:00Z',
      hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
      views: 1247,
      verifications: 156,
      thumbnailUrl: 'https://via.placeholder.com/300x200'
    },
    {
      id: '3',
      title: 'Financial Markets Report Q1 2025',
      description: 'Comprehensive analysis of financial markets performance in Q1 2025',
      contentType: 'document',
      status: 'active',
      registrationDate: '2025-03-05T09:15:00Z',
      hash: '0x9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e',
      views: 342,
      verifications: 27,
      thumbnailUrl: 'https://via.placeholder.com/300x200'
    },
    {
      id: '4',
      title: 'Historic Election Photo Series',
      description: 'A series of verified photographs from the historic election',
      contentType: 'image',
      status: 'active',
      registrationDate: '2025-01-20T16:45:00Z',
      hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
      views: 897,
      verifications: 73,
      thumbnailUrl: 'https://via.placeholder.com/300x200'
    },
    {
      id: '5',
      title: 'Debunked: Viral Misinformation Campaign',
      description: 'Analysis and debunking of a recent viral misinformation campaign',
      contentType: 'article',
      status: 'active',
      registrationDate: '2025-03-10T11:30:00Z',
      hash: '0x5f4e3d2c1b0a9f8e7d6c5b4a3f2e1d0c9b8a7f6e',
      views: 1568,
      verifications: 214,
      thumbnailUrl: 'https://via.placeholder.com/300x200'
    },
    {
      id: '6',
      title: 'Podcast: Future of Blockchain Technology',
      description: 'Panel discussion on the future of blockchain technology and its applications',
      contentType: 'audio',
      status: 'revoked',
      registrationDate: '2025-01-05T08:00:00Z',
      hash: '0x2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      views: 456,
      verifications: 32,
      thumbnailUrl: 'https://via.placeholder.com/300x200'
    }
  ]);

  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortMethod, setSortMethod] = useState<string>('date-desc');

  // Filter, search, and sort content items
  const filteredContent = contentItems
    .filter(item => {
      if (filter === 'all') return true;
      if (filter === 'active') return item.status === 'active';
      if (filter === 'revoked') return item.status === 'revoked';
      return item.contentType === filter;
    })
    .filter(item => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortMethod) {
        case 'date-asc':
          return new Date(a.registrationDate).getTime() - new Date(b.registrationDate).getTime();
        case 'date-desc':
          return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
        case 'views-desc':
          return b.views - a.views;
        case 'verifications-desc':
          return b.verifications - a.verifications;
        default:
          return new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime();
      }
    });

  // Calculate statistics
  const totalContent = contentItems.length;
  const activeContent = contentItems.filter(item => item.status === 'active').length;
  const totalViews = contentItems.reduce((sum, item) => sum + item.views, 0);
  const totalVerifications = contentItems.reduce((sum, item) => sum + item.verifications, 0);

  const handleRevokeContent = (id: string) => {
    setContentItems(
      contentItems.map(item =>
        item.id === id ? { ...item, status: 'revoked' } : item
      )
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-bold text-white mb-2 md:mb-0">My Content</h2>
        <button
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Register New Content
        </button>
      </div>

      {/* Content Statistics */}
      <ContentStats 
        totalContent={totalContent}
        activeContent={activeContent}
        totalViews={totalViews}
        totalVerifications={totalVerifications}
      />

      {/* Filters and search */}
      <ContentListFilters 
        filter={filter}
        setFilter={setFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        sortMethod={sortMethod}
        setSortMethod={setSortMethod}
      />

      {/* Content List */}
      <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="divide-y divide-gray-700">
          {filteredContent.length > 0 ? (
            filteredContent.map(item => (
              <ContentListItem 
                key={item.id} 
                item={item} 
                onRevoke={handleRevokeContent}
              />
            ))
          ) : (
            <div className="py-12 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-400">No content matches your filters</p>
              <button className="mt-4 px-4 py-2 text-sm text-blue-400 hover:text-blue-300" onClick={() => {
                setFilter('all');
                setSearchQuery('');
              }}>
                Clear filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination (simplified) */}
      {filteredContent.length > 0 && (
        <div className="flex items-center justify-between border-t border-gray-700 pt-4">
          <div className="text-sm text-gray-400">
            Showing <span className="font-medium text-white">{filteredContent.length}</span> of{' '}
            <span className="font-medium text-white">{contentItems.length}</span> items
          </div>
          <div className="flex space-x-2">
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-600" disabled>
              Previous
            </button>
            <button className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentListPanel;