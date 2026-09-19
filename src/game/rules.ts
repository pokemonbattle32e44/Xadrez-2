import { Piece, PieceType, Position, Mountain, ValidMove, Player } from '../types/game';

export const BOARD_SIZE = 20;
export const CENTER_MIN = 8;
export const CENTER_MAX = 11; // 8,9,10,11 is the central 4x4 zone

// Check if square is inside board boundaries
export function isInBounds(x: number, y: number): boolean {
  return x >= 0 && x < BOARD_SIZE && y >= 0 && y < BOARD_SIZE;
}

// Check if square is a mountain
export function isMountain(x: number, y: number, mountains: Mountain[]): boolean {
  return mountains.some((m) => m.x === x && m.y === y);
}

// Generate Mountain layout balanced around the board (not covering starting bases)
export function generateMountains(): Mountain[] {
  const list: Mountain[] = [];
  // Place strategic mountain clusters around quadrants and outer central rings
  // Avoiding player starting zones (edges) and immediate centers
  const fixedPositions: [number, number][] = [
    // Outer ring barriers
    [5, 5], [5, 6], [6, 5],
    [14, 5], [14, 6], [13, 5],
    [5, 14], [5, 13], [6, 14],
    [14, 14], [14, 13], [13, 14],
    // Midfield peaks
    [9, 6], [10, 6],
    [9, 13], [10, 13],
    [6, 9], [6, 10],
    [13, 9], [13, 10],
    // Strategic central obstacles
    [7, 7], [12, 7], [7, 12], [12, 12],
    [4, 10], [15, 9]
  ];

  for (const [x, y] of fixedPositions) {
    if (!list.some((m) => m.x === x && m.y === y)) {
      list.push({ x, y });
    }
  }
  return list;
}

// Base spawn locations for 2 to 10 players
// For 20x20 board, players are positioned around the perimeter pointing towards the center (9.5, 9.5)
export interface SpawnConfig {
  dirX: number; // Forward direction towards center
  dirY: number;
  startX: number;
  startY: number;
  layout: PieceType[]; // 10 pieces per army backline + front pawns
}

export function getSpawnConfig(slot: number, totalPlayers: number): {
  pawns: Position[];
  royals: { type: PieceType; pos: Position }[];
  forwardDir: { dx: number; dy: number };
} {
  // If 2 players: classic opposite side (South vs North)
  if (totalPlayers === 2) {
    if (slot === 0) {
      // South (bottom rows: y=19 royals, y=18 pawns)
      return generateEdgeFormation(5, 19, 0, -1);
    } else {
      // North (top rows: y=0 royals, y=1 pawns)
      return generateEdgeFormation(5, 0, 0, 1);
    }
  }

  // 3 or 4 players
  if (totalPlayers === 3 || totalPlayers === 4) {
    // 0: South (bottom)
    // 1: North (top)
    // 2: West (left)
    // 3: East (right)
    const positions = [
      { startX: 5, startY: 19, dx: 0, dy: -1 }, // South
      { startX: 5, startY: 0, dx: 0, dy: 1 },   // North
      { startX: 0, startY: 5, dx: 1, dy: 0 },   // West
      { startX: 19, startY: 5, dx: -1, dy: 0 },  // East
    ];
    const cfg = positions[slot % 4];
    return generateEdgeFormation(cfg.startX, cfg.startY, cfg.dx, cfg.dy);
  }

  // 5 to 10 players: distributed around the 4 borders and corners
  const slotConfigs: { startX: number; startY: number; dx: number; dy: number }[] = [
    { startX: 5, startY: 19, dx: 0, dy: -1 },   // 0: Bottom Center
    { startX: 5, startY: 0, dx: 0, dy: 1 },     // 1: Top Center
    { startX: 0, startY: 5, dx: 1, dy: 0 },     // 2: Left Center
    { startX: 19, startY: 5, dx: -1, dy: 0 },   // 3: Right Center
    { startX: 0, startY: 16, dx: 1, dy: -1 },   // 4: Bottom-Left
    { startX: 16, startY: 0, dx: -1, dy: 1 },   // 5: Top-Right
    { startX: 0, startY: 0, dx: 1, dy: 1 },     // 6: Top-Left
    { startX: 16, startY: 19, dx: -1, dy: -1 }, // 7: Bottom-Right
    { startX: 10, startY: 19, dx: 0, dy: -1 },  // 8: Bottom-Mid-Right
    { startX: 10, startY: 0, dx: 0, dy: 1 },    // 9: Top-Mid-Right
  ];

  // Adjust coordinates dynamically based on slot
  const mapped = getDynamicEdgeFormation(slot, totalPlayers);
  return mapped;
}

