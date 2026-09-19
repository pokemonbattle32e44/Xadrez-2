import {
  db,
  ensurePlayerSessionId,
} from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
} from 'firebase/firestore';
import {
  GameRoom,
  Player,
  Piece,
  ValidMove,
  MoveRecord,
  BOARD_SIZE,
  PLAYER_PALETTES,
} from '../types/game';
import {
  generateMountains,
  initializePieces,
  getValidMoves,
  simulateMove,
  isPlayerInCheck,
  isPlayerInCheckmate,
} from './rules';

const ROOMS_COLLECTION = 'rooms';

// Generate a random 6-character room code
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Subscribe to room updates in real-time
export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: GameRoom | null) => void,
  onError: (err: Error) => void
): Unsubscribe {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(
    roomRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }
      onUpdate(snapshot.data() as GameRoom);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      onError(err);
    }
  );
}

// Create a new room with host player
export async function createGameRoom(
  hostName: string,
  maxPlayers: number
): Promise<{ room: GameRoom; playerId: string }> {
  const playerId = await ensurePlayerSessionId();
  const roomCode = generateRoomCode();
  const roomId = `room_${roomCode}`;

  const hostPalette = PLAYER_PALETTES[0];

  const hostPlayer: Player = {
    id: playerId,
    slot: 0,
    name: hostName.trim() || 'Comandante Branco',
    color: hostPalette.hex,
    hex: hostPalette.hex,
    colorName: hostPalette.name,
    borderHex: hostPalette.borderHex,
    bgHex: hostPalette.bgHex,
    isAlive: true,
    isCheck: false,
    score: 0,
    lastActive: Date.now(),
    isHost: true,
  };

  const newRoom: GameRoom = {
    id: roomId,
    roomCode,
    status: 'lobby',
    hostId: playerId,
    maxPlayers: Math.min(10, Math.max(2, maxPlayers)),
    currentTurnSlot: 0,
    players: [hostPlayer],
    boardSize: BOARD_SIZE,
    mountains: generateMountains(),
    pieces: [],
    history: [],
    winnerSlot: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(doc(db, ROOMS_COLLECTION, roomId), newRoom);
  return { room: newRoom, playerId };
}

// Join an existing room
export async function joinGameRoom(
  roomCode: string,
  playerName: string
): Promise<{ room: GameRoom; playerId: string }> {
  const playerId = await ensurePlayerSessionId();
  const roomId = `room_${roomCode.toUpperCase().trim()}`;
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);

  const snap = await getDoc(roomRef);
  if (!snap.exists()) {
    throw new Error(`Sala com código "${roomCode}" não foi encontrada.`);
  }

  const room = snap.data() as GameRoom;

  // Check if player is already inside (reconnect case)
  const existingPlayer = room.players.find((p) => p.id === playerId);
  if (existingPlayer) {
    // Just update active timestamp
    existingPlayer.lastActive = Date.now();
    await updateDoc(roomRef, {
      players: room.players,
      updatedAt: Date.now(),
    });
    return { room, playerId };
  }

  if (room.status !== 'lobby') {
    throw new Error('A partida desta sala já foi iniciada.');
  }

  if (room.players.length >= room.maxPlayers) {
    throw new Error(`A sala atingiu o limite máximo de ${room.maxPlayers} jogadores.`);
  }

  const slot = room.players.length;
  const palette = PLAYER_PALETTES[slot % PLAYER_PALETTES.length];

  const newPlayer: Player = {
    id: playerId,
    slot,
    name: playerName.trim() || `Comandante ${palette.name}`,
    color: palette.hex,
    hex: palette.hex,
    colorName: palette.name,
    borderHex: palette.borderHex,
    bgHex: palette.bgHex,
    isAlive: true,
    isCheck: false,
    score: 0,
    lastActive: Date.now(),
    isHost: false,
  };

  const updatedPlayers = [...room.players, newPlayer];

  await updateDoc(roomRef, {
    players: updatedPlayers,
    updatedAt: Date.now(),
  });

  room.players = updatedPlayers;
  return { room, playerId };
}

// Start game from lobby (Host only)
export async function startGameRoom(roomId: string, hostId: string): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error('Sala não encontrada');

  const room = snap.data() as GameRoom;
  if (room.hostId !== hostId) {
    throw new Error('Apenas o anfitrião pode iniciar a partida.');
  }
  if (room.players.length < 2) {
    throw new Error('São necessários pelo menos 2 jogadores para iniciar.');
  }

  // Generate initial pieces for all connected players
  const initialPieces = initializePieces(room.players);

  await updateDoc(roomRef, {
    status: 'playing',
    pieces: initialPieces,
    currentTurnSlot: 0,
    history: [],
    updatedAt: Date.now(),
  });
}

