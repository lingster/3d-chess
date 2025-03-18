<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import {
    ThreeChessRenderer,
    Position,
    GameState,
    PieceColor
  } from '$lib/chess'

  // Game state
  let renderer: ThreeChessRenderer
  let selectedPosition: Position | null = null
  let validMoves: Position[] = []
  let gameState: GameState
  let currentTurn: PieceColor
  let message = 'Select a piece to move'
  let gameContainer: HTMLElement
  
  // Input for position entry
  let fromPositionInput = ''
  let toPositionInput = ''
  let inputMessage = ''

  onMount(() => {
    // Create and initialize the renderer
    renderer = new ThreeChessRenderer()
    renderer.initialize(gameContainer)
    
    // Set up click handler
    renderer.onPositionClicked(handlePositionClick)
    
    // Update game state
    updateGameState()
  })

  onDestroy(() => {
    // Clean up resources
    if (renderer) {
      renderer.cleanup()
    }
  })
  
  // Handle position click
  function handlePositionClick(position: Position) {
    if (!selectedPosition) {
      // First click - select a piece
      selectedPosition = position
      validMoves = renderer.getValidMovesForPosition(position)
      
      if (validMoves.length > 0) {
        renderer.highlightValidMoves(validMoves)
        message = `Selected piece at ${formatPosition(position)}. Choose destination.`
      } else {
        selectedPosition = null
        message = 'No valid moves for this piece. Select another piece.'
      }
    } else {
      // Second click - move the piece if the destination is valid
      const isValidMove = validMoves.some(move => 
        move.x === position.x && move.y === position.y && move.z === position.z
      )
      
      if (isValidMove) {
        renderer.movePiece(selectedPosition, position)
        message = `Moved from ${formatPosition(selectedPosition)} to ${formatPosition(position)}`
        
        // Reset selection
        selectedPosition = null
        validMoves = []
        
        // Update game state
        updateGameState()
      } else if (
        position.x === selectedPosition.x && 
        position.y === selectedPosition.y && 
        position.z === selectedPosition.z
      ) {
        // Clicked the same position again - deselect
        selectedPosition = null
        validMoves = []
        renderer.clearHighlights()
        message = 'Selection canceled. Select a piece to move.'
      } else {
        message = `Invalid move. Select a highlighted position or click the piece again to cancel.`
      }
    }
  }
  
  // Parse position from text input
  function parsePosition(input: string): Position | null {
    // Format should be "x,y,z" or "x y z"
    const parts = input.split(/[ ,]+/)
    
    if (parts.length !== 3) {
      return null
    }
    
    const x = parseInt(parts[0])
    const y = parseInt(parts[1])
    const z = parseInt(parts[2])
    
    if (isNaN(x) || isNaN(y) || isNaN(z) ||
        x < 1 || x > 8 || y < 1 || y > 8 || z < 1 || z > 8) {
      return null
    }
    
    return { x, y, z }
  }
  
  // Format position for display
  function formatPosition(position: Position): string {
    return `(${position.x},${position.y},${position.z})`
  }
  
  // Handle position input submission
  function handlePositionSubmit() {
    const fromPosition = parsePosition(fromPositionInput)
    const toPosition = parsePosition(toPositionInput)
    
    if (!fromPosition || !toPosition) {
      inputMessage = 'Invalid position format. Use x,y,z with values 1-8.'
      return
    }
    
    // Try to make the move
    const success = renderer.movePiece(fromPosition, toPosition)
    
    if (success) {
      message = `Moved from ${formatPosition(fromPosition)} to ${formatPosition(toPosition)}`
      
      // Reset input fields
      fromPositionInput = ''
      toPositionInput = ''
      inputMessage = 'Move submitted'
      
      // Update game state
      updateGameState()
    } else {
      inputMessage = 'Invalid move. Check coordinates and try again.'
    }
  }
  
  // Update game state
  function updateGameState() {
    gameState = renderer.getGameState()
    currentTurn = renderer.getCurrentTurn()
    
    // Update message based on game state
    if (gameState === GameState.CHECKMATE) {
      const winner = currentTurn === PieceColor.WHITE ? 'Black' : 'White'
      message = `Checkmate! ${winner} wins!`
    } else if (gameState === GameState.STALEMATE) {
      message = 'Stalemate! The game is a draw.'
    } else if (gameState === GameState.CHECK) {
      message = `${currentTurn === PieceColor.WHITE ? 'White' : 'Black'} is in check!`
    } else {
      message = `${currentTurn === PieceColor.WHITE ? 'White' : 'Black'} to move.`
    }
  }
</script>

<div class="flex flex-col md:flex-row w-full gap-4 p-4">
  <div class="w-full md:w-3/4">
    <div 
      bind:this={gameContainer} 
      class="w-full aspect-square bg-slate-800 rounded-lg shadow-lg"
    ></div>
  </div>
  
  <div class="w-full md:w-1/4">
    <div class="bg-white p-4 rounded-lg shadow-lg">
      <h2 class="text-2xl font-bold mb-4">3D Chess</h2>
      
      <div class="mb-4">
        <div class="bg-blue-100 p-3 rounded-md mb-2">
          <h3 class="font-bold">Game Status</h3>
          <p>{message}</p>
        </div>
        
        <div class="bg-gray-100 p-3 rounded-md">
          <h3 class="font-bold">Current Turn</h3>
          <p>{currentTurn === PieceColor.WHITE ? 'White' : 'Black'}</p>
        </div>
      </div>
      
      <div class="border-t pt-4 mt-4">
        <h3 class="font-bold mb-2">Manual Move Entry</h3>
        <p class="text-sm mb-2">Enter positions as x,y,z (1-8)</p>
        
        <div class="flex flex-col space-y-2 mb-2">
          <div>
            <label for="fromPosition" class="block text-sm">From:</label>
            <input 
              id="fromPosition"
              type="text" 
              bind:value={fromPositionInput} 
              placeholder="e.g. 1,1,1" 
              class="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label for="toPosition" class="block text-sm">To:</label>
            <input 
              id="toPosition"
              type="text" 
              bind:value={toPositionInput} 
              placeholder="e.g. 1,2,1" 
              class="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <button 
          on:click={handlePositionSubmit}
          class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Make Move
        </button>
        
        {#if inputMessage}
          <p class="text-sm mt-2 text-red-600">{inputMessage}</p>
        {/if}
      </div>
      
      <div class="border-t pt-4 mt-4">
        <h3 class="font-bold mb-2">Instructions</h3>
        <ul class="text-sm space-y-1 list-disc pl-4">
          <li>Click on a piece to select it</li>
          <li>Valid moves will be highlighted</li>
          <li>Click on a valid destination to move</li>
          <li>Click the piece again to cancel selection</li>
          <li>Drag to rotate the view</li>
          <li>Scroll to zoom in/out</li>
        </ul>
      </div>
    </div>
  </div>
</div>
