export type Mode = 'idle' | 'thinking' | 'reading' | 'editing' | 'terminal' | 'searching' | 'subagent' | 'waiting' | 'success' | 'failure' | 'sleep'

export type AnimationState = { mode: Mode; since: number; frame: number }

export function transition(current: AnimationState, mode: Mode, now: number): AnimationState {
  return { mode, since: now, frame: current.frame + 1 }
}

export function nextFrame(current: AnimationState): AnimationState {
  return { ...current, frame: current.frame + 1 }
}

export function shouldSleep(state: AnimationState, now: number, sleepAfter: number): boolean {
  return sleepAfter > 0 && (state.mode === 'idle' || state.mode === 'success') && now - state.since >= sleepAfter * 1000
}
