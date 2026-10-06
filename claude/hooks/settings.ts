export type Settings = {
  speed: 'slow' | 'normal' | 'fast'
  sleepAfter: number
  hud: boolean
  statusLine: boolean
  subagents: boolean
  scene: boolean
}

const defaults: Settings = {
  speed: 'normal',
  sleepAfter: 120,
  hud: false,
  statusLine: true,
  subagents: true,
  scene: true,
}

export function readSettings(options: unknown): Settings {
  const values = options && typeof options === 'object' ? options as Record<string, unknown> : {}
  const nested = values.userConfig && typeof values.userConfig === 'object'
    ? values.userConfig as Record<string, unknown>
    : values.settings && typeof values.settings === 'object'
      ? values.settings as Record<string, unknown>
      : values
  const speed = nested.speed
  const sleepAfter = nested.sleepAfter
  return {
    speed: speed === 'slow' || speed === 'fast' ? speed : defaults.speed,
    sleepAfter: typeof sleepAfter === 'number' && sleepAfter >= 0 ? sleepAfter : defaults.sleepAfter,
    hud: typeof nested.hud === 'boolean' ? nested.hud : defaults.hud,
    statusLine: typeof nested.statusLine === 'boolean' ? nested.statusLine : defaults.statusLine,
    subagents: typeof nested.subagents === 'boolean' ? nested.subagents : defaults.subagents,
    scene: typeof nested.scene === 'boolean' ? nested.scene : defaults.scene,
  }
}
