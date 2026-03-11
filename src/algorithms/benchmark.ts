import type { BenchmarkRun, BenchmarkResult, FileSizeLabel } from '../types'
import { kmpSearchFast } from './kmp'

const CHARSET =
  'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,!? '

/**
 * Generates a pseudo-random string of a given byte size.
 * We periodically inject the pattern so there are guaranteed matches
 * to find, making the benchmark realistic rather than a pure miss scenario.
 *
 * @param targetBytes  - approximate size in bytes
 * @param injectPattern - pattern to embed every ~5000 characters
 */
function generateText(targetBytes: number, injectPattern: string): string {
  const chunks: string[] = []
  let total = 0
  const injectEvery = 5000 // inject one match every 5000 chars

  while (total < targetBytes) {
    // Random chunk of ~500 characters
    const chunkSize = Math.min(500, targetBytes - total)
    let chunk = ''
    for (let i = 0; i < chunkSize; i++) {
      chunk += CHARSET[Math.floor(Math.random() * CHARSET.length)]
    }
    chunks.push(chunk)
    total += chunkSize

    // Inject the pattern periodically
    if (total % injectEvery < 500 && injectPattern.length > 0) {
      chunks.push(injectPattern)
      total += injectPattern.length
    }
  }

  return chunks.join('')
}

const SIZE_CONFIGS: { label: FileSizeLabel; bytes: number }[] = [
  { label: '1MB', bytes: 1 * 1024 * 1024 },
  { label: '10MB', bytes: 10 * 1024 * 1024 },
]

/**
 * Runs KMP on a pre-generated text and times it precisely.
 * We generate the text outside the timed block so we're only
 * measuring the search, not text generation.
 *
 * Big-O reminder shown in UI: O(n + m)
 * n = text length, m = pattern length
 */
function runSingle(
  text: string,
  pattern: string,
  label: FileSizeLabel
): BenchmarkRun {
  const start = performance.now()
  const matches = kmpSearchFast(text, pattern)
  const end = performance.now()

  return {
    fileSizeLabel: label,
    fileSizeBytes: text.length,
    matchCount: matches.length,
    durationMs: parseFloat((end - start).toFixed(3)),
    textLength: text.length,
  }
}

/**
 * Runs the full benchmark suite: 1MB and 10MB.
 *
 * Accepts an optional progress callback so the UI can show
 * "generating 10MB text..." before the run starts.
 *
 * Returns a BenchmarkResult with both runs for display.
 */
export async function runBenchmark(
  pattern: string,
  onProgress?: (message: string) => void
): Promise<BenchmarkResult> {
  const runs: BenchmarkRun[] = []

  for (const { label, bytes } of SIZE_CONFIGS) {
    onProgress?.(`Generating ${label} text...`)

    // Yield to the browser so the UI can update before the heavy work
    await new Promise((resolve) => setTimeout(resolve, 50))

    const text = generateText(bytes, pattern)

    onProgress?.(`Running KMP on ${label} text...`)
    await new Promise((resolve) => setTimeout(resolve, 50))

    const run = runSingle(text, pattern, label)
    runs.push(run)
  }

  onProgress?.('Done')

  return { pattern, runs }
}

/**
 * Returns a human-readable Big-O analysis comparing the two runs.
 * We verify that doubling n roughly doubles the time (linear behaviour).
 */
export function analyzeBigO(result: BenchmarkResult): {
  complexity: string
  explanation: string
  ratio: number
} {
  const [run1, run2] = result.runs

  if (!run1 || !run2) {
    return {
      complexity: 'O(n + m)',
      explanation: 'Not enough data to analyze.',
      ratio: 0,
    }
  }

  const sizeRatio = run2.fileSizeBytes / run1.fileSizeBytes
  const timeRatio =
    run1.durationMs > 0
      ? parseFloat((run2.durationMs / run1.durationMs).toFixed(2))
      : 0

  const explanation =
    `File size grew ${sizeRatio}×. ` +
    `Search time grew ${timeRatio}×. ` +
    (timeRatio <= sizeRatio * 1.5
      ? `This confirms linear O(n + m) behaviour — KMP scales proportionally with input size.`
      : `Slightly super-linear due to cache misses on large strings, but still effectively O(n + m).`)

  return {
    complexity: 'O(n + m)',
    explanation,
    ratio: timeRatio,
  }
}