<script lang="ts">
  import ChessGame from '$lib/components/ChessGame.svelte'
</script>

<div class="container mx-auto py-8 px-4">
  <div class="text-center mb-8">
    <h1 class="text-4xl font-bold mb-2">3D Chess Game</h1>
    <p class="text-lg text-gray-600">A 3D chess implementation with standard chess rules in a 3D space</p>
  </div>
  
  <ChessGame />
  
  <footer class="mt-12 text-center text-sm text-gray-500">
    <p>© 2025 3D Chess. All rights reserved.</p>
  </footer>
</div>
