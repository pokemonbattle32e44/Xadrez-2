import './index.css';
import {
  GameRoom,
  Piece,
  ValidMove,
  Player,
  BOARD_SIZE,
  Position,
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
import { getValidMoves, isMountain } from './game/rules';
import { getPieceSvg, getMountainSvg } from './game/svgPieces';
import confetti from 'canvas-confetti';

// ==========================================
// STATE VARIABLES
// ==========================================
let currentRoom: GameRoom | null = null;
let myPlayerId = '';
let selectedPiece: Piece | null = null;
let currentValidMoves: ValidMove[] = [];
let boardZoom = 1.0;
let soundEnabled = true;
let selectedMaxPlayers = 4;
let unsubscribeRoom: (() => void) | null = null;
let prevTurnSlot: number | null = null;

// Web Audio API Sound Synthesizer
let audioCtx: AudioContext | null = null;
function playSound(type: 'move' | 'capture' | 'special' | 'check' | 'win') {
  if (!soundEnabled) return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) audioCtx = new AudioContextClass();
    }
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;

    if (type === 'move') {
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(460, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'capture') {
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'special') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.22);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'check') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(550, now);
      osc.frequency.setValueAtTime(370, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === 'win') {
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.15);
      osc.frequency.setValueAtTime(783.99, now + 0.3);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch {
    // Ignore audio issues
  }
}

// Toast notification
function showTurnToast(msg: string) {
  const container = document.getElementById('turn-toast-container');
  const text = document.getElementById('turn-toast-text');
  if (!container || !text) return;
  text.textContent = msg;
  container.classList.remove('opacity-0', '-translate-y-2');
  container.classList.add('opacity-100', 'translate-y-0');
  setTimeout(() => {
    container.classList.remove('opacity-100', 'translate-y-0');
    container.classList.add('opacity-0', '-translate-y-2');
  }, 2800);
}

// ==========================================
// DOM SCREEN SWITCHER
// ==========================================
function setVisibleScreen(screen: 'welcome' | 'lobby' | 'game') {
  const welcome = document.getElementById('screen-welcome');
  const lobby = document.getElementById('screen-lobby');
  const game = document.getElementById('screen-game');
  const headerBadge = document.getElementById('header-room-badge');
  const leaveBtn = document.getElementById('btn-leave-top');

  welcome?.classList.add('hidden');
  lobby?.classList.add('hidden');
  game?.classList.add('hidden');

  if (screen === 'welcome') {
    welcome?.classList.remove('hidden');
    headerBadge?.classList.add('hidden');
    headerBadge?.classList.remove('flex');
    leaveBtn?.classList.add('hidden');
  } else if (screen === 'lobby') {
    lobby?.classList.remove('hidden');
    headerBadge?.classList.remove('hidden');
    headerBadge?.classList.add('flex');
    leaveBtn?.classList.remove('hidden');
  } else if (screen === 'game') {
    game?.classList.remove('hidden');
    game?.classList.add('flex');
    headerBadge?.classList.remove('hidden');
    headerBadge?.classList.add('flex');
    leaveBtn?.classList.remove('hidden');
  }
}

// ==========================================
// INITIALIZATION
// ==========================================
async function initApp() {
  // 1. Session ID
  myPlayerId = await ensurePlayerSessionId();

  // 2. Saved player name
  const savedName = localStorage.getItem('xadrez2_player_name') || '';
  const inputName = document.getElementById('input-player-name') as HTMLInputElement;
  if (inputName && savedName) {
    inputName.value = savedName;
  }

  // 3. Check active room in sessionStorage (reconnection)
  const activeRoomId = sessionStorage.getItem('xadrez2_active_room_id');
  if (activeRoomId) {
    connectToRoom(activeRoomId);
  } else {
    setVisibleScreen('welcome');
  }

  setupEventListeners();
}

