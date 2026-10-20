import React from 'react';

interface LopburiEmblemProps {
  size?: number;
  className?: string;
  customUrl?: string;
}

export const LopburiEmblem: React.FC<LopburiEmblemProps> = ({
  size = 80,
  className = '',
  customUrl,
}) => {
  if (customUrl) {
    return (
      <img
        src={customUrl}
        alt="ตราประจำจังหวัดลพบุรี"
        style={{ width: `${size}px`, height: 'auto' }}
        className={`object-contain mx-auto ${className}`}
      />
    );
  }

  // Official emblem recreation: Phra Narai standing in front of Phra Prang Sam Yot with golden oval seal
  return (
    <div
      style={{ width: `${size}px`, height: `${size * 0.95}px` }}
      className={`relative mx-auto flex items-center justify-center select-none ${className}`}
    >
      <svg
        viewBox="0 0 200 190"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-sm"
      >
        <defs>
          <radialGradient id="goldGlow" cx="50%" cy="50%" r="50%" fx="40%" fy="30%">
            <stop offset="0%" stopColor="#FFF2B2" />
            <stop offset="45%" stopColor="#F5C242" />
            <stop offset="85%" stopColor="#C98B18" />
            <stop offset="100%" stopColor="#8C5807" />
          </radialGradient>
          <linearGradient id="innerSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E2A63B" />
            <stop offset="70%" stopColor="#C1831E" />
            <stop offset="100%" stopColor="#7E4C07" />
          </linearGradient>
          <linearGradient id="prangStone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#875317" />
            <stop offset="100%" stopColor="#4A2603" />
          </linearGradient>
          <linearGradient id="vishnuGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDD0" />
            <stop offset="60%" stopColor="#FFD700" />
            <stop offset="100%" stopColor="#B8860B" />
          </linearGradient>
        </defs>

        {/* Outer Oval Frame */}
        <ellipse cx="100" cy="95" rx="88" ry="84" fill="url(#goldGlow)" stroke="#683E04" strokeWidth="3" />
        
        {/* Ray flourishes around border */}
        <ellipse cx="100" cy="95" rx="81" ry="77" fill="none" stroke="#FFF7CC" strokeWidth="1.5" strokeDasharray="3 3" />
        <ellipse cx="100" cy="95" rx="76" ry="72" fill="url(#innerSky)" stroke="#522F02" strokeWidth="2" />

        {/* Phra Prang Sam Yot (3 Khmer Stone Spires) in background */}
        {/* Left Prang */}
        <g opacity="0.95">
          <path d="M 64 125 L 67 80 Q 72 65 76 60 Q 80 65 85 80 L 88 125 Z" fill="url(#prangStone)" stroke="#381D02" strokeWidth="1" />
          {/* tiers */}
          <line x1="68" y1="92" x2="84" y2="92" stroke="#B8860B" strokeWidth="1.2" />
          <line x1="70" y1="80" x2="82" y2="80" stroke="#B8860B" strokeWidth="1.2" />
          <line x1="73" y1="68" x2="79" y2="68" stroke="#B8860B" strokeWidth="1" />
          <circle cx="76" cy="58" r="2" fill="#FFD700" />
        </g>

        {/* Right Prang */}
        <g opacity="0.95">
          <path d="M 112 125 L 115 80 Q 120 65 124 60 Q 128 65 133 80 L 136 125 Z" fill="url(#prangStone)" stroke="#381D02" strokeWidth="1" />
          {/* tiers */}
          <line x1="116" y1="92" x2="132" y2="92" stroke="#B8860B" strokeWidth="1.2" />
          <line x1="118" y1="80" x2="130" y2="80" stroke="#B8860B" strokeWidth="1.2" />
          <line x1="121" y1="68" x2="127" y2="68" stroke="#B8860B" strokeWidth="1" />
          <circle cx="124" cy="58" r="2" fill="#FFD700" />
        </g>

        {/* Central Prang (taller) */}
        <g>
          <path d="M 87 125 L 90 65 Q 98 40 100 35 Q 102 40 110 65 L 113 125 Z" fill="url(#prangStone)" stroke="#2B1501" strokeWidth="1.2" />
          <line x1="90" y1="95" x2="110" y2="95" stroke="#F5C242" strokeWidth="1.4" />
          <line x1="92" y1="80" x2="108" y2="80" stroke="#F5C242" strokeWidth="1.4" />
          <line x1="94" y1="65" x2="106" y2="65" stroke="#F5C242" strokeWidth="1.2" />
          <line x1="97" y1="50" x2="103" y2="50" stroke="#F5C242" strokeWidth="1" />
          <circle cx="100" cy="33" r="3" fill="#FFE57F" stroke="#8C5807" strokeWidth="0.8" />
        </g>

        {/* Phra Narai (Vishnu 4-armed) silhouette in center foreground */}
        {/* Aura halo */}
        <ellipse cx="100" cy="62" rx="13" ry="15" fill="#FFF9C4" opacity="0.6" />
        <circle cx="100" cy="62" r="10" stroke="#FFE082" strokeWidth="1" fill="#FFF8E1" />

        {/* Arms and weapons: Chakra (discus), Conch (Sankha), Mace (Gada), Lotus */}
        {/* Upper Left Arm holding Chakra */}
        <path d="M 97 73 Q 86 65 83 55" stroke="#FFDF00" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="82" cy="52" r="5" fill="#FFE57F" stroke="#7A4A00" strokeWidth="1" strokeDasharray="1 1" />

        {/* Upper Right Arm holding Conch */}
        <path d="M 103 73 Q 114 65 117 55" stroke="#FFDF00" strokeWidth="2.5" strokeLinecap="round" />
        <ellipse cx="118" cy="52" rx="3.5" ry="5.5" fill="#FFFFFF" stroke="#7A4A00" strokeWidth="0.9" />

        {/* Lower Left Arm holding Gada/Bow */}
        <path d="M 97 80 Q 86 85 86 100" stroke="#FFDF00" strokeWidth="2.3" strokeLinecap="round" />
        <line x1="86" y1="95" x2="86" y2="120" stroke="#F5C242" strokeWidth="2" strokeLinecap="round" />

        {/* Lower Right Arm (Varada / blessing mudra) */}
        <path d="M 103 80 Q 114 85 114 96" stroke="#FFDF00" strokeWidth="2.3" strokeLinecap="round" />

        {/* Head with Thai Chada Crown */}
        <path d="M 100 48 L 98 56 L 102 56 Z" fill="#FFE082" stroke="#8C5807" strokeWidth="0.8" />
        <circle cx="100" cy="60" r="5" fill="url(#vishnuGold)" />
        
        {/* Torso & Robes */}
        <path d="M 96 66 L 95 82 L 105 82 L 104 66 Z" fill="url(#vishnuGold)" stroke="#8C5807" strokeWidth="1" />
        {/* Royal Chong Kraben garment */}
        <path d="M 94 82 L 91 106 Q 100 114 109 106 L 106 82 Z" fill="#E65100" stroke="#4A1800" strokeWidth="1" />
        {/* Standing Legs on Lotus Pedestal */}
        <line x1="96" y1="106" x2="96" y2="124" stroke="url(#vishnuGold)" strokeWidth="3" strokeLinecap="round" />
        <line x1="104" y1="106" x2="104" y2="124" stroke="url(#vishnuGold)" strokeWidth="3" strokeLinecap="round" />

        {/* Lotus Pedestal base */}
        <ellipse cx="100" cy="126" rx="20" ry="5" fill="#FFE082" stroke="#7E4C07" strokeWidth="1" />

        {/* Bottom Banner with Thai script 'จังหวัดลพบุรี' */}
        <g>
          {/* Ribbon */}
          <path
            d="M 40 148 Q 100 138 160 148 L 155 166 Q 100 156 45 166 Z"
            fill="#1E5E28"
            stroke="#C98B18"
            strokeWidth="1.8"
          />
          {/* Ribbon ends */}
          <path d="M 40 148 L 32 155 L 45 166 Z" fill="#13421B" stroke="#C98B18" strokeWidth="1" />
          <path d="M 160 148 L 168 155 L 155 166 Z" fill="#13421B" stroke="#C98B18" strokeWidth="1" />
          
          {/* Text: จังหวัดลพบุรี */}
          <text
            x="100"
            y="159"
            fill="#FFF59D"
            fontSize="10.5"
            fontWeight="bold"
            fontFamily="'Sarabun', sans-serif"
            textAnchor="middle"
            letterSpacing="0.8"
          >
            จังหวัดลพบุรี
          </text>
        </g>
      </svg>
    </div>
  );
};