function generateEdgeFormation(
  startX: number,
  startY: number,
  forwardDx: number,
  forwardDy: number
): {
  pawns: Position[];
  royals: { type: PieceType; pos: Position }[];
  forwardDir: { dx: number; dy: number };
} {
  // 10 royals in back row:
  // [Rook, Knight, Bishop, Goat, Queen, King, Archmage, Dragon, Catapult, Rook]
  const backlineTypes: PieceType[] = [
    'rook',
    'knight',
    'bishop',
    'goat',
    'queen',
    'king',
    'archmage',
    'dragon',
    'catapult',
    'rook',
  ];

  const pawns: Position[] = [];
  const royals: { type: PieceType; pos: Position }[] = [];

  // Perpendicular vector for the row
  const perpX = forwardDy === 0 ? 0 : 1;
  const perpY = forwardDx === 0 ? 0 : 1;

  for (let i = 0; i < 10; i++) {
    const rx = startX + i * perpX;
    const ry = startY + i * perpY;
    royals.push({
      type: backlineTypes[i],
      pos: { x: rx, y: ry },
    });

    // Pawns in front row
    pawns.push({
      x: rx + forwardDx,
      y: ry + forwardDy,
    });
  }

  return { pawns, royals, forwardDir: { dx: forwardDx, dy: forwardDy } };
}

function getDynamicEdgeFormation(slot: number, total: number) {
  // Distribute along the perimeter of the 20x20 board
  // 10 armies can comfortably sit on perimeter segments (each takes 8-10 squares wide)
  // Let's create an elegant ring layout with 8 pieces per army or 10 pieces
  // Backline: 8 special pieces: [Rook, Knight, Goat, Queen, King, Archmage, Dragon, Catapult]
  // Pawns: 8 pawns in front
  const types8: PieceType[] = ['rook', 'goat', 'knight', 'queen', 'king', 'archmage', 'dragon', 'catapult'];

  // Calculate perimeter segment for slot out of total
  // Total perimeter = 4 sides * 20 = 80 cells
  // Each player takes an 8-wide block
  const perimeterAngles = (2 * Math.PI * slot) / total;
  // Radius ~ 8.5 from center (9.5, 9.5)
  const cx = 9.5;
  const cy = 9.5;
  
  // Assign designated edge or quadrant:
  // We can assign fixed well-spaced 8-wide strips:
  const anchorPoints = [
    { x: 6, y: 19, fdx: 0, fdy: -1, pdx: 1, pdy: 0 }, // S center
    { x: 6, y: 0, fdx: 0, fdy: 1, pdx: 1, pdy: 0 },   // N center
    { x: 0, y: 6, fdx: 1, fdy: 0, pdx: 0, pdy: 1 },   // W center
    { x: 19, y: 6, fdx: -1, fdy: 0, pdx: 0, pdy: 1 }, // E center
    { x: 0, y: 12, fdx: 1, fdy: 0, pdx: 0, pdy: 1 },  // W South
    { x: 19, y: 12, fdx: -1, fdy: 0, pdx: 0, pdy: 1 },// E South
    { x: 0, y: 0, fdx: 1, fdy: 1, pdx: 1, pdy: 0 },   // NW
    { x: 12, y: 0, fdx: 0, fdy: 1, pdx: 1, pdy: 0 },  // NE
    { x: 0, y: 19, fdx: 1, fdy: -1, pdx: 1, pdy: 0 }, // SW
    { x: 12, y: 19, fdx: 0, fdy: -1, pdx: 1, pdy: 0 },// SE
  ];

  const anchor = anchorPoints[slot % anchorPoints.length];
  const pawns: Position[] = [];
  const royals: { type: PieceType; pos: Position }[] = [];

  for (let i = 0; i < 8; i++) {
    const rx = Math.max(0, Math.min(BOARD_SIZE - 1, anchor.x + i * anchor.pdx));
    const ry = Math.max(0, Math.min(BOARD_SIZE - 1, anchor.y + i * anchor.pdy));
    royals.push({
      type: types8[i],
      pos: { x: rx, y: ry },
    });

    const px = Math.max(0, Math.min(BOARD_SIZE - 1, rx + anchor.fdx));
    const py = Math.max(0, Math.min(BOARD_SIZE - 1, ry + anchor.fdy));
    pawns.push({ x: px, y: py });
  }

  return { pawns, royals, forwardDir: { dx: anchor.fdx, dy: anchor.fdy } };
}

