import type { KMPStep, MatchResult } from '../types'

/**
 * builds the KMP failure function (partial match table).
 *
 * failure[i] = length of the longest proper prefix of pattern[0..i]
 * that is also a suffix.
 *
 * this is what allows KMP to never re-scan characters it has already seen.
 *
 * example: pattern = "ababc"
 * failure = [0, 0, 1, 2, 0]
 *
 * Big-O: O(m) time, O(m) space — where m = pattern length
 */
export function buildFailureFunction(pattern: string): number[] {
  const m = pattern.length
  const failure = new Array(m).fill(0)

  let k = 0
  for (let i = 1; i < m; i++) {
    // fall back until we find a matching prefix or reach the start
    while (k > 0 && pattern[k] !== pattern[i]) {
      k = failure[k - 1]
    }
    if (pattern[k] === pattern[i]) {
      k++
    }
    failure[i] = k
  }

  return failure
}

/**
 * runs KMP search and records every single step for animation playback.
 *
 * each step captures:
 * - where we are in the text (textIndex)
 * - where we are in the pattern (patternIndex / DFA state)
 * - whether this step completed a full match
 *
 * Big-O: O(n + m) time — where n = text length, m = pattern length
 * every character is visited at most twice.
 */
export function kmpSearch(text: string, pattern: string): {
  steps: KMPStep[]
  matches: MatchResult[]
} {
  const steps: KMPStep[] = []
  const matches: MatchResult[] = []

  if (pattern.length === 0 || text.length === 0) {
    return { steps, matches }
  }

  const n = text.length
  const m = pattern.length
  const failure = buildFailureFunction(pattern)

  let q = 0 // number of characters matched (also the current DFA state)

  for (let i = 0; i < n; i++) {
    // fall back through failure links until we find a match or hit state 0
    while (q > 0 && pattern[q] !== text[i]) {
      q = failure[q - 1]
    }

    if (pattern[q] === text[i]) {
      q++
    }

    const isMatch = q === m
    const matchStart = isMatch ? i - m + 1 : -1

    steps.push({
      textIndex: i,
      patternIndex: isMatch ? m : q,
      currentState: isMatch ? m : q,
      isMatch,
      matchStart,
    })

    if (isMatch) {
      matches.push({
        index: matchStart,
        length: m,
      })
      // use failure function to allow overlapping matches
      q = failure[q - 1]
    }
  }

  return { steps, matches }
}

/**
 * returns just the match results without step tracking
 * used by the benchmark runner where we only care about speed + count
 *
 * Big-O: O(n + m)
 */
export function kmpSearchFast(text: string, pattern: string): MatchResult[] {
  if (pattern.length === 0 || text.length === 0) return []

  const n = text.length
  const m = pattern.length
  const failure = buildFailureFunction(pattern)
  const matches: MatchResult[] = []

  let q = 0
  for (let i = 0; i < n; i++) {
    while (q > 0 && pattern[q] !== text[i]) {
      q = failure[q - 1]
    }
    if (pattern[q] === text[i]) q++
    if (q === m) {
      matches.push({ index: i - m + 1, length: m })
      q = failure[q - 1]
    }
  }

  return matches
}

export function explainFailureFunction(
  pattern: string
): { index: number; char: string; value: number }[] {
  const failure = buildFailureFunction(pattern)
  return pattern.split('').map((char, i) => ({
    index: i,
    char,
    value: failure[i],
  }))
}