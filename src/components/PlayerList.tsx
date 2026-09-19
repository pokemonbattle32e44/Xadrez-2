import React from 'react';
import { Player, GameRoom } from '../types/game';
import { Crown, Skull, AlertCircle, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';

interface PlayerListProps {
  room: GameRoom;
  currentPlayerSlot: number | null;
}

export const PlayerList: React.FC<PlayerListProps> = ({ room, currentPlayerSlot }) => {
  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Jogadores ({room.players.length}/{room.maxPlayers})
        </h3>
        <span className="text-[11px] text-slate-500 font-mono">
          Vivos: {room.players.filter((p) => p.isAlive).length}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-2 gap-2">
        {room.players.map((player) => {
          const isTurn = room.status === 'playing' && room.currentTurnSlot === player.slot;
          const isMe = currentPlayerSlot === player.slot;

          return (
            <div
              key={player.slot}
              id={`player-card-${player.slot}`}
              className={`relative flex items-center gap-2.5 p-2 rounded-xl border transition-all duration-200 ${
                !player.isAlive
                  ? 'bg-slate-900/40 border-slate-800/60 opacity-50 grayscale'
                  : isTurn
                  ? 'bg-slate-800/90 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Color orb */}
              <div className="relative flex-shrink-0">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner border border-white/20"
                  style={{
                    backgroundColor: player.hex,
                    color: player.slot === 0 ? '#0f172a' : '#ffffff',
                  }}
                >
                  {player.name.charAt(0).toUpperCase()}
                </div>
                {player.isHost && (
                  <Crown
                    size={12}
                    className="absolute -top-1.5 -right-1.5 text-amber-400 fill-amber-400 drop-shadow-sm"
                  />
                )}
              </div>

              {/* Name & status */}
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-slate-200 truncate">
                    {player.name}
                  </span>
                  {isMe && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-indigo-500/30 text-indigo-300 font-medium">
                      Você
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 mt-0.5">
                  {!player.isAlive ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-red-400 font-medium">
                      <Skull size={10} /> Eliminado
                    </span>
                  ) : player.isCheck ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-rose-400 font-bold animate-pulse">
                      <AlertCircle size={10} /> XEQUE!
                    </span>
                  ) : isTurn ? (
                    <span className="text-[10px] text-amber-400 font-medium animate-pulse">
                      ▶ Turno Ativo
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">
                      Aguardando
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
