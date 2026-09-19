import React from 'react';
import { X, ShieldAlert, Sparkles, Crosshair, Flame, Footprints, ArrowRightLeft } from 'lucide-react';
import { PieceIcon, getPieceName, getPieceDescription } from './PieceIcon';
import { PieceType } from '../types/game';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const newPieces: PieceType[] = ['goat', 'archmage', 'catapult', 'dragon'];
  const classicPieces: PieceType[] = ['king', 'queen', 'rook', 'bishop', 'knight', 'pawn'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl text-slate-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-2">
            <Sparkles size={14} /> Manual Oficial de Regras
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Regras do Xadrez 2 (Multiplayer 2 a 10 Jogadores)
          </h2>
        </div>

        {/* Section 1: General rules */}
        <div className="space-y-4 mb-6 text-sm text-slate-300">
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-2">
              🏔️ Casas Especiais (Montanhas)
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li>Identificadas com picos rochosos e neve no tabuleiro expandido de 20x20.</li>
              <li><strong className="text-slate-200">Apenas a Cabra</strong> pode parar sobre uma Montanha ou atravessá-la.</li>
              <li><strong className="text-slate-200">O Cavalo</strong> pode pular por cima das Montanhas, mas não pode parar sobre elas.</li>
              <li>Nenhuma outra peça pode passar ou parar nas casas de Montanha.</li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h3 className="font-bold text-amber-300 mb-1 flex items-center gap-2">
              👑 Promoção Automática do Peão & Eliminação
            </h3>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
              <li><strong className="text-slate-200">Promoção a Dama:</strong> Quando um Peão atinge a zona central do tabuleiro (destacada em dourado), ele é promovido automaticamente a uma Dama!</li>
              <li><strong className="text-slate-200">Xeque-Mate & Eliminação:</strong> Para eliminar um jogador, dê Xeque-Mate no seu Rei. Ao ser eliminado, suas peças restantes são retiradas do tabuleiro e o turno pula o jogador eliminado.</li>
            </ul>
          </div>
        </div>

        {/* Section 2: Novas Peças Personalizadas */}
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
          ✨ Novas Peças Personalizadas
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {newPieces.map((type) => (
            <div
              key={type}
              className="p-3.5 rounded-2xl bg-slate-800/60 border border-indigo-500/20 hover:border-indigo-500/40 flex items-start gap-3"
            >
              <div className="p-2 rounded-xl bg-slate-950 border border-slate-700/60 flex-shrink-0">
                <PieceIcon type={type} color="#818cf8" size={32} />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm text-indigo-300">
                  {getPieceName(type)}
                </span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {getPieceDescription(type)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Section 3: Peças Clássicas */}
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
          ♟️ Peças Originais
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {classicPieces.map((type) => (
            <div
              key={type}
              className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/30 flex items-center gap-2.5"
            >
              <PieceIcon type={type} color="#e2e8f0" size={24} />
              <div className="flex flex-col">
                <span className="font-semibold text-xs text-slate-200">
                  {getPieceName(type)}
                </span>
                <span className="text-[10px] text-slate-500">
                  Movimento tradicional
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
          >
            Entendido, fechar
          </button>
        </div>
      </div>
    </div>
  );
};
