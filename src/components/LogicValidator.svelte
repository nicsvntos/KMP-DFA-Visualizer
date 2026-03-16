<script lang="ts">
    import {
      atom,
      and,
      or,
      createRule,
      resetRuleCounter,
      generateTruthTable,
      validateRule,
      checkConsistency,
      exprToString,
      type Rule,
      type TruthTable,
      type ValidationResult,
      type ConsistencyReport,
      type Expr,
    } from '../algorithms/logic'
    import { kmpSearchFast } from '../algorithms/kmp'
  
    interface Props {
      text: string
    }
    let { text }: Props = $props()
  
    // ─── Rule builder state ───────────────────────────────────────────────────
    let patternA = $state('')
    let patternB = $state('')
    let negateA = $state(false)
    let negateB = $state(false)
    let operator = $state<'AND' | 'OR' | 'SINGLE'>('AND')
    let buildError = $state('')
  
    // ─── Rules + results ──────────────────────────────────────────────────────
    let rules = $state<Rule[]>([])
    let tables = $state<TruthTable[]>([])
    let validationResults = $state<ValidationResult[]>([])
    let consistencyReport = $state<ConsistencyReport | null>(null)
    let activeTableIndex = $state(0)
  
    // ─── Derived ──────────────────────────────────────────────────────────────
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
  
    function addRule() {
      const expr = buildExpr()
      if (!expr) return
  
      const rule = createRule(expr)
      const table = generateTruthTable(rule)
  
      rules = [...rules, rule]
      tables = [...tables, table]
      activeTableIndex = tables.length - 1
  
      patternA = ''
      patternB = ''
      negateA = false
      negateB = false
      operator = 'AND'
  
      runConsistency()
    }
  
    function removeRule(index: number) {
      rules = rules.filter((_, i) => i !== index)
      tables = tables.filter((_, i) => i !== index)
      validationResults = validationResults.filter((_, i) => i !== index)
      activeTableIndex = Math.min(activeTableIndex, tables.length - 1)
      runConsistency()
    }
  
    function clearAll() {
      rules = []
      tables = []
      validationResults = []
      consistencyReport = null
      activeTableIndex = 0
      resetRuleCounter()
    }
  
    function runConsistency() {
      consistencyReport = rules.length > 0 ? checkConsistency(rules) : null
    }
  
    function runValidation() {
      if (!hasText || !hasRules) return
  
      const foundPatterns = new Set<string>()
      const allPatterns = new Set(tables.flatMap(t => t.patterns))
  
      for (const pattern of allPatterns) {
        const matches = kmpSearchFast(text, pattern)
        if (matches.length > 0) foundPatterns.add(pattern)
      }
  
      validationResults = rules.map((rule, i) =>
        validateRule(rule, tables[i], foundPatterns)
      )
    }
  
    function statusColor(result: boolean) {
      return result ? 'text-green-400' : 'text-red-400'
    }
  
    function statusBg(result: boolean) {
      return result
        ? 'bg-green-900 border-green-700 text-green-300'
        : 'bg-red-900 border-red-700 text-red-300'
    }
  </script>
  
  <div class="flex flex-col gap-6">
    <div>
      <h2 class="text-lg font-semibold text-white">Logic Validator</h2>
      <p class="text-sm text-slate-400 mt-1">
        Build propositional rules, generate truth tables, and validate them
        against your search text.
      </p>
    </div>
  
    <!-- Rule builder -->
    <div class="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-4">
      <p class="text-sm font-medium text-slate-300">Build a Rule</p>
  
      <!-- Operator selector -->
      <div class="flex gap-2">
        {#each (['SINGLE', 'AND', 'OR'] as const) as op}
          <button
            onclick={() => (operator = op)}
            class="flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors
                   {operator === op
                     ? 'bg-indigo-600 border-indigo-500 text-white'
                     : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700'}"
          >
            {op === 'SINGLE' ? 'Single Pattern' : op}
          </button>
        {/each}
      </div>
  
      <!-- Pattern inputs -->
      <div class="flex flex-col gap-3">
        <!-- Pattern A -->
        <div class="flex items-center gap-2">
          <button
            onclick={() => (negateA = !negateA)}
            title="Toggle NOT"
            class="shrink-0 px-2 py-1.5 text-xs rounded-md border transition-colors font-mono
                   {negateA
                     ? 'bg-amber-700 border-amber-500 text-white'
                     : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}"
          >
            NOT
          </button>
          <input
            type="text"
            bind:value={patternA}
            placeholder="Pattern A (e.g. abc)"
            class="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5
                   text-white placeholder-slate-500 text-sm font-mono
                   focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
  
        <!-- Pattern B (only if AND/OR) -->
        {#if operator !== 'SINGLE'}
          <div class="flex items-center gap-2">
            <span class="shrink-0 px-2 py-1.5 text-xs rounded-md bg-indigo-900 border border-indigo-700 text-indigo-300 font-mono">
              {operator}
            </span>
            <button
              onclick={() => (negateB = !negateB)}
              title="Toggle NOT"
              class="shrink-0 px-2 py-1.5 text-xs rounded-md border transition-colors font-mono
                     {negateB
                       ? 'bg-amber-700 border-amber-500 text-white'
                       : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}"
            >
              NOT
            </button>
            <input
              type="text"
              bind:value={patternB}
              placeholder="Pattern B (e.g. xyz)"
              class="flex-1 rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5
                     text-white placeholder-slate-500 text-sm font-mono
                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        {/if}
      </div>
  
      <!-- Preview -->
      {#if patternA.trim()}
        <p class="text-xs text-slate-400 font-mono">
          Preview:
          <span class="text-indigo-300 font-semibold">
            {#if operator === 'SINGLE'}
              {negateA ? `NOT '${patternA}'` : `'${patternA}'`}
            {:else if patternB.trim()}
              ({negateA ? `NOT '${patternA}'` : `'${patternA}'`}
              {operator}
              {negateB ? `NOT '${patternB}'` : `'${patternB}'`})
            {:else}
              {negateA ? `NOT '${patternA}'` : `'${patternA}'`} {operator} ...
            {/if}
          </span>
        </p>
      {/if}
  
      {#if buildError}
        <p class="text-xs text-red-400 bg-red-950 border border-red-800 rounded-md px-3 py-2">
          {buildError}
        </p>
      {/if}
  
      <button
        onclick={addRule}
        class="w-full rounded-md bg-indigo-600 hover:bg-indigo-500 text-white
               text-sm font-medium py-2 transition-colors"
      >
        Add Rule
      </button>
    </div>
  
    <!-- Rules list -->
    {#if hasRules}
      <div class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-slate-300">
            Rules <span class="text-slate-500">({rules.length})</span>
          </p>
          <button
            onclick={clearAll}
            class="text-xs text-slate-500 hover:text-red-400 transition-colors underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
  
        {#each rules as rule, i}
          <div class="flex items-center justify-between rounded-lg border border-slate-700
                      bg-slate-900 px-3 py-2 gap-3">
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-xs text-slate-500 shrink-0">{rule.label}</span>
              <span class="text-xs font-mono text-indigo-300 truncate">
                {exprToString(rule.expr)}
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              {#if validationResults[i]}
                <span class="text-xs font-bold {statusColor(validationResults[i].result)}">
                  {validationResults[i].verdict === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                </span>
              {/if}
              <button
                onclick={() => activeTableIndex = i}
                class="text-xs px-2 py-0.5 rounded border transition-colors
                       {activeTableIndex === i
                         ? 'bg-indigo-700 border-indigo-500 text-white'
                         : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}"
              >
                Table
              </button>
              <button
                onclick={() => removeRule(i)}
                class="text-xs px-2 py-0.5 rounded border border-slate-700
                       bg-slate-800 text-slate-400 hover:text-red-400 hover:border-red-700 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        {/each}
      </div>
  
      <!-- Consistency report -->
      {#if consistencyReport}
        <div class="rounded-lg border p-3
                    {consistencyReport.status === 'consistent'
                      ? 'border-green-700 bg-green-950'
                      : 'border-red-700 bg-red-950'}">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-sm font-semibold
                         {consistencyReport.status === 'consistent' ? 'text-green-400' : 'text-red-400'}">
              {consistencyReport.status === 'consistent' ? '✓ Consistent' : '✗ Inconsistent'}
            </span>
          </div>
          <p class="text-xs {consistencyReport.status === 'consistent' ? 'text-green-300' : 'text-red-300'}">
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
  
      <!-- Truth table viewer -->
      {#if tables[activeTableIndex]}
        {@const table = tables[activeTableIndex]}
        <div class="rounded-xl border border-slate-700 bg-slate-900 p-4 flex flex-col gap-3">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p class="text-sm font-medium text-white">{table.rule.label} — Truth Table</p>
              <p class="text-xs font-mono text-indigo-300 mt-0.5">{exprToString(table.rule.expr)}</p>
            </div>
            <div class="flex gap-2">
              {#if table.isTautology}
                <span class="text-xs px-2 py-0.5 rounded bg-green-900 border border-green-700 text-green-300">
                  Tautology
                </span>
              {/if}
              {#if table.isContradiction}
                <span class="text-xs px-2 py-0.5 rounded bg-red-900 border border-red-700 text-red-300">
                  Contradiction
                </span>
              {/if}
              {#if table.isSatisfied && !table.isTautology}
                <span class="text-xs px-2 py-0.5 rounded bg-indigo-900 border border-indigo-700 text-indigo-300">
                  Satisfiable
                </span>
              {/if}
            </div>
          </div>
  
          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full text-xs font-mono">
              <thead>
                <tr class="border-b border-slate-700">
                  {#each table.patterns as p}
                    <th class="text-left py-2 pr-4 text-slate-400 font-medium">'{p}'</th>
                  {/each}
                  <th class="text-left py-2 text-slate-400 font-medium">Result</th>
                  {#if validationResults[activeTableIndex]}
                    <th class="text-left py-2 pl-2 text-slate-400 font-medium">↑ Actual</th>
                  {/if}
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800">
                {#each table.rows as row, rowIndex}
                  {@const isActualRow = validationResults[activeTableIndex]?.matchingRow === rowIndex}
                  <tr class="{isActualRow ? 'bg-indigo-900 bg-opacity-40' : ''}">
                    {#each table.patterns as p}
                      <td class="py-1.5 pr-4 {row.assignments[p] ? 'text-green-400' : 'text-red-400'}">
                        {row.assignments[p] ? 'T' : 'F'}
                      </td>
                    {/each}
                    <td class="py-1.5 font-bold {row.result ? 'text-green-400' : 'text-red-400'}">
                      {row.result ? 'T' : 'F'}
                    </td>
                    {#if validationResults[activeTableIndex]}
                      <td class="py-1.5 pl-2">
                        {#if isActualRow}
                          <span class="text-indigo-400 font-bold">← here</span>
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
  
      <!-- Validate button -->
      <button
        onclick={runValidation}
        disabled={!hasText}
        class="w-full rounded-md py-2.5 text-sm font-medium transition-colors
               {hasText
                 ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                 : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'}"
      >
        {hasText ? 'Validate Against Text' : 'Load text in Visualizer tab first'}
      </button>
  
      <!-- Validation results -->
      {#if validationResults.length > 0}
        <div class="flex flex-col gap-2">
          <p class="text-sm font-medium text-slate-300">Validation Results</p>
          {#each validationResults as vr}
            <div class="rounded-lg border px-3 py-2 flex flex-col gap-1 {statusBg(vr.result)}">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold">{vr.rule.label}</span>
                <span class="text-xs font-bold">
                  {vr.verdict === 'accepted' ? '✓ Accepted' : '✗ Rejected'}
                </span>
              </div>
              <p class="text-xs font-mono opacity-80">{exprToString(vr.rule.expr)}</p>
              <div class="flex flex-wrap gap-2 mt-1">
                {#each Object.entries(vr.assignments) as [pattern, found]}
                  <span class="text-xs px-1.5 py-0.5 rounded
                               {found ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}">
                    '{pattern}' = {found ? 'found' : 'not found'}
                  </span>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>