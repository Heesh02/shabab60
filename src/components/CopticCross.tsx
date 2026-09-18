import React from 'react';

interface CopticCrossProps {
  className?: string;
  size?: number;
  color?: string;
}

export const CopticCross: React.FC<CopticCrossProps> = ({ 
  className = 'w-6 h-6', 
  size = 24, 
  color = '#d4af37' 
}) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Coptic Orthodox Cross"
    >
      {/* Outer subtle glow circle */}
      <circle cx="50" cy="50" r="44" stroke={color} strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
      
      {/* Main Cross Beams */}
      <line x1="50" y1="14" x2="50" y2="86" stroke={color} strokeWidth="5" strokeLinecap="round" />
      <line x1="14" y1="50" x2="86" y2="50" stroke={color} strokeWidth="5" strokeLinecap="round" />

      {/* Decorative End Trefoils */}
      <circle cx="50" cy="14" r="3.5" fill={color} />
      <circle cx="50" cy="86" r="3.5" fill={color} />
      <circle cx="14" cy="50" r="3.5" fill={color} />
      <circle cx="86" cy="50" r="3.5" fill={color} />

      {/* 4 Quadrant Dots (representing the 4 Evangelists / Coptic traditional motif) */}
      <circle cx="34" cy="34" r="3.5" fill={color} />
      <circle cx="66" cy="34" r="3.5" fill={color} />
      <circle cx="34" cy="66" r="3.5" fill={color} />
      <circle cx="66" cy="66" r="3.5" fill={color} />

      {/* Central Gem */}
      <circle cx="50" cy="50" r="6" fill="#9b1b30" stroke={color} strokeWidth="1.5" />
    </svg>
  );
};
