import React from 'react';
import { PieceType } from '../types/game';
import { Shield, Sparkles, Crosshair, Flame, Crown, Footprints } from 'lucide-react';

interface PieceIconProps {
  type: PieceType;
  color: string;
  className?: string;
  size?: number;
}

export const PieceIcon: React.FC<PieceIconProps> = ({
  type,
  color,
  className = '',
  size = 28,
}) => {
  // We use custom SVG silhouettes with clear distinct icons for both classical and new pieces
  // They are styled with high contrast outlines and subtle glow for clarity on mobile and desktop
  switch (type) {
    case 'king':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          {/* King Crown with Cross */}
          <path d="M12 2v3m-1.5-1.5h3" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M5 19h14v2H5z" />
          <path d="M6 16h12l-1-7-3 3-2-4-2 4-3-3z" />
        </svg>
      );

    case 'queen':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          {/* Queen Crown with 5 points */}
          <path d="M5 19h14v2H5z" />
          <path d="M6 16h12l1-8-3.5 3L12 5l-3.5 6L5 8z" />
          <circle cx="5" cy="8" r="1" fill={color} />
          <circle cx="8.5" cy="11" r="1" fill={color} />
          <circle cx="12" cy="5" r="1" fill={color} />
          <circle cx="15.5" cy="11" r="1" fill={color} />
          <circle cx="19" cy="8" r="1" fill={color} />
        </svg>
      );

    case 'rook':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          <path d="M5 20h14v2H5z" />
          <path d="M7 17h10l-1-8h-8z" />
          <path d="M5 5h3v3h2V5h4v3h2V5h3v4H5z" />
        </svg>
      );

    case 'bishop':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          <path d="M6 20h12v2H6z" />
          <path d="M12 4a5 5 0 0 0-5 5c0 3 2 5 2 8h6c0-3 2-5 2-8a5 5 0 0 0-5-5z" />
          <path d="M12 2v2M10 6l4 4" stroke="#0f172a" strokeWidth="1.5" />
        </svg>
      );

    case 'knight':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          <path d="M5 20h14v2H5z" />
          <path d="M7 17h9c0-3-1-5-1-6 0-3-2-6-5-6-2 0-3 2-4 3l-2 2 2 2c-2 1-3 3-3 5h4z" />
          <circle cx="10" cy="9" r="1" fill="#0f172a" />
        </svg>
      );

    case 'pawn':
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          <path d="M7 20h10v2H7z" />
          <path d="M8 17h8c0-3-2-5-2-7h-4c0 2-2 4-2 7z" />
          <circle cx="12" cy="7" r="3.5" />
        </svg>
      );

    // ===================================
    // NOVAS PEÇAS DO XADREZ 2
    // ===================================

    case 'goat': // CABRA (Chifres e agilidade nas montanhas)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          {/* Base */}
          <path d="M6 20h12v2H6z" />
          {/* Body & Head */}
          <path d="M8 17h8l-1-7c0-2-1-4-3-4s-3 2-3 4z" />
          {/* Curved Goat Horns */}
          <path
            d="M9 7C7 4 4 4 4 7c1 1 3 1 4 2M15 7c2-3 5-3 5 0-1 1-3 1-4 2"
            stroke="#0f172a"
            strokeWidth="1.7"
            strokeLinecap="round"
            fill="none"
          />
          {/* Goat beard */}
          <path d="M12 17l-1 2.5h2z" fill="#0f172a" />
          <circle cx="10" cy="11" r="0.8" fill="#0f172a" />
          <circle cx="14" cy="11" r="0.8" fill="#0f172a" />
        </svg>
      );

    case 'archmage': // ARQUIMAGO (Chapéu cônico místico e orbe de transmutação)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          <path d="M6 20h12v2H6z" />
          <path d="M8 17h8c0-3-1-5-1-6h-6c0 1-1 3-1 6z" />
          {/* Pointed Wizard Hat */}
          <path d="M4 11h16L13 2c-1-1-2 1-3 2z" />
          {/* Magic Star / Orb on the Hat */}
          <circle cx="12" cy="7" r="1.5" fill="#facc15" stroke="#0f172a" strokeWidth="0.8" />
        </svg>
      );

    case 'catapult': // CATAPULTA (Braço balístico de lançamento de longo alcance)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          {/* Chassis and Wheels */}
          <path d="M4 18h16v3H4z" />
          <circle cx="7" cy="19" r="2" fill="#334155" stroke="#0f172a" strokeWidth="1" />
          <circle cx="17" cy="19" r="2" fill="#334155" stroke="#0f172a" strokeWidth="1" />
          {/* Catapult frame and throwing arm */}
          <path d="M6 18l5-8h2l5 8" stroke="#0f172a" strokeWidth="1.5" fill="none" />
          <line x1="8" y1="18" x2="16" y2="7" stroke="#0f172a" strokeWidth="2.5" />
          {/* Cup/Basket with projectile */}
          <circle cx="17" cy="6" r="2.2" fill="#e11d48" stroke="#0f172a" strokeWidth="1" />
        </svg>
      );

    case 'dragon': // DRAGÃO (Cabeça com chifres, asas e respiração de fogo)
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={color}
          stroke="#0f172a"
          strokeWidth="1.5"
          className={`drop-shadow-sm ${className}`}
        >
          <path d="M6 20h12v2H6z" />
          {/* Dragon body with wings */}
          <path d="M8 18h8c0-3-1-5-2-7l3-3-4 1-2-5-2 5-4-1 3 3c-1 2-2 4-2 7z" />
          {/* Horns & snarl */}
          <path d="M10 5l-2-2m6 2l2-2" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="10" cy="10" r="1" fill="#f59e0b" />
          <circle cx="14" cy="10" r="1" fill="#f59e0b" />
        </svg>
      );

    default:
      return null;
  }
};

export const getPieceName = (type: PieceType): string => {
  switch (type) {
    case 'pawn': return 'Peão';
    case 'rook': return 'Torre';
    case 'knight': return 'Cavalo';
    case 'bishop': return 'Bispo';
    case 'queen': return 'Dama';
    case 'king': return 'Rei';
    case 'goat': return 'Cabra';
    case 'archmage': return 'Arquimago';
    case 'catapult': return 'Catapulta';
    case 'dragon': return 'Dragão';
  }
};

export const getPieceDescription = (type: PieceType): string => {
  switch (type) {
    case 'goat':
      return 'Move-se 2 casas na diagonal. Pula e pode permanecer em cima das Montanhas.';
    case 'archmage':
      return 'Move-se 1 casa em qualquer direção. Habilidade Especial: Permutar de lugar com peça aliada adjacente!';
    case 'catapult':
      return 'Move 1 casa para frente/lados. Habilidade Especial: Disparo balístico à distância em linha reta a 3 casas, eliminando o inimigo sem sair do lugar.';
    case 'dragon':
      return 'Move-se como Torre até 3 casas. Habilidade Especial: Voa por cima de 1 peça intermediária!';
    case 'pawn':
      return 'Avança em direção ao centro. Ao alcançar o centro do tabuleiro, é promovido a Dama!';
    case 'knight':
      return 'Movimento em L. Pula peças e montanhas, mas não pode aterrissar em montanhas.';
    case 'bishop':
      return 'Move-se nas diagonais. Bloqueado por montanhas e peças.';
    case 'rook':
      return 'Move-se em linhas retas. Bloqueado por montanhas e peças.';
    case 'queen':
      return 'Move-se em todas as direções. Bloqueada por montanhas.';
    case 'king':
      return 'Move-se 1 casa em qualquer direção. Proteja seu Rei para evitar Xeque-Mate!';
  }
};