// Generate all initial pieces for a game
export function initializePieces(players: Player[]): Piece[] {
  const pieces: Piece[] = [];
  const total = players.length;

  players.forEach((player) => {
    const formation = getSpawnConfig(player.slot, total);

    // Royals
    formation.royals.forEach((r, idx) => {
      pieces.push({
        id: `p_${player.slot}_r_${idx}_${r.type}`,
        type: r.type,
        ownerId: player.id,
        playerIndex: player.slot,
        x: r.pos.x,
        y: r.pos.y,
        hasMoved: false,
      });
    });

    // Pawns
    formation.pawns.forEach((p, idx) => {
      pieces.push({
        id: `p_${player.slot}_pawn_${idx}`,
        type: 'pawn',
        ownerId: player.id,
        playerIndex: player.slot,
        x: p.x,
        y: p.y,
        hasMoved: false,
      });
    });
  });

  return pieces;
}

// Pawn promotion rule:
// "Quando um Peão atinge o centro do tabuleiro ou a metade do caminho em direção ao centro, ele é promovido automaticamente a uma Dama"
// The center of the 20x20 board is from index 8 to 11 (central 4x4 squares).
export function shouldPromotePawn(x: number, y: number): boolean {
  // Center 6x6 zone (7 to 12) or half-way mark
  // Central core: 8, 9, 10, 11
  const isCenter = x >= 8 && x <= 11 && y >= 8 && y <= 11;
  return isCenter;
}

