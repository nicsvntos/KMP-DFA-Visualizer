<script lang="ts">
  import {
    atom,
    and,
    or,
    exprToString,
    type Expr,
  } from '../algorithms/logic'
  import {
    getRules,
    getTables,
    getValidationResults,
    getConsistencyReport,
    getActiveTableIndex,
    setActiveTableIndex,
    addRule,
    removeRule,
    clearAll,
    runValidation,
  } from '../stores/logicStore.svelte'

  interface Props {
    text: string
    pattern: string
  }
  let { text, pattern }: Props = $props()

  let patternA = $state('')
  let patternB = $state('')
  let negateA = $state(false)
  let negateB = $state(false)
  let operator = $state<'AND' | 'OR' | 'SINGLE'>('AND')
  let buildError = $state('')

  let rules = $derived(getRules())
  let tables = $derived(getTables())
  let validationResults = $derived(getValidationResults())
  let consistencyReport = $derived(getConsistencyReport())
  let activeTableIndex = $derived(getActiveTableIndex())

  let hasText = $derived(text.trim().length > 0)
  let hasRules = $derived(rules.length > 0)

  function buildExpr(): Expr | null {
    const a = patternA.trim()
    const b = patternB.trim()
    if (!a) { buildError = 'Pattern A is required.'; return null }
    if (operator !== 'SINGLE' && !b) { buildError = 'Pattern B is required for AND / OR rules.'; return null }
    if (operator !== 'SINGLE' && a === b) { buildError = 'Pattern A and B must be different.'; return null }
    buildError = ''
    const atomA = atom(a, negateA)
    if (operator === 'SINGLE') return atomA
    const atomB = atom(b, negateB)
    return operator === 'AND' ? and(atomA, atomB) : or(atomA, atomB)
  }

  function handleAddRule() {
    const expr = buildExpr()
    if (!expr) return
    addRule(expr)
    patternA = ''
    patternB = ''
    negateA = false
    negateB = false
    operator = 'AND'
  }
</script>

