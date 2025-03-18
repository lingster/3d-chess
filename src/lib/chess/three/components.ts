import * as THREE from 'three'
import { Piece, PieceColor, PieceType, Position, positionToKey } from '../models/types'

// Set up the Three.js scene
export function setupScene(container: HTMLElement): THREE.Scene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)
  
  // Add ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 1.5)
  scene.add(ambientLight)
  
  // Add directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(1, 1, 1)
  scene.add(directionalLight)
  
  return scene
}

// Create a camera
export function setupCamera(container: HTMLElement): THREE.PerspectiveCamera {
  const aspect = container.clientWidth / container.clientHeight
  const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000)
  camera.position.set(12, 12, 12)
  camera.lookAt(3.5, 3.5, 3.5)
  return camera
}

// Create a renderer
export function setupRenderer(container: HTMLElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(window.devicePixelRatio)
  container.appendChild(renderer.domElement)
  return renderer
}

// Create a chessboard
export function createChessboard(scene: THREE.Scene): THREE.Group {
  const chessboard = new THREE.Group()
  
  // Create the grid
  for (let x = 1; x <= 8; x++) {
    for (let y = 1; y <= 8; y++) {
      for (let z = 1; z <= 8; z++) {
        // Determine color pattern (alternating color pattern extended to 3D)
        const isWhite = (x + y + z) % 2 === 0
        const color = isWhite ? 0xe0e0e0 : 0x808080
        
        // Create cell material with some transparency
        const material = new THREE.MeshStandardMaterial({
          color: color,
          transparent: true,
          opacity: 0.3,
          side: THREE.DoubleSide
        })
        
        // Create cube geometry
        const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9)
        const cell = new THREE.Mesh(geometry, material)
        
        // Position the cell
        cell.position.set(x - 0.5, y - 0.5, z - 0.5)
        
        // Store position data for raycasting
        cell.userData = { position: { x, y, z } }
        
        // Add cell to chessboard
        chessboard.add(cell)
      }
    }
  }
  
  // Add coordinate grid
  addCoordinateGrid(chessboard)
  
  return chessboard
}

// Add coordinate indicators
function addCoordinateGrid(chessboard: THREE.Group): void {
  // Add a thin frame around the cube to show boundaries
  const frameGeometry = new THREE.BoxGeometry(8.1, 8.1, 8.1)
  const frameMaterial = new THREE.LineBasicMaterial({ color: 0xffffff })
  const frameEdges = new THREE.EdgesGeometry(frameGeometry)
  const frame = new THREE.LineSegments(frameEdges, frameMaterial)
  frame.position.set(3.5, 3.5, 3.5)
  chessboard.add(frame)
  
  // Add axes labels
  // This is a simplified version - in a complete implementation, 
  // we'd add text labels for coordinates
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