// Valid moves computation for each piece type
export function getValidMoves(
  piece: Piece,
  allPieces: Piece[],
  mountains: Mountain[]
): ValidMove[] {
  const validMoves: ValidMove[] = [];
  const pieceAt = (x: number, y: number): Piece | undefined =>
    allPieces.find((p) => p.x === x && p.y === y);

  const isMt = (x: number, y: number): boolean => isMountain(x, y, mountains);

  switch (piece.type) {
    case 'pawn': {
      // Moves towards the center (9.5, 9.5)
      const cx = 9.5;
      const cy = 9.5;
      const dxToCenter = Math.sign(cx - piece.x);
      const dyToCenter = Math.sign(cy - piece.y);

      // Main forward directions (can be diagonal if not aligned)
      const dirs: Position[] = [];
      if (dxToCenter !== 0) dirs.push({ x: piece.x + dxToCenter, y: piece.y });
      if (dyToCenter !== 0) dirs.push({ x: piece.x, y: piece.y + dyToCenter });
      if (dxToCenter !== 0 && dyToCenter !== 0) {
        dirs.push({ x: piece.x + dxToCenter, y: piece.y + dyToCenter });
      }

      // Forward 1 step if empty and not mountain
      dirs.forEach((target) => {
        if (isInBounds(target.x, target.y) && !isMt(target.x, target.y)) {
          const occ = pieceAt(target.x, target.y);
          if (!occ) {
            validMoves.push({
              x: target.x,
              y: target.y,
              actionType: 'move',
              promoted: shouldPromotePawn(target.x, target.y),
            });
          }
        }
      });

      // Diagonal captures: all 4 diagonals for flexibility on multiplayer expanded board
      const diagDeltas = [
        [-1, -1], [1, -1], [-1, 1], [1, 1],
      ];
      diagDeltas.forEach(([ddx, ddy]) => {
        const tx = piece.x + ddx;
        const ty = piece.y + ddy;
        if (isInBounds(tx, ty) && !isMt(tx, ty)) {
          const occ = pieceAt(tx, ty);
          if (occ && occ.playerIndex !== piece.playerIndex) {
            validMoves.push({
              x: tx,
              y: ty,
              actionType: 'capture',
              capturedPieceId: occ.id,
              promoted: shouldPromotePawn(tx, ty),
            });
          }
        }
      });
      break;
    }

    case 'rook': {
      // Standard rook: straight lines in 4 directions, cannot cross/stop on mountains
      const dirs = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
      ];
      dirs.forEach(([dx, dy]) => {
        for (let step = 1; step < BOARD_SIZE; step++) {
          const tx = piece.x + dx * step;
          const ty = piece.y + dy * step;
          if (!isInBounds(tx, ty) || isMt(tx, ty)) break;

          const occ = pieceAt(tx, ty);
          if (!occ) {
            validMoves.push({ x: tx, y: ty, actionType: 'move' });
          } else {
            if (occ.playerIndex !== piece.playerIndex) {
              validMoves.push({
                x: tx,
                y: ty,
                actionType: 'capture',
                capturedPieceId: occ.id,
              });
            }
            break; // blocked
          }
        }
      });
      break;
    }

    case 'bishop': {
      // Diagonal lines, cannot cross/stop on mountains
      const dirs = [
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];
      dirs.forEach(([dx, dy]) => {
        for (let step = 1; step < BOARD_SIZE; step++) {
          const tx = piece.x + dx * step;
          const ty = piece.y + dy * step;
          if (!isInBounds(tx, ty) || isMt(tx, ty)) break;

          const occ = pieceAt(tx, ty);
          if (!occ) {
            validMoves.push({ x: tx, y: ty, actionType: 'move' });
          } else {
            if (occ.playerIndex !== piece.playerIndex) {
              validMoves.push({
                x: tx,
                y: ty,
                actionType: 'capture',
                capturedPieceId: occ.id,
              });
            }
            break;
          }
        }
      });
      break;
    }

    case 'knight': {
      // L-shape: Jumps over everything including mountains, but CANNOT land on mountains
      const knightMoves = [
        [1, 2], [2, 1], [-1, 2], [-2, 1],
        [1, -2], [2, -1], [-1, -2], [-2, -1],
      ];
      knightMoves.forEach(([dx, dy]) => {
        const tx = piece.x + dx;
        const ty = piece.y + dy;
        if (isInBounds(tx, ty) && !isMt(tx, ty)) {
          const occ = pieceAt(tx, ty);
          if (!occ) {
            validMoves.push({ x: tx, y: ty, actionType: 'move' });
          } else if (occ.playerIndex !== piece.playerIndex) {
            validMoves.push({
              x: tx,
              y: ty,
              actionType: 'capture',
              capturedPieceId: occ.id,
            });
          }
        }
      });
      break;
    }

    case 'queen': {
      // Rook + Bishop moves
      const dirs = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];
      dirs.forEach(([dx, dy]) => {
        for (let step = 1; step < BOARD_SIZE; step++) {
          const tx = piece.x + dx * step;
          const ty = piece.y + dy * step;
          if (!isInBounds(tx, ty) || isMt(tx, ty)) break;

          const occ = pieceAt(tx, ty);
          if (!occ) {
            validMoves.push({ x: tx, y: ty, actionType: 'move' });
          } else {
            if (occ.playerIndex !== piece.playerIndex) {
              validMoves.push({
                x: tx,
                y: ty,
                actionType: 'capture',
                capturedPieceId: occ.id,
              });
            }
            break;
          }
        }
      });
      break;
    }

    case 'king': {
      // 1 square in any direction, cannot step on mountain
      const dirs = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];
      dirs.forEach(([dx, dy]) => {
        const tx = piece.x + dx;
        const ty = piece.y + dy;
        if (isInBounds(tx, ty) && !isMt(tx, ty)) {
          const occ = pieceAt(tx, ty);
          if (!occ) {
            validMoves.push({ x: tx, y: ty, actionType: 'move' });
          } else if (occ.playerIndex !== piece.playerIndex) {
            validMoves.push({
              x: tx,
              y: ty,
              actionType: 'capture',
              capturedPieceId: occ.id,
            });
          }
        }
      });
      break;
    }

    // ==========================================
    // NOVAS PEÇAS PERSONALIZADAS DO XADREZ 2
    // ==========================================

    case 'goat': {
      // CABRA:
      // - Move-se exatamente 2 casas na diagonal.
      // - Pula e pode permanecer em cima das casas de Montanha!
      // - (Única peça que pode parar sobre Montanha ou atravessá-la)
      const goatDeltas = [
        [2, 2], [2, -2], [-2, 2], [-2, -2],
      ];
      goatDeltas.forEach(([dx, dy]) => {
        const tx = piece.x + dx;
        const ty = piece.y + dy;
        if (isInBounds(tx, ty)) {
          // Goat CAN land on mountain!
          const occ = pieceAt(tx, ty);
          if (!occ) {
            validMoves.push({ x: tx, y: ty, actionType: 'move' });
          } else if (occ.playerIndex !== piece.playerIndex) {
            validMoves.push({
              x: tx,
              y: ty,
              actionType: 'capture',
              capturedPieceId: occ.id,
            });
          }
        }
      });
      break;
    }

    case 'archmage': {
      // ARQUIMAGO:
      // - Move-se 1 casa em qualquer direção, como o Rei.
      // - Habilidade especial: pode permutar (trocar de posição) com qualquer peça aliada adjacente
      //   sem gastar um turno de ataque.
      // - Não pode andar na montanha.
      const dirs = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
        [1, 1], [1, -1], [-1, 1], [-1, -1],
      ];
      dirs.forEach(([dx, dy]) => {
        const tx = piece.x + dx;
        const ty = piece.y + dy;
        if (isInBounds(tx, ty) && !isMt(tx, ty)) {
          const occ = pieceAt(tx, ty);
          if (!occ) {
            validMoves.push({ x: tx, y: ty, actionType: 'move' });
          } else if (occ.playerIndex !== piece.playerIndex) {
            validMoves.push({
              x: tx,
              y: ty,
              actionType: 'capture',
              capturedPieceId: occ.id,
            });
          } else if (occ.playerIndex === piece.playerIndex) {
            // Habilidade especial: permutar com peça aliada adjacente
            validMoves.push({
              x: tx,
              y: ty,
              actionType: 'archmage_swap',
              swappedPieceId: occ.id,
            });
          }
        }
      });
      break;
    }

    case 'catapult': {
      // CATAPULTA:
      // - Move-se 1 casa para frente ou para os lados.
      // - Habilidade especial: pode capturar peças inimigas à distância, exatamente a 3 casas em linha reta,
      //   saltando por cima de qualquer peça intermediária, sem mover a Catapulta do lugar.
      const stepDirs = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
      ];
      // Regular move (1 sq orthogonally)
      stepDirs.forEach(([dx, dy]) => {
        const tx = piece.x + dx;
        const ty = piece.y + dy;
        if (isInBounds(tx, ty) && !isMt(tx, ty)) {
          const occ = pieceAt(tx, ty);
          if (!occ) {
            validMoves.push({ x: tx, y: ty, actionType: 'move' });
          }
        }
      });

      // Special Strike: Exactly 3 squares in orthogonal straight line
      stepDirs.forEach(([dx, dy]) => {
        const tx = piece.x + dx * 3;
        const ty = piece.y + dy * 3;
        if (isInBounds(tx, ty)) {
          const occ = pieceAt(tx, ty);
          // Can strike an enemy piece at distance 3, jumping over obstacles/mountains/pieces
          if (occ && occ.playerIndex !== piece.playerIndex) {
            validMoves.push({
              x: tx,
              y: ty,
              actionType: 'catapult_strike',
              capturedPieceId: occ.id,
            });
          }
        }
      });
      break;
    }

    case 'dragon': {
      // DRAGÃO:
      // - Move-se como a Torre, em linhas retas, limitado a até 3 casas de distância.
      // - Habilidade especial: pode voar por cima de UMA ÚNICA peça inimiga ou aliada em seu caminho.
      // - Não pode parar em montanhas.
      const dirs = [
        [0, 1], [0, -1], [1, 0], [-1, 0],
      ];
      dirs.forEach(([dx, dy]) => {
        let jumpedPieces = 0;
        for (let step = 1; step <= 3; step++) {
          const tx = piece.x + dx * step;
          const ty = piece.y + dy * step;
          if (!isInBounds(tx, ty)) break;

          const occ = pieceAt(tx, ty);
          const mt = isMt(tx, ty);

          if (step < 3) {
            // Intermediate square
            if (mt) {
              // Dragon flies over mountains as long as it doesn't land on it
            }
            if (occ) {
              jumpedPieces++;
              if (jumpedPieces > 1) break; // Can only jump over at most ONE piece
              continue; // Jumped, continue
            }
          }

          // Landing square (or step when no piece or after 1 jump)
          if (!mt) {
            if (!occ) {
              validMoves.push({ x: tx, y: ty, actionType: 'move' });
            } else {
              // Can land to capture if enemy
              if (occ.playerIndex !== piece.playerIndex) {
                validMoves.push({
                  x: tx,
                  y: ty,
                  actionType: 'capture',
                  capturedPieceId: occ.id,
                });
              }
              break; // Landing on a piece stops the line
            }
          }
        }
      });
      break;
    }
  }

  return validMoves;
}

