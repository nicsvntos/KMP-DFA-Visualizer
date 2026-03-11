<script lang="ts">
  import PatternInput from './components/PatternInput.svelte'
  import DFAGraph from './components/DFAGraph.svelte'
  import MatchHighlighter from './components/MatchHighlighter.svelte'
  import StepController from './components/StepController.svelte'
  import BenchmarkPanel from './components/BenchmarkPanel.svelte'

  import {
    getSteps,
    getMatches,
    getStatus,
    getDFA,
    getCurrentStepIndex,
    getPattern,
  } from './stores/kmpStore.svelte'

  type Tab = 'visualizer' | 'benchmark'
  let activeTab = $state<Tab>('visualizer')

  let isReady = $state(false)
  let currentPattern = $state('')
  let currentText = $state('')

  let steps = $derived(getSteps())
  let matches = $derived(getMatches())
  let status = $derived(getStatus())
  let dfa = $derived(getDFA())
  let currentStepIndex = $derived(getCurrentStepIndex())
  let currentStep = $derived(
    currentStepIndex >= 0 && steps.length > 0 ? steps[currentStepIndex] : null
  )
  let activeState = $derived(currentStep ? currentStep.currentState : 0)

  function handleReady(pattern: string, text: string) {
    currentPattern = pattern
    currentText = text
    isReady = true
  }
</script>

<div class="min-h-screen bg-zinc-950 text-white">
  <!-- Top nav -->
  <header class="border-b border-zinc-800 bg-zinc-900">
    <div class="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <!-- Logo mark -->
        <div class="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-sm font-bold text-white leading-none">Pattern Matcher</h1>
          <p class="text-xs text-zinc-500 leading-none mt-0.5">KMP + DFA Visualizer</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-zinc-800 rounded-lg p-1">
        <button
          onclick={() => (activeTab = 'visualizer')}
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                 {activeTab === 'visualizer'
                   ? 'bg-indigo-600 text-white'
                   : 'text-zinc-400 hover:text-white'}"
        >
          Visualizer
        </button>
        <button
          onclick={() => (activeTab = 'benchmark')}
          class="px-3 py-1.5 text-xs font-medium rounded-md transition-colors
                 {activeTab === 'benchmark'
                   ? 'bg-indigo-600 text-white'
                   : 'text-zinc-400 hover:text-white'}"
        >
          Benchmark
        </button>
      </div>
    </div>
  </header>

  <!-- Main content -->
  <main class="max-w-screen-xl mx-auto px-4 py-6">

    {#if activeTab === 'visualizer'}
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

        <!-- Left panel: input + controls -->
        <div class="lg:col-span-3 flex flex-col gap-6">
          <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <PatternInput onReady={handleReady} />
          </div>

          {#if isReady}
            <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <StepController disabled={!isReady} />
            </div>
          {/if}
        </div>

        <!-- Right panel: DFA + highlighter -->
        <div class="lg:col-span-9 flex flex-col gap-6">
          {#if !isReady}
            <!-- Welcome / empty state -->
            <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-10
                        flex flex-col items-center justify-center gap-4 text-center">
              <div class="w-16 h-16 rounded-full bg-indigo-900 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                </svg>
              </div>
              <div>
                <h2 class="text-xl font-semibold text-white">Welcome to Pattern Matcher</h2>
                <p class="text-zinc-400 text-sm mt-2 max-w-md">
                  Enter a search pattern and text on the left, then click
                  <span class="text-indigo-400 font-medium">Build DFA & Run KMP</span>
                  to see the algorithm animate step by step.
                </p>
              </div>
              <div class="grid grid-cols-3 gap-3 mt-2 w-full max-w-lg">
                {#each [
                  { icon: '⬡', title: 'DFA Graph', desc: 'Circle-and-arrows automaton built from your pattern' },
                  { icon: '⚡', title: 'KMP Steps', desc: 'Watch each character comparison in real time' },
                  { icon: '📊', title: 'Big-O Proof', desc: 'Benchmark on 1MB vs 10MB to confirm O(n+m)' },
                ] as feature}
                  <div class="rounded-lg border border-zinc-700 bg-zinc-800 p-3 text-left">
                    <div class="text-xl mb-1">{feature.icon}</div>
                    <p class="text-xs font-semibold text-white">{feature.title}</p>
                    <p class="text-xs text-zinc-500 mt-0.5">{feature.desc}</p>
                  </div>
                {/each}
              </div>
            </div>
          {:else}
            <!-- DFA Graph -->
            <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4" style="min-height: 380px;">
              <DFAGraph {dfa} {activeState} />
            </div>

            <!-- Match Highlighter -->
            <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <MatchHighlighter
                text={currentText}
                pattern={currentPattern}
                {matches}
                {currentStep}
              />
            </div>
          {/if}
        </div>
      </div>

    {:else}
      <!-- Benchmark tab -->
      <div class="max-w-2xl mx-auto">
        <div class="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <BenchmarkPanel pattern={currentPattern} />
          {#if !currentPattern}
            <p class="text-xs text-zinc-600 mt-4 text-center">
              Go to the Visualizer tab first and enter a pattern to enable benchmarking.
            </p>
          {/if}
        </div>
      </div>
    {/if}
  </main>

  <!-- Footer -->
  <footer class="border-t border-zinc-800 mt-10">
    <div class="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-zinc-600">
      <span>KMP + DFA Pattern Matcher · CS Project</span>
      <span>Svelte 5 · Tailwind v4 · Cytoscape.js</span>
    </div>
  </footer>
</div>