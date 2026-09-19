import React from 'react';
import { Mountain } from '../types/game';

interface MountainSquareProps {
  sizePx: number;
}

export const MountainSquare: React.FC<MountainSquareProps> = ({ sizePx }) => {
  return (
    <div
      className="w-full h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 shadow-inner select-none pointer-events-none"
      title="Montanha - Apenas a Cabra pode entrar ou atravessar. O Cavalo pode pular por cima."
    >
      {/* Mountain Peak Vector Silhouette */}
      <svg
        viewBox="0 0 40 40"
        className="w-full h-full opacity-90"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background Mountain peak */}
        <polygon points="12,36 24,14 36,36" fill="#44403c" stroke="#292524" strokeWidth="1" />
        {/* Snowcap on secondary peak */}
        <polygon points="21,20 24,14 27,20 25,18 23,21" fill="#e2e8f0" opacity="0.8" />

        {/* Foreground Primary Mountain Peak */}
        <polygon points="4,38 17,8 30,38" fill="#57534e" stroke="#1c1917" strokeWidth="1.2" />
        {/* Snowcap on main peak */}
        <polygon points="14,15 17,8 20,15 18,13 16,16" fill="#f8fafc" />

        {/* Ridges & Shadows */}
        <line x1="17" y1="8" x2="19" y2="38" stroke="#292524" strokeWidth="1" strokeOpacity="0.6" />
      </svg>

      {/* Tiny Mountain Indicator Tag */}
      <span className="absolute bottom-0.5 right-1 text-[8px] font-mono text-stone-300 font-bold opacity-60">
        ▲
      </span>
    </div>
  );
};
