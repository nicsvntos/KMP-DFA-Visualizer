<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import cytoscape from 'cytoscape'
  import type { DFA } from '../types'

  // ─── Props ──────────────────────────────────────────────────────────────────
  interface Props {
    dfa: DFA | null
    activeState: number
  }
  let { dfa, activeState }: Props = $props()


  let container: HTMLDivElement
  let cy: cytoscape.Core | null = null


  const COLOR = {
    nodeBg: '#27272a',        // zinc-800
    nodeBorder: '#52525b',    // zinc-600
    nodeText: '#e4e4e7',      // zinc-200
    activeNodeBg: '#4f46e5',  // indigo-600
    activeNodeBorder: '#818cf8', // indigo-400
    acceptNodeBorder: '#22c55e', // green-500
    startNodeBorder: '#f59e0b',  // amber-500
    edgeColor: '#71717a',     // zinc-500
    activeEdgeColor: '#818cf8', // indigo-400
    edgeLabel: '#a1a1aa',     // zinc-400
    bg: 'transparent',
  }


  function buildElements(dfa: DFA): cytoscape.ElementDefinition[] {
    const elements: cytoscape.ElementDefinition[] = []

    // Nodes
    for (const state of dfa.states) {
      elements.push({
        data: {
          id: `s${state.id}`,
          label: state.label,
          isStart: state.isStart,
          isAccept: state.isAccept,
          stateId: state.id,
        },
      })
    }

    // Edges — group parallel transitions (same from/to, different symbols)
    const edgeMap = new Map<string, string[]>()
    for (const t of dfa.transitions) {
      // Skip self-loops on state 0 for non-alphabet chars to reduce clutter
      if (t.from === t.to && t.from === 0) continue
      const key = `${t.from}-${t.to}`
      if (!edgeMap.has(key)) edgeMap.set(key, [])
      edgeMap.get(key)!.push(t.symbol)
    }

    let edgeId = 0
    for (const [key, symbols] of edgeMap.entries()) {
      const [from, to] = key.split('-').map(Number)
      elements.push({
        data: {
          id: `e${edgeId++}`,
          source: `s${from}`,
          target: `s${to}`,
          label: symbols.join(', '),
        },
      })
    }

    return elements
  }

  function initCytoscape(dfa: DFA) {
    if (cy) {
      cy.destroy()
      cy = null
    }

    const elements = buildElements(dfa)

    cy = cytoscape({
      container,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': COLOR.nodeBg,
            'border-color': COLOR.nodeBorder,
            'border-width': 2,
            color: COLOR.nodeText,
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '11px',
            'font-family': 'monospace',
            width: 48,
            height: 48,
          },
        },
        {
          selector: 'node[?isStart]',
          style: {
            'border-color': COLOR.startNodeBorder,
            'border-width': 3,
          },
        },
        {
          selector: 'node[?isAccept]',
          style: {
            'border-color': COLOR.acceptNodeBorder,
            'border-width': 3,
            'border-style': 'double',
          },
        },
        {
          selector: '.active-node',
          style: {
            'background-color': COLOR.activeNodeBg,
            'border-color': COLOR.activeNodeBorder,
            'border-width': 3,
            color: '#ffffff',
          },
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': COLOR.edgeColor,
            'target-arrow-color': COLOR.edgeColor,
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': '10px',
            'font-family': 'monospace',
            color: COLOR.edgeLabel,
            'text-background-color': '#18181b',
            'text-background-opacity': 1,
            'text-background-padding': '2px',
          },
        },
        {
          selector: '.active-edge',
          style: {
            'line-color': COLOR.activeEdgeColor,
            'target-arrow-color': COLOR.activeEdgeColor,
            width: 3,
          },
        },
      ],
      layout: {
        name: 'breadthfirst',
        directed: true,
        spacingFactor: 1.4,
        padding: 30,
      },
      userZoomingEnabled: true,
      userPanningEnabled: true,
      boxSelectionEnabled: false,
      autoungrabify: false,
    })
  }


  function highlightState(stateId: number) {
    if (!cy) return
    cy.nodes().removeClass('active-node')
    cy.edges().removeClass('active-edge')

    const node = cy.getElementById(`s${stateId}`)
    if (node) {
      node.addClass('active-node')
    }
  }


  $effect(() => {
    if (dfa && container) {
      initCytoscape(dfa)
      highlightState(activeState)
    }
  })

  $effect(() => {
    if (cy) {
      highlightState(activeState)
    }
  })

  onDestroy(() => {
    cy?.destroy()
  })
</script>

<div class="flex flex-col gap-3 h-full">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h2 class="text-lg font-semibold text-[#8fa8c8]">DFA Visualization</h2>
      <p class="text-base text-[#6a82a0]">
        Each circle is a state. The highlighted state shows where the machine is
        right now.
      </p>
    </div>
    {#if dfa}
      <div class="flex gap-3 text-sm text-[#50688c] shrink-0">
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-full border-2 border-amber-500"></span>
          Start
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-full border-2 border-green-500"></span>
          Accept
        </span>
        <span class="flex items-center gap-1">
          <span class="inline-block w-3 h-3 rounded-full bg-[#1e1f2f]"></span>
          Active
        </span>
      </div>
    {/if}
  </div>

  <!-- Graph container -->
  <div
    class="relative flex-1 rounded-lg border border-zinc-700 bg-zinc-950 overflow-hidden"
    style="min-height: 300px;"
  >
    {#if !dfa}
      <!-- Empty state -->
      <div class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="10" stroke-width="1.5" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 12h4m0 0l-2-2m2 2l-2 2" />
        </svg>
        <p class="text-sm">Enter a pattern to build the DFA</p>
      </div>
    {/if}
    <div bind:this={container} class="w-full h-full" style="min-height: 300px;"></div>
  </div>

  <!-- State info -->
  {#if dfa}
    <div class="rounded-md border border-[#2a2a3d]bg-[#1a1929] px-3 py-2">
      <p class="text-sm text-[#50688c]">
        <span class="text-[#8fa8c8] font-medium">{dfa.states.length} states</span>
        &nbsp;·&nbsp;
        <span class="text-[#8fa8c8] font-medium">{dfa.alphabet.join(', ')}</span> alphabet
        &nbsp;·&nbsp;
        Currently in state
        <span class="text-[#50688c] font-mono font-bold">q{activeState}</span>
        {#if dfa.acceptStates.includes(activeState)}
          <span class="text-green-400 ml-1">✓ match!</span>
        {/if}
      </p>
    </div>
  {/if}
</div>