import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { Menu, X } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = (): void => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav 
      className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gray-900 bg-opacity-80 backdrop-blur-md shadow-md py-2' 
          : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-6 flex justify-between items-center">
        <Logo size="small" />

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-blue-200 hover:text-white transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="text-blue-200 hover:text-white transition-colors">
            How It Works
          </a>
          <a href="#for-creators" className="text-blue-200 hover:text-white transition-colors">
            For Creators
          </a>
          <a href="#for-consumers" className="text-blue-200 hover:text-white transition-colors">
            For Consumers
          </a>
        </div>

        {/* Authentication Links */}
        <div className="hidden md:flex items-center space-x-4">
          <Link 
            to="/login" 
            className="px-4 py-2 rounded text-blue-200 border border-blue-400 border-opacity-40 hover:bg-blue-900 hover:bg-opacity-30 transition-colors"
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded text-white transition-colors"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-gray-900 bg-opacity-95 backdrop-blur-md p-4">
          <div className="flex flex-col space-y-4">
            <a 
              href="#features" 
              className="text-blue-200 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              className="text-blue-200 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              How It Works
            </a>
            <a 
              href="#for-creators" 
              className="text-blue-200 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              For Creators
            </a>
            <a 
              href="#for-consumers" 
              className="text-blue-200 hover:text-white transition-colors py-2"
              onClick={() => setIsMenuOpen(false)}
            >
              For Consumers
            </a>
            <div className="border-t border-gray-700 pt-4 flex flex-col space-y-3">
              <Link 
                to="/login" 
                className="px-4 py-2 text-blue-200 text-center rounded border border-blue-400 border-opacity-30 hover:bg-blue-900 hover:bg-opacity-30 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-teal-600 text-white text-center rounded hover:from-blue-700 hover:to-teal-700 transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;