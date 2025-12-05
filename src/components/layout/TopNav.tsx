import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../ui/Logo';

const TopNav: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-surface/98 backdrop-blur-md supports-[backdrop-filter]:bg-surface/90 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link to="/" className="group">
            <Logo size="sm" showText={true} />
          </Link>

          {/* Utility Area */}
          <div className="flex items-center gap-4">
            <a 
              href="#help" 
              aria-label="Help"
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-accent/10 transition-colors"
            >
              Help
            </a>
            <div className="h-6 w-px bg-border" />
            <button
              className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md hover:bg-accent/10 transition-colors"
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default TopNav;

