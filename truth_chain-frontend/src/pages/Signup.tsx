import React from 'react';
import GradientBackground from '../components/ui/GradientBackground';
import SignupForm from '../components/Form/SignupForm';
import Logo from '../components/ui/Logo';

const SignUpPage: React.FC = () => {
  return (
    <GradientBackground>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="mb-10 animate-float">
          <Logo size="large" className="animate-pulse-slow" />
        </div>
        
        <SignupForm />
        
        <div className="mt-8 text-center text-xs text-blue-200 opacity-70">
          <p>© 2025 TruthChain. All rights reserved.</p>
          <p className="mt-1">Powered by Stacks Blockchain</p>
        </div>
      </div>
    </GradientBackground>
  );
};

export default SignUpPage;