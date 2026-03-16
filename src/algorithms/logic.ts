export type Operator = 'AND' | 'OR' | 'NOT'

export interface Atom {
    kind: 'atom'
    pattern: string     // pattern string atom refers to
    negated: boolean    // true = NOT applied to this atom
}

export interface Compound {
    kind: 'compound'
    operator: 'AND' | 'OR'
    left: Expr
    right: Expr
}

export type Expr = Atom | Compound

/**
 * a single rule defined by the user
 * e.g. "abc AND NOT xyz"
 */

export interface Rule {
    id: string
    label: string   //readable label "RULE 1"
    expr: Expr
}

export interface TruthTableRow {
    assignments: Record <string, boolean>
    result: boolean
}

export interface TruthTable {
    rule: Rule
    patterns: string []
    rows: TruthTableRow[]
    isTautology: boolean
    isContradiction: boolean
    isSatisfied: boolean

}

export interface ValidationResult {
    rule: Rule
    assignments: Record <string, boolean>
    result: boolean
    verdict: 'accepted' | 'rejected'
    matchingRow: number
}

export type ConsistencyStatus = 'consistent' | 'inconsistent'

export interface ConsistencyReport {
    status: ConsistencyStatus
    rules: Rule[]
    allPatterns: string []
    satisfyRows: Record<string, boolean>[]
}

export const atom = (pattern: string, negated = false): Atom => ({ kind: 'atom', pattern, negated})

export const and = (left: Expr, right: Expr): Compound =>
({ kind: 'compound', operator: 'AND', left, right})

export const or = (left: Expr, right: Expr): Compound =>
({ kind: 'compound', operator: 'OR', left, right})

export function extractPatterns(expr: Expr): string[] {
    const patterns = new Set<string>()
    const walk = (e: Expr) => {
      if (e.kind === 'atom') patterns.add(e.pattern)
      else { walk(e.left); walk(e.right) }
    }
    walk(expr)
    return Array.from(patterns).sort()
  }

export function evaluate(expr: Expr, assignments: Record<string,boolean>): boolean {
    if (expr.kind === 'atom') {
        const val = assignments[expr.pattern] ?? false
        return expr.negated ? !val : val
    }
    const l = evaluate(expr.left, assignments)
    const r = evaluate(expr.right, assignments)
    return expr.operator === 'AND' ? l && r : l || r
}

export function exprToString(expr: Expr): string {
    if (expr.kind === 'atom') return expr.negated ? `NOT '${expr.pattern}'` : `'${expr.pattern}'`
    return `(${exprToString(expr.left)} ${expr.operator} ${exprToString(expr.right)})`
}

function generateAssignments(patterns: string[]): Record<string, boolean>[] {
    const n = patterns.length
    return Array.from({ length: Math.pow(2, n) }, (_, i) =>
      Object.fromEntries(patterns.map((p, j) => [p, Boolean((i >> (n - 1 - j)) & 1)]))
    )
}

export function generateTruthTable (rule: Rule): TruthTable {
    const patterns = extractPatterns(rule.expr)
    const rows = generateAssignments(patterns).map(assignments => 
    ({
        assignments,
        result: evaluate(rule.expr, assignments),
    }))
    const trueCount = rows.filter(r => r.result).length
    return {
        rule,
        patterns,
        rows,
        isTautology: trueCount === rows.length,
        isContradiction: trueCount === 0,
        isSatisfied: trueCount > 0,
    }
}

export function validateRule(
    rule: Rule,
    table: TruthTable,
    patternsFound: Set<string>
  ): ValidationResult {
    const assignments = Object.fromEntries(table.patterns.map(p => [p, patternsFound.has(p)]))
    const result = evaluate(rule.expr, assignments)
    const matchingRow = table.rows.findIndex(row =>
      table.patterns.every(p => row.assignments[p] === assignments[p])
    )
    return { rule, assignments, result, verdict: result ? 'accepted' : 'rejected', matchingRow }
}

export function checkConsistency(rules: Rule[]): ConsistencyReport {
    if (rules.length === 0) return { status: 'consistent', rules, allPatterns: [], satisfyRows: [] }
   
    const allPatterns = Array.from(
      new Set(rules.flatMap(r => extractPatterns(r.expr)))
    ).sort()
   
    const satisfyRows = generateAssignments(allPatterns).filter(assignment =>
      rules.every(rule => evaluate(rule.expr, assignment))
    )
   
    return {
      status: satisfyRows.length > 0 ? 'consistent' : 'inconsistent',
      rules,
      allPatterns,
      satisfyRows,
    }
  }


let _ruleCounter = 1
export function createRule(expr: Expr): Rule {
    return { id: `rule-${Date.now()}-${_ruleCounter}`, label: `Rule ${_ruleCounter++}`, expr}
}

export function resetRuleCounter(){
    _ruleCounter = 1
}