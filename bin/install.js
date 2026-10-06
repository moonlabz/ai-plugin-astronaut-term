#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import { access, cp, lstat, mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const markerName = '.astronaut-term-owned.json'
const petId = 'astronaut-term'
const timestamp = new Date().toISOString().replaceAll(':', '-').replaceAll('.', '-')
const homeDir = os.homedir()
const codexHome = process.env.CODEX_HOME || path.join(homeDir, '.codex')
const claudeHome = process.env.CLAUDE_CONFIG_DIR || path.join(homeDir, '.claude')
const claudeMarketplace = path.join(claudeHome, 'plugins', 'marketplaces', 'astronaut-term')

async function exists(file) {
  try { await access(file); return true } catch { return false }
}

function commandVersion(command) {
  const result = spawnSync(command, ['--version'], { encoding: 'utf8', timeout: 5000 })
  if (result.status !== 0) return null
  return `${result.stdout || ''}${result.stderr || ''}`.trim()
}

function majorMinorPatch(value) {
  const match = value?.match(/\b(\d+)\.(\d+)\.(\d+)\b/)
  return match ? match.slice(1).map(Number) : null
}

function atLeast(version, wanted) {
  if (!version) return false
  for (let i = 0; i < 3; i++) {
    if (version[i] !== wanted[i]) return version[i] > wanted[i]
  }
  return true
}

async function jsonFile(file) {
  return JSON.parse(await readFile(file, 'utf8'))
}

async function safeReplaceOwned(source, destination, identify, label) {
  await mkdir(path.dirname(destination), { recursive: true })
  if (await exists(destination)) {
    const details = await lstat(destination)
    if (details.isSymbolicLink()) throw new Error(`${label} destination is a symlink; refusing to write through it: ${destination}`)
    if (!await identify(destination)) throw new Error(`${label} destination already exists and is not an Astronaut Term install: ${destination}`)
    const same = await compareFiles(source, destination)
    if (same) return false
    await rename(destination, `${destination}.backup-${timestamp}`)
  }
  await cp(source, destination, { recursive: true, errorOnExist: true, force: false })
  return true
}

async function compareFiles(source, destination) {
  const files = ['pet.json', 'spritesheet.webp']
  for (const name of files) {
    const [a, b] = await Promise.all([readFile(path.join(source, name)), readFile(path.join(destination, name))])
    if (!a.equals(b)) return false
  }
  return true
}

async function installCodex() {
  const codexVersion = commandVersion('codex')
  if (!codexVersion) {
    console.log('Codex CLI not found; skipped Codex pet installation.')
    return
  }
  const source = path.join(packageRoot, 'codex', 'pet-v1')
  const destination = path.join(codexHome, 'pets', petId)
  const changed = await safeReplaceOwned(source, destination, async dir => {
    try {
      const manifest = await jsonFile(path.join(dir, 'pet.json'))
      return manifest.id === petId && manifest.displayName === 'Astronaut Term'
    } catch { return false }
  }, 'Codex pet')
  console.log(`${changed ? 'Installed' : 'Already current'} Codex V1 pet at ${destination}`)
  console.log('Select it with /pets in Codex.')
}

async function marketplaceIsOurs() {
  try {
    const marker = await jsonFile(path.join(claudeMarketplace, markerName))
    return marker.name === 'astronaut-term' && marker.version === '0.1.0'
  } catch { return false }
}

async function sameDirectory(left, right) {
  const entries = await readdir(left, { withFileTypes: true })
  const otherEntries = await readdir(right, { withFileTypes: true })
  if (entries.length !== otherEntries.length) return false
  for (const entry of entries) {
    const a = path.join(left, entry.name)
    const b = path.join(right, entry.name)
    const other = otherEntries.find(candidate => candidate.name === entry.name)
    if (!other || entry.isDirectory() !== other.isDirectory() || entry.isFile() !== other.isFile()) return false
    if (entry.isDirectory()) {
      if (!await sameDirectory(a, b)) return false
    } else if (!(await readFile(a)).equals(await readFile(b))) return false
  }
  return true
}

async function stageClaudeMarketplace() {
  await mkdir(path.dirname(claudeMarketplace), { recursive: true })
  if (await exists(claudeMarketplace) && (await lstat(claudeMarketplace)).isSymbolicLink()) {
    throw new Error(`Claude marketplace destination is a symlink; refusing to write through it: ${claudeMarketplace}`)
  }
  if (await exists(claudeMarketplace) && !await marketplaceIsOurs()) {
    throw new Error(`Claude marketplace destination already exists and is not managed by Astronaut Term: ${claudeMarketplace}`)
  }
  const stage = `${claudeMarketplace}.stage-${timestamp}`
  await mkdir(stage, { recursive: true })
  await cp(path.join(packageRoot, '.claude-plugin'), path.join(stage, '.claude-plugin'), { recursive: true })
  await cp(path.join(packageRoot, 'claude'), path.join(stage, 'claude'), {
    recursive: true,
    filter: source => !source.includes(`${path.sep}types${path.sep}`),
  })
  await writeFile(path.join(stage, markerName), JSON.stringify({ name: 'astronaut-term', version: '0.1.0' }, null, 2) + '\n')
  if (await exists(claudeMarketplace)) {
    if (await sameDirectory(stage, claudeMarketplace)) {
      await rm(stage, { recursive: true })
      return
    }
    await rename(claudeMarketplace, `${claudeMarketplace}.backup-${timestamp}`)
  }
  await rename(stage, claudeMarketplace)
}

