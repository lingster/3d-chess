import { Board, Piece, PieceType, Position, isValidPosition } from './types'
import { getPiece } from './board'

// Interface for movement strategies
export interface MovementStrategy {
  getValidMoves(piece: Piece, board: Board): Position[]
}

// Get possible moves for a piece
export function getValidMoves(piece: Piece, board: Board): Position[] {
  switch (piece.type) {
    case PieceType.PAWN:
      return getPawnMoves(piece, board)
    case PieceType.ROOK:
      return getRookMoves(piece, board)
    case PieceType.KNIGHT:
      return getKnightMoves(piece, board)
    case PieceType.BISHOP:
      return getBishopMoves(piece, board)
    case PieceType.QUEEN:
      return getQueenMoves(piece, board)
    case PieceType.KING:
      return getKingMoves(piece, board)
    default:
      return []
  }
}

// Check if a move to a target position is valid
export function isValidMove(piece: Piece, targetPos: Position, board: Board): boolean {
  const validMoves = getValidMoves(piece, board)
  return validMoves.some(pos => 
    pos.x === targetPos.x && pos.y === targetPos.y && pos.z === targetPos.z
  )
}

// Helper to get positions in a straight line until blocked
function getLinearMoves(
  start: Position, 
  directions: Position[], 
  board: Board, 
  pieceColor: string
): Position[] {
  const moves: Position[] = []

  for (const dir of directions) {
    let currentPos: Position = { ...start }

    while (true) {
      currentPos = {
        x: currentPos.x + dir.x,
        y: currentPos.y + dir.y,
        z: currentPos.z + dir.z
      }

      if (!isValidPosition(currentPos)) {
        break
      }

      const pieceAtPos = getPiece(board, currentPos)
      
      if (!pieceAtPos) {
        // Empty square, can move here
        moves.push(currentPos)
      } else if (pieceAtPos.color !== pieceColor) {
        // Opponent's piece, can capture and then stop
        moves.push(currentPos)
        break
      } else {
        // Own piece, blocked
        break
      }
    }
  }

  return moves
}

// Pawn movement
function getPawnMoves(piece: Piece, board: Board): Position[] {
  const moves: Position[] = []
  const { x, y, z } = piece.position
  const direction = piece.color === 'white' ? 1 : -1
  
  // Forward movement (in y direction)
  const forwardPos = { x, y: y + direction, z }
  if (isValidPosition(forwardPos) && !getPiece(board, forwardPos)) {
    moves.push(forwardPos)
    
    // Double move from starting position
    if (!piece.hasMoved) {
      const doubleMove = { x, y: y + 2 * direction, z }
      if (isValidPosition(doubleMove) && !getPiece(board, doubleMove)) {
        moves.push(doubleMove)
      }
    }
  }
  
  // Captures (diagonally in x,y plane)
  const capturePositions = [
    { x: x - 1, y: y + direction, z },
    { x: x + 1, y: y + direction, z }
  ]
  
  for (const pos of capturePositions) {
    if (isValidPosition(pos)) {
      const pieceAtPos = getPiece(board, pos)
      if (pieceAtPos && pieceAtPos.color !== piece.color) {
        moves.push(pos)
      }
    }
  }
  
  // 3D additions: Vertical movement and diagonal-vertical capture
  // Pawn can move up in z direction
  const upPos = { x, y, z: z + direction }
  if (isValidPosition(upPos) && !getPiece(board, upPos)) {
    moves.push(upPos)
  }
  
  // Pawn can capture diagonally in all three dimensions
  const diagonalCaptures = [
    { x: x - 1, y: y + direction, z: z + 1 },
    { x: x + 1, y: y + direction, z: z + 1 },
    { x: x - 1, y: y + direction, z: z - 1 },
    { x: x + 1, y: y + direction, z: z - 1 }
  ]
  
  for (const pos of diagonalCaptures) {
    if (isValidPosition(pos)) {
      const pieceAtPos = getPiece(board, pos)
      if (pieceAtPos && pieceAtPos.color !== piece.color) {
        moves.push(pos)
      }
    }
  }
  
  return moves
}

// Rook movement
function getRookMoves(piece: Piece, board: Board): Position[] {
  const directions = [
    { x: 1, y: 0, z: 0 },  // Right
    { x: -1, y: 0, z: 0 }, // Left
    { x: 0, y: 1, z: 0 },  // Forward
    { x: 0, y: -1, z: 0 }, // Backward
    { x: 0, y: 0, z: 1 },  // Up
    { x: 0, y: 0, z: -1 }  // Down
  ]
  
  return getLinearMoves(piece.position, directions, board, piece.color)
}

