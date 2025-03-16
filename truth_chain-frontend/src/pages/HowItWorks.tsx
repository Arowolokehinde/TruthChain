import React from 'react';
import { Link } from 'react-router-dom';
// import Layout from '../components/layout/Layout';

interface Step {
  number: number;
  title: string;
  description: string;
}

const HowItWorks: React.FC = () => {
  const steps: Step[] = [
    {
      number: 1,
      title: "Create Content",
      description: "Upload your digital content to our platform."
    },
    {
      number: 2,
      title: "Generate Hash",
      description: "Our system creates a unique SHA-256 fingerprint of your content."
    },
    {
      number: 3,
      title: "Sign & Register",
      description: "Sign with your Stacks wallet and register on the blockchain."
    },
    {
      number: 4,
      title: "Display Badge",
      description: "Add verification badges to your content that anyone can verify."
    }
  ];

  const technicalDetails = [
    {
      title: "Content Hashing",
      description: "Your content is processed through a SHA-256 algorithm to generate a unique fingerprint that represents your digital content without revealing the content itself."
    },
    {
      title: "Blockchain Registration",
      description: "The hash of your content is stored on the Stacks blockchain, providing an immutable record of existence and ownership tied to your wallet address."
    },
    {
      title: "Timestamp Verification",
      description: "Every registration includes a blockchain timestamp that proves when the content was registered, establishing provenance."
    },
    {
      title: "Decentralized Verification",
      description: "Anyone can verify the authenticity of your content by comparing the hash of the content with what's stored on the blockchain."
    }
  ];

  return (
    <>
      <div className="bg-gradient-to-b from-blue-900 to-black min-h-screen">
        {/* Hero Section */}
        <div className="py-20 px-6 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            How TruthChain Works
          </h1>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Secure your content authenticity through blockchain verification in four simple steps
          </p>
        </div>
        
        {/* Steps Section */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">The Process</h2>
            
            <div className="grid md:grid-cols-4 gap-8">
              {steps.map((step) => (
                <div key={step.number} className="text-center bg-blue-900/30 p-8 rounded-xl backdrop-blur-sm shadow-lg hover:shadow-blue-500/20 transition duration-300">
                  <div className="bg-gradient-to-r from-blue-600 to-teal-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{step.title}</h3>
                  <p className="text-blue-200">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Technical Details Section */}
        <section id="technical-details" className="py-20 bg-blue-950/50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Technical Details</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {technicalDetails.map((detail, index) => (
                <div key={index} className="bg-blue-900/20 p-6 rounded-xl backdrop-blur-sm border border-blue-700/30 shadow-lg hover:shadow-blue-500/20 transition duration-300">
                  <h3 className="text-xl font-bold text-white mb-4">{detail.title}</h3>
                  <p className="text-blue-200">
                    {detail.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section id="faq" className="py-20">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">Frequently Asked Questions</h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-blue-900/30 p-6 rounded-xl backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-2">How secure is the verification process?</h3>
                <p className="text-blue-200">
                  Our verification uses SHA-256 cryptographic hashing and the Stacks blockchain for immutable storage, making it extremely secure and tamper-proof.
                </p>
              </div>
              
              <div className="bg-blue-900/30 p-6 rounded-xl backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-2">What types of content can I verify?</h3>
                <p className="text-blue-200">
                  Any digital content can be verified - documents, images, videos, audio files, code, and more. If it can be represented digitally, it can be hashed and verified.
                </p>
              </div>
              
              <div className="bg-blue-900/30 p-6 rounded-xl backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-2">Does my content get uploaded to the blockchain?</h3>
                <p className="text-blue-200">
                  No. Only the cryptographic hash of your content is stored on the blockchain, not the content itself. This protects your privacy while still providing verification.
                </p>
              </div>
              
              <div className="bg-blue-900/30 p-6 rounded-xl backdrop-blur-sm">
                <h3 className="text-xl font-bold text-white mb-2">What blockchain does TruthChain use?</h3>
                <p className="text-blue-200">
                  TruthChain uses the Stacks blockchain, which leverages Bitcoin's security while enabling smart contracts and decentralized applications.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 text-center">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">Ready to Verify Your Content?</h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto mb-10">
              Start protecting your digital content with blockchain verification today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/register" 
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded-lg font-medium text-white inline-flex items-center justify-center"
              >
                Register Content
              </Link>
              <Link 
                to="/verify" 
                className="px-8 py-4 bg-blue-900/50 hover:bg-blue-800 border border-blue-700 rounded-lg font-medium text-white inline-flex items-center justify-center"
              >
                Verify Content
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default HowItWorks;