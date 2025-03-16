// src/components/Dashboard/DashboardHeader.tsx
import React, { useState } from 'react';

interface UserData {
  firstName: string;
  lastName: string;
  username: string;
  location: string;
  email: string;
  walletConnected: boolean;
  walletAddress: string;
  walletType: string;
  joinDate: string;
  verified: boolean;
}

interface DashboardHeaderProps {
  userData: UserData | null;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userData }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Mock notifications - in a real app, these would come from a backend
  const notifications = [
    {
      id: 1,
      message: 'Your content was successfully verified',
      time: '5 minutes ago',
      read: false,
    },
    {
      id: 2,
      message: 'Someone tipped your article 5 STX',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 3,
      message: 'Your wallet transaction was confirmed',
      time: '1 day ago',
      read: true,
    },
  ];

  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-700">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm">Welcome back, {userData?.firstName}</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:block relative">
            <input
              type="text"
              className="bg-gray-700 text-white rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          </div>

          {/* Notification bell */}
          <div className="relative">
            <button
              className="p-2 rounded-full text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* Dropdown notifications */}
            {showNotifications && (
              <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-2 px-3 border-b border-gray-700">
                  <h3 className="text-white font-medium">Notifications</h3>
                </div>
                <div className="overflow-y-auto max-h-96">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-700 hover:bg-gray-700 ${
                        !notification.read ? "bg-gray-700 bg-opacity-50" : ""
                      }`}
                    >
                      <p className="text-sm text-white">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="py-2 px-3 text-center">
                  <button className="text-sm text-blue-400 hover:text-blue-300">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Balance indicator */}
          <div className="hidden sm:flex items-center bg-gray-700 rounded-full px-4 py-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-blue-400 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-white font-medium">125.45 STX</span>
          </div>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              className="flex items-center text-white focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-600 to-teal-600 flex items-center justify-center text-white font-bold">
                {userData?.firstName?.charAt(0) || ''}
                {userData?.lastName?.charAt(0) || ''}
              </div>
            </button>

            {/* Dropdown menu */}
            {showProfileMenu && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1">
                  <a
                    href="#profile"
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    Your Profile
                  </a>
                  <a
                    href="#settings"
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    Settings
                  </a>
                  <a
                    href="#help"
                    className="block px-4 py-2 text-sm text-white hover:bg-gray-700"
                  >
                    Help & Support
                  </a>
                  <div className="border-t border-gray-700">
                    <a
                      href="/login"
                      className="block px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                      onClick={() => {
                        localStorage.removeItem('userData');
                      }}
                    >
                      Sign out
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;