// Check detection: Is a given player's king attacked by any opponent piece?
export function isPlayerInCheck(
  playerSlot: number,
  allPieces: Piece[],
  mountains: Mountain[]
): boolean {
  const king = allPieces.find(
    (p) => p.playerIndex === playerSlot && p.type === 'king'
  );
  if (!king) return false;

  const opponentPieces = allPieces.filter(
    (p) => p.playerIndex !== playerSlot
  );

  for (const opp of opponentPieces) {
    // For check, we evaluate if opponent can attack king's position
    const moves = getValidMoves(opp, allPieces, mountains);
    const attacksKing = moves.some(
      (m) =>
        (m.actionType === 'capture' || m.actionType === 'catapult_strike') &&
        m.x === king.x &&
        m.y === king.y
    );
    if (attacksKing) return true;
  }

  return false;
}

// Checkmate detection:
// If the player is in check and has NO move that removes the check on their King.
export function isPlayerInCheckmate(
  playerSlot: number,
  allPieces: Piece[],
  mountains: Mountain[]
): boolean {
  if (!isPlayerInCheck(playerSlot, allPieces, mountains)) {
    return false;
  }

  const myPieces = allPieces.filter((p) => p.playerIndex === playerSlot);

  for (const myPiece of myPieces) {
    const candidateMoves = getValidMoves(myPiece, allPieces, mountains);

    for (const move of candidateMoves) {
      // Simulate move
      const simulatedPieces = simulateMove(myPiece, move, allPieces);
      if (!isPlayerInCheck(playerSlot, simulatedPieces, mountains)) {
        // Found at least one legal escape move!
        return false;
      }
    }
  }

  return true; // No escape, checkmate!
}

// Simulate a move and return the new array of pieces
export function simulateMove(
  piece: Piece,
  move: ValidMove,
  allPieces: Piece[]
): Piece[] {
  if (move.actionType === 'archmage_swap') {
    return allPieces.map((p) => {
      if (p.id === piece.id) {
        return { ...p, x: move.x, y: move.y, hasMoved: true };
      }
      if (p.id === move.swappedPieceId) {
        return { ...p, x: piece.x, y: piece.y };
      }
      return p;
    });
  }

  if (move.actionType === 'catapult_strike') {
    // Catapult doesn't move! Only eliminates target piece
    return allPieces.filter((p) => p.id !== move.capturedPieceId);
  }

  // Normal move or capture
  return allPieces
    .filter((p) => (move.capturedPieceId ? p.id !== move.capturedPieceId : true))
    .map((p) => {
      if (p.id === piece.id) {
        const nextType = move.promoted ? 'queen' : piece.type;
        return {
          ...p,
          type: nextType,
          x: move.x,
          y: move.y,
          hasMoved: true,
        };
      }
      return p;
    });
}
