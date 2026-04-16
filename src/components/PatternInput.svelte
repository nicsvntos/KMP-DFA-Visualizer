<script lang="ts">
  import { initialize, getPattern } from '../stores/kmpStore.svelte'
  import { explainFailureFunction } from '../algorithms/kmp'

  interface Props {
    onReady: (pattern: string, text: string) => void
  }
  let { onReady }: Props = $props()

  let pattern = $state('')
  let text = $state('')
  let error = $state('')

  const SAMPLE_TEXTS = [
    'the quick brown fox jumps over the lazy dog',
    'ababababcababababcababababc',
    'AABAACAADAABAAABAABAAC',
    'this is a simple test with simple words appearing simply',
  ]

  const SAMPLE_PATTERNS = ['abc', 'aba', 'the', 'simple', 'AABA']

  let failureTable = $derived(
    pattern.length > 0 ? explainFailureFunction(pattern) : []
  )

  let charCount = $derived(text.length)

  function handleSubmit() {
    error = ''
    if (pattern.trim().length === 0) {
      error = 'Please enter a search pattern.'
      return
    }
    if (text.trim().length === 0) {
      error = 'Please enter some text to search.'
      return
    }
    if (pattern.length > text.length) {
      error = 'Pattern cannot be longer than the search text.'
      return
    }
    initialize(pattern, text)
    onReady(pattern, text)
  }

  function loadSample(sampleText: string) {
    text = sampleText
  }

  function loadSamplePattern(samplePattern: string) {
    pattern = samplePattern
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
  }
</script>

<div class="flex flex-col gap-6">
  <!-- Header -->
  <div>
    <h2 class="text-lg font-semibold text-[#8fa8c8]">Pattern & Text Input</h2>
    <p class="text-sm text-zinc-400 mt-1">
      Enter a pattern and text to search. The visualizer will animate the KMP
      algorithm step by step.
    </p>
  </div>

  <!-- Pattern input -->
  <div class="flex flex-col gap-2">
    <label class="text-sm font-medium text-zinc-300" for="pattern">
      Search Pattern
    </label>
    <input
      id="pattern"
      type="text"
      bind:value={pattern}
      placeholder="e.g. abc"
      class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2
             text-[#8fa8c8] placeholder-zinc-500 text-sm
             focus:outline-none focus:ring-2 focus:ring-[#3a3b5c]
             font-mono"
    />
    <!-- Sample patterns -->
    <div class="flex flex-wrap gap-2 mt-1">
      <span class="text-xs text-zinc-500">Quick patterns:</span>
      {#each SAMPLE_PATTERNS as sp}
        <button
          onclick={() => loadSamplePattern(sp)}
          class="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300
                 hover:bg-[#50688c] hover:text-[#191826] hover:text-[#8fa8c8] transition-colors font-mono"
        >
          {sp}
        </button>
      {/each}
    </div>
  </div>

  <!-- Failure function table -->
  {#if failureTable.length > 0}
    <div class="rounded-md border border-zinc-700 bg-zinc-900 p-3">
      <p class="text-xs font-medium text-zinc-400 mb-2">
        KMP Failure Function (partial match table)
      </p>
      <div class="overflow-x-auto">
        <table class="text-xs font-mono">
          <thead>
            <tr>
              <td class="pr-3 text-zinc-500">index</td>
              {#each failureTable as cell}
                <td class="w-8 text-center text-zinc-500">{cell.index}</td>
              {/each}
            </tr>
            <tr>
              <td class="pr-3 text-zinc-500">char</td>
              {#each failureTable as cell}
                <td class="w-8 text-center text-[#8fa8c8] font-bold">{cell.char}</td>
              {/each}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td class="pr-3 text-zinc-500">f(i)</td>
              {#each failureTable as cell}
                <td
                  class="w-8 text-center rounded
                         {cell.value > 0
                           ? 'text-[#50688c] font-bold'
                           : 'text-zinc-400'}"
                >
                  {cell.value}
                </td>
              {/each}
            </tr>
          </tbody>
        </table>
      </div>
      <p class="text-xs text-zinc-500 mt-2">
        f(i) = longest proper prefix of pattern[0..i] that is also a suffix.
        Non-zero values mean KMP can skip re-checking those characters.
      </p>
    </div>
  {/if}

  <!-- Text input -->
  <div class="flex flex-col gap-2">
    <div class="flex items-center justify-between">
      <label class="text-sm font-medium text-zinc-300" for="text">
        Search Text
      </label>
      <span class="text-xs text-zinc-500">{charCount} characters</span>
    </div>
    <textarea
      id="text"
      bind:value={text}
      onkeydown={handleKeydown}
      placeholder="Paste or type your text here..."
      rows={5}
      class="w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2
             text-[#8fa8c8] placeholder-zinc-500 text-sm resize-y
             focus:outline-none focus:ring-2 focus:ring-[#3a3b5c]
             font-mono"
    ></textarea>

    <!-- Sample texts -->
    <div class="flex flex-col gap-1 mt-1">
      <span class="text-xs text-zinc-500">Load a sample:</span>
      <div class="flex flex-wrap gap-2">
        {#each SAMPLE_TEXTS as st, i}
          <button
            onclick={() => loadSample(st)}
            class="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-300
                   hover:bg-[#50688c] hover:text-[#191826] hover:text-[#8fa8c8] transition-colors"
          >
            Sample {i + 1}
          </button>
        {/each}
      </div>
    </div>
  </div>

  <!-- Error -->
  {#if error}
    <p class="text-sm text-red-400 bg-red-950 border border-red-800 rounded-md px-3 py-2">
      {error}
    </p>
  {/if}

  <!-- Submit -->
  <button
    onclick={handleSubmit}
    class="w-full rounded-md bg-[#1e1f2f] hover:bg-[#50688c] hover:text-[#191826] text-[#8fa8c8] text-sm font-medium py-2.5 px-4
           transition-colors focus:outline-none focus:ring-2 focus:ring-[#3a3b5c]"
  >
    Build DFA & Run KMP
  </button>

  <p class="text-xs text-zinc-600 text-center">Tip: Ctrl + Enter to submit</p>
</div>