<script lang="ts">
  import {
    runBenchmarkSuite,
    clearResults,
    getResult,
    getIsRunning,
    getProgressMessage,
    getError,
  } from '../stores/benchmarkStore.svelte'
  import { analyzeBigO } from '../algorithms/benchmark'

  interface Props {
    pattern: string
    text: string
  }
  let { pattern, text }: Props = $props()

  // ─── Local derived state ────────────────────────────────────────────────────
  let result = $derived(getResult())
  let isRunning = $derived(getIsRunning())
  let progressMessage = $derived(getProgressMessage())
  let error = $derived(getError())
  let analysis = $derived(result ? analyzeBigO(result) : null)

  function formatBytes(bytes: number): string {
    if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`
    if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`
    return `${bytes} B`
  }

  function formatMs(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(0)} µs`
    return `${ms.toFixed(2)} ms`
  }
</script>

<div class="flex flex-col gap-5">
  <!-- Header -->
  <div>
    <h2 class="text-lg font-semibold text-white">Performance Benchmark</h2>
    <p class="text-sm text-slate-400 mt-1">
      Runs KMP on 1 MB and 10 MB of synthetic text to demonstrate
      <span class="text-indigo-400 font-mono">O(n + m)</span> linear scaling.
    </p>
  </div>

  <!-- Context banner -->
  {#if pattern || text}
    <div class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 flex flex-col gap-1.5">
      <p class="text-xs font-medium text-slate-400">From Visualizer</p>
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono">
        <span class="text-slate-400">
          Pattern:
          {#if pattern}
            <span class="text-indigo-300 font-semibold">'{pattern}'</span>
          {:else}
            <span class="text-slate-600">none</span>
          {/if}
        </span>
        <span class="text-slate-400">
          Text:
          {#if text}
            <span class="text-slate-300">
              '{text.length > 40 ? text.slice(0, 40) + '…' : text}'
            </span>
            <span class="text-slate-500 ml-1">({text.length} chars)</span>
          {:else}
            <span class="text-slate-600">none</span>
          {/if}
        </span>
      </div>
    </div>
  {/if}

  <!-- Run button -->
  <button
    onclick={() => runBenchmarkSuite(pattern)}
    disabled={isRunning || pattern.length === 0}
    class="w-full rounded-md py-2.5 px-4 text-sm font-medium transition-colors
           focus:outline-none focus:ring-2 focus:ring-indigo-400
           {isRunning || pattern.length === 0
             ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
             : 'bg-indigo-600 hover:bg-indigo-500 text-white'}"
  >
    {#if isRunning}
      <span class="flex items-center justify-center gap-2">
        <svg class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
        </svg>
        {progressMessage || 'Running...'}
      </span>
    {:else if pattern.length === 0}
      Enter a pattern first
    {:else}
      Run Benchmark
    {/if}
  </button>

  <!-- Error -->
  {#if error}
    <p class="text-sm text-red-400 bg-red-950 border border-red-800 rounded-md px-3 py-2">
      {error}
    </p>
  {/if}

  <!-- Results -->
  {#if result}
    <!-- Run cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each result.runs as run}
        <div class="rounded-lg border border-zinc-700 bg-zinc-900 p-4 flex flex-col gap-3">
          <!-- Size badge -->
          <div class="flex items-center justify-between">
            <span class="text-xs font-bold px-2 py-0.5 rounded bg-indigo-900 text-indigo-300 border border-indigo-700">
              {run.fileSizeLabel}
            </span>
            <span class="text-xs text-zinc-500">{formatBytes(run.fileSizeBytes)}</span>
          </div>

          <!-- Stats -->
          <div class="flex flex-col gap-1.5">
            <div class="flex justify-between text-sm">
              <span class="text-zinc-400">Duration</span>
              <span class="text-white font-mono font-bold">{formatMs(run.durationMs)}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-zinc-400">Characters scanned</span>
              <span class="text-white font-mono">{run.textLength.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-zinc-400">Matches found</span>
              <span class="text-green-400 font-mono font-bold">{run.matchCount}</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-zinc-400">Throughput</span>
              <span class="text-white font-mono">
                {run.durationMs > 0
                  ? `${((run.textLength / run.durationMs) * 1000 / 1_000_000).toFixed(1)} M chars/s`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      {/each}
    </div>

    <!-- Big-O analysis -->
    {#if analysis}
      <div class="rounded-lg border border-indigo-800 bg-indigo-950 p-4 flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="text-indigo-300 font-mono font-bold text-base">{analysis.complexity}</span>
          <span class="text-xs text-indigo-400">Analysis</span>
        </div>
        <p class="text-sm text-indigo-200 leading-relaxed">{analysis.explanation}</p>

        <!-- Size vs time ratio comparison -->
        <div class="grid grid-cols-2 gap-3 mt-1">
          <div class="rounded-md bg-indigo-900 bg-opacity-50 p-3 text-center">
            <p class="text-xs text-indigo-400 mb-1">File size ratio</p>
            <p class="text-xl font-bold font-mono text-white">10×</p>
            <p class="text-xs text-indigo-400">1 MB → 10 MB</p>
          </div>
          <div class="rounded-md bg-indigo-900 bg-opacity-50 p-3 text-center">
            <p class="text-xs text-indigo-400 mb-1">Time ratio</p>
            <p class="text-xl font-bold font-mono
                      {analysis.ratio <= 15 ? 'text-green-400' : 'text-amber-400'}">
              {analysis.ratio}×
            </p>
            <p class="text-xs text-indigo-400">
              {analysis.ratio <= 15 ? 'Confirms linear' : 'Near-linear'}
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Big-O reference table -->
    <div class="rounded-lg border border-zinc-700 bg-zinc-900 p-4">
      <p class="text-xs font-medium text-zinc-400 mb-3">Big-O Complexity Reference</p>
      <table class="w-full text-xs">
        <thead>
          <tr class="text-zinc-500 border-b border-zinc-800">
            <th class="text-left pb-2 font-medium">Algorithm</th>
            <th class="text-left pb-2 font-medium">Best</th>
            <th class="text-left pb-2 font-medium">Worst</th>
            <th class="text-left pb-2 font-medium">Space</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-800">
          <tr class="text-zinc-300">
            <td class="py-2 font-medium text-indigo-400">KMP (this app)</td>
            <td class="py-2 font-mono">O(n + m)</td>
            <td class="py-2 font-mono">O(n + m)</td>
            <td class="py-2 font-mono">O(m)</td>
          </tr>
          <tr class="text-zinc-400">
            <td class="py-2">Brute Force</td>
            <td class="py-2 font-mono">O(n)</td>
            <td class="py-2 font-mono text-red-400">O(n · m)</td>
            <td class="py-2 font-mono">O(1)</td>
          </tr>
          <tr class="text-zinc-400">
            <td class="py-2">Boyer-Moore</td>
            <td class="py-2 font-mono text-green-400">O(n/m)</td>
            <td class="py-2 font-mono">O(n · m)</td>
            <td class="py-2 font-mono">O(m + σ)</td>
          </tr>
          <tr class="text-zinc-400">
            <td class="py-2">Rabin-Karp</td>
            <td class="py-2 font-mono">O(n + m)</td>
            <td class="py-2 font-mono text-red-400">O(n · m)</td>
            <td class="py-2 font-mono">O(1)</td>
          </tr>
        </tbody>
      </table>
      <p class="text-xs text-zinc-600 mt-2">n = text length · m = pattern length · σ = alphabet size</p>
    </div>

    <!-- Clear button -->
    <button
      onclick={clearResults}
      class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors underline underline-offset-2 self-start"
    >
      Clear results
    </button>
  {/if}
</div>