import {
    createRule,
    resetRuleCounter,
    generateTruthTable,
    validateRule,
    checkConsistency,
    type Rule,
    type TruthTable,
    type ValidationResult,
    type ConsistencyReport,
    type Expr,
  } from '../algorithms/logic'
  import { kmpSearchFast } from '../algorithms/kmp'
  
  
  let rules = $state<Rule[]>([])
  let tables = $state<TruthTable[]>([])
  let validationResults = $state<ValidationResult[]>([])
  let consistencyReport = $state<ConsistencyReport | null>(null)
  let activeTableIndex = $state(0)
  
  export function getRules() { return rules }
  export function getTables() { return tables }
  export function getValidationResults() { return validationResults }
  export function getConsistencyReport() { return consistencyReport }
  export function getActiveTableIndex() { return activeTableIndex }
  export function setActiveTableIndex(i: number) { activeTableIndex = i }
  
  export function addRule(expr: Expr) {
    const rule = createRule(expr)
    const table = generateTruthTable(rule)
    rules = [...rules, rule]
    tables = [...tables, table]
    activeTableIndex = tables.length - 1
    _runConsistency()
  }
  
  export function removeRule(index: number) {
    rules = rules.filter((_, i) => i !== index)
    tables = tables.filter((_, i) => i !== index)
    validationResults = validationResults.filter((_, i) => i !== index)
    activeTableIndex = Math.min(activeTableIndex, Math.max(0, tables.length - 1))
    _runConsistency()
  }
  
  export function clearAll() {
    rules = []
    tables = []
    validationResults = []
    consistencyReport = null
    activeTableIndex = 0
    resetRuleCounter()
  }
  
  export function runValidation(text: string) {
    if (!text || rules.length === 0) return
  
    const foundPatterns = new Set<string>()
    const allPatterns = new Set(tables.flatMap(t => t.patterns))
  
    for (const pattern of allPatterns) {
      if (kmpSearchFast(text, pattern).length > 0) foundPatterns.add(pattern)
    }
  
    validationResults = rules.map((rule, i) =>
      validateRule(rule, tables[i], foundPatterns)
    )
  }
  
  function _runConsistency() {
    consistencyReport = rules.length > 0 ? checkConsistency(rules) : null
  }