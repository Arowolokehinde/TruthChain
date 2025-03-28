// src/App.tsx
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import GradientBackground from './components/ui/GradientBackground';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Home from './pages/HomePage';
import { AuthContextProvider } from './context/AuthContext';
import Navbar from './components/Navigation/Navbar';
import  Footer  from './components/Footer/Footer';
import SignUpPage from './pages/Signup';

const App: React.FC = () => {
  return (
      <AuthContextProvider>
        <AppProvider>
          <GradientBackground>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUpPage />} />
              {/* Add more routes as you create the components */}
            </Routes>
            <Footer />
          </GradientBackground>
        </AppProvider>
      </AuthContextProvider>
  );
};

export default App;