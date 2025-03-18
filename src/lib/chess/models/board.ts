import { Board, Piece, PieceColor, PieceType, Position, positionToKey, ChessTypes } from './types'

// Initialize an empty 3D chess board
export function createEmptyBoard(): Board {
  return ChessTypes.createBoard()
}

// Setup the initial piece arrangement for a standard 3D chess game
export function setupBoard(): Board {
  const board = createEmptyBoard()

  // Set up standard chess pieces on the first and eighth layers
  setupBaseLayer(board, 1, PieceColor.WHITE) // White pieces at z=1
  setupBaseLayer(board, 8, PieceColor.BLACK) // Black pieces at z=8

  return board
}

// Setup pieces for a specific layer
function setupBaseLayer(board: Board, z: number, color: PieceColor): void {
  const backRowY = color === PieceColor.WHITE ? 1 : 8
  const pawnRowY = color === PieceColor.WHITE ? 2 : 7

  // Place pawns
  for (let x = 1; x <= 8; x++) {
    addPiece(board, {
      type: PieceType.PAWN,
      color,
      position: { x, y: pawnRowY, z: 1 },
      hasMoved: false
    })
  }

  // Place other pieces on the back row
  // Rooks
  addPiece(board, { type: PieceType.ROOK, color, position: { x: 1, y: backRowY, z: 1 }, hasMoved: false })
  addPiece(board, { type: PieceType.ROOK, color, position: { x: 8, y: backRowY, z: 1 }, hasMoved: false })

  // Knights
  addPiece(board, { type: PieceType.KNIGHT, color, position: { x: 2, y: backRowY, z: 1 } })
  addPiece(board, { type: PieceType.KNIGHT, color, position: { x: 7, y: backRowY, z: 1 } })

  // Bishops
  addPiece(board, { type: PieceType.BISHOP, color, position: { x: 3, y: backRowY, z: 1 } })
  addPiece(board, { type: PieceType.BISHOP, color, position: { x: 6, y: backRowY, z: 1 } })

  // Queen and King
  addPiece(board, { type: PieceType.QUEEN, color, position: { x: 4, y: backRowY, z: 1 } })
  addPiece(board, { type: PieceType.KING, color, position: { x: 5, y: backRowY, z: 1 }, hasMoved: false })
}

// Add a piece to the board
export function addPiece(board: Board, piece: Piece): void {
  const key = positionToKey(piece.position)
  board.set(key, piece)
}

// Get a piece at a specific position
export function getPiece(board: Board, position: Position): Piece | undefined {
  const key = positionToKey(position)
  return board.get(key)
}

// Remove a piece from the board
export function removePiece(board: Board, position: Position): Piece | undefined {
  const key = positionToKey(position)
  const piece = board.get(key)
  if (piece) {
    board.delete(key)
  }
  return piece
}

// Move a piece from one position to another
export function movePiece(board: Board, from: Position, to: Position): Piece | undefined {
  const piece = removePiece(board, from)
  if (piece) {
    const capturedPiece = getPiece(board, to)
    if (capturedPiece) {
      removePiece(board, to)
    }
    
    // Update piece position and hasMoved flag
    piece.position = to
    if ('hasMoved' in piece) {
      piece.hasMoved = true
    }
    
    addPiece(board, piece)
    return capturedPiece
  }
  return undefined
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
