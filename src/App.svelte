<script lang="ts">
  import PatternInput from './components/PatternInput.svelte'
  import DFAGraph from './components/DFAGraph.svelte'
  import MatchHighlighter from './components/MatchHighlighter.svelte'
  import StepController from './components/StepController.svelte'
  import BenchmarkPanel from './components/BenchmarkPanel.svelte'
  import LogicValidator from './components/LogicValidator.svelte'

  import {
    getSteps,
    getMatches,
    getStatus,
    getDFA,
    getCurrentStepIndex,
    getPattern,
  } from './stores/kmpStore.svelte'

  type Tab = 'visualizer' | 'benchmark' | 'validator'
  let activeTab = $state<Tab>('visualizer')
  let sliding = $state(false)
  let slideDirection = $state<'left' | 'right'>('left')

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

  const TAB_ORDER: Tab[] = ['visualizer', 'benchmark', 'validator']

  function switchTab(tab: Tab) {
    if (tab === activeTab) return
    const currentIndex = TAB_ORDER.indexOf(activeTab)
    const nextIndex = TAB_ORDER.indexOf(tab)
    slideDirection = nextIndex > currentIndex ? 'left' : 'right'
    sliding = true
    setTimeout(() => {
      activeTab = tab
      sliding = false
    }, 280)
  }

  function handleReady(pattern: string, text: string) {
    currentPattern = pattern
    currentText = text
    isReady = true
  }
</script>

<div class="min-h-screen bg-slate-800 text-white">

  <!-- Top nav -->
  <header class="border-b border-slate-700 bg-slate-900">
    <div class="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.5 3A6.5 6.5 0 0 1 16 9.5c0 1.61-.59 3.09-1.56 4.23l.27.27h.79l5 5-1.5 1.5-5-5v-.79l-.27-.27A6.516 6.516 0 0 1 9.5 16 6.5 6.5 0 0 1 3 9.5 6.5 6.5 0 0 1 9.5 3m0 2C7 5 5 7 5 9.5S7 14 9.5 14 14 12 14 9.5 12 5 9.5 5z"/>
          </svg>
        </div>
        <div>
          <h1 class="text-sm font-bold text-white leading-none">Pattern Matcher</h1>
          <p class="text-xs text-slate-400 leading-none mt-0.5">KMP + DFA Visualizer</p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex gap-1 bg-slate-800 border border-slate-700 rounded-lg p-1">
        {#each ([
          { id: 'visualizer', label: 'Visualizer' },
          { id: 'benchmark', label: 'Benchmark' },
          { id: 'validator', label: 'Validator' },
        ] as const) as tab}
          <button
            onclick={() => switchTab(tab.id)}
            class="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200
                   {activeTab === tab.id
                     ? 'bg-indigo-600 text-white shadow'
                     : 'text-slate-400 hover:text-white hover:bg-slate-700'}"
          >
            {tab.label}
          </button>
        {/each}
      </div>
    </div>
  </header>

  <!-- Main content -->
  <main class="max-w-screen-xl mx-auto px-4 py-6 overflow-hidden">
    <div
      class="transition-all duration-[280ms] ease-in-out"
      style="
        opacity: {sliding ? 0 : 1};
        transform: {sliding
          ? slideDirection === 'left'
            ? 'translateX(-32px)'
            : 'translateX(32px)'
          : 'translateX(0)'};
      "
    >

      {#if activeTab === 'visualizer'}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

          <!-- Left panel -->
          <div class="lg:col-span-3 flex flex-col gap-6">
            <div class="rounded-xl border border-slate-700 bg-slate-900 p-4">
              <PatternInput onReady={handleReady} />
            </div>
            {#if isReady}
              <div class="rounded-xl border border-slate-700 bg-slate-900 p-4">
                <StepController disabled={!isReady} />
              </div>
            {/if}
          </div>

          <!-- Right panel -->
          <div class="lg:col-span-9 flex flex-col gap-6">
            {#if !isReady}
              <div class="rounded-xl border border-slate-700 bg-slate-900 p-10
                          flex flex-col items-center justify-center gap-4 text-center">
                <div class="w-16 h-16 rounded-full bg-indigo-900 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                      d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18" />
                  </svg>
                </div>
                <div>
                  <h2 class="text-xl font-semibold text-white">Welcome to Pattern Matcher</h2>
                  <p class="text-slate-400 text-sm mt-2 max-w-md">
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
                    <div class="rounded-lg border border-slate-700 bg-slate-800 p-3 text-left">
                      <div class="text-xl mb-1">{feature.icon}</div>
                      <p class="text-xs font-semibold text-white">{feature.title}</p>
                      <p class="text-xs text-slate-500 mt-0.5">{feature.desc}</p>
                    </div>
                  {/each}
                </div>
              </div>
            {:else}
              <div class="rounded-xl border border-slate-700 bg-slate-900 p-4" style="min-height: 380px;">
                <DFAGraph {dfa} {activeState} />
              </div>
              <div class="rounded-xl border border-slate-700 bg-slate-900 p-4">
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

      {:else if activeTab === 'benchmark'}
        <div class="max-w-2xl mx-auto">
          <div class="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <BenchmarkPanel pattern={currentPattern} text={currentText} />
            {#if !currentPattern}
              <p class="text-xs text-slate-600 mt-4 text-center">
                Go to the Visualizer tab first and enter a pattern to enable benchmarking.
              </p>
            {/if}
          </div>
        </div>

      {:else if activeTab === 'validator'}
        <div class="max-w-2xl mx-auto">
          <div class="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <LogicValidator text={currentText} pattern={currentPattern} />
            {#if !currentText}
              <p class="text-xs text-slate-600 mt-4 text-center">
                Go to the Visualizer tab first and load some text to enable validation.
              </p>
            {/if}
          </div>
        </div>
      {/if}

    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-700 mt-10">
    <div class="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between text-xs text-slate-600">
      <span>KMP + DFA Pattern Matcher · CS Project</span>
      <span>Svelte 5 · Tailwind v4 · Cytoscape.js</span>
    </div>
  </footer>
</div>