// ==========================================
// ROOM CONNECTION & FIRESTORE REALTIME SYNC
// ==========================================
function connectToRoom(roomId: string) {
  if (unsubscribeRoom) {
    unsubscribeRoom();
  }

  const connText = document.getElementById('connection-text');
  const netBanner = document.getElementById('network-banner');

  unsubscribeRoom = subscribeToRoom(
    roomId,
    (room) => {
      netBanner?.classList.add('hidden');
      if (connText) connText.textContent = 'Firebase Sincronizado';

      if (!room) {
        sessionStorage.removeItem('xadrez2_active_room_id');
        currentRoom = null;
        setVisibleScreen('welcome');
        return;
      }

      currentRoom = room;
      renderCurrentRoomState();
    },
    (err) => {
      console.error('Room sync error:', err);
      netBanner?.classList.remove('hidden');
      if (connText) connText.textContent = 'Reconectando...';
    }
  );
}

// Render entire UI according to room status
function renderCurrentRoomState() {
  if (!currentRoom) return;

  // Update header room code
  const headerCode = document.getElementById('header-room-code');
  if (headerCode) headerCode.textContent = currentRoom.roomCode;

  if (currentRoom.status === 'lobby') {
    setVisibleScreen('lobby');
    renderLobbyScreen();
  } else if (currentRoom.status === 'playing' || currentRoom.status === 'finished') {
    setVisibleScreen('game');
    renderGameScreen();
  }
}

