import React from 'react';

import GradientBackground from '@/components/ui/GradientBackground';
import HeroSection from '@/components/Landing/HeroSection';
import FeaturesSection from '@/components/Landing/FeaturesSection';
import HowItWorksSection from '@/components/Landing/HowItWorksSection';
import ForCreatorsSection from '@/components/Landing/ForCreatorsSection';
import ForConsumersSection from '@/components/Landing/ForConsumersSection';
import CTASection from '@/components/Landing/CTASection';
import Footer from '@/components/Footer/Footer';
import Navbar from '@/components/Navigation/Navbar';

const Home: React.FC = () => {
  return (
    <GradientBackground>
      <div className="min-h-screen">

        {/* Navigation */}
        <Navbar />

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
    </GradientBackground>
  );
};

export default Home;





