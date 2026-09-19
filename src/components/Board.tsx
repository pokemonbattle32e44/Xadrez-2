import React, { useRef, useState, useEffect } from 'react';
import { GameRoom, Piece, ValidMove, Position, Mountain, BOARD_SIZE } from '../types/game';
import { getValidMoves, isMountain, shouldPromotePawn, simulateMove } from '../game/rules';
import { PieceIcon } from './PieceIcon';
import { MountainSquare } from './MountainSquare';
import { ZoomIn, ZoomOut, RotateCcw, Crosshair, ArrowRightLeft } from 'lucide-react';

interface BoardProps {
  room: GameRoom;
  currentPlayerSlot: number | null;
  onMakeMove: (
    piece: Piece,
    move: ValidMove
  ) => Promise<void>;
  isMyTurn: boolean;
}

export const Board: React.FC<BoardProps> = ({
  room,
  currentPlayerSlot,
  onMakeMove,
  isMyTurn,
}) => {
  const [selectedPiece, setSelectedPiece] = useState<Piece | null>(null);
  const [validMoves, setValidMoves] = useState<ValidMove[]>([]);
  const [zoom, setZoom] = useState<number>(1);
  const [activeStrikeEffect, setActiveStrikeEffect] = useState<{
    from: Position;
    to: Position;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // When selected piece changes, compute valid moves
  useEffect(() => {
    if (!selectedPiece) {
      setValidMoves([]);
      return;
    }

    // Only allow selecting pieces of current player's army
    if (selectedPiece.playerIndex !== room.currentTurnSlot) {
      setValidMoves([]);
      return;
    }

    const moves = getValidMoves(selectedPiece, room.pieces, room.mountains);
    setValidMoves(moves);
  }, [selectedPiece, room.pieces, room.mountains, room.currentTurnSlot]);

  // Handle cell or piece click
  const handleSquareClick = async (x: number, y: number) => {
    if (!isMyTurn) return;

    const clickedPiece = room.pieces.find((p) => p.x === x && p.y === y);

    // If a piece is already selected, check if clicked square is a valid move
    if (selectedPiece) {
      const matchedMove = validMoves.find((m) => m.x === x && m.y === y);

      if (matchedMove) {
        // Visual effect for catapult strike or archmage swap
        if (matchedMove.actionType === 'catapult_strike') {
          setActiveStrikeEffect({
            from: { x: selectedPiece.x, y: selectedPiece.y },
            to: { x, y },
          });
          setTimeout(() => setActiveStrikeEffect(null), 700);
        }

        setSelectedPiece(null);
        setValidMoves([]);
        await onMakeMove(selectedPiece, matchedMove);
        return;
      }

      // If clicked on another own piece, switch selection
      if (clickedPiece && clickedPiece.playerIndex === currentPlayerSlot) {
        setSelectedPiece(clickedPiece);
        return;
      }

      // Deselect if clicked elsewhere
      setSelectedPiece(null);
      setValidMoves([]);
      return;
    }

    // No piece currently selected: select clicked piece if it belongs to current player
    if (clickedPiece && clickedPiece.playerIndex === currentPlayerSlot) {
      setSelectedPiece(clickedPiece);
    }
  };

  // Center indicator check
  const isCenterZone = (x: number, y: number): boolean => {
    return x >= 8 && x <= 11 && y >= 8 && y <= 11;
  };

  // Calculate cell pixel dimension dynamically
  // 20x20 grid fits comfortably with scroll or zoom
  const cellSize = Math.round(36 * zoom);

  return (
    <div className="flex flex-col items-center w-full select-none">
      {/* Zoom / View controls toolbar */}
      <div className="flex items-center justify-between w-full max-w-3xl mb-3 px-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Tabuleiro Expandido: {BOARD_SIZE}x{BOARD_SIZE} (400 Casas)</span>
          <span className="hidden sm:inline-block text-slate-500">|</span>
          <span className="hidden sm:inline-block text-amber-400/90 text-xs">Centro (8..11): Promoção a Dama</span>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 rounded-lg p-1 shadow-md">
          <button
            id="btn-zoom-out"
            onClick={() => setZoom((z) => Math.max(0.7, +(z - 0.15).toFixed(2)))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Diminuir Zoom"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[11px] font-mono px-1 text-slate-400 font-medium">
            {Math.round(zoom * 100)}%
          </span>
          <button
            id="btn-zoom-in"
            onClick={() => setZoom((z) => Math.min(1.4, +(z + 0.15).toFixed(2)))}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Aumentar Zoom"
          >
            <ZoomIn size={16} />
          </button>
          <button
            id="btn-zoom-reset"
            onClick={() => setZoom(1)}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
            title="Resetar Zoom"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Board Scroll Container */}
      <div
        ref={containerRef}
        className="w-full overflow-auto max-h-[75vh] flex justify-center p-2 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-2xl backdrop-blur-sm"
        style={{ touchAction: 'pan-x pan-y' }}
      >
        <div
          className="relative grid rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900"
          style={{
            gridTemplateColumns: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${BOARD_SIZE}, ${cellSize}px)`,
            width: `${cellSize * BOARD_SIZE}px`,
            height: `${cellSize * BOARD_SIZE}px`,
          }}
        >
          {/* Render 20x20 Grid Cells */}
          {Array.from({ length: BOARD_SIZE }).map((_, y) =>
            Array.from({ length: BOARD_SIZE }).map((_, x) => {
              const isDark = (x + y) % 2 === 1;
              const hasMt = isMountain(x, y, room.mountains);
              const isCenter = isCenterZone(x, y);

              // Find piece on this square
              const piece = room.pieces.find((p) => p.x === x && p.y === y);
              const isSelected = selectedPiece?.x === x && selectedPiece?.y === y;
              const validMove = validMoves.find((m) => m.x === x && m.y === y);

              // Player styling
              const piecePlayer = piece
                ? room.players.find((pl) => pl.slot === piece.playerIndex)
                : undefined;

              return (
                <div
                  key={`sq-${x}-${y}`}
                  id={`square-${x}-${y}`}
                  onClick={() => handleSquareClick(x, y)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                    hasMt
                      ? ''
                      : isCenter
                      ? isDark
                        ? 'bg-amber-950/40 hover:bg-amber-900/40'
                        : 'bg-amber-900/30 hover:bg-amber-800/40'
                      : isDark
                      ? 'bg-slate-800/90 hover:bg-slate-750'
                      : 'bg-slate-700/70 hover:bg-slate-650'
                  } ${
                    isSelected
                      ? 'ring-2 ring-amber-400 ring-inset z-10 bg-amber-500/20'
                      : ''
                  }`}
                  style={{ width: cellSize, height: cellSize }}
                >
                  {/* Mountain component */}
                  {hasMt && <MountainSquare sizePx={cellSize} />}

                  {/* Central Golden Crown watermark */}
                  {isCenter && !hasMt && !piece && (
                    <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
                      <span className="text-[10px] text-amber-300 font-bold">👑</span>
                    </div>
                  )}

                  {/* Coordinates indicator on corners */}
                  {((x === 0 && y % 5 === 0) || (y === 0 && x % 5 === 0)) && (
                    <span className="absolute top-0.5 left-0.5 text-[8px] font-mono text-slate-500 pointer-events-none select-none">
                      {String.fromCharCode(65 + x)}{y + 1}
                    </span>
                  )}

                  {/* Valid Move Indicator Overlay */}
                  {validMove && (
                    <div
                      className={`absolute inset-0 flex items-center justify-center z-20 pointer-events-none ${
                        validMove.actionType === 'capture'
                          ? 'bg-red-500/35 ring-2 ring-red-500 ring-inset'
                          : validMove.actionType === 'catapult_strike'
                          ? 'bg-orange-500/40 ring-2 ring-orange-500 ring-inset animate-pulse'
                          : validMove.actionType === 'archmage_swap'
                          ? 'bg-purple-500/35 ring-2 ring-purple-400 ring-inset'
                          : 'bg-emerald-500/20'
                      }`}
                    >
                      {validMove.actionType === 'move' && (
                        <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
                      )}
                      {validMove.actionType === 'capture' && (
                        <div className="w-5 h-5 rounded-full border-2 border-red-400 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        </div>
                      )}
                      {validMove.actionType === 'catapult_strike' && (
                        <Crosshair size={18} className="text-orange-300 animate-spin" />
                      )}
                      {validMove.actionType === 'archmage_swap' && (
                        <ArrowRightLeft size={16} className="text-purple-300" />
                      )}
                    </div>
                  )}

                  {/* Piece Rendering */}
                  {piece && piecePlayer && (
                    <div
                      className={`relative z-10 flex items-center justify-center transition-transform duration-200 ${
                        isSelected ? 'scale-115 -translate-y-0.5' : 'hover:scale-105'
                      }`}
                      style={{
                        filter: isSelected
                          ? `drop-shadow(0 0 8px ${piecePlayer.borderHex})`
                          : undefined,
                      }}
                    >
                      <PieceIcon
                        type={piece.type}
                        color={piecePlayer.hex}
                        size={Math.max(20, Math.round(cellSize * 0.75))}
                      />

                      {/* Small badge for player color indicator */}
                      <div
                        className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-slate-900 shadow-sm"
                        style={{ backgroundColor: piecePlayer.hex }}
                        title={`Jogador: ${piecePlayer.name}`}
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Catapult Strike Projectile Animation */}
          {activeStrikeEffect && (
            <div
              className="absolute pointer-events-none z-30 transition-all duration-500 ease-out flex items-center justify-center"
              style={{
                left: `${activeStrikeEffect.to.x * cellSize}px`,
                top: `${activeStrikeEffect.to.y * cellSize}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
              }}
            >
              <div className="w-8 h-8 rounded-full bg-orange-500/80 animate-ping" />
              <div className="w-4 h-4 rounded-full bg-red-600 shadow-lg shadow-orange-500 animate-bounce" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
