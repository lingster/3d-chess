// Main entry point for chess game
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

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
  hasMoved?: boolean
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

// The board is a Map of positions to pieces
export type Board = Map<string, Piece>

// Game representation
export interface Game {
  board: Board
  currentTurn: PieceColor
  moves: Move[]
  state: GameState
}

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

// Initialize an empty 3D chess board
export function createEmptyBoard(): Board {
  return new Map<string, Piece>()
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
// Movement functions
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

// Piece movement implementations
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

function getQueenMoves(piece: Piece, board: Board): Position[] {
  return [
    ...getRookMoves(piece, board),
    ...getBishopMoves(piece, board)
  ]
}

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
  
  return moves
}

// Game management functions
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

// Find the king of a specific color
export function findKing(board: Board, color: PieceColor): Piece | undefined {
  const pieces = getPiecesByColor(board, color)
  return pieces.find(piece => piece.type === PieceType.KING)
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
// THREE.js renderer implementation
export class ThreeChessRenderer {
  private container: HTMLElement | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private renderer: THREE.WebGLRenderer | null = null
  private controls: OrbitControls | null = null
  private chessboard: THREE.Group | null = null
  private pieces: Map<string, THREE.Mesh> = new Map()
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()
  private game: Game
  private highlightGroup: THREE.Group | null = null
  private positionClickedCallback: ((position: Position) => void) | null = null
  private hoveredMesh: THREE.Mesh | null = null

  constructor() {
    this.game = createGame()
  }

  initialize(container: HTMLElement): void {
    this.container = container
    
    // Setup scene, camera and renderer
    this.scene = setupScene(container)
    this.camera = setupCamera(container)
    this.renderer = setupRenderer(container)
    
    // Setup orbit controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.05
    
    // Create the chessboard
    this.chessboard = createChessboard(this.scene)
    
    // Add all pieces
    this.placePieces()
    
    // Setup event listeners
    this.setupEventListeners()
    
    // Initialize highlight group
    this.highlightGroup = new THREE.Group()
    this.scene.add(this.highlightGroup)
    
    // Start animation loop
    this.animate()
  }

  update(): void {
    // This method can be called to update the game state
    // For now, it just re-renders everything
    if (this.scene) {
      this.placePieces()
    }
  }

  cleanup(): void {
    // Remove event listeners
    if (this.container && this.renderer) {
      window.removeEventListener('resize', this.onWindowResize)
      this.renderer.domElement.removeEventListener('click', this.onClick)
      this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove)
      
      // Remove renderer from DOM
      this.container.removeChild(this.renderer.domElement)
      
      // Dispose of resources
      this.pieces.forEach(mesh => {
        mesh.geometry.dispose()
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach(m => m.dispose())
        } else {
          mesh.material.dispose()
        }
      })
      
      this.pieces.clear()
      this.renderer.dispose()
    }
  }
  
  onPositionClicked(callback: (position: Position) => void): void {
    this.positionClickedCallback = callback
  }
  
  highlightValidMoves(positions: Position[]): void {
    if (this.scene && this.highlightGroup) {
      // Clear previous highlights
      this.clearHighlights()
      
      // Create new highlights
      this.highlightGroup = highlightValidMoves(this.scene, positions)
    }
  }
  
  clearHighlights(): void {
    if (this.scene && this.highlightGroup) {
      removeHighlights(this.scene, this.highlightGroup)
      this.highlightGroup = new THREE.Group()
      this.scene.add(this.highlightGroup)
    }
  }
  
  movePiece(from: Position, to: Position): boolean {
    const success = makeMove(this.game, from, to)
    
    if (success) {
      // Update 3D representation
      this.clearHighlights()
      this.placePieces()
    }
    
    return success
  }
  
  getGameState(): GameState {
    return this.game.state
  }
  
  getCurrentTurn(): PieceColor {
    return this.game.currentTurn
  }
  
  getValidMovesForPosition(position: Position): Position[] {
    return getValidMovesForPosition(this.game, position)
  }
  
  private placePieces(): void {
    if (!this.scene) return
    
    // Remove all existing pieces
    this.pieces.forEach(mesh => {
      this.scene!.remove(mesh)
    })
    this.pieces.clear()
    
    // Add all pieces from the game board
    this.game.board.forEach((piece) => {
      this.addPiece(piece)
    })
  }
  
  private addPiece(piece: Piece): void {
    if (!this.scene) return
    
    const pieceMesh = createPieceMesh(piece)
    this.scene.add(pieceMesh)
    
    const key = positionToKey(piece.position)
    this.pieces.set(key, pieceMesh)
  }
  
  private setupEventListeners(): void {
    if (!this.container || !this.renderer) return
    
    // Handle window resize
    window.addEventListener('resize', this.onWindowResize)
    
    // Handle mouse click and move
    this.renderer.domElement.addEventListener('click', this.onClick)
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove)
  }
  
  private onWindowResize = (): void => {
    if (!this.container || !this.camera || !this.renderer) return
    
    // Update camera aspect ratio
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    
    // Update renderer size
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
  
  private onClick = (event: MouseEvent): void => {
    if (!this.renderer || !this.camera || !this.chessboard) return
    
    // Calculate mouse position
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Raycast to find intersected objects
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene!.children, true)
    
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object
      
      // Check if the object has position data
      if (intersectedObject.userData && intersectedObject.userData.position) {
        const position = intersectedObject.userData.position as Position
        
        // Call the callback
        if (this.positionClickedCallback) {
          this.positionClickedCallback(position)
        }
      }
    }
  }
  
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.renderer || !this.camera || !this.chessboard) return
    
    // Calculate mouse position
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    // Raycast to find intersected objects
    this.raycaster.setFromCamera(this.mouse, this.camera)
    const intersects = this.raycaster.intersectObjects(this.scene!.children, true)
    
    // Reset previous hover state
    if (this.hoveredMesh && this.hoveredMesh.material) {
      const material = this.hoveredMesh.material as THREE.MeshStandardMaterial
      if (material.emissive) {
        material.emissive.setHex(0)
      }
    }
    
    // Set new hover state
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object as THREE.Mesh
      
      if (intersectedObject.material) {
        const material = intersectedObject.material as THREE.MeshStandardMaterial
        if (material.emissive) {
          this.hoveredMesh = intersectedObject
          material.emissive.setHex(0x222222)
        }
      }
    } else {
      this.hoveredMesh = null
    }
  }
  
  private animate = (): void => {
    if (!this.renderer || !this.scene || !this.camera) return
    
    requestAnimationFrame(this.animate)
    
    // Update controls
    if (this.controls) {
      this.controls.update()
    }
    
    // Render the scene
    this.renderer.render(this.scene, this.camera)
  }
}

