import React from 'react';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'large', className = '' }) => {
  const sizeClasses = {
    small: 'h-8',
    medium: 'h-12',
    large: 'h-16'
  };
  
  return (
    <a href="/" className={`flex items-center ${className}`}>
      <div className="relative">
        <div className={`${sizeClasses[size]} flex items-center`}>
          {/* Chain icon SVG */}
          <svg 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
            className={`${sizeClasses[size]} text-white`}
          >
            <path 
              d="M13.5 6L10.5 18M7.5 4L5.57 7.427C5.21131 8.146 5.03197 8.50549 4.92 8.89509C4.82014 9.24343 4.76598 9.60337 4.7586 9.96558C4.75 10.3743 4.75 10.7953 4.75 11.6373V12.3627C4.75 13.2047 4.75 13.6257 4.7586 14.0344C4.76598 14.3966 4.82014 14.7566 4.92 15.1049C5.03197 15.4945 5.21131 15.854 5.57 16.573L7.5 20M16.5 20L18.43 16.573C18.7887 15.854 18.968 15.4945 19.08 15.1049C19.1799 14.7566 19.234 14.3966 19.2414 14.0344C19.25 13.6257 19.25 13.2047 19.25 12.3627V11.6373C19.25 10.7953 19.25 10.3743 19.2414 9.96558C19.234 9.60337 19.1799 9.24343 19.08 8.89509C18.968 8.50549 18.7887 8.146 18.43 7.427L16.5 4" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
          
          {/* Text logo */}
          <div className="ml-2 flex flex-col">
            <span className="text-white font-bold tracking-wider text-2xl leading-tight">
              TruthChain
            </span>
            <span className="text-blue-200 text-xs tracking-wide">
              Verified on Stacks
            </span>
          </div>
        </div>
        
        {/* Glow effect */}
        <div className="absolute inset-0 bg-blue-500 blur-xl opacity-30 rounded-full -z-10"></div>
      </div>
    </a>
  );
};

export default Logo;