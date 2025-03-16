// src/components/Dashboard/ContentListFilters.tsx
import React from 'react';

interface ContentListFiltersProps {
  filter: string;
  setFilter: (filter: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortMethod: string;
  setSortMethod: (method: string) => void;
}

const ContentListFilters: React.FC<ContentListFiltersProps> = ({
  filter,
  setFilter,
  searchQuery,
  setSearchQuery,
  sortMethod,
  setSortMethod,
}) => {
  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Content' },
    { value: 'active', label: 'Active' },
    { value: 'revoked', label: 'Revoked' },
    { value: 'article', label: 'Articles' },
    { value: 'image', label: 'Images' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'document', label: 'Documents' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'views-desc', label: 'Most Views' },
    { value: 'verifications-desc', label: 'Most Verifications' },
  ];

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:space-y-0 md:space-x-4">
        {/* Search input */}
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            placeholder="Search content..."
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
              onClick={() => setSearchQuery('')}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Filter dropdown */}
        <div className="flex-shrink-0">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
            aria-label="Filter content"
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort dropdown */}
        <div className="flex-shrink-0">
          <select
            value={sortMethod}
            onChange={(e) => setSortMethod(e.target.value)}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 appearance-none"
            aria-label="Sort content"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mt-3">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            className={`px-2 py-1 text-xs rounded-full ${
              filter === option.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
            onClick={() => setFilter(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ContentListFilters;