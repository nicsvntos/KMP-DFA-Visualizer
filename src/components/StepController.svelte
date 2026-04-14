<script lang="ts">
  import {
    play,
    pause,
    reset,
    stepForward,
    stepBack,
    setSpeed,
    getStatus,
    getSpeedMs,
    getCurrentStepIndex,
    getSteps,
  } from '../stores/kmpStore.svelte'

  interface Props {
    disabled?: boolean
  }
  let { disabled = false }: Props = $props()

  let status = $derived(getStatus())
  let speedMs = $derived(getSpeedMs())
  let currentIndex = $derived(getCurrentStepIndex())
  let steps = $derived(getSteps())

  let isPlaying = $derived(status === 'playing')
  let isDone = $derived(status === 'done')
  let isIdle = $derived(status === 'idle')
  let totalSteps = $derived(steps.length)
  let canStepBack = $derived(currentIndex > 0)
  let canStepForward = $derived(currentIndex < totalSteps - 1)

  // Speed labels
  const SPEED_OPTIONS = [
    { label: 'Slow', ms: 600 },
    { label: 'Normal', ms: 300 },
    { label: 'Fast', ms: 100 },
    { label: 'Instant', ms: 16 },
  ]

  let selectedSpeed = $state(300)

  function handleSpeedChange(ms: number) {
    selectedSpeed = ms
    setSpeed(ms)
  }

  function handlePlayPause() {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }
</script>

<div class="flex flex-col gap-4">
  <div>
    <h2 class="text-lg font-semibold text-[#8fa8c8]">Playback Controls</h2>
    <p class="text-sm text-zinc-400 mt-1">
      Step through the algorithm manually or let it play automatically.
    </p>
  </div>

  <!-- Step counter -->
  <div class="flex items-center justify-between text-sm">
    <span class="text-zinc-400">
      Step
      <span class="text-[#8fa8c8] font-mono font-bold">
        {currentIndex < 0 ? 0 : currentIndex + 1}
      </span>
      of
      <span class="text-[#8fa8c8] font-mono font-bold">{totalSteps}</span>
    </span>

    {#if isDone}
      <span class="text-green-400 text-xs font-medium">✓ Search complete</span>
    {:else if isIdle}
      <span class="text-zinc-500 text-xs">Ready</span>
    {:else if isPlaying}
      <span class="text-[#50688c] text-xs font-medium animate-pulse">● Playing</span>
    {:else}
      <span class="text-amber-400 text-xs font-medium">⏸ Paused</span>
    {/if}
  </div>

  <!-- Progress bar -->
  <div class="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
    <div
      class="h-full rounded-full bg-indigo-500 transition-all duration-150"
      style="width: {totalSteps > 0 ? ((currentIndex + 1) / totalSteps) * 100 : 0}%"
    ></div>
  </div>

  <!-- Main controls -->
  <div class="flex items-center gap-2">
    <!-- Step back -->
    <button
      onclick={stepBack}
      disabled={disabled || isIdle || !canStepBack}
      title="Step back"
      class="flex items-center justify-center w-10 h-10 rounded-md
             border border-zinc-700 bg-zinc-800 text-zinc-300
             hover:bg-zinc-700 hover:text-[#8fa8c8]
             disabled:opacity-30 disabled:cursor-not-allowed
             transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z"/>
      </svg>
    </button>

    <!-- Play / Pause -->
    <button
      onclick={handlePlayPause}
      disabled={disabled || isIdle || isDone}
      title={isPlaying ? 'Pause' : 'Play'}
      class="flex items-center justify-center flex-1 h-10 rounded-md
             font-medium text-sm
             {isPlaying
               ? 'bg-amber-600 hover:bg-amber-500 text-[#8fa8c8] border border-amber-500'
               : 'bg-[#1e1f2f] hover:bg-[#252638] text-[#8fa8c8] border border-[#3a3b5c]'}
             disabled:opacity-30 disabled:cursor-not-allowed
             transition-colors"
    >
      {#if isPlaying}
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
        Pause
      {:else}
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        {isDone ? 'Done' : 'Play'}
      {/if}
    </button>

    <!-- Step forward -->
    <button
      onclick={stepForward}
      disabled={disabled || isIdle || !canStepForward}
      title="Step forward"
      class="flex items-center justify-center w-10 h-10 rounded-md
             border border-zinc-700 bg-zinc-800 text-zinc-300
             hover:bg-zinc-700 hover:text-[#8fa8c8]
             disabled:opacity-30 disabled:cursor-not-allowed
             transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M6 18l8.5-6L6 6v12zm2.5-6 5.5 3.9V8.1L8.5 12zM16 6h2v12h-2z"/>
      </svg>
    </button>

    <!-- Reset -->
    <button
      onclick={reset}
      disabled={disabled || isIdle}
      title="Reset"
      class="flex items-center justify-center w-10 h-10 rounded-md
             border border-zinc-700 bg-zinc-800 text-zinc-300
             hover:bg-red-950 hover:text-red-400 hover:border-red-800
             disabled:opacity-30 disabled:cursor-not-allowed
             transition-colors"
    >
      <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/>
      </svg>
    </button>
  </div>

  <!-- Speed selector -->
  <div class="flex flex-col gap-2">
    <span class="text-xs font-medium text-zinc-400">Playback Speed</span>
    <div class="flex gap-2">
      {#each SPEED_OPTIONS as opt}
        <button
          onclick={() => handleSpeedChange(opt.ms)}
          class="flex-1 text-xs py-1.5 rounded-md border transition-colors
                 {selectedSpeed === opt.ms
                   ? 'bg-[#1e1f2f] border-[#3a3b5c] text-[#8fa8c8] font-medium'
                   : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-[#8fa8c8]'}"
        >
          {opt.label}
        </button>
      {/each}
    </div>
  </div>

  <!-- Keyboard hint -->
  <div class="rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2">
    <p class="text-xs text-zinc-500 font-medium mb-1">Keyboard shortcuts</p>
    <div class="flex flex-col gap-0.5 text-xs text-zinc-600">
      <span><kbd class="text-zinc-400 bg-zinc-800 px-1 rounded">Space</kbd> Play / Pause</span>
      <span><kbd class="text-zinc-400 bg-zinc-800 px-1 rounded">←</kbd> Step back</span>
      <span><kbd class="text-zinc-400 bg-zinc-800 px-1 rounded">→</kbd> Step forward</span>
      <span><kbd class="text-zinc-400 bg-zinc-800 px-1 rounded">R</kbd> Reset</span>
    </div>
  </div>
</div>

<!-- Keyboard listener -->
<svelte:window
  onkeydown={(e) => {
    if (disabled) return
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
    if (e.key === ' ') { e.preventDefault(); handlePlayPause() }
    if (e.key === 'ArrowRight') { e.preventDefault(); stepForward() }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepBack() }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); reset() }
  }}
/>