"use client";

import React from 'react';

interface SofiaLogoProps {
  className?: string;
  size?: number;
  color?: string;
}

const SofiaLogo: React.FC<SofiaLogoProps> = ({ 
  className = "", 
  size = 24, 
  color = "currentColor" 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Base circular shape */}
      <circle cx="12" cy="12" r="10" strokeOpacity="0.4" />
      
      {/* Inner network pattern */}
      <path d="M12 7v2" />
      <path d="M12 15v2" />
      <path d="M7 12h2" />
      <path d="M15 12h2" />
      
      {/* Diagonal connections */}
      <path d="M8.5 8.5l1.5 1.5" />
      <path d="M14 14l1.5 1.5" />
      <path d="M8.5 15.5l1.5-1.5" />
      <path d="M14 10l1.5-1.5" />
      
      {/* Central node */}
      <circle cx="12" cy="12" r="2" fill={color} strokeOpacity="1" />
      
      {/* Pulse effect */}
      <circle cx="12" cy="12" r="4" strokeOpacity="0.6" strokeDasharray="1,1" />
      
      {/* Sparkle points */}
      <circle cx="12" cy="5" r="0.5" fill={color} />
      <circle cx="19" cy="12" r="0.5" fill={color} />
      <circle cx="12" cy="19" r="0.5" fill={color} />
      <circle cx="5" cy="12" r="0.5" fill={color} />
    </svg>
  );
};

export default SofiaLogo;
