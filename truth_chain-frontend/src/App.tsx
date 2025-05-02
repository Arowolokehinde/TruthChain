import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthContextProvider } from './context/AuthContext';
import GradientBackground from './components/ui/GradientBackground';
import Navbar from './components/Navigation/Navbar';
import Footer from './components/Footer/Footer';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Home from './pages/HomePage';
import SignUpPage from './pages/Signup';
import WaitList from './pages/WaitList';

const App: React.FC = () => {
  const location = useLocation();  // Get the current route

  const isDashboard = location.pathname === '/dashboard';  // Check if it's the dashboard route

  return (
    <AuthContextProvider>
      <AppProvider>
        {!isDashboard ? (
          <GradientBackground>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/WaitList" element={<WaitList />} />
            </Routes>
            <Footer />
          </GradientBackground>
        ) : (
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
          </Routes>
        )}
      </AppProvider>
    </AuthContextProvider>
  );
};

export default App;
