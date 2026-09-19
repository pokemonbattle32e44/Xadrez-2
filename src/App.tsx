import React, { useEffect, useState, useRef } from 'react';
import {
  GameRoom,
  Piece,
  ValidMove,
  Player,
} from './types/game';
import {
  subscribeToRoom,
  createGameRoom,
  joinGameRoom,
  startGameRoom,
  executeGameMove,
  leaveGameRoom,
} from './game/network';
import { ensurePlayerSessionId } from './firebase';
import { Board } from './components/Board';
import { Lobby } from './components/Lobby';
import { WelcomeScreen } from './components/WelcomeScreen';
import { PlayerList } from './components/PlayerList';
import { MoveHistory } from './components/MoveHistory';
import { RulesModal } from './components/RulesModal';
import { PieceIcon, getPieceName } from './components/PieceIcon';
import confetti from 'canvas-confetti';
import {
  Crown,
  HelpCircle,
  Volume2,
  VolumeX,
  RotateCcw,
  LogOut,
  AlertCircle,
  Sparkles,
  Wifi,
  WifiOff,
  Flame,
  Shield,
} from 'lucide-react';

export default function App() {
  const [playerName, setPlayerName] = useState<string>(() => {
    return localStorage.getItem('xadrez2_player_name') || '';
  });
  const [currentRoom, setCurrentRoom] = useState<GameRoom | null>(null);
  const [currentRoomId, setCurrentRoomId] = useState<string | null>(() => {
    return sessionStorage.getItem('xadrez2_active_room_id') || null;
  });
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [rulesOpen, setRulesOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [turnNotification, setTurnNotification] = useState<string | null>(null);

  // Audio effects synthesizer using Web Audio API (cross-platform, zero dependencies)
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSoundEffect = (type: 'move' | 'capture' | 'special' | 'check' | 'win') => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      if (ctx.state === 'suspended') ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === 'move') {
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'capture') {
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.15);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else if (type === 'special') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'check') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.setValueAtTime(400, now + 0.1);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === 'win') {
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.15);
        osc.frequency.setValueAtTime(783.99, now + 0.3);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    } catch {
      // Ignore audio policy issues
    }
  };

  // Ensure Player session on mount
  useEffect(() => {
    ensurePlayerSessionId()
      .then((uid) => {
        setMyPlayerId(uid);
      })
      .catch((err) => {
        console.error('Session initialization error:', err);
      });
  }, []);

  // Sync player name to local storage
  const handleUpdatePlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem('xadrez2_player_name', name);
  };

  // Real-time Firestore subscription to active room
  useEffect(() => {
    if (!currentRoomId) {
      setCurrentRoom(null);
      return;
    }

    setIsReconnecting(true);
    const unsubscribe = subscribeToRoom(
      currentRoomId,
      (roomData) => {
        setIsReconnecting(false);
        setNetworkError(null);
        setCurrentRoom(roomData);

        if (!roomData) {
          sessionStorage.removeItem('xadrez2_active_room_id');
          setCurrentRoomId(null);
        }
      },
      (err) => {
        console.error('Room sync error:', err);
        setNetworkError('Problema na conexão em tempo real. Tentando reconectar...');
        setIsReconnecting(true);
      }
    );

    return () => unsubscribe();
  }, [currentRoomId]);

  // Determine current player profile & slot
  const myPlayer: Player | undefined = currentRoom?.players.find(
    (p) => p.id === myPlayerId
  );
  const mySlot: number | null = myPlayer ? myPlayer.slot : null;
  const isMyTurn =
    currentRoom?.status === 'playing' &&
    mySlot !== null &&
    currentRoom.currentTurnSlot === mySlot &&
    myPlayer?.isAlive === true;

  // Turn notification & sounds
  const prevTurnRef = useRef<number | null>(null);
  useEffect(() => {
    if (!currentRoom || currentRoom.status !== 'playing') return;

    if (prevTurnRef.current !== currentRoom.currentTurnSlot) {
      const activePlayer = currentRoom.players.find(
        (p) => p.slot === currentRoom.currentTurnSlot
      );
      if (activePlayer) {
        if (activePlayer.slot === mySlot) {
          setTurnNotification('É a sua vez de jogar!');
          playSoundEffect('special');
        } else {
          setTurnNotification(`Turno de: ${activePlayer.name}`);
        }
        const timer = setTimeout(() => setTurnNotification(null), 3000);
        return () => clearTimeout(timer);
      }
      prevTurnRef.current = currentRoom.currentTurnSlot;
    }
  }, [currentRoom?.currentTurnSlot, currentRoom?.status, mySlot]);

  // Winner celebration confetti
  useEffect(() => {
    if (currentRoom?.status === 'finished') {
      playSoundEffect('win');
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }
  }, [currentRoom?.status]);

  // Create room handler
  const handleCreateRoom = async (maxPlayers: number) => {
    const { room } = await createGameRoom(playerName, maxPlayers);
    sessionStorage.setItem('xadrez2_active_room_id', room.id);
    setCurrentRoomId(room.id);
    setCurrentRoom(room);
  };

  // Join room handler
  const handleJoinRoom = async (code: string) => {
    const { room } = await joinGameRoom(code, playerName);
    sessionStorage.setItem('xadrez2_active_room_id', room.id);
    setCurrentRoomId(room.id);
    setCurrentRoom(room);
  };

  // Start game handler
  const handleStartGame = async () => {
    if (!currentRoom) return;
    await startGameRoom(currentRoom.id, myPlayerId);
  };

  // Leave room handler
  const handleLeaveRoom = async () => {
    if (currentRoom) {
      await leaveGameRoom(currentRoom.id, myPlayerId);
    }
    sessionStorage.removeItem('xadrez2_active_room_id');
    setCurrentRoomId(null);
    setCurrentRoom(null);
  };

  // Move submission handler
  const handleMakeMove = async (piece: Piece, move: ValidMove) => {
    if (!currentRoom || mySlot === null) return;

    if (move.actionType === 'capture' || move.actionType === 'catapult_strike') {
      playSoundEffect('capture');
    } else if (move.actionType === 'archmage_swap' || move.promoted) {
      playSoundEffect('special');
    } else {
      playSoundEffect('move');
    }

    try {
      await executeGameMove(currentRoom.id, piece, move, mySlot);
    } catch (err: any) {
      console.error('Error executing move:', err);
      alert(err.message || 'Erro ao realizar jogada.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              XADREZ <span className="text-amber-400 font-extrabold text-2xl">2</span>
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Multiplayer 2-10P
            </span>
          </div>

          {/* Connection status indicator */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pl-2 border-l border-slate-800">
            {isReconnecting ? (
              <span className="flex items-center gap-1 text-amber-400 animate-pulse font-medium">
                <WifiOff size={13} /> Sincronizando...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <Wifi size={13} /> Firebase Conectado
              </span>
            )}
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          {currentRoom && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-700/70 text-xs">
              <span className="text-slate-400">Sala:</span>
              <span className="font-mono font-bold text-amber-400">{currentRoom.roomCode}</span>
            </div>
          )}

          <button
            id="btn-toggle-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            title={soundEnabled ? 'Silenciar Áudio' : 'Ativar Sons'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            id="btn-rules-header"
            onClick={() => setRulesOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <HelpCircle size={15} />
            <span className="hidden sm:inline">Regras</span>
          </button>

          {currentRoom && (
            <button
              id="btn-leave-top"
              onClick={handleLeaveRoom}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
              title="Sair da Partida"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Reconnection Alert Banner */}
      {networkError && (
        <div className="w-full bg-amber-500/20 border-b border-amber-500/30 text-amber-300 text-xs py-2 px-4 text-center font-medium flex items-center justify-center gap-2">
          <AlertCircle size={14} />
          {networkError}
        </div>
      )}

      {/* Main Game Container */}
      <main className="flex-1 flex flex-col items-center justify-start p-2 sm:p-4 w-full max-w-7xl mx-auto">
        {!currentRoom ? (
          // Welcome & Room Creation Screen
          <WelcomeScreen
            playerName={playerName}
            onUpdatePlayerName={handleUpdatePlayerName}
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
            onOpenRules={() => setRulesOpen(true)}
          />
        ) : currentRoom.status === 'lobby' ? (
          // Lobby waiting room
          <Lobby
            room={currentRoom}
            currentPlayerId={myPlayerId}
            onStartGame={handleStartGame}
            onLeaveRoom={handleLeaveRoom}
          />
        ) : (
          // Active Gameplay Arena
          <div className="flex flex-col lg:flex-row items-start justify-center gap-4 w-full">
            {/* Left/Main Column: Board & Turn Banner */}
            <div className="flex flex-col items-center w-full lg:flex-1">
              {/* Turn Banner & Status bar */}
              <div className="w-full max-w-3xl mb-3 flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl">
                <div className="flex items-center gap-3">
                  {/* Current turn player badge */}
                  {(() => {
                    const activeP = currentRoom.players.find(
                      (p) => p.slot === currentRoom.currentTurnSlot
                    );
                    return (
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full animate-ping"
                          style={{ backgroundColor: activeP?.hex || '#fff' }}
                        />
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                            Vez de Jogar
                          </span>
                          <span className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                            {activeP?.name}
                            {activeP?.slot === mySlot && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                                SUA VEZ!
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Status indicator (Check, Elimination, Game Over) */}
                <div className="flex items-center gap-2">
                  {currentRoom.status === 'finished' ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 font-bold text-xs">
                      <Crown size={15} /> Vencedor: {currentRoom.winnerName || 'Fim de Jogo'}
                    </div>
                  ) : myPlayer?.isAlive === false ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold text-xs">
                      Eliminado (Espectador)
                    </div>
                  ) : myPlayer?.isCheck ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-600/30 text-rose-200 border border-rose-500/60 font-black text-xs animate-bounce">
                      <AlertCircle size={15} /> SEU REI ESTÁ EM XEQUE!
                    </div>
                  ) : null}
                </div>
              </div>

              {/* Turn notification overlay pop */}
              {turnNotification && (
                <div className="mb-2 px-4 py-1.5 rounded-full bg-slate-800/90 border border-amber-400/50 text-amber-300 text-xs font-bold shadow-lg animate-in fade-in zoom-in duration-150">
                  {turnNotification}
                </div>
              )}

              {/* The 20x20 Expanded Chess Board */}
              <Board
                room={currentRoom}
                currentPlayerSlot={mySlot}
                onMakeMove={handleMakeMove}
                isMyTurn={isMyTurn}
              />

              {/* Mobile Quick Legend */}
              <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-400 px-2">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-stone-700 rounded-sm"></span> Montanha (Cabra passa/fica)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-900/60 rounded-sm"></span> Centro (Promoção Peão)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-orange-500/50 rounded-sm"></span> Disparo Catapulta (3 casas)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-purple-500/50 rounded-sm"></span> Troca Arquimago
                </span>
              </div>
            </div>

            {/* Right Side Column: Players status and Move History */}
            <div className="flex flex-col gap-4 w-full lg:w-80 flex-shrink-0">
              {/* Player list card */}
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <PlayerList room={currentRoom} currentPlayerSlot={mySlot} />
              </div>

              {/* Move history card */}
              <MoveHistory history={currentRoom.history} />

              {/* Quick Pieces info card */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400">
                <div className="flex items-center justify-between font-bold text-slate-200 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-400" /> Novas Peças
                  </span>
                  <button
                    onClick={() => setRulesOpen(true)}
                    className="text-amber-400 hover:underline text-[11px]"
                  >
                    Ver Todas
                  </button>
                </div>
                <div className="space-y-1.5 text-[11px]">
                  <div><strong className="text-slate-300">Cabra:</strong> 2 casas na diagonal. Pode pisar em Montanhas.</div>
                  <div><strong className="text-slate-300">Arquimago:</strong> Permuta com aliado adjacente.</div>
                  <div><strong className="text-slate-300">Catapulta:</strong> Captura à distância a 3 casas retas.</div>
                  <div><strong className="text-slate-300">Dragão:</strong> Como Torre até 3 casas, voa sobre 1 peça.</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Rules and Guide Modal */}
      <RulesModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
}
