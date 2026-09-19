import { PieceType } from '../types/game';

// Generates high-contrast, scalable SVG markup for all classic and custom pieces
export function getPieceSvg(type: PieceType, color: string, size = 26): string {
  const stroke = '#0f172a';
  const strokeWidth = '1.5';

  switch (type) {
    case 'king':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M12 2v3m-1.5-1.5h3" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" />
          <path d="M5 19h14v2H5z" />
          <path d="M6 16h12l-1-7-3 3-2-4-2 4-3-3z" />
        </svg>
      `;

    case 'queen':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M5 19h14v2H5z" />
          <path d="M6 16h12l1-8-3.5 3L12 5l-3.5 6L5 8z" />
          <circle cx="5" cy="8" r="1" fill="${color}" />
          <circle cx="8.5" cy="11" r="1" fill="${color}" />
          <circle cx="12" cy="5" r="1" fill="${color}" />
          <circle cx="15.5" cy="11" r="1" fill="${color}" />
          <circle cx="19" cy="8" r="1" fill="${color}" />
        </svg>
      `;

    case 'rook':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M5 20h14v2H5z" />
          <path d="M7 17h10l-1-8h-8z" />
          <path d="M5 5h3v3h2V5h4v3h2V5h3v4H5z" />
        </svg>
      `;

    case 'bishop':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M6 20h12v2H6z" />
          <path d="M12 4a5 5 0 0 0-5 5c0 3 2 5 2 8h6c0-3 2-5 2-8a5 5 0 0 0-5-5z" />
          <path d="M12 2v2M10 6l4 4" stroke="${stroke}" stroke-width="1.5" />
        </svg>
      `;

    case 'knight':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M5 20h14v2H5z" />
          <path d="M7 17h9c0-3-1-5-1-6 0-3-2-6-5-6-2 0-3 2-4 3l-2 2 2 2c-2 1-3 3-3 5h4z" />
          <circle cx="10" cy="9" r="1" fill="#0f172a" />
        </svg>
      `;

    case 'pawn':
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M7 20h10v2H7z" />
          <path d="M8 17h8c0-3-2-5-2-7h-4c0 2-2 4-2 7z" />
          <circle cx="12" cy="7" r="3.5" />
        </svg>
      `;

    case 'goat':
      // Cabra: Chifres curvos e perfil ágil
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M6 20h12v2H6z" />
          <path d="M8 17h8l-1-7c0-2-1-4-3-4s-3 2-3 4z" />
          <path d="M9 7C7 4 4 4 4 7c1 1 3 1 4 2M15 7c2-3 5-3 5 0-1 1-3 1-4 2" stroke="${stroke}" stroke-width="1.8" stroke-linecap="round" fill="none" />
          <path d="M12 17l-1 2.5h2z" fill="#0f172a" />
        </svg>
      `;

    case 'archmage':
      // Arquimago: Chapéu cônico de mago e orbe místico
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M6 20h12v2H6z" />
          <path d="M8 17h8c0-3-1-5-1-6h-6c0 1-1 3-1 6z" />
          <path d="M4 11h16L13 2c-1-1-2 1-3 2z" />
          <circle cx="12" cy="7" r="1.5" fill="#facc15" stroke="${stroke}" stroke-width="0.8" />
        </svg>
      `;

    case 'catapult':
      // Catapulta: Rodas, armação de lançamento e projétil vermelho
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M4 18h16v3H4z" />
          <circle cx="7" cy="19" r="2" fill="#334155" stroke="${stroke}" stroke-width="1" />
          <circle cx="17" cy="19" r="2" fill="#334155" stroke="${stroke}" stroke-width="1" />
          <path d="M6 18l5-8h2l5 8" stroke="${stroke}" stroke-width="1.5" fill="none" />
          <line x1="8" y1="18" x2="16" y2="7" stroke="${stroke}" stroke-width="2.5" />
          <circle cx="17" cy="6" r="2.2" fill="#e11d48" stroke="${stroke}" stroke-width="1" />
        </svg>
      `;

    case 'dragon':
      // Dragão: Chifres draconianos e asas aladas
      return `
        <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="${stroke}" stroke-width="${strokeWidth}" class="drop-shadow-sm">
          <path d="M6 20h12v2H6z" />
          <path d="M8 18h8c0-3-1-5-2-7l3-3-4 1-2-5-2 5-4-1 3 3c-1 2-2 4-2 7z" />
          <path d="M10 5l-2-2m6 2l2-2" stroke="${stroke}" stroke-width="1.5" stroke-linecap="round" />
          <circle cx="10" cy="10" r="1" fill="#f59e0b" />
          <circle cx="14" cy="10" r="1" fill="#f59e0b" />
        </svg>
      `;
  }
}

export function getMountainSvg(): string {
  return `
    <div class="w-full h-full flex items-center justify-center relative overflow-hidden bg-gradient-to-b from-stone-600 via-stone-700 to-stone-800 shadow-inner select-none pointer-events-none" title="Montanha: Cabra passa/fica; Cavalo pula">
      <svg viewBox="0 0 40 40" class="w-full h-full opacity-90" fill="none" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,36 24,14 36,36" fill="#44403c" stroke="#292524" stroke-width="1" />
        <polygon points="21,20 24,14 27,20 25,18 23,21" fill="#e2e8f0" opacity="0.8" />
        <polygon points="4,38 17,8 30,38" fill="#57534e" stroke="#1c1917" stroke-width="1.2" />
        <polygon points="14,15 17,8 20,15 18,13 16,16" fill="#f8fafc" />
        <line x1="17" y1="8" x2="19" y2="38" stroke="#292524" stroke-width="1" stroke-opacity="0.6" />
      </svg>
      <span class="absolute bottom-0.5 right-1 text-[8px] font-mono text-stone-300 font-bold opacity-60">▲</span>
    </div>
  `;
}
