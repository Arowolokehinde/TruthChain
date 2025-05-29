import React from 'react';

import HeroSection from '@/components/Landing/HeroSection';
import FeaturesSection from '@/components/Landing/FeaturesSection';
import HowItWorksSection from '@/components/Landing/HowItWorksSection';
import ForCreatorsSection from '@/components/Landing/ForCreatorsSection';
import ForConsumersSection from '@/components/Landing/ForConsumersSection';
import CTASection from '@/components/Landing/CTASection';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* For Creators Section */}
      <ForCreatorsSection />

      {/* For Consumers Section */}
      <ForConsumersSection />

      {/* CTA Section */}
      <CTASection />

      {/* Footer */}
      {/* <Footer /> */}
    </div>
  );
};

export default Home;





