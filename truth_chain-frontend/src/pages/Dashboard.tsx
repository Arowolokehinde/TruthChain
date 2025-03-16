import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import ContentRegistrationPanel from '../components/Dashboard/ContentRegistrationPanel';
import ContentListPanel from '../components/Dashboard/ContentListPanel';
import ContentVerificationPanel from '../components/Dashboard/ContentVerificationPanel';
import ProfilePanel from '../components/Dashboard/ProfilePanel';
import TipCreatorPanel from '../components/Dashboard/TipCreatorPanel';
import ContentAnalyticsPanel from '../components/Dashboard/ContentAnalyticsPanel';
import BlockchainTransactionsPanel from '../components/Dashboard/BlockchainTransactionsPanel';

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

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentPanel, setCurrentPanel] = useState<string>('dashboard');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    // Check if user is logged in by looking for userData in localStorage
    const storedUserData = localStorage.getItem('userData');
    
    if (!storedUserData) {
      // Redirect to login if no user data found
      navigate('/login');
      return; // Don't continue with the rest of the effect
    }
    
    try {
      const parsedUserData = JSON.parse(storedUserData);
      setUserData(parsedUserData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error parsing user data:', error);
      // Redirect to login if data is corrupt
      navigate('/login');
      return; // Don't continue with the rest of the effect
    }
    
    // Only set loading to false if authentication is successful
    setIsLoading(false);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated || !userData) {
    return null;
  }

  const renderCurrentPanel = () => {
    switch (currentPanel) {
      case 'dashboard':
        return <ContentListPanel />;
      case 'register':
        return <ContentRegistrationPanel />;
      case 'verify':
        return <ContentVerificationPanel />;
      case 'profile':
        return <ProfilePanel userData={userData} />;
      case 'tip':
        return <TipCreatorPanel />;
      case 'analytics':
        return <ContentAnalyticsPanel />;
      case 'transactions':
        return <BlockchainTransactionsPanel />;
      default:
        return <ContentListPanel />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar */}
      <Sidebar 
        currentPanel={currentPanel}
        setCurrentPanel={setCurrentPanel}
        userData={userData}
      />
      
      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <DashboardHeader userData={userData} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-gray-800">
          <div className="container mx-auto">
            {renderCurrentPanel()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;