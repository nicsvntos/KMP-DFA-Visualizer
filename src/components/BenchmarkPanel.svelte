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
    <h2 class="text-lg font-semibold text-[#8fa8c8]">Performance Benchmark</h2>
    <p class="text-base text-[#6a82a0] mt-1">
      Runs KMP on 1 MB and 10 MB of synthetic text to demonstrate
      <span class="text-[#50688c] font-mono">O(n + m)</span> linear scaling.
    </p>
  </div>

  <!-- Context banner -->
  <div class="rounded-lg border border-[#2a2a3d]bg-[#191826] px-4 py-2 flex items-center gap-3">
    <p class="text-sm font-medium text-[#50688c] shrink-0">From Visualizer</p>
    <span class="text-[#2e3d54]">·</span>
    <p class="text-sm font-mono">
      Pattern:
      {#if pattern}
        <span class="text-[#50688c] font-semibold">'{pattern}'</span>
      {:else}
        <span class="text-[#2e3d54]">none</span>
      {/if}
    </p>
    <span class="text-[#2e3d54]">·</span>
    <p class="text-sm text-[#50688c]">
      {#if text}
        <span class="text-[#6a82a0]">{text.length.toLocaleString()} chars loaded</span>
      {:else}
        <span class="text-[#2e3d54]">no text loaded</span>
      {/if}
    </p>
  </div>

  <!-- Run button -->
  <button
    onclick={() => runBenchmarkSuite(pattern)}
    disabled={isRunning || pattern.length === 0}
    class="w-full rounded-md py-3 px-4 text-base font-medium transition-colors
           focus:outline-none focus:ring-2 focus:ring-[#3a3b5c]
           {isRunning || pattern.length === 0
             ? 'bg-[#191826] text-[#3d5070] cursor-not-allowed border border-slate-700'
             : 'bg-[#1e1f2f] hover:bg-[#252638] text-[#8fa8c8]'}"
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
    <p class="text-base text-red-400 bg-red-950 border border-red-800 rounded-md px-4 py-3">
      {error}
    </p>
  {/if}

  <!-- Results -->
  {#if result}
    <!-- Run cards -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {#each result.runs as run}
        <div class="rounded-lg border border-[#2a2a3d]bg-[#1a1929] p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <span class="text-base font-bold px-2 py-0.5 rounded bg-[#191826] text-[#50688c] border border-[#2a2a3d]">
              {run.fileSizeLabel}
            </span>
            <span class="text-base text-[#50688c]">{formatBytes(run.fileSizeBytes)}</span>
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex justify-between text-base">
              <span class="text-[#6a82a0]">Duration</span>
              <span class="text-[#8fa8c8] font-mono font-bold">{formatMs(run.durationMs)}</span>
            </div>
            <div class="flex justify-between text-base">
              <span class="text-[#6a82a0]">Characters scanned</span>
              <span class="text-[#8fa8c8] font-mono">{run.textLength.toLocaleString()}</span>
            </div>
            <div class="flex justify-between text-base">
              <span class="text-[#6a82a0]">Matches found</span>
              <span class="text-green-400 font-mono font-bold">{run.matchCount}</span>
            </div>
            <div class="flex justify-between text-base">
              <span class="text-[#6a82a0]">Throughput</span>
              <span class="text-[#8fa8c8] font-mono">
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
      <div class="rounded-lg border border-[#2a2a3d] bg-[#191826] p-4 flex flex-col gap-3">
        <div class="flex items-center gap-2">
          <span class="text-[#50688c] font-mono font-bold text-base">{analysis.complexity}</span>
          <span class="text-base text-[#50688c]">Analysis</span>
        </div>
        <p class="text-base text-slate-200 leading-relaxed">{analysis.explanation}</p>
        <div class="grid grid-cols-2 gap-3 mt-1">
          <div class="rounded-md bg-[#191826] bg-opacity-60 p-3 text-center border border-[#2a2a3d]">
            <p class="text-sm text-[#50688c] mb-1">File size ratio</p>
            <p class="text-2xl font-bold font-mono text-[#8fa8c8]">10×</p>
            <p class="text-sm text-[#50688c]">1 MB → 10 MB</p>
          </div>
          <div class="rounded-md bg-[#191826] bg-opacity-60 p-3 text-center border border-[#2a2a3d]">
            <p class="text-sm text-[#50688c] mb-1">Time ratio</p>
            <p class="text-2xl font-bold font-mono
                      {analysis.ratio <= 15 ? 'text-green-400' : 'text-amber-300'}">
              {analysis.ratio}×
            </p>
            <p class="text-sm text-[#50688c]">
              {analysis.ratio <= 15 ? 'Confirms linear' : 'Near-linear'}
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Big-O reference table -->
    <div class="rounded-lg border border-[#2a2a3d]bg-[#1a1929] p-4">
      <p class="text-base font-semibold text-[#8fa8c8] mb-3">Big-O Complexity Reference</p>
      <table class="w-full text-sm">
        <thead>
          <tr class="text-[#50688c] border-b border-slate-700">
            <th class="text-left pb-2 font-medium">Algorithm</th>
            <th class="text-left pb-2 font-medium">Best</th>
            <th class="text-left pb-2 font-medium">Worst</th>
            <th class="text-left pb-2 font-medium">Space</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-800">
          <tr>
            <td class="py-2.5 font-semibold text-[#50688c]">KMP (this app)</td>
            <td class="py-2.5 font-mono text-slate-200">O(n + m)</td>
            <td class="py-2.5 font-mono text-slate-200">O(n + m)</td>
            <td class="py-2.5 font-mono text-slate-200">O(m)</td>
          </tr>
          <tr>
            <td class="py-2.5 text-[#6a82a0]">Brute Force</td>
            <td class="py-2.5 font-mono text-[#6a82a0]">O(n)</td>
            <td class="py-2.5 font-mono text-red-400">O(n · m)</td>
            <td class="py-2.5 font-mono text-[#6a82a0]">O(1)</td>
          </tr>
          <tr>
            <td class="py-2.5 text-[#6a82a0]">Boyer-Moore</td>
            <td class="py-2.5 font-mono text-green-400">O(n/m)</td>
            <td class="py-2.5 font-mono text-red-400">O(n · m)</td>
            <td class="py-2.5 font-mono text-[#6a82a0]">O(m + σ)</td>
          </tr>
        </tbody>
      </table>
      <p class="text-sm text-[#3d5070] mt-3">n = text length · m = pattern length · σ = alphabet size</p>
    </div>

    <button
      onclick={clearResults}
      class="text-sm text-[#3d5070] hover:text-[#6a82a0] transition-colors underline underline-offset-2 self-start"
    >
      Clear results
    </button>
  {/if}
</div>