// Create a mesh for a chess piece
export function createPieceMesh(piece: Piece): THREE.Mesh {
  const { type, color, position } = piece
  
  // Base size and color for pieces
  const baseSize = 0.4
  const baseColor = color === PieceColor.WHITE ? 0xf0f0f0 : 0x202020
  
  // Geometry based on piece type
  let geometry: THREE.BufferGeometry
  
  switch (type) {
    case PieceType.PAWN:
      geometry = new THREE.ConeGeometry(baseSize * 0.3, baseSize, 8)
      break
    case PieceType.ROOK:
      geometry = new THREE.BoxGeometry(baseSize * 0.6, baseSize, baseSize * 0.6)
      break
    case PieceType.KNIGHT:
      // Simplified knight as a combination of geometries
      geometry = new THREE.SphereGeometry(baseSize * 0.4, 8, 8)
      break
    case PieceType.BISHOP:
      geometry = new THREE.ConeGeometry(baseSize * 0.4, baseSize * 1.2, 8)
      break
    case PieceType.QUEEN:
      // Queen as a cylinder with a sphere on top
      geometry = new THREE.CylinderGeometry(baseSize * 0.5, baseSize * 0.7, baseSize * 1.2, 8)
      break
    case PieceType.KING:
      // King as a cylinder with a cross on top
      geometry = new THREE.CylinderGeometry(baseSize * 0.5, baseSize * 0.7, baseSize * 1.4, 8)
      break
    default:
      // Default to a sphere for unknown piece types
      geometry = new THREE.SphereGeometry(baseSize * 0.5, 8, 8)
  }
  
  // Create material
  const material = new THREE.MeshStandardMaterial({
    color: baseColor,
    metalness: 0.3,
    roughness: 0.7
  })
  
  // Create mesh
  const mesh = new THREE.Mesh(geometry, material)
  
  // Position the mesh
  mesh.position.set(position.x - 0.5, position.y - 0.5, position.z - 0.5)
  
  // Store piece data for raycasting
  mesh.userData = { 
    piece,
    position
  }
  
  return mesh
}

// Highlight valid move positions
export function highlightValidMoves(scene: THREE.Scene, positions: Position[]): THREE.Group {
  const highlightGroup = new THREE.Group()
  
  positions.forEach(position => {
    // Create a semi-transparent cube to highlight the position
    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00, // Green highlight
      transparent: true,
      opacity: 0.4
    })
    
    const highlightMesh = new THREE.Mesh(geometry, material)
    highlightMesh.position.set(position.x - 0.5, position.y - 0.5, position.z - 0.5)
    
    // Store position data
    highlightMesh.userData = { position }
    
    highlightGroup.add(highlightMesh)
  })
  
  scene.add(highlightGroup)
  return highlightGroup
}

// Remove highlights
export function removeHighlights(scene: THREE.Scene, highlightGroup: THREE.Group): void {
  scene.remove(highlightGroup)
  
  // Clean up geometries and materials
  highlightGroup.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}
