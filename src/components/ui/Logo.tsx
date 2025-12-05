import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md', showText = true }) => {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Professional SVG Logo */}
      <div className={`${sizeClasses[size]} flex-shrink-0`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Outer Circle - Voting Booth */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="url(#gradient1)"
            stroke="url(#gradient2)"
            strokeWidth="3"
          />
          {/* Inner Circle - Ballot Box */}
          <circle
            cx="50"
            cy="50"
            r="30"
            fill="url(#gradient3)"
            opacity="0.9"
          />
          {/* Checkmark - Vote Cast */}
          <path
            d="M35 50 L45 60 L65 40"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#7c3aed" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      
      {/* Text */}
      {showText && (
        <div className="flex flex-col">
          <span className={`${textSizes[size]} font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight`}>
            E-LONDA
          </span>
          <span className="text-xs text-muted-foreground leading-tight hidden sm:block">
            Secure Digital Voting
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;




