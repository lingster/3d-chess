import { describe, it, expect } from 'vitest'
import { 
  createGame, 
  makeMove,
  PieceColor,
  Position,
  GameState,
  getPiece,
  getValidMovesForPosition
} from '../models'

describe('Chess Model Tests', () => {
  it('should create a game with the correct initial state', () => {
    const game = createGame()
    
    expect(game.currentTurn).toBe(PieceColor.WHITE)
    expect(game.state).toBe(GameState.ACTIVE)
    expect(game.moves.length).toBe(0)
    
    // Check that some pieces are in their expected positions
    expect(getPiece(game.board, { x: 1, y: 1, z: 1 })?.type).toBe('rook')
    expect(getPiece(game.board, { x: 2, y: 1, z: 1 })?.type).toBe('knight')
    expect(getPiece(game.board, { x: 5, y: 1, z: 1 })?.type).toBe('king')
    expect(getPiece(game.board, { x: 4, y: 1, z: 1 })?.type).toBe('queen')
  })
  
  it('should validate pawn movements correctly', () => {
    const game = createGame()
    
    // Get valid moves for a white pawn at position 1,2,1
    const pawnMoves = getValidMovesForPosition(game, { x: 1, y: 2, z: 1 })
    
    // A pawn should be able to move forward one or two squares from its starting position
    expect(pawnMoves.length).toBeGreaterThan(0)
    expect(pawnMoves).toContainEqual({ x: 1, y: 3, z: 1 }) // One square forward
    expect(pawnMoves).toContainEqual({ x: 1, y: 4, z: 1 }) // Two squares forward
    
    // In 3D chess, a pawn can also move up in the z direction
    expect(pawnMoves).toContainEqual({ x: 1, y: 2, z: 2 }) // One square up
  })
  
  it('should make valid moves', () => {
    const game = createGame()
    
    // Move a pawn from its starting position
    const from: Position = { x: 1, y: 2, z: 1 }
    const to: Position = { x: 1, y: 4, z: 1 }
    
    const result = makeMove(game, from, to)
    
    expect(result).toBe(true)
    expect(game.moves.length).toBe(1)
    expect(game.currentTurn).toBe(PieceColor.BLACK)
    
    // Verify the pawn has moved
    expect(getPiece(game.board, from)).toBeUndefined()
    const movedPiece = getPiece(game.board, to)
    expect(movedPiece?.type).toBe('pawn')
    expect(movedPiece?.color).toBe(PieceColor.WHITE)
  })
  
  it('should reject invalid moves', () => {
    const game = createGame()
    
    // Try to move a pawn to an invalid position
    const from: Position = { x: 1, y: 2, z: 1 }
    const to: Position = { x: 3, y: 4, z: 2 }
    
    const result = makeMove(game, from, to)
    
    expect(result).toBe(false)
    expect(game.moves.length).toBe(0)
    expect(game.currentTurn).toBe(PieceColor.WHITE)
    
    // Verify the pawn hasn't moved
    expect(getPiece(game.board, from)?.type).toBe('pawn')
  })
  
  it('should enforce turn-based play', () => {
    const game = createGame()
    
    // Try to move a black piece when it's white's turn
    const from: Position = { x: 1, y: 7, z: 1 } // Black pawn
    const to: Position = { x: 1, y: 5, z: 1 }
    
    const result = makeMove(game, from, to)
    
    expect(result).toBe(false)
    expect(game.moves.length).toBe(0)
    expect(game.currentTurn).toBe(PieceColor.WHITE)
  })
})
