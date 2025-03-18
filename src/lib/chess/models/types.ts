// Define the types for our 3D chess game

// Position in 3D space
export interface Position {
  x: number
  y: number
  z: number
}

// Color of the piece
export enum PieceColor {
  WHITE = 'white',
  BLACK = 'black'
}

// Types of chess pieces
export enum PieceType {
  PAWN = 'pawn',
  ROOK = 'rook',
  KNIGHT = 'knight',
  BISHOP = 'bishop',
  QUEEN = 'queen',
  KING = 'king'
}

// A chess piece
export interface Piece {
  type: PieceType
  color: PieceColor
  position: Position
  hasMoved?: boolean // For pawns, kings (castling)
}

// Game state
export enum GameState {
  ACTIVE = 'active',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate'
}

// Move representation
export interface Move {
  from: Position
  to: Position
  piece: Piece
  capturedPiece?: Piece
  isPromotion?: boolean
  promotionPiece?: PieceType
}

// Game representation
export interface Game {
  board: Map<string, Piece>
  currentTurn: PieceColor
  moves: Move[]
  state: GameState
}

// We need to define the Board type in a way that will work at runtime
export type Board = Map<string, Piece>

// Convert position to string key for the Map
export function positionToKey(position: Position): string {
  return `${position.x},${position.y},${position.z}`
}

// Convert string key to position
export function keyToPosition(key: string): Position {
  const [x, y, z] = key.split(',').map(Number)
  return { x, y, z }
}

// Check if a position is within the board boundaries
export function isValidPosition(position: Position): boolean {
  return (
    position.x >= 1 && position.x <= 8 &&
    position.y >= 1 && position.y <= 8 &&
    position.z >= 1 && position.z <= 8
  )
}

// Check if two positions are equal
export function arePositionsEqual(pos1: Position, pos2: Position): boolean {
  return pos1.x === pos2.x && pos1.y === pos2.y && pos1.z === pos2.z
}

// Export a class or constructor that can be used at runtime
export class ChessTypes {
  static createBoard(): Board {
    return new Map<string, Piece>()
  }
}