// Knight movement
function getKnightMoves(piece: Piece, board: Board): Position[] {
  const moves: Position[] = []
  const { x, y, z } = piece.position
  
  // All possible knight moves in 3D space (L shape in any dimension)
  const knightOffsets = [
    // Traditional 2D knight moves in xy plane
    { x: 1, y: 2, z: 0 }, { x: 2, y: 1, z: 0 },
    { x: -1, y: 2, z: 0 }, { x: -2, y: 1, z: 0 },
    { x: 1, y: -2, z: 0 }, { x: 2, y: -1, z: 0 },
    { x: -1, y: -2, z: 0 }, { x: -2, y: -1, z: 0 },
    
    // 3D knight moves in xz plane
    { x: 1, y: 0, z: 2 }, { x: 2, y: 0, z: 1 },
    { x: -1, y: 0, z: 2 }, { x: -2, y: 0, z: 1 },
    { x: 1, y: 0, z: -2 }, { x: 2, y: 0, z: -1 },
    { x: -1, y: 0, z: -2 }, { x: -2, y: 0, z: -1 },
    
    // 3D knight moves in yz plane
    { x: 0, y: 1, z: 2 }, { x: 0, y: 2, z: 1 },
    { x: 0, y: -1, z: 2 }, { x: 0, y: -2, z: 1 },
    { x: 0, y: 1, z: -2 }, { x: 0, y: 2, z: -1 },
    { x: 0, y: -1, z: -2 }, { x: 0, y: -2, z: -1 }
  ]
  
  for (const offset of knightOffsets) {
    const newPos = {
      x: x + offset.x,
      y: y + offset.y,
      z: z + offset.z
    }
    
    if (isValidPosition(newPos)) {
      const pieceAtNewPos = getPiece(board, newPos)
      if (!pieceAtNewPos || pieceAtNewPos.color !== piece.color) {
        moves.push(newPos)
      }
    }
  }
  
  return moves
}

// Bishop movement
function getBishopMoves(piece: Piece, board: Board): Position[] {
  // Diagonal directions in all three dimensions
  const directions = [
    // Diagonals in xy plane
    { x: 1, y: 1, z: 0 }, { x: 1, y: -1, z: 0 },
    { x: -1, y: 1, z: 0 }, { x: -1, y: -1, z: 0 },
    
    // Diagonals in xz plane
    { x: 1, y: 0, z: 1 }, { x: 1, y: 0, z: -1 },
    { x: -1, y: 0, z: 1 }, { x: -1, y: 0, z: -1 },
    
    // Diagonals in yz plane
    { x: 0, y: 1, z: 1 }, { x: 0, y: 1, z: -1 },
    { x: 0, y: -1, z: 1 }, { x: 0, y: -1, z: -1 },
    
    // 3D diagonals (all three coordinates change)
    { x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: -1 },
    { x: 1, y: -1, z: 1 }, { x: 1, y: -1, z: -1 },
    { x: -1, y: 1, z: 1 }, { x: -1, y: 1, z: -1 },
    { x: -1, y: -1, z: 1 }, { x: -1, y: -1, z: -1 }
  ]
  
  return getLinearMoves(piece.position, directions, board, piece.color)
}

// Queen movement (combination of rook and bishop)
function getQueenMoves(piece: Piece, board: Board): Position[] {
  return [
    ...getRookMoves(piece, board),
    ...getBishopMoves(piece, board)
  ]
}

// King movement
function getKingMoves(piece: Piece, board: Board): Position[] {
  const moves: Position[] = []
  const { x, y, z } = piece.position
  
  // Generate all adjacent positions (26 positions in 3D space)
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        // Skip the current position
        if (dx === 0 && dy === 0 && dz === 0) continue
        
        const newPos = {
          x: x + dx,
          y: y + dy,
          z: z + dz
        }
        
        if (isValidPosition(newPos)) {
          const pieceAtNewPos = getPiece(board, newPos)
          if (!pieceAtNewPos || pieceAtNewPos.color !== piece.color) {
            moves.push(newPos)
          }
        }
      }
    }
  }
  
  // Note: We're skipping castling for the 3D version
  
  return moves
}
