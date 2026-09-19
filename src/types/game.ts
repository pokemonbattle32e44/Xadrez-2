export const BOARD_SIZE = 20;

export type PieceType =
  | 'pawn'
  | 'rook'
  | 'knight'
  | 'bishop'
  | 'queen'
  | 'king'
  | 'goat'      // Cabra: 2 squares diagonally, jumps/stays on mountains
  | 'archmage'  // Arquimago: 1 sq any dir, can swap with adjacent ally without attacking
  | 'catapult'  // Catapulta: moves 1 forward or sides. Special attack: captures at exact 3 sq in straight line jumping over
  | 'dragon';   // Dragão: moves like rook up to 3 squares, flies over 1 piece

export interface Position {
  x: number; // 0 to BOARD_SIZE - 1
  y: number; // 0 to BOARD_SIZE - 1
}

export interface Piece {
  id: string;
  type: PieceType;
  ownerId: string; // playerId (e.g., 'p1', 'p2', etc.)
  playerIndex: number; // 0 to N-1
  x: number;
  y: number;
  hasMoved?: boolean;
}

export interface Player {
  id: string; // auth uid or local player id
  slot: number; // player slot 0 to N-1
  name: string;
  color: string;
  hex: string;
  colorName: string;
  borderHex: string;
  bgHex: string;
  isAlive: boolean;
  isCheck: boolean;
  score: number;
  lastActive: number;
  isHost: boolean;
}

export interface Mountain {
  x: number;
  y: number;
}

export interface MoveRecord {
  id: string;
  turnNumber: number;
  playerSlot: number;
  playerName: string;
  playerColor: string;
  pieceType: PieceType;
  from: Position;
  to: Position;
  actionType: 'move' | 'capture' | 'catapult_strike' | 'archmage_swap' | 'promotion';
  capturedPiece?: PieceType;
  promotedTo?: PieceType;
  note?: string;
  timestamp: number;
}

export interface GameRoom {
  id: string;
  roomCode: string;
  status: 'lobby' | 'playing' | 'finished';
  hostId: string;
  maxPlayers: number;
  currentTurnSlot: number; // Slot of player whose turn it is
  turnDeadline?: number;
  players: Player[];
  boardSize: number; // 20
  mountains: Mountain[];
  pieces: Piece[];
  history: MoveRecord[];
  winnerSlot: number | null;
  winnerName?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ValidMove {
  x: number;
  y: number;
  actionType: 'move' | 'capture' | 'catapult_strike' | 'archmage_swap';
  swappedPieceId?: string;
  capturedPieceId?: string;
  promoted?: boolean;
}

export interface PlayerTheme {
  name: string;
  hex: string;
  textHex: string;
  bgHex: string;
  borderHex: string;
  glowHex: string;
}

export const PLAYER_PALETTES: PlayerTheme[] = [
  { name: 'Branco Pérola', hex: '#F1F5F9', textHex: '#0F172A', bgHex: '#E2E8F0', borderHex: '#94A3B8', glowHex: 'rgba(241, 245, 249, 0.6)' },
  { name: 'Ônix Negro', hex: '#1E293B', textHex: '#F8FAFC', bgHex: '#334155', borderHex: '#475569', glowHex: 'rgba(30, 41, 59, 0.7)' },
  { name: 'Rubi Carmim', hex: '#DC2626', textHex: '#FFFFFF', bgHex: '#EF4444', borderHex: '#B91C1C', glowHex: 'rgba(220, 38, 38, 0.6)' },
  { name: 'Safira Real', hex: '#2563EB', textHex: '#FFFFFF', bgHex: '#3B82F6', borderHex: '#1D4ED8', glowHex: 'rgba(37, 99, 235, 0.6)' },
  { name: 'Esmeralda', hex: '#059669', textHex: '#FFFFFF', bgHex: '#10B981', borderHex: '#047857', glowHex: 'rgba(5, 150, 105, 0.6)' },
  { name: 'Âmbar Dourado', hex: '#D97706', textHex: '#FFFFFF', bgHex: '#F59E0B', borderHex: '#B45309', glowHex: 'rgba(217, 119, 6, 0.6)' },
  { name: 'Ametista Mística', hex: '#9333EA', textHex: '#FFFFFF', bgHex: '#A855F7', borderHex: '#7E22CE', glowHex: 'rgba(147, 51, 234, 0.6)' },
  { name: 'Ciano Glacial', hex: '#0891B2', textHex: '#FFFFFF', bgHex: '#06B6D4', borderHex: '#0E7490', glowHex: 'rgba(8, 145, 178, 0.6)' },
  { name: 'Rosa Magenta', hex: '#DB2777', textHex: '#FFFFFF', bgHex: '#EC4899', borderHex: '#BE185D', glowHex: 'rgba(219, 39, 119, 0.6)' },
  { name: 'Menta Lima', hex: '#65A30D', textHex: '#FFFFFF', bgHex: '#84CC16', borderHex: '#4D7C0F', glowHex: 'rgba(101, 163, 13, 0.6)' },
];
