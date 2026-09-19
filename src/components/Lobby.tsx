import React, { useState } from 'react';
import { GameRoom } from '../types/game';
import { Copy, Check, Users, Play, LogOut, Shield, Zap, Sparkles } from 'lucide-react';

interface LobbyProps {
  room: GameRoom;
  currentPlayerId: string;
  onStartGame: () => Promise<void>;
  onLeaveRoom: () => Promise<void>;
}

export const Lobby: React.FC<LobbyProps> = ({
  room,
  currentPlayerId,
  onStartGame,
  onLeaveRoom,
}) => {
  const [copied, setCopied] = useState(false);
  const [starting, setStarting] = useState(false);

  const isHost = room.hostId === currentPlayerId;
  const canStart = room.players.length >= 2;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(room.roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleStart = async () => {
    if (!canStart || starting) return;
    try {
      setStarting(true);
      await onStartGame();
    } catch (e) {
      console.error(e);
      setStarting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full max-w-2xl mx-auto px-4 py-8">
      {/* Header card */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold mb-4">
          <Sparkles size={14} className="text-indigo-400" />
          Sala de Espera Multiplayer
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2 tracking-tight">
          Lobby do <span className="text-amber-400">Xadrez 2</span>
        </h2>
        <p className="text-sm text-slate-400 max-w-md mb-6">
          Convide de 2 a 10 amigos compartilhando o código da sala. Quando todos entrarem, o anfitrião pode iniciar a partida!
        </p>

        {/* Room Code Badge */}
        <div className="flex items-center gap-3 bg-slate-950 border border-slate-700/80 rounded-2xl p-2.5 px-4 mb-6 shadow-inner">
          <div className="flex flex-col items-start">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
              Código da Sala
            </span>
            <span className="text-2xl font-mono font-extrabold text-amber-400 tracking-widest">
              {room.roomCode}
            </span>
          </div>

          <button
            id="btn-copy-code"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-600 transition-colors"
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-400" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>

        {/* Player List In Lobby */}
        <div className="w-full mb-8">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3 px-1 font-semibold">
            <span className="flex items-center gap-1.5">
              <Users size={14} /> Jogadores Conectados ({room.players.length}/{room.maxPlayers})
            </span>
            <span>Mínimo para iniciar: 2</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {room.players.map((p, idx) => (
              <div
                key={p.slot}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-md border border-white/20"
                    style={{
                      backgroundColor: p.hex,
                      color: idx === 0 ? '#0f172a' : '#ffffff',
                    }}
                  >
                    {idx + 1}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold text-slate-200">
                      {p.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Exército {p.colorName}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {p.isHost && (
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                      Host
                    </span>
                  )}
                  {p.id === currentPlayerId && (
                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                      Você
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Empty slots placeholders */}
            {Array.from({ length: Math.max(0, room.maxPlayers - room.players.length) }).map(
              (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-medium"
                >
                  Aguardando jogador {room.players.length + i + 1}...
                </div>
              )
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
          {isHost ? (
            <button
              id="btn-start-game"
              onClick={handleStart}
              disabled={!canStart || starting}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm transition-all shadow-lg ${
                canStart && !starting
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25 cursor-pointer active:scale-98'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              <Play size={18} fill="currentColor" />
              {starting
                ? 'Iniciando partida...'
                : canStart
                ? `Iniciar Partida (${room.players.length} Jogadores)`
                : 'Aguardando pelo menos 2 jogadores...'}
            </button>
          ) : (
            <div className="flex-1 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400 text-center">
              Aguardando o anfitrião ({room.players.find((p) => p.isHost)?.name}) iniciar a partida...
            </div>
          )}

          <button
            id="btn-leave-lobby"
            onClick={onLeaveRoom}
            className="w-full sm:w-auto flex items-center justify-center gap-2 py-3.5 px-5 rounded-2xl bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-900/60 font-semibold text-xs transition-colors"
          >
            <LogOut size={16} />
            Sair da Sala
          </button>
        </div>
      </div>
    </div>
  );
};