// ==========================================
// LOBBY RENDERING
// ==========================================
function renderLobbyScreen() {
  if (!currentRoom) return;

  const lobbyCode = document.getElementById('lobby-room-code');
  if (lobbyCode) lobbyCode.textContent = currentRoom.roomCode;

  const countSpan = document.getElementById('lobby-player-count');
  if (countSpan) {
    countSpan.textContent = `Jogadores Conectados (${currentRoom.players.length}/${currentRoom.maxPlayers})`;
  }

  // Player cards in lobby
  const grid = document.getElementById('lobby-players-grid');
  if (grid) {
    grid.innerHTML = '';
    currentRoom.players.forEach((p, idx) => {
      const isMe = p.id === myPlayerId;
      const card = document.createElement('div');
      card.className =
        'flex items-center justify-between p-3 rounded-xl bg-slate-800/60 border border-slate-700/50';
      card.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shadow-md border border-white/20"
               style="background-color: ${p.hex}; color: ${idx === 0 ? '#0f172a' : '#ffffff'};">
            ${idx + 1}
          </div>
          <div class="flex flex-col text-left">
            <span class="text-sm font-semibold text-slate-200">${p.name}</span>
            <span class="text-[10px] text-slate-400 font-mono">Exército ${p.colorName}</span>
          </div>
        </div>
        <div class="flex items-center gap-1.5">
          ${p.isHost ? '<span class="text-[10px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">Host</span>' : ''}
          ${isMe ? '<span class="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">Você</span>' : ''}
        </div>
      `;
      grid.appendChild(card);
    });

    // Empty slot placeholders
    const emptySlots = currentRoom.maxPlayers - currentRoom.players.length;
    for (let i = 0; i < emptySlots; i++) {
      const placeholder = document.createElement('div');
      placeholder.className =
        'flex items-center justify-center p-3 rounded-xl border border-dashed border-slate-800 text-slate-500 text-xs font-medium';
      placeholder.textContent = `Aguardando jogador ${currentRoom.players.length + i + 1}...`;
      grid.appendChild(placeholder);
    }
  }

  // Start game button state
  const isHost = currentRoom.hostId === myPlayerId;
  const canStart = currentRoom.players.length >= 2;
  const startBtn = document.getElementById('btn-start-game') as HTMLButtonElement;
  const startText = document.getElementById('btn-start-text');

  if (startBtn && startText) {
    if (isHost) {
      if (canStart) {
        startBtn.disabled = false;
        startBtn.className =
          'flex-1 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/25 cursor-pointer active:scale-98 transition-all';
        startText.textContent = `Iniciar Partida (${currentRoom.players.length} Jogadores)`;
      } else {
        startBtn.disabled = true;
        startBtn.className =
          'flex-1 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-bold text-sm bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed transition-all shadow-lg';
        startText.textContent = 'Aguardando pelo menos 2 jogadores...';
      }
    } else {
      startBtn.disabled = true;
      startBtn.className =
        'flex-1 w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl font-semibold text-xs bg-slate-800/40 text-slate-400 border border-slate-700/40 cursor-not-allowed transition-all';
      const host = currentRoom.players.find((p) => p.isHost);
      startText.textContent = `Aguardando anfitrião (${host?.name || 'Host'}) iniciar a partida...`;
    }
  }
}

// ==========================================
// GAME ARENA RENDERING
// ==========================================
function renderGameScreen() {
  const room = currentRoom;
  if (!room) return;

  const myPlayer = room.players.find((p) => p.id === myPlayerId);
  const mySlot = myPlayer ? myPlayer.slot : null;
  const isMyTurn =
    room.status === 'playing' &&
    mySlot !== null &&
    room.currentTurnSlot === mySlot &&
    myPlayer?.isAlive === true;

  // Active turn notifications & sound
  if (prevTurnSlot !== room.currentTurnSlot) {
    prevTurnSlot = room.currentTurnSlot;
    const activePlayer = room.players.find(
      (p) => p.slot === room.currentTurnSlot
    );
    if (activePlayer) {
      if (activePlayer.slot === mySlot) {
        showTurnToast('Sua vez de jogar!');
        playSound('special');
      } else {
        showTurnToast(`Turno de: ${activePlayer.name}`);
      }
    }
  }

  // Finished celebration
  if (room.status === 'finished') {
    playSound('win');
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
  }

  // Turn status badge
  const activePlayer = room.players.find(
    (p) => p.slot === room.currentTurnSlot
  );
  const indicator = document.getElementById('turn-active-indicator');
  const activeName = document.getElementById('turn-active-name');
  if (indicator && activePlayer) {
    indicator.style.backgroundColor = activePlayer.hex;
  }
  if (activeName && activePlayer) {
    activeName.innerHTML = `
      <span>${activePlayer.name}</span>
      ${
        isMyTurn
          ? '<span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">SUA VEZ!</span>'
          : ''
      }
    `;
  }

  // Alerts
  const checkBadge = document.getElementById('badge-check');
  const eliminatedBadge = document.getElementById('badge-eliminated');
  const winnerBadge = document.getElementById('badge-winner');

  if (room.status === 'finished') {
    winnerBadge?.classList.remove('hidden');
    winnerBadge?.classList.add('flex');
    if (winnerBadge) winnerBadge.textContent = `👑 Vencedor: ${room.winnerName || 'Fim de Jogo'}!`;
  } else {
    winnerBadge?.classList.add('hidden');
    winnerBadge?.classList.remove('flex');
  }

  if (myPlayer?.isAlive === false) {
    eliminatedBadge?.classList.remove('hidden');
    eliminatedBadge?.classList.add('flex');
  } else {
    eliminatedBadge?.classList.add('hidden');
    eliminatedBadge?.classList.remove('flex');
  }

  if (myPlayer?.isCheck && myPlayer.isAlive) {
    checkBadge?.classList.remove('hidden');
    checkBadge?.classList.add('flex');
    playSound('check');
  } else {
    checkBadge?.classList.add('hidden');
    checkBadge?.classList.remove('flex');
  }

  // Render 20x20 board
  renderBoardGrid(mySlot, isMyTurn);

  // Render players in sidebar
  renderPlayersSidebar(mySlot);

  // Render move history
  renderMoveHistory();
}

// ==========================================
// 20x20 CHESS BOARD RENDERING
// ==========================================
function renderBoardGrid(mySlot: number | null, isMyTurn: boolean) {
  if (!currentRoom) return;

  const board = document.getElementById('chess-board');
  if (!board) return;

  const cellSize = Math.round(36 * boardZoom);
  board.style.gridTemplateColumns = `repeat(${BOARD_SIZE}, ${cellSize}px)`;
  board.style.gridTemplateRows = `repeat(${BOARD_SIZE}, ${cellSize}px)`;
  board.style.width = `${cellSize * BOARD_SIZE}px`;
  board.style.height = `${cellSize * BOARD_SIZE}px`;

  // Compute valid moves if a piece is selected
  if (selectedPiece && selectedPiece.playerIndex === currentRoom.currentTurnSlot) {
    currentValidMoves = getValidMoves(
      selectedPiece,
      currentRoom.pieces,
      currentRoom.mountains
    );
  } else {
    currentValidMoves = [];
  }

  board.innerHTML = '';

  for (let y = 0; y < BOARD_SIZE; y++) {
    for (let x = 0; x < BOARD_SIZE; x++) {
      const isDark = (x + y) % 2 === 1;
      const hasMt = isMountain(x, y, currentRoom.mountains);
      const isCenter = x >= 8 && x <= 11 && y >= 8 && y <= 11;
      const piece = currentRoom.pieces.find((p) => p.x === x && p.y === y);
      const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
      const validMove = currentValidMoves.find((m) => m.x === x && m.y === y);

      const cell = document.createElement('div');
      cell.id = `cell-${x}-${y}`;
      cell.className = `relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
        hasMt
          ? ''
          : isCenter
          ? isDark
            ? 'bg-amber-950/40 hover:bg-amber-900/40'
            : 'bg-amber-900/30 hover:bg-amber-800/40'
          : isDark
          ? 'bg-slate-800/90 hover:bg-slate-750'
          : 'bg-slate-700/70 hover:bg-slate-650'
      } ${isSelected ? 'ring-2 ring-amber-400 ring-inset z-10 bg-amber-500/20' : ''}`;

      cell.style.width = `${cellSize}px`;
      cell.style.height = `${cellSize}px`;

      // Mountain element
      if (hasMt) {
        cell.innerHTML = getMountainSvg();
      }

      // Center Crown indicator
      if (isCenter && !hasMt && !piece) {
        const crown = document.createElement('div');
        crown.className =
          'absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none text-[10px] text-amber-300 font-bold';
        crown.textContent = '👑';
        cell.appendChild(crown);
      }

      // Coordinates along corners
      if ((x === 0 && y % 5 === 0) || (y === 0 && x % 5 === 0)) {
        const coord = document.createElement('span');
        coord.className =
          'absolute top-0.5 left-0.5 text-[8px] font-mono text-slate-500 pointer-events-none select-none';
        coord.textContent = `${String.fromCharCode(65 + x)}${y + 1}`;
        cell.appendChild(coord);
      }

      // Valid move overlay
      if (validMove) {
        const moveOverlay = document.createElement('div');
        moveOverlay.className = `absolute inset-0 flex items-center justify-center z-20 pointer-events-none ${
          validMove.actionType === 'capture'
            ? 'bg-red-500/35 ring-2 ring-red-500 ring-inset'
            : validMove.actionType === 'catapult_strike'
            ? 'bg-orange-500/40 ring-2 ring-orange-500 ring-inset animate-pulse'
            : validMove.actionType === 'archmage_swap'
            ? 'bg-purple-500/35 ring-2 ring-purple-400 ring-inset'
            : 'bg-emerald-500/20'
        }`;

        if (validMove.actionType === 'move') {
          moveOverlay.innerHTML =
            '<div class="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse"></div>';
        } else if (validMove.actionType === 'capture') {
          moveOverlay.innerHTML =
            '<div class="w-5 h-5 rounded-full border-2 border-red-400 flex items-center justify-center"><div class="w-2 h-2 rounded-full bg-red-500"></div></div>';
        } else if (validMove.actionType === 'catapult_strike') {
          moveOverlay.innerHTML = '<span class="text-orange-300 font-bold text-sm">🎯</span>';
        } else if (validMove.actionType === 'archmage_swap') {
          moveOverlay.innerHTML = '<span class="text-purple-300 font-bold text-sm">⇄</span>';
        }

        cell.appendChild(moveOverlay);
      }

      // Piece rendering
      if (piece) {
        const player = currentRoom.players.find((p) => p.slot === piece.playerIndex);
        if (player) {
          const pieceWrap = document.createElement('div');
          pieceWrap.className = `relative z-10 flex items-center justify-center transition-transform duration-200 ${
            isSelected ? 'scale-115 -translate-y-0.5' : 'hover:scale-105'
          }`;
          if (isSelected) {
            pieceWrap.style.filter = `drop-shadow(0 0 8px ${player.borderHex})`;
          }

          const iconSize = Math.max(20, Math.round(cellSize * 0.75));
          pieceWrap.innerHTML = getPieceSvg(piece.type, player.hex, iconSize);

          // Small player color badge on piece
          const badge = document.createElement('div');
          badge.className =
            'absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 shadow-sm';
          badge.style.backgroundColor = player.hex;
          badge.title = `Jogador: ${player.name}`;
          pieceWrap.appendChild(badge);

          cell.appendChild(pieceWrap);
        }
      }

      // Cell click handler
      cell.addEventListener('click', () => handleCellClick(x, y, mySlot, isMyTurn));

      board.appendChild(cell);
    }
  }
}

// Cell click logic
async function handleCellClick(
  x: number,
  y: number,
  mySlot: number | null,
  isMyTurn: boolean
) {
  if (!currentRoom || !isMyTurn || mySlot === null) return;

  const clickedPiece = currentRoom.pieces.find((p) => p.x === x && p.y === y);

  // If piece selected, check if clicked square is a valid target move
  if (selectedPiece) {
    const matchedMove = currentValidMoves.find((m) => m.x === x && m.y === y);
    if (matchedMove) {
      if (matchedMove.actionType === 'capture' || matchedMove.actionType === 'catapult_strike') {
        playSound('capture');
      } else if (matchedMove.actionType === 'archmage_swap' || matchedMove.promoted) {
        playSound('special');
      } else {
        playSound('move');
      }

      const pieceToMove = selectedPiece;
      selectedPiece = null;
      currentValidMoves = [];

      try {
        await executeGameMove(currentRoom.id, pieceToMove, matchedMove, mySlot);
      } catch (err: any) {
        console.error('Error executing move:', err);
        alert(err.message || 'Erro ao realizar jogada.');
      }
      return;
    }

    // Switch selection to another own piece
    if (clickedPiece && clickedPiece.playerIndex === mySlot) {
      selectedPiece = clickedPiece;
      renderGameScreen();
      return;
    }

    // Deselect
    selectedPiece = null;
    currentValidMoves = [];
    renderGameScreen();
    return;
  }

  // No selection: select clicked piece if it belongs to current player
  if (clickedPiece && clickedPiece.playerIndex === mySlot) {
    selectedPiece = clickedPiece;
    renderGameScreen();
  }
}

// ==========================================
// PLAYERS SIDEBAR RENDERING
// ==========================================
function renderPlayersSidebar(mySlot: number | null) {
  if (!currentRoom) return;

  const countSpan = document.getElementById('game-player-count');
  const aliveSpan = document.getElementById('game-alive-count');
  const list = document.getElementById('game-players-list');

  const alive = currentRoom.players.filter((p) => p.isAlive).length;
  if (countSpan) countSpan.textContent = `${currentRoom.players.length}/${currentRoom.maxPlayers}`;
  if (aliveSpan) aliveSpan.textContent = `Vivos: ${alive}`;

  if (list) {
    list.innerHTML = '';
    currentRoom.players.forEach((p) => {
      const isTurn = currentRoom?.status === 'playing' && currentRoom.currentTurnSlot === p.slot;
      const isMe = mySlot === p.slot;

      const card = document.createElement('div');
      card.className = `relative flex items-center gap-2 p-2 rounded-xl border transition-all duration-200 ${
        !p.isAlive
          ? 'bg-slate-900/40 border-slate-800/60 opacity-50 grayscale'
          : isTurn
          ? 'bg-slate-800/90 border-amber-400 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/50'
          : 'bg-slate-900/70 border-slate-800'
      }`;

      card.innerHTML = `
        <div class="relative flex-shrink-0">
          <div class="w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shadow-inner border border-white/20"
               style="background-color: ${p.hex}; color: ${p.slot === 0 ? '#0f172a' : '#ffffff'};">
            ${p.name.charAt(0).toUpperCase()}
          </div>
          ${p.isHost ? '<span class="absolute -top-1.5 -right-1.5 text-[10px]">👑</span>' : ''}
        </div>
        <div class="flex flex-col min-w-0 flex-1">
          <div class="flex items-center gap-1">
            <span class="text-xs font-semibold text-slate-200 truncate">${p.name}</span>
            ${isMe ? '<span class="text-[9px] px-1 rounded bg-indigo-500/30 text-indigo-300 font-medium">Você</span>' : ''}
          </div>
          <div class="flex items-center gap-1 mt-0.5">
            ${
              !p.isAlive
                ? '<span class="text-[10px] text-red-400 font-medium">💀 Eliminado</span>'
                : p.isCheck
                ? '<span class="text-[10px] text-rose-400 font-bold animate-pulse">⚠️ XEQUE!</span>'
                : isTurn
                ? '<span class="text-[10px] text-amber-400 font-medium animate-pulse">▶ Vez de jogar</span>'
                : '<span class="text-[10px] text-slate-500">Aguardando</span>'
            }
          </div>
        </div>
      `;
      list.appendChild(card);
    });
  }
}

// ==========================================
// MOVE HISTORY RENDERING
// ==========================================
function renderMoveHistory() {
  if (!currentRoom) return;

  const total = document.getElementById('history-total-count');
  const scrollList = document.getElementById('history-scroll-list');
  if (total) total.textContent = `Total: ${currentRoom.history.length}`;

  if (scrollList) {
    if (currentRoom.history.length === 0) {
      scrollList.innerHTML = `
        <div class="flex items-center justify-center h-20 text-slate-600 text-xs italic">
          Nenhuma jogada realizada ainda
        </div>
      `;
    } else {
      scrollList.innerHTML = '';
      currentRoom.history
        .slice()
        .reverse()
        .forEach((rec) => {
          const fromCoord = `${String.fromCharCode(65 + rec.from.x)}${rec.from.y + 1}`;
          const toCoord = `${String.fromCharCode(65 + rec.to.x)}${rec.to.y + 1}`;

          const item = document.createElement('div');
          item.className =
            'flex items-center justify-between p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px]';
          item.innerHTML = `
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full flex-shrink-0" style="background-color: ${rec.playerColor}"></span>
              <span class="font-semibold text-slate-300">${rec.playerName}</span>
            </div>
            <div class="flex items-center gap-1 text-slate-400">
              ${
                rec.actionType === 'catapult_strike'
                  ? `<span class="text-orange-400 font-bold">🎯 Disparo ➔ ${toCoord}</span>`
                  : rec.actionType === 'archmage_swap'
                  ? `<span class="text-purple-400 font-bold">⇄ Troca ${fromCoord}-${toCoord}</span>`
                  : rec.actionType === 'capture'
                  ? `<span class="text-rose-400 font-bold">${fromCoord} x ${toCoord}</span>`
                  : `<span>${fromCoord} ➔ ${toCoord}</span>`
              }
              ${rec.promotedTo ? '<span class="text-amber-400 font-bold">[♛ Dama]</span>' : ''}
            </div>
          `;
          scrollList.appendChild(item);
        });
    }
  }
}

// ==========================================
// EVENT LISTENERS SETUP
// ==========================================
function setupEventListeners() {
  // Brand Home click
  document.getElementById('btn-brand-home')?.addEventListener('click', () => {
    if (!currentRoom) setVisibleScreen('welcome');
  });

  // Sound toggle
  document.getElementById('btn-toggle-sound')?.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    const iconOn = document.getElementById('sound-icon-on');
    const iconOff = document.getElementById('sound-icon-off');
    if (soundEnabled) {
      iconOn?.classList.remove('hidden');
      iconOff?.classList.add('hidden');
    } else {
      iconOn?.classList.add('hidden');
      iconOff?.classList.remove('hidden');
    }
  });

  // Rules Modal open/close
  const modalRules = document.getElementById('modal-rules');
  const openRules = () => modalRules?.classList.remove('hidden');
  const closeRules = () => modalRules?.classList.add('hidden');

  document.getElementById('btn-rules-header')?.addEventListener('click', openRules);
  document.getElementById('btn-open-rules-welcome')?.addEventListener('click', openRules);
  document.getElementById('btn-open-rules-sidebar')?.addEventListener('click', openRules);
  document.getElementById('btn-close-rules')?.addEventListener('click', closeRules);
  document.getElementById('btn-close-rules-bottom')?.addEventListener('click', closeRules);

  // Player count buttons (2P, 4P, 6P, 10P)
  const countButtons = document.querySelectorAll('.btn-player-count');
  countButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      countButtons.forEach((b) => {
        b.className =
          'btn-player-count py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-all';
      });
      btn.className =
        'btn-player-count py-1.5 rounded-lg text-xs font-bold bg-amber-400 text-slate-950 shadow-md transition-all';
      selectedMaxPlayers = parseInt(btn.getAttribute('data-players') || '4', 10);
      const btnCreateText = document.getElementById('btn-create-text');
      if (btnCreateText) btnCreateText.textContent = `Criar Sala (${selectedMaxPlayers}P)`;
    });
  });

  // Create Room
  document.getElementById('btn-create-room')?.addEventListener('click', async () => {
    const inputName = (document.getElementById('input-player-name') as HTMLInputElement)?.value.trim();
    const errorBanner = document.getElementById('welcome-error-msg');
    if (!inputName) {
      if (errorBanner) {
        errorBanner.textContent = 'Por favor, informe seu apelido de comandante!';
        errorBanner.classList.remove('hidden');
      }
      return;
    }
    errorBanner?.classList.add('hidden');
    localStorage.setItem('xadrez2_player_name', inputName);

    const btn = document.getElementById('btn-create-room') as HTMLButtonElement;
    btn.disabled = true;
    const textSpan = document.getElementById('btn-create-text');
    if (textSpan) textSpan.textContent = 'Criando Sala...';

    try {
      const { room } = await createGameRoom(inputName, selectedMaxPlayers);
      sessionStorage.setItem('xadrez2_active_room_id', room.id);
      connectToRoom(room.id);
    } catch (err: any) {
      if (errorBanner) {
        errorBanner.textContent = err.message || 'Erro ao criar sala.';
        errorBanner.classList.remove('hidden');
      }
    } finally {
      btn.disabled = false;
      if (textSpan) textSpan.textContent = `Criar Sala (${selectedMaxPlayers}P)`;
    }
  });

  // Join Room
  document.getElementById('btn-join-room')?.addEventListener('click', async () => {
    const inputName = (document.getElementById('input-player-name') as HTMLInputElement)?.value.trim();
    const inputCode = (document.getElementById('input-room-code') as HTMLInputElement)?.value.trim().toUpperCase();
    const errorBanner = document.getElementById('welcome-error-msg');

    if (!inputName) {
      if (errorBanner) {
        errorBanner.textContent = 'Por favor, informe seu apelido de comandante!';
        errorBanner.classList.remove('hidden');
      }
      return;
    }
    if (!inputCode) {
      if (errorBanner) {
        errorBanner.textContent = 'Digite o código de 6 caracteres da sala.';
        errorBanner.classList.remove('hidden');
      }
      return;
    }
    errorBanner?.classList.add('hidden');
    localStorage.setItem('xadrez2_player_name', inputName);

    const btn = document.getElementById('btn-join-room') as HTMLButtonElement;
    btn.disabled = true;
    const textSpan = document.getElementById('btn-join-text');
    if (textSpan) textSpan.textContent = 'Entrando...';

    try {
      const { room } = await joinGameRoom(inputCode, inputName);
      sessionStorage.setItem('xadrez2_active_room_id', room.id);
      connectToRoom(room.id);
    } catch (err: any) {
      if (errorBanner) {
        errorBanner.textContent = err.message || 'Sala não encontrada ou cheia.';
        errorBanner.classList.remove('hidden');
      }
    } finally {
      btn.disabled = false;
      if (textSpan) textSpan.textContent = 'Entrar na Sala';
    }
  });

  // Copy Room Code
  document.getElementById('btn-copy-code')?.addEventListener('click', async () => {
    if (!currentRoom) return;
    try {
      await navigator.clipboard.writeText(currentRoom.roomCode);
      const text = document.getElementById('copy-text');
      const icon = document.getElementById('copy-icon');
      if (text) text.textContent = 'Copiado!';
      if (icon) icon.textContent = '✅';
      setTimeout(() => {
        if (text) text.textContent = 'Copiar';
        if (icon) icon.textContent = '📋';
      }, 2000);
    } catch {
      // Fallback
    }
  });

  // Start Game (Host)
  document.getElementById('btn-start-game')?.addEventListener('click', async () => {
    if (!currentRoom || currentRoom.players.length < 2) return;
    try {
      const btn = document.getElementById('btn-start-game') as HTMLButtonElement;
      btn.disabled = true;
      const text = document.getElementById('btn-start-text');
      if (text) text.textContent = 'Iniciando partida...';
      await startGameRoom(currentRoom.id, myPlayerId);
    } catch (err: any) {
      alert(err.message || 'Erro ao iniciar partida');
    }
  });

  // Leave Room (Lobby and Header)
  const handleLeave = async () => {
    if (currentRoom) {
      await leaveGameRoom(currentRoom.id, myPlayerId);
    }
    if (unsubscribeRoom) {
      unsubscribeRoom();
      unsubscribeRoom = null;
    }
    sessionStorage.removeItem('xadrez2_active_room_id');
    currentRoom = null;
    selectedPiece = null;
    currentValidMoves = [];
    setVisibleScreen('welcome');
  };

  document.getElementById('btn-leave-lobby')?.addEventListener('click', handleLeave);
  document.getElementById('btn-leave-top')?.addEventListener('click', handleLeave);

  // Zoom controls
  const zoomVal = document.getElementById('zoom-value');
  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    boardZoom = Math.min(1.4, +(boardZoom + 0.15).toFixed(2));
    if (zoomVal) zoomVal.textContent = `${Math.round(boardZoom * 100)}%`;
    renderGameScreen();
  });
  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    boardZoom = Math.max(0.65, +(boardZoom - 0.15).toFixed(2));
    if (zoomVal) zoomVal.textContent = `${Math.round(boardZoom * 100)}%`;
    renderGameScreen();
  });
  document.getElementById('btn-zoom-reset')?.addEventListener('click', () => {
    boardZoom = 1.0;
    if (zoomVal) zoomVal.textContent = '100%';
    renderGameScreen();
  });
}

// Start application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
