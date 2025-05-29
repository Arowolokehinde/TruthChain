import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import GradientBackground from './components/ui/GradientBackground';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Home from './pages/HomePage';
import { AuthContextProvider } from './context/AuthContext';
import Navbar from './components/Navigation/Navbar';
import  Footer  from './components/Footer/Footer';
import SignUpPage from './pages/Signup';

const AppContent: React.FC = () => {
  const location = useLocation();
  const showNavbar = location.pathname === '/';

  return (
    <GradientBackground>
      {showNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUpPage />} />
        {/* Add more routes as you create the components */}
      </Routes>
      <Footer />
    </GradientBackground>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthContextProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthContextProvider>
    </BrowserRouter>
  );
};

export default App;