<div class="flex flex-col gap-6">

  <!-- Header -->
  <div>
    <h2 class="text-lg font-semibold text-[#8fa8c8]">Logic Validator</h2>
    <p class="text-base text-[#6a82a0] mt-1">
      Build propositional rules, generate truth tables, and validate them
      against your search text.
    </p>
  </div>

  <!-- Context banner -->
  <div class="rounded-lg bg-[#1e1f2f] px-4 py-2 flex items-center gap-3">
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

  <!-- Top section -->
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

    <!-- LEFT: Rule builder -->
    <div class="lg:col-span-5">
      <div class="rounded-xl bg-[#1e1f2f] p-5 flex flex-col gap-4">
        <p class="text-base font-semibold text-[#8fa8c8]">Build a Rule</p>

        <!-- Operator selector -->
        <div class="flex gap-2">
          {#each (['SINGLE', 'AND', 'OR'] as const) as op}
            <button
              onclick={() => (operator = op)}
              class="flex-1 py-2 text-sm font-medium rounded-md border transition-colors
                     {operator === op
                       ? 'bg-[#50688c] text-[#191826]'
                       : 'bg-[#1e1f2f] text-[#50688c] hover:text-[#8fa8c8] hover:bg-[#50688c] hover:text-[#191826]'}"
            >
              {op === 'SINGLE' ? 'Single' : op}
            </button>
          {/each}
        </div>

        <!-- Pattern A -->
        <div class="flex flex-col gap-2">
          <p class="text-sm text-[#50688c] font-medium">Pattern A</p>
          <div class="flex items-center gap-2">
            <button
              onclick={() => (negateA = !negateA)}
              class="shrink-0 px-3 py-2 text-sm rounded-md border transition-colors font-mono
                     {negateA
                       ? 'bg-[#50688c] text-[#191826]'
                       : 'bg-[#1e1f2f] text-[#50688c] hover:text-[#8fa8c8]'}"
            >
              NOT
            </button>
            <input
              type="text"
              bind:value={patternA}
              placeholder="e.g. AABA"
              class="flex-1 min-w-0 rounded-md bg-[#1e1f2f] border border-[#2a2a3d] px-3 py-2
                     text-[#8fa8c8] placeholder-slate-500 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-[#3a3b5c]"
            />
          </div>
        </div>

        <!-- Pattern B -->
        {#if operator !== 'SINGLE'}
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <span class="text-sm text-[#50688c] font-medium">Pattern B</span>
              <span class="px-2 py-0.5 text-xs rounded bg-[#191826] text-[#50688c] font-mono">
                {operator}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <button
                onclick={() => (negateB = !negateB)}
                class="shrink-0 px-3 py-2 text-sm rounded-md border transition-colors font-mono
                       {negateB
                         ? 'bg-[#50688c] text-[#8fa8c8]'
                         : 'bg-[#1e1f2f] text-[#50688c] hover:text-[#8fa8c8]'}"
              >
                NOT
              </button>
              <input
                type="text"
                bind:value={patternB}
                placeholder="e.g. AAC"
                class="flex-1 min-w-0 rounded-md bg-[#1e1f2f] border border-[#2a2a3d] px-3 py-2
                       text-[#8fa8c8] placeholder-slate-500 text-sm font-mono
                       focus:outline-none focus:ring-2 focus:ring-[#3a3b5c]"
              />
            </div>
          </div>
        {/if}

        <!-- Preview -->
        {#if patternA.trim()}
          <div class="rounded-md bg-[#1e1f2f] px-3 py-2">
            <p class="text-sm text-[#50688c]">Preview:</p>
            <p class="text-sm font-mono text-[#50688c] font-semibold mt-0.5 break-all">
              {#if operator === 'SINGLE'}
                {negateA ? `NOT '${patternA}'` : `'${patternA}'`}
              {:else if patternB.trim()}
                ({negateA ? `NOT '${patternA}'` : `'${patternA}'`}
                {operator}
                {negateB ? `NOT '${patternB}'` : `'${patternB}'`})
              {:else}
                {negateA ? `NOT '${patternA}'` : `'${patternA}'`} {operator} ...
              {/if}
            </p>
          </div>
        {/if}

        {#if buildError}
          <p class="text-sm text-red-400 bg-red-950 border border-red-800 rounded-md px-3 py-2">
            {buildError}
          </p>
        {/if}

        <button
          onclick={handleAddRule}
          class="w-full rounded-md bg-[#1e1f2f] hover:bg-[#50688c] hover:text-[#191826] text-[#8fa8c8]
                 text-sm font-medium py-2.5 transition-colors"
        >
          Add Rule
        </button>
      </div>
    </div>

    <!-- RIGHT: Rules list + consistency + truth table -->
    <div class="lg:col-span-7 flex flex-col gap-4">

      {#if !hasRules}
        <div class="rounded-xl bg-[#1e1f2f] p-10
                    flex flex-col items-center justify-center gap-2 text-center">
          <p class="text-base text-[#50688c]">No rules added yet.</p>
          <p class="text-sm text-[#2e3d54]">Add a rule on the left to get started.</p>
        </div>

      {:else}

        <!-- Rules list -->
        <div class="rounded-xl bg-[#1e1f2f] p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between">
            <p class="text-base font-semibold text-[#8fa8c8]">
              Rules <span class="text-[#3d5070] font-normal">({rules.length})</span>
            </p>
            <button
              onclick={clearAll}
              class="text-sm text-[#3d5070] hover:text-red-400 transition-colors underline underline-offset-2"
            >
              Clear all
            </button>
          </div>

          {#each rules as rule, i}
            <div class="flex items-center justify-between rounded-lg border border-slate-700
                        bg-[#1e1f2f] px-3 py-2 gap-3">
              <div class="flex flex-col gap-0.5 min-w-0">
                <span class="text-sm text-[#50688c]">{rule.label}</span>
                <span class="text-sm font-mono text-[#50688c] truncate">
                  {exprToString(rule.expr)}
                </span>
              </div>
              <div class="flex items-center gap-2 shrink-0">
                {#if validationResults[i]}
                  <span class="text-sm font-bold {validationResults[i].result ? 'text-green-400' : 'text-red-400'}">
                    {validationResults[i].verdict === 'accepted' ? '✓' : '✗'}
                  </span>
                {/if}
                <button
                  onclick={() => setActiveTableIndex(i)}
                  class="text-sm px-2 py-0.5 rounded border transition-colors
                         {activeTableIndex === i
                           ? 'bg-[#1e1f2f] text-[#8fa8c8]'
                           : 'bg-slate-700 text-[#6a82a0] hover:text-[#8fa8c8]'}"
                >
                  Table
                </button>
                <button
                  onclick={() => removeRule(i)}
                  class="text-sm px-2 py-0.5 rounded
                         bg-slate-700 text-[#6a82a0] hover:text-red-400 hover:border-red-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
          {/each}
        </div>

        <!-- Consistency report -->
        {#if consistencyReport}
          <div class="rounded-xl border p-4
                      {consistencyReport.status === 'consistent'
                        ? 'border-green-800 bg-green-950'
                        : 'border-red-800 bg-red-950'}">
            <p class="text-base font-bold
                       {consistencyReport.status === 'consistent' ? 'text-green-400' : 'text-red-400'}">
              {consistencyReport.status === 'consistent' ? '✓ Consistent' : '✗ Inconsistent'}
            </p>
            <p class="text-sm mt-1 text-[#6a82a0]">
              {#if consistencyReport.status === 'consistent'}
                All rules can be satisfied simultaneously.
                {consistencyReport.satisfyRows.length} assignment{consistencyReport.satisfyRows.length !== 1 ? 's' : ''}
                satisfy every rule at once.
              {:else}
                No assignment of patterns can satisfy all rules at the same time.
                These rules are logically contradictory.
              {/if}
            </p>
          </div>
        {/if}

        <!-- Truth table -->
        {#if tables[activeTableIndex]}
          {@const table = tables[activeTableIndex]}
          <div class="rounded-xl bg-[#1e1f2f] p-4 flex flex-col gap-3">
            <div class="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <p class="text-base font-semibold text-[#8fa8c8]">{table.rule.label} — Truth Table</p>
                <p class="text-sm font-mono text-[#50688c] mt-0.5">{exprToString(table.rule.expr)}</p>
              </div>
              <div class="flex gap-2 flex-wrap">
                {#if table.isTautology}
                  <span class="text-sm px-2 py-0.5 rounded bg-green-950 border border-green-800 text-green-400">Tautology</span>
                {/if}
                {#if table.isContradiction}
                  <span class="text-sm px-2 py-0.5 rounded bg-red-950 border border-red-800 text-red-400">Contradiction</span>
                {/if}
                {#if table.isSatisfied && !table.isTautology}
                  <span class="text-sm px-2 py-0.5 rounded bg-[#191826] text-[#50688c]">Satisfiable</span>
                {/if}
              </div>
            </div>

            <div class="overflow-x-auto">
              <table class="w-full text-sm font-mono">
                <thead>
                  <tr class="border-b border-slate-700">
                    {#each table.patterns as p}
                      <th class="text-left py-2 pr-4 text-[#6a82a0] font-medium">'{p}'</th>
                    {/each}
                    <th class="text-left py-2 text-[#6a82a0] font-medium">Result</th>
                    {#if validationResults[activeTableIndex]}
                      <th class="text-left py-2 pl-2 text-[#6a82a0] font-medium">Actual</th>
                    {/if}
                  </tr>
                </thead>
                <tbody class="divide-y divide-slate-800">
                  {#each table.rows as row, rowIndex}
                    {@const isActualRow = validationResults[activeTableIndex]?.matchingRow === rowIndex}
                    <tr class="{isActualRow ? 'bg-[#191826] bg-opacity-50' : ''}">
                      {#each table.patterns as p}
                        <td class="py-2 pr-4 font-bold
                                   {isActualRow
                                     ? (row.assignments[p] ? 'text-green-400' : 'text-red-400')
                                     : (row.assignments[p] ? 'text-green-400' : 'text-red-400')}">
                          {row.assignments[p] ? 'T' : 'F'}
                        </td>
                      {/each}
                      <td class="py-2 font-bold
                                 {isActualRow
                                   ? (row.result ? 'text-green-400' : 'text-red-400')
                                   : (row.result ? 'text-green-400' : 'text-red-400')}">
                        {row.result ? 'T' : 'F'}
                      </td>
                      {#if validationResults[activeTableIndex]}
                        <td class="py-2 pl-2">
                          {#if isActualRow}
                            <span class="text-[#8fa8c8] font-bold">← here</span>
                          {/if}
                        </td>
                      {/if}
                    </tr>
                  {/each}
                </tbody>
              </table>
            </div>
          </div>
        {/if}

      {/if}
    </div>
  </div>

  <!-- BOTTOM: Validate + results -->
  {#if hasRules}
    <div class="flex flex-col gap-4">

      <button
        onclick={() => runValidation(text)}
        disabled={!hasText}
        class="w-full rounded-md py-3 text-base font-medium transition-colors
               {hasText
                 ? 'bg-[#1e1f2f] hover:bg-[#50688c] hover:text-[#191826] text-[#8fa8c8]'
                 : 'bg-[#1e1f2f] text-[#3d5070] cursor-not-allowed'}"
      >
        {hasText ? 'Validate Against Text' : 'Load text in Visualizer tab first'}
      </button>

      {#if validationResults.length > 0}
        <div class="rounded-xl bg-[#1e1f2f] p-4 flex flex-col gap-3">
          <p class="text-base font-bold text-[#8fa8c8]">Validation Results</p>

          {#each validationResults as vr}
            <div class="rounded-lg bg-[#1e1f2f] px-4 py-3 flex flex-col gap-3">

              <!-- Rule header -->
              <div class="flex items-center justify-between">
                <div class="flex flex-col gap-0.5">
                  <span class="text-base font-bold text-[#8fa8c8]">{vr.rule.label}</span>
                  <span class="text-sm font-mono text-[#50688c]">{exprToString(vr.rule.expr)}</span>
                </div>
                <span class="text-base font-bold shrink-0 {vr.result ? 'text-green-400' : 'text-red-400'}">
                  {vr.verdict === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                </span>
              </div>

              <!-- Found / Not found columns -->
              <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                <!-- Found -->
                <div class="flex flex-col gap-1.5">
                  <p class="text-sm font-bold text-green-400">Found</p>
                  {#each Object.entries(vr.assignments).filter(([_, v]) => v) as [p]}
                    <span class="text-sm font-mono text-[#8fa8c8] font-bold">✓ '{p}'</span>
                  {/each}
                  {#if Object.entries(vr.assignments).filter(([_, v]) => v).length === 0}
                    <span class="text-sm text-[#3d5070] italic">none</span>
                  {/if}
                </div>

                <!-- Not found -->
                <div class="flex flex-col gap-1.5">
                  <p class="text-sm font-bold text-red-400">Not Found</p>
                  {#each Object.entries(vr.assignments).filter(([_, v]) => !v) as [p]}
                    <span class="text-sm font-mono text-[#6a82a0] font-bold">✗ '{p}'</span>
                  {/each}
                  {#if Object.entries(vr.assignments).filter(([_, v]) => !v).length === 0}
                    <span class="text-sm text-[#3d5070] italic">none</span>
                  {/if}
                </div>
              </div>

            </div>
          {/each}
        </div>
      {/if}

    </div>
  {/if}

</div>