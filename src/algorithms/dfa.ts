import type { DFA, DFAState, DFATransition } from '../types'

/**
 * Builds a DFA from a pattern string using the KMP failure function approach.
 *
 * Each state i represents "we have matched i characters of the pattern so far."
 * State 0 = start, State pattern.length = accept (full match found).
 *
 * Big-O: O(m * |alphabet|) to build, where m = pattern length
 */
export function buildDFA(pattern: string): DFA {
  const m = pattern.length

  if (m === 0) {
    return {
      states: [{ id: 0, label: 'q0', isStart: true, isAccept: true }],
      transitions: [],
      alphabet: [],
      startState: 0,
      acceptStates: [0],
    }
  }

  // Collect unique characters in the pattern (the alphabet we care about)
  const alphabet = Array.from(new Set(pattern.split('')))

  // ── Build the transition table via the overlap (failure) method ──────────
  // transitionTable[state][char] = nextState
  const transitionTable: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(alphabet.length).fill(0)
  )

  for (let state = 0; state <= m; state++) {
    for (let ci = 0; ci < alphabet.length; ci++) {
      const char = alphabet[ci]

      if (state < m && pattern[state] === char) {
        // Extend the current match
        transitionTable[state][ci] = state + 1
      } else {
        // Use the failure function to find the longest proper suffix that is
        // also a prefix, then follow that state's transition
        let fallback = state
        while (fallback > 0) {
          // Walk back using the pattern prefix overlap
          fallback = computeFailureAt(pattern, fallback)
          if (pattern[fallback] === char) {
            transitionTable[state][ci] = fallback + 1
            break
          }
        }
        // If fallback hit 0 and still no match, transition stays 0
        if (transitionTable[state][ci] === 0 && pattern[0] === char) {
          transitionTable[state][ci] = 1
        }
      }
    }
  }

  // ── Convert table to DFAState[] + DFATransition[] ────────────────────────
  const states: DFAState[] = []
  const transitions: DFATransition[] = []

  for (let s = 0; s <= m; s++) {
    states.push({
      id: s,
      label: s === 0 ? 'q₀' : s === m ? `q${s} ✓` : `q${s}`,
      isStart: s === 0,
      isAccept: s === m,
    })
  }

  for (let state = 0; state <= m; state++) {
    for (let ci = 0; ci < alphabet.length; ci++) {
      const nextState = transitionTable[state][ci]
      transitions.push({
        from: state,
        to: nextState,
        symbol: alphabet[ci],
      })
    }
  }

  return {
    states,
    transitions,
    alphabet,
    startState: 0,
    acceptStates: [m],
  }
}

/**
 * Computes the failure (fallback) value for position `pos` in the pattern.
 * This is the length of the longest proper prefix of pattern[0..pos-1]
 * that is also a suffix.
 *
 * Used internally during DFA construction to handle mismatches.
 */
function computeFailureAt(pattern: string, pos: number): number {
  // Build the full failure array up to pos
  const failure = new Array(pos).fill(0)
  let k = 0
  for (let i = 1; i < pos; i++) {
    while (k > 0 && pattern[k] !== pattern[i]) {
      k = failure[k - 1]
    }
    if (pattern[k] === pattern[i]) k++
    failure[i] = k
  }
  return failure[pos - 1] ?? 0
}

/**
 * Given a DFA and a single character, returns the next state.
 * Used during animation to highlight transitions step by step.
 */
export function dfaStep(dfa: DFA, currentState: number, char: string): number {
  const transition = dfa.transitions.find(
    (t) => t.from === currentState && t.symbol === char
  )
  // If character is not in the alphabet, stay at state 0
  return transition ? transition.to : 0
}