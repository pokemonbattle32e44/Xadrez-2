import React, { useState } from 'react';
import { Sparkles, Users, Plus, ArrowRight, Shield, Award, HelpCircle } from 'lucide-react';

interface WelcomeScreenProps {
  playerName: string;
  onUpdatePlayerName: (name: string) => void;
  onCreateRoom: (maxPlayers: number) => Promise<void>;
  onJoinRoom: (code: string) => Promise<void>;
  onOpenRules: () => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  playerName,
  onUpdatePlayerName,
  onCreateRoom,
  onJoinRoom,
  onOpenRules,
}) => {
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [selectedMaxPlayers, setSelectedMaxPlayers] = useState(4);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!playerName.trim()) {
      setErrorMsg('Por favor, informe seu apelido de jogador!');
      return;
    }
    setErrorMsg(null);
    setLoadingAction('create');
    try {
      await onCreateRoom(selectedMaxPlayers);
    } catch (e: any) {
      setErrorMsg(e.message || 'Erro ao criar a sala');
      setLoadingAction(null);
    }
  };

  const handleJoin = async () => {
    if (!playerName.trim()) {
      setErrorMsg('Por favor, informe seu apelido de jogador!');
      return;
    }
    if (!roomCodeInput.trim()) {
      setErrorMsg('Digite o código de 6 dígitos da sala');
      return;
    }
    setErrorMsg(null);
    setLoadingAction('join');
    try {
      await onJoinRoom(roomCodeInput.trim().toUpperCase());
    } catch (e: any) {
      setErrorMsg(e.message || 'Sala não encontrada ou cheia');
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] w-full max-w-4xl mx-auto px-4 py-8">
      {/* Title & Brand */}
      <div className="flex flex-col items-center text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold mb-3">
          <Sparkles size={14} /> A Nova Evolução do Xadrez Multiplayer
        </div>

        <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-2">
          XADREZ <span className="text-amber-400">2</span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-lg leading-relaxed">
          2 a 10 jogadores simultâneos no mesmo tabuleiro expandido com Montanhas, Cabra, Arquimago, Catapulta e Dragão. Sincronizado em tempo real pelo Firebase.
        </p>
      </div>

      {/* Main card */}
      <div className="w-full max-w-xl bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Player Name Input */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Seu Nome de Comandante
          </label>
          <input
            id="input-player-name"
            type="text"
            value={playerName}
            onChange={(e) => onUpdatePlayerName(e.target.value)}
            maxLength={18}
            placeholder="Ex: Magnus, Kasparov, Alexandre..."
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700/80 rounded-2xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all font-medium"
          />
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Options grid: Create or Join */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {/* Create Room Box */}
          <div className="flex flex-col p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              <Plus size={14} className="text-amber-400" /> Criar Nova Sala
            </span>
            <span className="text-[11px] text-slate-400 mb-3">
              Escolha a capacidade máxima de jogadores (2 a 10):
            </span>

            {/* Max players selector */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {[2, 4, 6, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSelectedMaxPlayers(num)}
                  className={`py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedMaxPlayers === num
                      ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {num}P
                </button>
              ))}
            </div>

            <button
              id="btn-create-room"
              onClick={handleCreate}
              disabled={loadingAction !== null}
              className="mt-auto w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            >
              {loadingAction === 'create' ? (
                'Criando Sala...'
              ) : (
                <>
                  <span>Criar Sala ({selectedMaxPlayers}P)</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>

          {/* Join Room Box */}
          <div className="flex flex-col p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-2">
              <Users size={14} className="text-indigo-400" /> Entrar com Código
            </span>
            <span className="text-[11px] text-slate-400 mb-3">
              Cole o código de 6 caracteres fornecido pelo anfitrião:
            </span>

            <input
              id="input-room-code"
              type="text"
              value={roomCodeInput}
              onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="CÓDIGO (ex: XK9A2B)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-amber-400 font-mono font-bold text-center tracking-widest text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400 mb-4 uppercase"
            />

            <button
              id="btn-join-room"
              onClick={handleJoin}
              disabled={loadingAction !== null}
              className="mt-auto w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 active:scale-98 transition-all"
            >
              {loadingAction === 'join' ? (
                'Entrando...'
              ) : (
                <>
                  <span>Entrar na Sala</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer: Learn Rules */}
        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
          <button
            id="btn-open-rules"
            onClick={onOpenRules}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-300 font-medium transition-colors"
          >
            <HelpCircle size={15} />
            <span>Como Jogar: Montanhas & Novas Peças</span>
          </button>

          <span className="text-[11px] text-slate-500 font-mono">
            Firebase Firestore v1.0
          </span>
        </div>
      </div>
    </div>
  );
};
