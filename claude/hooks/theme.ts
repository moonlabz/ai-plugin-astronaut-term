export const colors = {
  blank: 0x01000000,
  navy: 0x07111f,
  visor: 0x0b1730,
  blueDark: 0x174ea6,
  blue: 0x2563eb,
  blueLight: 0x60a5fa,
  ice: 0x93c5fd,
  white: 0xe8f1ff,
  moon: 0x94a3b8,
  moonLight: 0xcbd5e1,
  warning: 0xf5c451,
  error: 0xf87171,
  success: 0x60d394,
} as const

export type ThemeColor = keyof typeof colors
