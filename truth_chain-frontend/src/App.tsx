// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AuthContextProvider } from './context/AuthContext';
import GradientBackground from './components/ui/GradientBackground';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Home from './pages/HomePage';
import Navbar from './components/Navigation/Navbar';
import { Footer } from './components/Footer/Footer';
import SignUpPage from './pages/Signup';
import HowItWorks from './pages/HowItWorks';

const App: React.FC = () => {
  return (
    <AuthContextProvider>
      <AppProvider>
        <Routes>
          <Route path="/" element={
            <>
              <GradientBackground>
                <Navbar />
                <Home />
                <Footer />
              </GradientBackground>
            </>
          } />
          
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="*" element={<h1>Not Found</h1>} />
        </Routes>
      </AppProvider>
    </AuthContextProvider>
  );
};

export default App;