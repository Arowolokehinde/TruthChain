import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';
import { Menu, X } from 'lucide-react';

// Optional interface for navigation items
interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Example navigation configuration
  const navigationItems: NavItem[] = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'For Creators', href: '#for-creators' },
    { label: 'For Consumers', href: '#for-consumers' },
    { label: 'Join Waitlist', href: '/waitlist' }
  ];

  useEffect(() => {
    const handleScroll = (): void => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    // Close menu when clicking outside
    const handleClickOutside = (event: MouseEvent): void => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
        setActiveDropdown(null);
      }
    };

    // Close menu when window resizes to desktop size
    const handleResize = (): void => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // const toggleDropdown = (label: string): void => {
  //   setActiveDropdown(activeDropdown === label ? null : label);
  // };

  return (
    <nav 
      ref={navRef}
      className={`fixed  w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-gray-900 bg-opacity-90 backdrop-blur-md shadow-lg py-2' 
          : 'bg-transparent py-4'
      }`}
      aria-label="Main navigation"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center">
          <Logo size="small" />
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-4">
          {navigationItems.map((item) => (
            <a 
              key={item.label}
              href={item.href} 
              className="px-3 py-2 text-sm lg:text-base text-blue-200 hover:text-white transition-colors rounded-md hover:bg-blue-900 hover:bg-opacity-30"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Authentication Links */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
          <Link 
            to="/login" 
            className="px-3 lg:px-4 py-1.5 lg:py-2 rounded text-blue-200 border border-blue-400 border-opacity-40 hover:bg-blue-900 hover:bg-opacity-30 transition-colors text-sm lg:text-base"
          >
            Login
          </Link>
          <Link 
            to="/signup" 
            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 rounded text-white transition-colors text-sm lg:text-base"
          >
            Sign Up
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 rounded p-1"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Animated Slide Down */}
      <div 
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          isMenuOpen 
            ? 'max-h-screen opacity-100' 
            : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-gray-900 bg-opacity-95 backdrop-blur-md p-4 shadow-lg">
          <div className="flex flex-col space-y-1">
            {navigationItems.map((item) => (
              <a 
                key={item.label}
                href={item.href} 
                className="text-blue-200 hover:text-white transition-colors py-3 px-2 rounded-md hover:bg-blue-900 hover:bg-opacity-30"
                onClick={() => setIsMenuOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <div className="border-t border-gray-700 mt-2 pt-4 flex flex-col space-y-3">
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
      </div>
    </nav>
  );
};

export default Navbar;