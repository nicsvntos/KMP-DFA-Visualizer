//dfa types
export interface DFAState {
    id: number,
    label: string,
    isStart: boolean,
    isAccept: boolean
}

export interface DFATransition {
    from: number,
    to: number,
    symbol: string
}

export interface DFA {
    states: DFAState[]
    transitions: DFATransition[]
    alphabet: string[]
    startState: number
    acceptStates: number[]
}

//kmp types

export interface KMPStep{
    textIndex: number
    patternIndex: number
    currentState: number
    isMatch: boolean
    matchStart: number
}

export interface MatchResult {
    index: number
    length: number
}

export type FileSizeLabel = '1MB' | '10MB'

export interface BenchmarkRun {
    fileSizeLabel: FileSizeLabel
    fileSizeBytes: number
    matchCount: number
    durationMs: number
    textLength: number
}

export interface BenchmarkResult {
    pattern: string
    runs: BenchmarkRun[]
}

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'done'

export interface AnimationState {
    steps: KMPStep[]
    currentStepIndex: number
    status: PlaybackStatus
    speedMs: number
}
