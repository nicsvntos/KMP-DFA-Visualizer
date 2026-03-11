<script lang="ts">
  import type { MatchResult, KMPStep } from '../types'
  interface Props {
    text: string
    pattern: string
    matches: MatchResult[]
    currentStep: KMPStep | null
  }
  let { text, pattern, matches, currentStep }: Props = $props()

  // Build a set of match ranges for O(1) lookup
  let matchRanges = $derived(() => {
    const ranges: { start: number; end: number }[] = []
    for (const m of matches) {
      ranges.push({ start: m.index, end: m.index + m.length - 1 })
    }
    return ranges
  })

  // Current scanning window — where the pattern is currently being compared
  let scanStart = $derived(() => {
    if (!currentStep) return -1
    return currentStep.textIndex - currentStep.patternIndex + 1
  })

  let scanEnd = $derived(() => {
    if (!currentStep) return -1
    return currentStep.textIndex
  })

  // Segment the text into labeled spans for rendering
  type SpanKind = 'match' | 'active' | 'scanning' | 'normal'

  interface TextSpan {
    char: string
    index: number
    kind: SpanKind
  }

  let spans = $derived(() => {
    if (!text) return [] as TextSpan[]

    const result: TextSpan[] = []
    const _matchRanges = matchRanges()
    const _scanStart = scanStart()
    const _scanEnd = scanEnd()
    const activeIndex = currentStep?.textIndex ?? -1

    for (let i = 0; i < text.length; i++) {
      const inMatch = _matchRanges.some((r) => i >= r.start && i <= r.end)
      const isActive = i === activeIndex
      const inScan =
        _scanStart >= 0 && i >= _scanStart && i <= _scanEnd && !inMatch

      let kind: SpanKind = 'normal'
      if (inMatch) kind = 'match'
      else if (isActive) kind = 'active'
      else if (inScan) kind = 'scanning'

      result.push({ char: text[i], index: i, kind })
    }

    return result
  })

  // Stats
  let matchCount = $derived(matches.length)
  let progress = $derived(
    currentStep ? Math.round(((currentStep.textIndex + 1) / text.length) * 100) : 0
  )
</script>

<div class="flex flex-col gap-3 h-full">
  <!-- Header -->
  <div class="flex items-center justify-between flex-wrap gap-2">
    <div>
      <h2 class="text-lg font-semibold text-white">Match Highlighter</h2>
      <p class="text-sm text-zinc-400">
        Watch the algorithm scan through your text in real time.
      </p>
    </div>

    <!-- Stats row -->
    <div class="flex gap-3 text-xs shrink-0">
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-2 rounded-sm bg-indigo-500 opacity-80"></span>
        <span class="text-zinc-400">Scanning</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-2 rounded-sm bg-amber-400"></span>
        <span class="text-zinc-400">Current char</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="inline-block w-3 h-2 rounded-sm bg-green-500"></span>
        <span class="text-zinc-400">Match</span>
      </span>
    </div>
  </div>

  <!-- Match count + progress -->
  {#if text.length > 0}
    <div class="flex items-center gap-3">
      <div class="flex-1 h-1.5 rounded-full bg-zinc-800 overflow-hidden">
        <div
          class="h-full rounded-full bg-indigo-500 transition-all duration-150"
          style="width: {progress}%"
        ></div>
      </div>
      <span class="text-xs text-zinc-400 shrink-0">
        {progress}% scanned
      </span>
      {#if matchCount > 0}
        <span class="text-xs text-green-400 font-medium shrink-0">
          {matchCount} match{matchCount !== 1 ? 'es' : ''} found
        </span>
      {/if}
    </div>
  {/if}

  <!-- Text display -->
  <div
    class="flex-1 rounded-lg border border-zinc-700 bg-zinc-950 p-4 overflow-auto"
    style="min-height: 200px;"
  >
    {#if !text}
      <p class="text-zinc-600 text-sm">No text loaded yet.</p>
    {:else}
      <p class="font-mono text-sm leading-7 break-all whitespace-pre-wrap select-text">
        {#each spans() as span (span.index)}
          {#if span.kind === 'match'}
            <span
              class="bg-green-500 text-zinc-950 font-bold rounded-sm px-px"
              title="Match at index {span.index}"
            >{span.char}</span>
          {:else if span.kind === 'active'}
            <span
              class="bg-amber-400 text-zinc-950 font-bold rounded-sm px-px ring-1 ring-amber-300"
              title="Currently comparing index {span.index}"
            >{span.char}</span>
          {:else if span.kind === 'scanning'}
            <span
              class="bg-indigo-900 text-indigo-200 rounded-sm px-px"
              title="In scan window"
            >{span.char}</span>
          {:else}
            <span class="text-zinc-300">{span.char}</span>
          {/if}
        {/each}
      </p>
    {/if}
  </div>

  <!-- Current step info -->
  {#if currentStep}
    <div class="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono">
      <div class="flex flex-wrap gap-x-4 gap-y-1 text-zinc-400">
        <span>
          text[<span class="text-white">{currentStep.textIndex}</span>]
          = <span class="text-amber-400 font-bold">'{text[currentStep.textIndex]}'</span>
        </span>
        <span>
          pattern[<span class="text-white">{currentStep.patternIndex > 0 ? currentStep.patternIndex - 1 : 0}</span>]
          = <span class="text-indigo-400 font-bold">
            '{pattern[currentStep.patternIndex > 0 ? currentStep.patternIndex - 1 : 0] ?? '—'}'
          </span>
        </span>
        <span>
          state = <span class="text-indigo-400 font-bold">q{currentStep.currentState}</span>
        </span>
        {#if currentStep.isMatch}
          <span class="text-green-400 font-bold">
            ✓ Match at index {currentStep.matchStart}
          </span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Match list -->
  {#if matches.length > 0}
    <div class="rounded-md border border-zinc-700 bg-zinc-900 p-3">
      <p class="text-xs font-medium text-zinc-400 mb-2">All matches found so far</p>
      <div class="flex flex-wrap gap-2">
        {#each matches as m}
          <span
            class="text-xs font-mono px-2 py-0.5 rounded bg-green-900 text-green-300 border border-green-700"
          >
            index {m.index}
          </span>
        {/each}
      </div>
    </div>
  {/if}
</div>