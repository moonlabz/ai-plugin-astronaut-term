import { nextFrame, shouldSleep, transition, type AnimationState, type Mode } from './anim'
import { hudText } from './hud'
import { astronautCells } from './pixels'
import { sceneCells } from './scene'
import { readSettings } from './settings'
import { modeForTool, statusText } from './status'

export function register(on: any, options: any = {}) {
  const settings = readSettings(options)
  let state: AnimationState = { mode: 'idle', since: Date.now(), frame: 0 }
  let bodyColumns = 80

  const setMode = ($: { ui: { invalidate: (event: string) => void } }, mode: Mode) => {
    state = transition(state, mode, Date.now())
    $.ui.invalidate('ui.render')
  }

  on('session.start', async ($, e, next) => {
    setMode($, 'idle')
    const interval = settings.speed === 'fast' ? 300 : settings.speed === 'slow' ? 800 : 450
    $.clock.every(interval, () => {
      const now = Date.now()
      if (shouldSleep(state, now, settings.sleepAfter)) state = transition(state, 'sleep', now)
      else if (state.mode === 'success' || state.mode === 'failure') {
        if (now - state.since > 1800) state = transition(state, 'idle', now)
      } else state = nextFrame(state)
      $.ui.invalidate('ui.render')
    })
    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    setMode($, 'thinking')
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    const tool = typeof e.tool === 'string' ? e.tool : ''
    setMode($, modeForTool(tool, settings.subagents))
    try {
      const result = await next(e)
      if (result && typeof result === 'object' && ('deny' in result || ('isError' in result && result.isError))) setMode($, 'failure')
      else setMode($, 'thinking')
      return result
    } catch (error) {
      setMode($, 'failure')
      throw error
    }
  })

  on('turn.complete', async ($, e, next) => {
    setMode($, 'success')
    return next(e)
  })

  on('tool.check', async ($, e, next) => {
    const decision = await next(e)
    if (decision && typeof decision === 'object' && 'decision' in decision && decision.decision === 'ask') setMode($, 'waiting')
    return decision
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.hasSurvey) return next(e)
    bodyColumns = e.props.bodyColumns || bodyColumns
    const { Box, Raster, Text } = $.ui.resolve(e)
    const children = []
    if (settings.scene) {
      children.push(<Raster key="sky" columns={Math.max(20, Math.min(bodyColumns - 1, 80))} rows={1} cells={sceneCells(bodyColumns, state.frame)} />)
    }
    children.push(<Raster key="astronaut" columns={20} rows={8} cells={astronautCells(state.mode, state.frame)} />)
    if (settings.statusLine) children.push(<Text color="#93C5FD" bold>{statusText(state.mode)}</Text>)
    if (settings.scene) {
      children.push(<Raster key="moon" columns={Math.max(20, Math.min(bodyColumns - 1, 80))} rows={1} cells={sceneCells(bodyColumns, state.frame, true)} />)
    }
    if (settings.hud) children.push(<Text color="#60A5FA">{hudText(state.mode)}</Text>)
    return <Box flexDirection="column">{await next(e)}{children}</Box>
  })
}
