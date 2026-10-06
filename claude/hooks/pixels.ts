import { colors, type ThemeColor } from './theme'
import type { Mode } from './anim'

const WIDTH = 20
const HEIGHT = 8
const DEFAULT = [0x20, colors.blank, colors.blank]

function put(grid: ThemeColor[][], x: number, y: number, color: ThemeColor) {
  if (grid[y] && x >= 0 && x < WIDTH) grid[y][x] = color
}

function pack(rows: ThemeColor[][]): string {
  const values: number[] = []
  for (const row of rows) {
    for (const color of row) {
      values.push(...(color === 'blank' ? DEFAULT : [0x2588, colors[color], colors.blank]))
    }
  }
  return new Uint8Array(new Uint32Array(values).buffer).toBase64()
}

export function astronautCells(mode: Mode, frame: number): string {
  const grid = Array.from({ length: HEIGHT }, () => Array<ThemeColor>(WIDTH).fill('blank'))
  const bob = mode === 'idle' && frame % 2 === 1 ? 1 : 0
  const helmet = [[8, 11], [6, 13], [5, 14], [5, 14], [6, 13]]
  helmet.forEach(([left, right], row) => {
    for (let x = left; x <= right; x++) put(grid, x, row + bob, row === 0 || row === 4 ? 'moonLight' : 'white')
  })
  for (let y = 2; y <= 3; y++) for (let x = 7; x <= 12; x++) put(grid, x, y + bob, 'visor')
  for (let x = 7; x <= 12; x++) put(grid, x, 4 + bob, 'moon')
  put(grid, 8, 2 + bob, 'blueLight')
  put(grid, 9, 2 + bob, 'blueLight')
  for (let x = 7; x <= 12; x++) put(grid, x, 5 + bob, 'blue')
  for (let x = 6; x <= 13; x++) put(grid, x, 6 + bob, 'blueDark')
  put(grid, 9, 5 + bob, 'ice')
  put(grid, 10, 5 + bob, 'ice')
  const step = mode === 'terminal' || mode === 'reading' ? frame % 2 : 0
  put(grid, 7 - step, 7, 'visor')
  put(grid, 8 - step, 7, 'moon')
  put(grid, 11 + step, 7, 'visor')
  put(grid, 12 + step, 7, 'moon')

  if (mode === 'thinking') {
    put(grid, 16, 2, 'ice'); put(grid, 17, 1, 'blueLight'); put(grid, 17, 2, 'white'); put(grid, 18, 2, 'blueLight')
  } else if (mode === 'failure') {
    put(grid, 16, 1, 'warning'); put(grid, 16, 2, 'error')
  } else if (mode === 'success') {
    put(grid, 16, 1, 'success'); put(grid, 17, 2, 'ice'); put(grid, 18, 1, 'success')
  } else if (mode === 'searching') {
    put(grid, 16, 3, 'ice'); put(grid, 17, 3, 'white'); put(grid, 18, 3, 'ice')
  } else if (mode === 'subagent') {
    put(grid, 16, 2, 'blueDark'); put(grid, 17, 1, 'ice'); put(grid, 17, 2, 'blueLight'); put(grid, 18, 2, 'blueDark'); put(grid, 19, 2, 'ice')
  } else if (mode === 'editing') {
    put(grid, 15, 6, 'blueLight'); put(grid, 16, 6, 'ice'); put(grid, 17, 6, 'white')
  } else if (mode === 'sleep') {
    put(grid, 8, 2 + bob, 'visor'); put(grid, 9, 2 + bob, 'visor'); put(grid, 10, 2 + bob, 'visor')
  }
  return pack(grid)
}

export function sceneCells(columns: number, frame: number, ground = false): string {
  const row: ThemeColor[] = Array(Math.max(20, Math.min(columns, 80))).fill('blank')
  if (ground) {
    const center = Math.floor(row.length / 2)
    for (let x = Math.max(0, center - 8); x <= Math.min(row.length - 1, center + 8); x++) row[x] = 'moon'
    row[center - 4] = 'moonLight'; row[center + 5] = 'blueDark'
  } else {
    const stars = [3, 12, 25, 36, 49, 61, 73]
    stars.forEach((x, index) => { if (x < row.length && (frame + index) % 3 !== 0) row[x] = 'ice' })
  }
  return pack([row])
}
