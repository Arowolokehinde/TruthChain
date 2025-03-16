// src/components/Dashboard/ContentListItem.tsx
import React, { useState } from 'react';

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

interface ContentListItemProps {
  item: ContentItem;
  onRevoke: (id: string) => void;
}

const ContentListItem: React.FC<ContentListItemProps> = ({ item, onRevoke }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-5a2 2 0 00-2 2v12a2 2 0 002 2h5z" />
          </svg>
        );
      case 'image':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'video':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'audio':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
      case 'document':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        );
    }
  };

  return (
    <div className="group">
      <div className="p-4 hover:bg-gray-750 transition-colors">
        <div className="flex items-start">
          {/* Content thumbnail or icon */}
          <div className="flex-shrink-0 mr-4">
            {item.thumbnailUrl ? (
              <div className="h-14 w-20 bg-gray-700 rounded overflow-hidden">
                <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
              </div>
            ) : (
              <div className="h-14 w-14 bg-gray-700 rounded flex items-center justify-center">
                {getContentTypeIcon(item.contentType)}
              </div>
            )}
          </div>

          {/* Content info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <h3 className="text-white font-medium truncate">{item.title}</h3>
              {item.status === 'revoked' && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-red-900 text-red-300 rounded-full">
                  Revoked
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">{item.description}</p>
            <div className="flex items-center mt-2 text-xs text-gray-500">
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {formatDate(item.registrationDate)}
              </span>
              <span className="flex items-center ml-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {item.views.toLocaleString()}
              </span>
              <span className="flex items-center ml-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {item.verifications.toLocaleString()}
              </span>
              <span className="flex items-center ml-3">
                <span className={`capitalize ${item.contentType === 'article' ? 'text-blue-400' : item.contentType === 'video' ? 'text-red-400' : item.contentType === 'image' ? 'text-green-400' : item.contentType === 'audio' ? 'text-purple-400' : 'text-yellow-400'}`}>
                  {item.contentType}
                </span>
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="ml-4 flex-shrink-0 flex space-x-2">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-700 focus:outline-none"
              aria-label="Show details"
            >
              {showDetails ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              )}
            </button>
            <button
              className="p-2 text-blue-400 hover:text-blue-300 rounded-full hover:bg-gray-700 focus:outline-none"
              aria-label="Copy verification link"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            {item.status === 'active' && (
              <button
                onClick={() => setShowRevokeConfirm(true)}
                className="p-2 text-red-400 hover:text-red-300 rounded-full hover:bg-gray-700 focus:outline-none"
                aria-label="Revoke content"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {showDetails && (
          <div className="mt-4 pl-14">
            <div className="p-4 bg-gray-700 rounded-lg">
              <div className="mb-3">
                <h4 className="text-sm font-medium text-gray-300 mb-1">Content Hash</h4>
                <div className="flex items-center">
                  <p className="text-xs font-mono text-blue-300 truncate">{item.hash}</p>
                  <button className="ml-2 text-gray-400 hover:text-white focus:outline-none" aria-label="Copy hash">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Registration Info</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2">Date:</span>
                      <span>{new Date(item.registrationDate).toLocaleString()}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2">Status:</span>
                      <span className={item.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                        {item.status === 'active' ? 'Active' : 'Revoked'}
                      </span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2">Type:</span>
                      <span className="capitalize">{item.contentType}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Engagement</h4>
                  <ul className="text-xs text-gray-400 space-y-1">
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2">Views:</span>
                      <span>{item.views.toLocaleString()}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2">Verifications:</span>
                      <span>{item.verifications.toLocaleString()}</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-gray-500 mr-2">Tips received:</span>
                      <span>23.5 STX</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex mt-4 space-x-3">
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  View on Explorer
                </button>
                <button className="px-3 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Get Verification Badge
                </button>
                <button className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revoke confirmation dialog */}
        {showRevokeConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-semibold text-white mb-4">Revoke Content</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to revoke "{item.title}"? This will mark the content as inactive on the blockchain. This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowRevokeConfirm(false)}
                  className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onRevoke(item.id);
                    setShowRevokeConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Revoke Content
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentListItem;