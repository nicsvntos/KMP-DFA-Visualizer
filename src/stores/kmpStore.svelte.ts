import { kmpSearch } from '../algorithms/kmp'
import { buildDFA } from '../algorithms/dfa'
import type { DFA, KMPStep, MatchResult, PlaybackStatus } from '../types'

let steps = $state<KMPStep[]>([])
let matches = $state<MatchResult[]>([])
let currentStepIndex = $state(-1)
let status = $state<PlaybackStatus>('idle')
let speedMs = $state(300)
let dfa = $state<DFA | null>(null)
let pattern = $state('')
let text = $state('')

let _timer: ReturnType<typeof setTimeout> | null = null

export function initialize(newPattern: string, newText: string) {
  _clearTimer()
  pattern = newPattern
  text = newText
  currentStepIndex = -1
  status = 'idle'

  if (newPattern.length === 0 || newText.length === 0) {
    steps = []
    matches = []
    dfa = null
    return
  }

  const result = kmpSearch(newText, newPattern)
  steps = result.steps
  matches = result.matches
  dfa = buildDFA(newPattern)
}

export function stepForward() {
  if (currentStepIndex < steps.length - 1) {
    currentStepIndex++
    if (currentStepIndex === steps.length - 1) status = 'done'
  }
}

export function stepBack() {
  if (currentStepIndex > 0) {
    currentStepIndex--
    status = 'paused'
  }
}

export function play() {
  if (status === 'done' || steps.length === 0) return
  status = 'playing'
  _tick()
}

export function pause() {
  _clearTimer()
  status = 'paused'
}

export function reset() {
  _clearTimer()
  currentStepIndex = -1
  status = 'idle'
}

export function setSpeed(ms: number) {
  speedMs = ms
}

export function getSteps() { return steps }
export function getMatches() { return matches }
export function getStatus() { return status }
export function getSpeedMs() { return speedMs }
export function getDFA() { return dfa }
export function getPattern() { return pattern }
export function getCurrentStepIndex() { return currentStepIndex }
export function getCurrentStep() {
  return currentStepIndex >= 0 ? steps[currentStepIndex] : null
}
export function getActiveState() {
  const step = getCurrentStep()
  return step ? step.currentState : 0
}

function _tick() {
  _clearTimer()
  if (status !== 'playing') return
  if (currentStepIndex >= steps.length - 1) {
    status = 'done'
    return
  }
  _timer = setTimeout(() => {
    stepForward()
    if (status === 'playing') _tick()
  }, speedMs)
}

function _clearTimer() {
  if (_timer !== null) {
    clearTimeout(_timer)
    _timer = null
  }
}