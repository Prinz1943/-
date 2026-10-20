import React, { useState } from 'react';

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
  const [hasError, setHasError] = useState(false);
  const sealSrc = customUrl || '/assets/lopburi-seal.jpg';

  if (hasError) {
    // Secondary fallback to the direct uploaded asset path
    return (
      <img
        src="/assets/aistudio/S__14524511_6256f2d7.jpg"
        alt="ตราประจำจังหวัดลพบุรี"
        style={{ width: `${size}px`, height: `${size}px` }}
        className={`object-contain mx-auto select-none ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: `${size}px`, height: `${size}px` }}
      className={`relative mx-auto flex items-center justify-center select-none ${className}`}
    >
      <img
        src={sealSrc}
        alt="ตราประจำจังหวัดลพบุรี"
        style={{ width: `${size}px`, height: `${size}px` }}
        className="w-full h-full object-contain filter drop-shadow-xs"
        onError={() => setHasError(true)}
      />
    </div>
  );
};
