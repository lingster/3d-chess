import { Board, Game, GameState, Move, Piece, PieceColor, Position, arePositionsEqual, positionToKey } from './types'
import { setupBoard, movePiece, getPiece } from './board'
import { getValidMoves, isValidMove } from './movement'

// Initialize a new game
export function createGame(): Game {
  return {
    board: setupBoard(),
    currentTurn: PieceColor.WHITE,
    moves: [],
    state: GameState.ACTIVE
  }
}

// Make a move
export function makeMove(game: Game, from: Position, to: Position): boolean {
  // Check if the game is over
  if (game.state === GameState.CHECKMATE || game.state === GameState.STALEMATE) {
    return false
  }

  // Get the piece to move
  const piece = getPiece(game.board, from)

  // Check if there's a piece at the selected position
  if (!piece) {
    return false
  }

  // Check if it's the right player's turn
  if (piece.color !== game.currentTurn) {
    return false
  }

  // Check if the move is valid
  if (!isValidMove(piece, to, game.board)) {
    return false
  }

  // Capture the piece at the destination, if any
  const capturedPiece = getPiece(game.board, to)

  // Move the piece
  movePiece(game.board, from, to)

  // Record the move
  const move: Move = {
    from,
    to,
    piece: { ...piece, position: to },
    capturedPiece
  }
  game.moves.push(move)

  // Switch turns
  game.currentTurn = game.currentTurn === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE

  // Update game state
  updateGameState(game)

  return true
}

// Get all pieces of a specific color
export function getPiecesByColor(board: Board, color: PieceColor): Piece[] {
  const pieces: Piece[] = []
  
  board.forEach(piece => {
    if (piece.color === color) {
      pieces.push(piece)
    }
  })
  
  return pieces
}

// Find the king of a specific color
export function findKing(board: Board, color: PieceColor): Piece | undefined {
  const pieces = getPiecesByColor(board, color)
  return pieces.find(piece => piece.type === 'king')
}

// Check if a king is in check
export function isKingInCheck(board: Board, kingColor: PieceColor): boolean {
  const king = findKing(board, kingColor)
  if (!king) return false
  
  const opponentColor = kingColor === PieceColor.WHITE ? PieceColor.BLACK : PieceColor.WHITE
  const opponentPieces = getPiecesByColor(board, opponentColor)
  
  // Check if any opponent piece can capture the king
  for (const piece of opponentPieces) {
    const validMoves = getValidMoves(piece, board)
    if (validMoves.some(pos => arePositionsEqual(pos, king.position))) {
      return true
    }
  }
  
  return false
}

// Check if a player has any valid moves
export function hasValidMoves(game: Game, color: PieceColor): boolean {
  const pieces = getPiecesByColor(game.board, color)
  
  for (const piece of pieces) {
    const validMoves = getValidMoves(piece, game.board)
    if (validMoves.length > 0) {
      // For a proper implementation, we should check if the move leaves the king in check
      // This is simplified for the demo
      return true
    }
  }
  
  return false
}

// Update the game state (check, checkmate, stalemate)
function updateGameState(game: Game): void {
  const currentColor = game.currentTurn
  const kingInCheck = isKingInCheck(game.board, currentColor)
  const hasMovesAvailable = hasValidMoves(game, currentColor)
  
  if (kingInCheck) {
    game.state = hasMovesAvailable ? GameState.CHECK : GameState.CHECKMATE
  } else {
    game.state = hasMovesAvailable ? GameState.ACTIVE : GameState.STALEMATE
  }
}

// Get all valid moves for a piece at a specific position
export function getValidMovesForPosition(game: Game, position: Position): Position[] {
  const piece = getPiece(game.board, position)
  if (!piece || piece.color !== game.currentTurn) {
    return []
  }
  
  return getValidMoves(piece, game.board)
}

// Convert position to a standard notation (e.g., "A1" to "1,1,1")
export function positionToNotation(position: Position): string {
  const fileChar = String.fromCharCode('A'.charCodeAt(0) + position.x - 1)
  return `${fileChar}${position.y}${position.z}`
}

// Convert notation to position (e.g., "A11" to {x: 1, y: 1, z: 1})
export function notationToPosition(notation: string): Position | null {
  if (notation.length < 3) return null
  
  const fileChar = notation.charAt(0).toUpperCase()
  const x = fileChar.charCodeAt(0) - 'A'.charCodeAt(0) + 1
  const y = parseInt(notation.charAt(1))
  const z = parseInt(notation.substring(2))
  
  if (isNaN(y) || isNaN(z) || x < 1 || x > 8 || y < 1 || y > 8 || z < 1 || z > 8) {
    return null
  }
  
  return { x, y, z }
}