// Execute move and handle turn rotation, check, checkmate, and elimination
export async function executeGameMove(
  roomId: string,
  piece: Piece,
  move: ValidMove,
  actingPlayerSlot: number
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) throw new Error('Sala não encontrada');

  const room = snap.data() as GameRoom;

  // Turn validation
  if (room.status !== 'playing') {
    throw new Error('A partida não está em andamento.');
  }
  if (room.currentTurnSlot !== actingPlayerSlot) {
    throw new Error('Não é o seu turno!');
  }
  if (piece.playerIndex !== actingPlayerSlot) {
    throw new Error('Você só pode mover suas próprias peças.');
  }

  // Validate that move is in legal moves
  const legalMoves = getValidMoves(piece, room.pieces, room.mountains);
  const matched = legalMoves.find(
    (m) => m.x === move.x && m.y === move.y && m.actionType === move.actionType
  );
  if (!matched) {
    throw new Error('Movimento inválido pelas regras do Xadrez 2!');
  }

  // Execute simulation to get new pieces list
  let nextPieces = simulateMove(piece, matched, room.pieces);

  // Record move history
  const actingPlayer = room.players.find((p) => p.slot === actingPlayerSlot)!;
  const capturedPiece = matched.capturedPieceId
    ? room.pieces.find((p) => p.id === matched.capturedPieceId)
    : undefined;

  const moveRecord: MoveRecord = {
    id: `move_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    turnNumber: room.history.length + 1,
    playerSlot: actingPlayerSlot,
    playerName: actingPlayer.name,
    playerColor: actingPlayer.color,
    pieceType: piece.type,
    from: { x: piece.x, y: piece.y },
    to: { x: matched.x, y: matched.y },
    actionType: matched.actionType,
    capturedPiece: capturedPiece?.type,
    promotedTo: matched.promoted ? 'queen' : undefined,
    timestamp: Date.now(),
  };

  // Evaluate Check and Checkmate for all players
  const updatedPlayers = room.players.map((pl) => {
    if (!pl.isAlive) return pl;

    const inCheck = isPlayerInCheck(pl.slot, nextPieces, room.mountains);
    const inMate = isPlayerInCheckmate(pl.slot, nextPieces, room.mountains);

    // If checkmated, eliminate the player!
    if (inMate) {
      // Remove or deactivate all pieces of this checkmated player
      nextPieces = nextPieces.filter((p) => p.playerIndex !== pl.slot);
      return {
        ...pl,
        isAlive: false,
        isCheck: true,
      };
    }

    return {
      ...pl,
      isCheck: inCheck,
    };
  });

  // Calculate Next Turn Slot
  // Must rotate only to players who are ALIVE
  const alivePlayers = updatedPlayers.filter((p) => p.isAlive);

  let nextStatus: 'playing' | 'finished' = 'playing';
  let winnerSlot: number | null = null;
  let winnerName: string | undefined = undefined;

  if (alivePlayers.length <= 1) {
    // Game over! Winner declared
    nextStatus = 'finished';
    if (alivePlayers.length === 1) {
      winnerSlot = alivePlayers[0].slot;
      winnerName = alivePlayers[0].name;
    }
  }

  // Find next alive player slot in cyclical order
  let nextSlot = room.currentTurnSlot;
  if (nextStatus === 'playing') {
    const totalSlots = room.players.length;
    for (let step = 1; step <= totalSlots; step++) {
      const candidateSlot = (room.currentTurnSlot + step) % totalSlots;
      const candidatePlayer = updatedPlayers.find((p) => p.slot === candidateSlot);
      if (candidatePlayer && candidatePlayer.isAlive) {
        nextSlot = candidateSlot;
        break;
      }
    }
  }

  await updateDoc(roomRef, {
    pieces: nextPieces,
    players: updatedPlayers,
    currentTurnSlot: nextSlot,
    history: [...room.history, moveRecord],
    status: nextStatus,
    winnerSlot: winnerSlot,
    winnerName: winnerName,
    updatedAt: Date.now(),
  });
}

// Leave room
export async function leaveGameRoom(roomId: string, playerId: string): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as GameRoom;
  if (room.status === 'lobby') {
    const filteredPlayers = room.players.filter((p) => p.id !== playerId);
    if (filteredPlayers.length === 0) {
      // Room empty, can be left or reset
      return;
    }
    // If host left, pass host to next player
    if (room.hostId === playerId && filteredPlayers.length > 0) {
      filteredPlayers[0].isHost = true;
      await updateDoc(roomRef, {
        hostId: filteredPlayers[0].id,
        players: filteredPlayers,
        updatedAt: Date.now(),
      });
      return;
    }
    await updateDoc(roomRef, {
      players: filteredPlayers,
      updatedAt: Date.now(),
    });
  }
}
