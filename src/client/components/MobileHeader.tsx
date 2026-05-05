import React from 'react';
import { Link } from 'react-router-dom';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  return (
    <header className="mobile-header" role="banner">
      <Link to="/" className="mobile-header-logo">
        The Body Remembers
      </Link>
      <button
        className="hamburger"
        onClick={onMenuClick}
        aria-label="Open navigation menu"
        aria-expanded={false}
      >
        <span />
        <span />
        <span />
      </button>
    </header>
  );
}
