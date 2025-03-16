// src/components/Dashboard/ProfilePanel.tsx
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

interface ProfilePanelProps {
  userData: UserData | null;
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ userData }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    firstName: userData?.firstName || '',
    lastName: userData?.lastName || '',
    username: userData?.username || '',
    location: userData?.location || '',
    email: userData?.email || '',
    bio: '',
    twitter: '',
    website: ''
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSave = () => {
    setIsSaving(true);
    
    // Simulate API call with delay
    setTimeout(() => {
      // In a real app, we would update userData in state/context
      localStorage.setItem('userData', JSON.stringify({
        ...userData,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        location: formData.location,
        email: formData.email
      }));
      
      setIsSaving(false);
      setIsEditing(false);
    }, 1500);
  };
  
  if (!userData) {
    return (
      <div className="bg-gray-800 rounded-lg shadow-lg p-6 flex items-center justify-center h-64">
        <p className="text-gray-400">User data not available</p>
      </div>
    );
  }
  
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return 'Invalid date';
    }
  };
  
  return (
    <div className="bg-gray-800 rounded-lg shadow-lg">
      {/* Profile header */}
      <div className="relative">
        {/* Cover image */}
        <div className="h-40 bg-gradient-to-r from-blue-900 to-teal-900 rounded-t-lg"></div>
        
        {/* Profile picture and basic info */}
        <div className="px-6">
          <div className="flex flex-col sm:flex-row sm:items-end -mt-16">
            <div className="w-32 h-32 rounded-full border-4 border-gray-800 bg-gray-700 overflow-hidden">
              <div className="h-full w-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-teal-600 text-white text-3xl font-bold">
                {userData.firstName.charAt(0)}{userData.lastName.charAt(0)}
              </div>
            </div>
            
            <div className="mt-4 sm:mt-0 sm:ml-4 sm:flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    {userData.firstName} {userData.lastName}
                  </h1>
                  <p className="text-blue-400">@{userData.username}</p>
                </div>
                
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Profile
                  </button>
                )}
              </div>
              
              <div className="mt-2 flex flex-wrap text-sm text-gray-400">
                <div className="flex items-center mr-4 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {userData.location}
                </div>
                <div className="flex items-center mr-4 mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Joined {formatDate(userData.joinDate)}
                </div>
                <div className="flex items-center mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  {userData.verified ? 'Verified Creator' : 'Unverified'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Profile main content */}
      <div className="p-6">
        {isEditing ? (
          /* Edit form */
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-blue-300 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-blue-300 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-blue-300 mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-blue-300 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-blue-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label htmlFor="bio" className="block text-sm font-medium text-blue-300 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 resize-none"
                />
                <p className="text-gray-400 text-xs mt-1">
                  Brief description of yourself as a content creator
                </p>
              </div>
              
              <div>
                <label htmlFor="twitter" className="block text-sm font-medium text-blue-300 mb-1">
                  Twitter
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-400">@</span>
                  </div>
                  <input
                    type="text"
                    id="twitter"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleInputChange}
                    className="w-full pl-8 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    placeholder="username"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="website" className="block text-sm font-medium text-blue-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            </div>
          </div>
        ) : (
          /* Profile info */
          <div className="space-y-6">
            {/* Wallet info */}
            <div className="bg-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-medium text-white mb-3">Wallet Information</h2>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400 text-sm">Wallet Type:</span>
                  <span className="text-white ml-2">{userData.walletType}</span>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Wallet Address:</span>
                  <div className="flex items-center mt-1">
                    <span className="text-white font-mono text-sm break-all">{userData.walletAddress}</span>
                    <button className="ml-2 text-blue-400 hover:text-blue-300 focus:outline-none">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-gray-400 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Verified on Blockchain
                  </span>
                  <a href="#" className="text-sm text-blue-400 hover:text-blue-300">
                    View on Explorer
                  </a>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">6</div>
                <div className="text-sm text-gray-400">Content Pieces</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">4,389</div>
                <div className="text-sm text-gray-400">Total Views</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">552</div>
                <div className="text-sm text-gray-400">Verifications</div>
              </div>
              <div className="bg-gray-700 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-white">156.32</div>
                <div className="text-sm text-gray-400">STX Received</div>
              </div>
            </div>
            
            {/* Verification badge */}
            <div className="bg-gradient-to-r from-blue-900 to-teal-900 rounded-lg p-5">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div className="ml-4">
                  <h3 className="text-xl font-semibold text-white">Verified Content Creator</h3>
                  <p className="text-blue-300">
                    Your profile has been verified on the TruthChain network.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex space-x-3">
                <button className="px-3 py-1 bg-teal-700 text-white rounded hover:bg-teal-600 focus:outline-none text-sm">
                  Get Verification Badge
                </button>
                <button className="px-3 py-1 bg-blue-700 text-white rounded hover:bg-blue-600 focus:outline-none text-sm">
                  Embed on Website
                </button>
              </div>
            </div>
            
            {/* Security settings */}
            <div>
              <h2 className="text-lg font-medium text-white mb-3">Security</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                  <div>
                    <h3 className="text-white font-medium">Change Password</h3>
                    <p className="text-gray-400 text-sm">Update your account password</p>
                  </div>
                  <button className="px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-600 focus:outline-none">
                    Update
                  </button>
                </div>
                <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                  <div>
                    <h3 className="text-white font-medium">Two-Factor Authentication</h3>
                    <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                  </div>
                  <button className="px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-600 focus:outline-none">
                    Enable
                  </button>
                </div>
                <div className="flex items-center justify-between bg-gray-700 rounded-lg p-4">
                  <div>
                    <h3 className="text-white font-medium">Connected Applications</h3>
                    <p className="text-gray-400 text-sm">Manage apps that have access to your account</p>
                  </div>
                  <button className="px-3 py-1 border border-gray-600 text-gray-300 rounded hover:bg-gray-600 focus:outline-none">
                    Manage
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePanel;