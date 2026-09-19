import React from 'react';
import { MoveRecord } from '../types/game';
import { PieceIcon, getPieceName } from './PieceIcon';
import { History, Shield, Sparkles, Crosshair } from 'lucide-react';

interface MoveHistoryProps {
  history: MoveRecord[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ history }) => {
  return (
    <div className="flex flex-col w-full h-full bg-slate-900/90 border border-slate-800 rounded-2xl p-3 shadow-xl">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <History size={13} className="text-amber-400" />
          Histórico de Jogadas
        </h3>
        <span className="text-[10px] font-mono text-slate-500">
          Total: {history.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto max-h-[220px] space-y-1.5 pr-1 font-mono text-xs">
        {history.length === 0 ? (
          <div className="flex items-center justify-center h-28 text-slate-600 text-xs italic">
            Nenhuma jogada realizada ainda
          </div>
        ) : (
          history
            .slice()
            .reverse()
            .map((rec) => {
              const fromCoord = `${String.fromCharCode(65 + rec.from.x)}${rec.from.y + 1}`;
              const toCoord = `${String.fromCharCode(65 + rec.to.x)}${rec.to.y + 1}`;

              return (
                <div
                  key={rec.id}
                  className="flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: rec.playerColor }}
                    />
                    <span className="font-semibold text-slate-300">
                      {rec.playerName}
                    </span>
                    <span className="text-slate-500">
                      {getPieceName(rec.pieceType)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400">
                    {rec.actionType === 'catapult_strike' ? (
                      <span className="text-orange-400 font-bold flex items-center gap-0.5">
                        <Crosshair size={11} /> Disparo ➔ {toCoord}
                      </span>
                    ) : rec.actionType === 'archmage_swap' ? (
                      <span className="text-purple-400 font-bold">
                        Troca {fromCoord} ⇄ {toCoord}
                      </span>
                    ) : rec.actionType === 'capture' ? (
                      <span className="text-rose-400 font-bold">
                        {fromCoord} x {toCoord}
                      </span>
                    ) : (
                      <span>
                        {fromCoord} ➔ {toCoord}
                      </span>
                    )}

                    {rec.promotedTo && (
                      <span className="text-amber-400 font-bold text-[10px]">
                        [♛ Dama]
                      </span>
                    )}
                  </div>
                </div>
              );
            })
        )}
      </div>
    </div>
  );
};