function runClaude(args) {
  const result = spawnSync('claude', args, { encoding: 'utf8', stdio: 'inherit', timeout: 30000 })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`claude ${args.join(' ')} failed with exit code ${result.status}`)
}

async function installClaude() {
  const versionText = commandVersion('claude')
  if (!versionText) {
    console.log('Claude Code not found; skipped Claude mod installation.')
    return
  }
  const version = majorMinorPatch(versionText)
  if (!atLeast(version, [2, 1, 287])) {
    console.log(`Claude Code ${versionText} is below the mod API minimum (2.1.287); kept the mod package at ${path.join(packageRoot, 'claude')}.`)
    return
  }
  await stageClaudeMarketplace()
  const listed = spawnSync('claude', ['plugin', 'marketplace', 'list'], { encoding: 'utf8', timeout: 10000 })
  const alreadyRegistered = listed.status === 0 && (listed.stdout || '').includes('astronaut-term')
  if (!alreadyRegistered) runClaude(['plugin', 'marketplace', 'add', claudeMarketplace])
  else if (!(listed.stdout || '').includes(claudeMarketplace)) throw new Error('Claude already has an Astronaut Term marketplace name registered to a different source.')
  runClaude(['plugin', 'install', 'astronaut-term@astronaut-term', '--scope', 'user', '--yes'])
  console.log('Installed Claude Code mod from the local Astronaut Term marketplace.')
}

async function install() {
  console.log(`Astronaut Term installer (${process.platform})`)
  await installCodex()
  await installClaude()
  console.log('Done. See README.md for selection and development commands.')
}

async function doctor() {
  console.log(`Platform: ${process.platform}`)
  console.log(`Codex CLI: ${commandVersion('codex') || 'not found'}`)
  console.log(`CODEX_HOME: ${codexHome}`)
  console.log(`Codex pet: ${await exists(path.join(codexHome, 'pets', petId, 'pet.json')) ? 'present' : 'not installed'}`)
  console.log(`Claude Code: ${commandVersion('claude') || 'not found'}`)
  console.log(`CLAUDE_CONFIG_DIR: ${claudeHome}`)
  console.log(`Claude marketplace: ${await marketplaceIsOurs() ? 'installed' : 'not installed'}`)
  for (const relative of ['codex/pet/pet.json', 'codex/pet/spritesheet.webp', 'codex/pet-v1/pet.json', 'codex/pet-v1/spritesheet.webp', 'claude/.claude-plugin/plugin.json']) {
    const file = path.join(packageRoot, relative)
    console.log(`${relative}: ${await exists(file) ? 'present' : 'missing'}`)
  }
}

async function uninstallCodex() {
  const destination = path.join(codexHome, 'pets', petId)
  if (!await exists(destination)) {
    console.log(`Codex pet not installed at ${destination}`)
    return
  }
  if ((await lstat(destination)).isSymbolicLink()) throw new Error(`Refusing to remove a pet directory symlink: ${destination}`)
  const manifest = await jsonFile(path.join(destination, 'pet.json')).catch(() => ({}))
  if (manifest.id !== petId || manifest.displayName !== 'Astronaut Term') {
    throw new Error(`Refusing to remove a pet that is not identified as Astronaut Term: ${destination}`)
  }
  await rm(destination, { recursive: true })
  console.log(`Removed Codex pet at ${destination}`)
}

async function uninstallClaude() {
  if (await exists(claudeMarketplace) && (await lstat(claudeMarketplace)).isSymbolicLink()) {
    throw new Error(`Refusing to remove a Claude marketplace symlink: ${claudeMarketplace}`)
  }
  if (!await marketplaceIsOurs()) {
    console.log('Astronaut Term Claude marketplace not installed.')
    return
  }
  if (commandVersion('claude')) {
    const installed = spawnSync('claude', ['plugin', 'list'], { encoding: 'utf8', timeout: 10000 })
    if (installed.status === 0 && (installed.stdout || '').includes('astronaut-term@astronaut-term')) {
      runClaude(['plugin', 'uninstall', 'astronaut-term@astronaut-term', '--scope', 'user'])
    }
    const marketplaces = spawnSync('claude', ['plugin', 'marketplace', 'list'], { encoding: 'utf8', timeout: 10000 })
    if (marketplaces.status === 0 && (marketplaces.stdout || '').includes('astronaut-term')) {
      runClaude(['plugin', 'marketplace', 'remove', 'astronaut-term'])
    }
  }
  await rm(claudeMarketplace, { recursive: true })
  console.log(`Removed Astronaut Term Claude marketplace at ${claudeMarketplace}`)
}

async function main() {
  const command = process.argv[2] || 'install'
  if (command === 'install') await install()
  else if (command === 'doctor') await doctor()
  else if (command === 'uninstall') {
    await uninstallCodex()
    await uninstallClaude()
  } else {
    console.error('Usage: npx ai-plugin-astronaut-term [install|uninstall|doctor]')
    process.exitCode = 2
  }
}

main().catch(error => {
  console.error(`Astronaut Term: ${error.message}`)
  process.exitCode = 1
})
