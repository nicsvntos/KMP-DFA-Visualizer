import { runBenchmark, analyzeBigO } from '../algorithms/benchmark'
import type { BenchmarkResult } from '../types'

let result = $state<BenchmarkResult | null>(null)
let isRunning = $state(false)
let progressMessage = $state('')
let error = $state<string | null>(null)


export async function runBenchmarkSuite(pattern: string) {
  if (isRunning || pattern.length === 0) return
  isRunning = true
  error = null
  result = null
  progressMessage = 'Starting benchmark...'

  try {
    result = await runBenchmark(pattern, (message) => {
      progressMessage = message
    })
  } catch (e) {
    error = e instanceof Error ? e.message : 'An unknown error occurred.'
  } finally {
    isRunning = false
    progressMessage = ''
  }
}

export function clearResults() {
  result = null
  error = null
  progressMessage = ''
}

export function getResult() { return result }
export function getIsRunning() { return isRunning }
export function getProgressMessage() { return progressMessage }
export function getError() { return error }
export function getAnalysis() { return result ? analyzeBigO(result) : null }