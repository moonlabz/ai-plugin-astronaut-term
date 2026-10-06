import type { Mode } from './anim'

const labels: Record<Mode, string> = {
  idle: 'on the moon',
  thinking: 'thinking',
  reading: 'scanning',
  editing: 'updating systems',
  terminal: 'operating console',
  searching: 'contacting mission control',
  subagent: 'satellite deployed',
  waiting: 'standing by',
  success: 'mission complete',
  failure: 'signal interrupted',
  sleep: 'resting on the moon',
}

export function statusText(mode: Mode): string {
  return `◈ ${labels[mode]}...`
}

export function modeForTool(tool: string, showSubagents: boolean): Mode {
  if (showSubagents && /^(Task|Agent)$/.test(tool)) return 'subagent'
  if (/^(Read|Glob|Grep|LS|Search|NotebookRead)$/.test(tool)) return 'reading'
  if (/^(Edit|Write|MultiEdit|NotebookEdit)$/.test(tool)) return 'editing'
  if (tool === 'Bash') return 'terminal'
  if (/^(WebFetch|WebSearch)$/.test(tool)) return 'searching'
  return 'thinking'
}
