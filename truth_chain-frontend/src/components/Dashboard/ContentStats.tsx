// src/components/Dashboard/ContentStats.tsx
import React from 'react';

interface ContentStatsProps {
  totalContent: number;
  activeContent: number;
  totalViews: number;
  totalVerifications: number;
}

const ContentStats: React.FC<ContentStatsProps> = ({
  totalContent,
  activeContent,
  totalViews,
  totalVerifications,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Content */}
      <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-lg p-4 shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-blue-800 bg-opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Content</h3>
            <div className="flex items-baseline">
              <p className="text-white text-2xl font-bold">{totalContent}</p>
              <p className="text-blue-300 text-sm ml-2">
                {activeContent} active
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Views */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-lg p-4 shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-indigo-800 bg-opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-gray-400 text-sm font-medium">Total Views</h3>
            <div className="flex items-baseline">
              <p className="text-white text-2xl font-bold">{totalViews.toLocaleString()}</p>
              <p className="text-indigo-300 text-sm ml-2">
                lifetime
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Total Verifications */}
      <div className="bg-gradient-to-br from-teal-900 to-teal-800 rounded-lg p-4 shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-teal-800 bg-opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-teal-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-gray-400 text-sm font-medium">Verifications</h3>
            <div className="flex items-baseline">
              <p className="text-white text-2xl font-bold">{totalVerifications.toLocaleString()}</p>
              <p className="text-teal-300 text-sm ml-2">
                total
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Total STX Received */}
      <div className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-lg p-4 shadow">
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-purple-800 bg-opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-4">
            <h3 className="text-gray-400 text-sm font-medium">STX Received</h3>
            <div className="flex items-baseline">
              <p className="text-white text-2xl font-bold">156.32</p>
              <p className="text-purple-300 text-sm ml-2">
                tips
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentStats;