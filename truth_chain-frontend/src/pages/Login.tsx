import React from 'react';
import GradientBackground from '../components/ui/GradientBackground';
import LoginForm from '../components/Form/LoginForm';
import Logo from '../components/ui/Logo';

const LoginPage: React.FC = () => {
  return (
    <GradientBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mb-10 animate-float">
          <Logo size="large" className="animate-pulse-slow" />
        </div>
        
        <LoginForm />
        
        <div className="mt-8 text-center text-xs text-blue-200 opacity-70">
          <p>© 2025 TruthChain. All rights reserved.</p>
          <p className="mt-1">Built By Kairos Developers</p>
        </div>
      </div>
    </GradientBackground>
  );
};

export default LoginPage;