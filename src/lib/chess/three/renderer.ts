import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { 
  GameState, 
  Piece, 
  PieceColor, 
  Position, 
  positionToKey,
  arePositionsEqual
} from '../models/types'
import {
  getPiece,
  getPiecesByColor
} from '../models/board'
import {
  createGame, 
  makeMove,
  getValidMovesForPosition as getValidMovesForPiece
} from '../models/game'
import {
  createChessboard,
  createPieceMesh,
  highlightValidMoves,
  removeHighlights,
  setupCamera,
  setupRenderer,
  setupScene
} from './components'

export interface ChessRenderer {
  initialize(container: HTMLElement): void
  update(): void
  cleanup(): void
  onPositionClicked(callback: (position: Position) => void): void
  highlightValidMoves(positions: Position[]): void
  clearHighlights(): void
  movePiece(from: Position, to: Position): void
  getGameState(): GameState
  getCurrentTurn(): PieceColor
  getValidMovesForPosition(position: Position): Position[]
}

export class ThreeChessRenderer implements ChessRenderer {
  private container: HTMLElement | null = null
  private scene: THREE.Scene | null = null
  private camera: THREE.PerspectiveCamera | null = null
  private renderer: THREE.WebGLRenderer | null = null
  private controls: OrbitControls | null = null
  private chessboard: THREE.Group | null = null
  private pieces: Map<string, THREE.Mesh> = new Map()
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private mouse: THREE.Vector2 = new THREE.Vector2()
  private game: any
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
    }
  }
  
  movePiece(from: Position, to: Position): void {
    const success = makeMove(this.game, from, to)
    
    if (success) {
      // Update 3D representation
      this.clearHighlights()
      this.placePieces()
    }
  }
  
  getGameState(): GameState {
    return this.game.state
  }
  
  getCurrentTurn(): PieceColor {
    return this.game.currentTurn
  }
  
  getValidMovesForPosition(position: Position): Position[] {
    return getValidMovesForPiece(this.game, position)
  }
  
  private placePieces(): void {
    if (!this.scene) return
    
    // Remove all existing pieces
    this.pieces.forEach(mesh => {
      this.scene!.remove(mesh)
    })
    this.pieces.clear()
    
    // Add all pieces from the game board
    getPiecesByColor(this.game.board, PieceColor.WHITE).forEach(piece => {
      this.addPiece(piece)
    })
    
    getPiecesByColor(this.game.board, PieceColor.BLACK).forEach(piece => {
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
    const intersects = this.raycaster.intersectObjects(this.chessboard.children, true)
    
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
    const intersects = this.raycaster.intersectObjects(this.chessboard.children, true)
    
    // Reset previous hover state
    if (this.hoveredMesh && this.hoveredMesh.material) {
      (this.hoveredMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0)
    }
    
    // Set new hover state
    if (intersects.length > 0) {
      const intersectedObject = intersects[0].object as THREE.Mesh
      
      if (intersectedObject.material && 
        !(intersectedObject.material as THREE.MeshBasicMaterial).map) {
        this.hoveredMesh = intersectedObject
        ;(this.hoveredMesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x222222)
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
