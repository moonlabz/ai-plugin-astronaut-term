# Implementation Plan — `ai-plugin-astronaut-term`

## 1. Goal

Build a lightweight, pixel-art terminal companion/theme plugin named:

**`ai-plugin-astronaut-term`**

It should provide a coherent **space/astronaut terminal experience** for both:

- Claude Code
- OpenAI Codex CLI

The design should be inspired by the architecture and behavior of [`namenomeaning/pixel-pet`](https://github.com/namenomeaning/pixel-pet), but **do not fork or copy its visual identity**.

The uploaded moon and rocket images are the visual direction:

- pixel-art aesthetic
- astronaut / moon / rocket motifs
- blue → deep blue → navy palette
- simple silhouettes
- transparent backgrounds
- small, readable terminal sprites
- visually charming but still professional

---

# 2. Important Architecture Decision

Implement this as **one repository with two runtime adapters**:

```text
ai-plugin-astronaut-term/
├── core/
│   ├── theme/
│   ├── sprites/
│   └── shared/
│
├── claude/
│   ├── .claude-plugin/
│   ├── hooks/
│   ├── assets/
│   └── skills/
│
├── codex/
│   ├── pet/
│   ├── assets/
│   └── installer/
│
├── bin/
│   └── install.js
│
├── package.json
├── README.md
└── LICENSE
```

Do **not** attempt to force Claude Code and Codex to share the same runtime implementation.

Instead:

```text
                    ┌─────────────────────┐
                    │ ai-plugin-astronaut │
                    │       -term         │
                    └──────────┬──────────┘
                               │
                    ┌──────────┴──────────┐
                    │ Shared visual core  │
                    │ sprites / palette   │
                    │ animation concepts  │
                    └───────┬───────┬─────┘
                            │       │
                 ┌──────────┘       └──────────┐
                 ▼                             ▼
          Claude Code adapter            Codex adapter
          Claude Mod                     Custom Pet
          AbovePrompt                    /pets
          HUD                            spritesheet
          tool events                    native states
```

This is important because Claude Code Mods can render custom UI directly inside the terminal, while Codex currently provides a **native terminal-pet system** using custom sprite packages. Codex plugins themselves should not be treated as a mechanism for arbitrary TUI rendering. [GitHub](https://github.com/namenomeaning/pixel-pet)

---

# 3. Golden Sample: Claude Code

Use `namenomeaning/pixel-pet` as the architectural reference.

Reference:

https://github.com/namenomeaning/pixel-pet

The reference demonstrates the following important pattern:

```text
.claude-plugin/
plugins/<plugin>/
    .claude-plugin/plugin.json
    hooks/hooks.json
    hooks/register.tsx
    hooks/*.ts
    types/
    assets/
    skills/
```

Its `register.tsx` connects Claude events to animation state and renders the pixel character through `AbovePrompt` / `PromptHint`. [GitHub](https://github.com/namenomeaning/pixel-pet)

The reference plugin also keeps the visual theme as data rather than hard-coding every sprite into the renderer. Its default pet is represented by a compact JSON sprite/palette definition. [GitHub](https://raw.githubusercontent.com/namenomeaning/pixel-pet/main/plugins/pixel-pet/assets/slime.json)

Follow this architecture where appropriate.

---

# 4. Claude Code Implementation

Create a Claude Code Mod.

Target structure:

```text
claude/
├── .claude-plugin/
│   └── plugin.json
│
├── hooks/
│   ├── hooks.json
│   ├── register.tsx
│   ├── anim.ts
│   ├── pixels.ts
│   ├── theme.ts
│   ├── scene.ts
│   ├── status.ts
│   ├── hud.ts
│   └── settings.ts
│
├── types/
│   └── index.d.ts
│
├── assets/
│   ├── astronaut.json
│   ├── moon.json
│   ├── rocket.json
│   └── stars.json
│
└── skills/
    └── astronaut-term/
        └── SKILL.md
```

Keep the implementation intentionally smaller than `pixel-pet`.

Do **not** reproduce every feature from the reference.

---

# 5. Claude Code Visual Concept

The main character should be a tiny **astronaut**.

Example conceptual states:

| Claude state | Astronaut animation |
|---|---|
| Idle | Floating / breathing |
| Thinking | Looking at a small holographic display |
| Tool running | Walking / floating with tool |
| Read/Search | Looking through telescope |
| Edit/Write | Typing on a tiny console |
| Bash | Operating terminal console |
| Web | Radar / satellite signal |
| Waiting for user | Astronaut looks toward user |
| Tool failure | Warning symbol / sweat pixel |
| Turn completed | Small jump / rocket burst |
| Subagent active | Tiny satellite/astronaut follows main astronaut |
| Long idle | Sleeping on moon |

The animation should remain subtle.

Avoid:

- large animations
- excessive flashing
- full-screen effects
- high-frequency redraws
- audio
- network calls

---

# 6. Space Scene

Create a minimal moon surface rather than a complex game scene.

Suggested scene:

```text
                  ·       ·
       ·                         *
             ✦

       .       🪐

             👨‍🚀
       ____/──────\____
    __/      moon        \__
```

Actual implementation must use pixel sprites rather than emoji.

Scene components:

```text
background
  ├── sparse stars
  ├── moon surface
  ├── small craters
  └── astronaut
```

Use the uploaded moon image as visual inspiration for:

- crater shapes
- circular geometry
- soft blue palette
- simple pixel-art construction

Use the uploaded rocket image as inspiration for:

- rocket silhouette
- blue/space theme adaptation
- accent shapes
- motion/exhaust effects

Do not simply embed the uploaded images as terminal graphics.

Create purpose-built pixel sprites.

---

# 7. Color System

Use a consistent blue/navy system.

Recommended initial palette:

```text
NAVY_950   #07111F
NAVY_900   #0B1730
NAVY_800   #10244A
BLUE_700   #174EA6
BLUE_600   #2563EB
BLUE_500   #3B82F6
BLUE_400   #60A5FA
BLUE_300   #93C5FD
BLUE_200   #BFDBFE

MOON_DARK  #64748B
MOON       #94A3B8
MOON_LIGHT #CBD5E1

WHITE      #E8F1FF

WARNING    #F5C451
ERROR      #F87171
SUCCESS    #60D394
```

Primary brand colors:

```text
Deep Navy
#07111F

Navy Blue
#0B1730

Astronaut Blue
#2563EB

Space Blue
#3B82F6

Ice Blue
#93C5FD
```

The visual hierarchy should be:

**navy background → blue character → light-blue highlights → restrained accent colors**

Do not make the terminal look like a generic neon cyberpunk theme.

The desired feeling is:

> **quiet space station / technical astronaut console**

rather than:

> gaming RGB / cyberpunk.

---

# 8. Pixel-Art Rules

All terminal graphics must follow these rules:

1. Pixel-art first.
2. No gradients inside sprites.
3. No anti-aliased edges.
4. Use a restricted palette.
5. Prefer 1–3 pixel details.
6. Keep silhouettes recognizable at very small sizes.
7. Use transparent backgrounds.
8. Avoid unnecessary animation frames.
9. Reuse sprites wherever possible.
10. Do not ship huge raster assets.

Target astronaut size:

```text
~16–32 terminal cells wide
~8–16 terminal rows high
```

The renderer should scale the same pixel art rather than generating large images.

---

# 9. Animation Design

Keep the animation engine event-driven.

Do not constantly perform expensive work.

Use:

```text
event
  ↓
state transition
  ↓
animation frame
  ↓
terminal redraw
```

Instead of:

```text
60 FPS
 ↓
recalculate everything
 ↓
redraw terminal
```

Recommended behavior:

```text
Idle:
    ~2–4 FPS

Thinking:
    ~4 FPS

Working:
    ~6–8 FPS

Short action animation:
    temporarily higher rate if required
```

When nothing changes, avoid redraws.

---

# 10. Claude Events

Implement only events that materially affect the animation.

Primary events:

```text
session.start
tool.call
ui.render
```

Use the same general event-driven approach demonstrated by `pixel-pet`.

The reference tracks tool calls, working state, subagents and UI rendering from its registration module. [GitHub](https://raw.githubusercontent.com/namenomeaning/pixel-pet/main/plugins/pixel-pet/hooks/register.tsx)

Map tools approximately:

```text
Read / Glob / Grep
    → telescope / scanner

Edit / Write / MultiEdit
    → astronaut typing

Bash
    → astronaut operating terminal

WebFetch / WebSearch
    → satellite / radar

Task / subagent
    → mini satellite

unknown tool
    → generic control panel
```

Do not expose complete tool arguments in the UI.

For example:

```text
❌ npm install some-private-package --token=...

✓ running command
```

Privacy should be a default design principle.

---

# 11. Claude HUD

Create a very small optional HUD.

Suggested:

```text
╭──────────────────────────────╮
│ FUEL ███████████░  82%       │
│ SIGNAL ██████████░  76%      │
╰──────────────────────────────╯
```

But keep this **optional**.

Default:

```text
HUD = off
```

The astronaut itself is the primary experience.

The reference's HUD is useful, but reproducing HP/MP/ST is unnecessary for the first version. `pixel-pet` exposes HUD and status-line settings through `userConfig`; use that concept but simplify it. [GitHub](https://raw.githubusercontent.com/namenomeaning/pixel-pet/main/plugins/pixel-pet/.claude-plugin/plugin.json)

---

# 12. Claude Configuration

Create a small configuration surface:

```json
{
  "speed": "normal",
  "sleepAfter": 120,
  "hud": false,
  "statusLine": true,
  "subagents": true,
  "scene": true
}
```

Suggested options:

| Setting | Default |
|---|---|
| Animation speed | `normal` |
| Sleep after | `120s` |
| Status line | `true` |
| HUD | `false` |
| Scene | `true` |
| Subagent satellites | `true` |

Keep configuration intentionally small.

---

# 13. Codex Implementation

Codex should use its **native custom terminal pet system**, not attempt to inject arbitrary React/TUI rendering.

Codex supports custom terminal pets under:

```text
$CODEX_HOME/pets/<pet-id>/
```

with:

```text
pet.json
spritesheet.webp
```

and supports `/pets` for selecting them. [ChatGPT Learn](https://learn.chatgpt.com/docs/pets?translationFallback=pt-BR\&utm_source=chatgpt.com)

The current custom pet contract supports:

```text
1536 × 1872
8 × 9
192 × 208 per frame
```

for V1, and:

```text
1536 × 2288
8 × 11
192 × 208 per frame
```

for V2. [GitHub](https://github.com/openai/codex/blob/main/codex-rs/tui/src/pets/model.rs?utm_source=chatgpt.com)

Prefer **V2** for the new implementation if the installed Codex version supports it.

Provide V1 fallback if practical.

---

# 14. Codex Pet

Create:

```text
codex/
└── pet/
    ├── pet.json
    ├── spritesheet.webp
    └── preview.png
```

Manifest:

```json
{
  "id": "astronaut-term",
  "displayName": "Astronaut Term",
  "description": "A tiny astronaut companion for your AI coding terminal.",
  "spriteVersionNumber": 2,
  "spritesheetPath": "spritesheet.webp"
}
```

The sprite atlas should contain the standard Codex animation states.

For V2:

```text
row 0   idle
row 1   running-right
row 2   running-left
row 3   waving
row 4   jumping
row 5   failed
row 6   waiting
row 7   running
row 8   review
row 9   look directions
row 10  look directions
```

Use transparent unused cells.

The Codex source currently validates the atlas dimensions and frame grid and supports custom manifests from `$CODEX_HOME/pets/<id>/pet.json`. [GitHub](https://github.com/openai/codex/blob/main/codex-rs/tui/src/pets/model.rs?utm_source=chatgpt.com)

---

# 15. Sprite Design

Create one coherent astronaut character rather than separate unrelated characters.

Character:

```text
     ___
   /     \
  |  • •  |
  |   ─   |
   \_____/
    /| |\
   / | | \
     / \
```

But convert this concept into actual pixel art.

Design characteristics:

- rounded helmet
- dark navy visor
- blue suit
- light-blue highlights
- small backpack
- tiny boots
- minimal facial detail
- recognizable silhouette at low resolution

Optional accessory:

```text
small moon badge
```

Do not use a large NASA-like logo or recognizable third-party branding.

---

# 16. Rocket / Moon Supporting Assets

Create:

```text
assets/
├── astronaut/
├── moon/
├── rocket/
├── satellite/
├── stars/
├── telescope/
└── terminal/
```

The rocket should be a **secondary motif**, not the main character.

Use it for:

- completion
- launch/start
- transition
- success
- occasional idle decoration

Moon:

- background/ground
- crater decoration
- sleep scene

Satellite:

- subagent representation

---

# 17. Shared Theme Definition

Create a shared theme definition such as:

```text
core/theme/astronaut-theme.json
```

Example:

```json
{
  "name": "astronaut-term",
  "palette": {
    "navy": "#07111F",
    "deepBlue": "#0B1730",
    "blue": "#2563EB",
    "lightBlue": "#93C5FD",
    "moon": "#94A3B8",
    "moonLight": "#CBD5E1"
  },
  "character": "astronaut",
  "scene": "moon",
  "accent": "rocket"
}
```

Both adapters should consume the same conceptual theme.

Do not make Claude and Codex use the exact same file format where their runtimes require different formats.

---

# 18. `npx` Installation

Provide a first-class npm installer:

```bash
npx ai-plugin-astronaut-term
```

The installer should:

1. Detect operating system.
2. Detect Claude Code.
3. Detect Codex.
4. Detect `$CODEX_HOME`.
5. Detect `$CLAUDE_CONFIG_DIR`.
6. Install the appropriate runtime assets.
7. Never overwrite unrelated user configuration without backup.
8. Print exactly what was changed.
9. Provide an uninstall command.

Example:

```text
Astronaut Term Installer

✓ Claude Code detected
✓ Codex detected

Installing Claude Code Mod...
✓ Installed

Installing Codex terminal pet...
✓ Installed to ~/.codex/pets/astronaut-term/

Done.

Claude Code:
  restart Claude Code or reload plugins

Codex:
  run /pets
  select "Astronaut Term"
```

---

# 19. Installation Safety

The installer must be conservative.

Before changing files:

```text
~/.claude/...
~/.codex/...
```

create backups where required.

Never blindly replace:

```text
~/.claude/settings.json
~/.codex/config.toml
```

Prefer:

- plugin installation
- isolated directories
- existing plugin mechanisms
- existing pet directories

For Codex, the custom pet should primarily be copied into:

```text
${CODEX_HOME:-$HOME/.codex}/pets/astronaut-term/
```

This matches the native Codex custom-pet model. [GitHub](https://github.com/openai/codex/blob/main/codex-rs/tui/src/pets/model.rs?utm_source=chatgpt.com)

---

# 20. `npx` Package Structure

Create:

```text
package.json
bin/install.js
```

Package configuration:

```json
{
  "name": "ai-plugin-astronaut-term",
  "version": "0.1.0",
  "description": "A lightweight pixel astronaut terminal companion for Claude Code and Codex.",
  "bin": {
    "astronaut-term": "./bin/install.js"
  }
}
```

Support:

```bash
npx ai-plugin-astronaut-term
```

and preferably:

```bash
npx ai-plugin-astronaut-term install
npx ai-plugin-astronaut-term uninstall
npx ai-plugin-astronaut-term doctor
```

---

# 21. Claude Installation Strategy

The installer should install/register the Claude plugin using Claude's supported plugin mechanism rather than attempting to modify Claude's executable.

The reference uses a Claude plugin marketplace/package structure with:

```text
.claude-plugin/plugin.json
hooks/hooks.json
hooks/register.tsx
```

and validates the plugin using:

```bash
claude plugin validate ...
claude plugin test ...
```

Follow the same validation model. [GitHub](https://github.com/namenomeaning/pixel-pet)

If local installation through `npx` requires a temporary/local plugin directory, document the mechanism clearly.

---

# 22. Codex Plugin Packaging

Also make the repository structurally compatible with the modern Codex plugin system where useful.

Codex plugins can contain:

```text
plugin.json
skills/
hooks/
assets/
```

and Codex can load plugin lifecycle hooks. [OpenAI Developers](https://developers.openai.com/plugins/concepts/plugins?utm_source=chatgpt.com)

However:

**Do not use the Codex plugin system as the rendering mechanism for the terminal pet.**

The terminal pet should remain a native Codex custom-pet package.

The plugin can optionally provide:

```text
skills/
    astronaut-term/
        SKILL.md
```

containing instructions for helping users install/configure the Astronaut Term environment.

---

# 23. Optional Codex Skill

Create:

```text
skills/astronaut-term/SKILL.md
```

Purpose:

Allow Codex to understand:

```text
"install astronaut term"
"change astronaut term"
"disable astronaut term"
"restore default Codex pet"
"create another astronaut sprite"
```

The skill should explain:

- where the pet lives
- how to validate it
- how to select it
- how to uninstall it

Do not make the skill necessary for the actual pet runtime.

---

# 24. Resource Budget

This is a major requirement.

Target:

```text
Installer:
    < 100 KB JS excluding npm metadata

Claude runtime:
    < 1 MB installed assets

Codex sprites:
    preferably < 1–2 MB

Runtime CPU:
    negligible while idle

Memory:
    ideally < 30 MB incremental

Network:
    zero runtime network requests
```

Do not introduce:

- Electron
- Tauri
- browser windows
- React runtime
- canvas rendering
- WebSocket servers
- background daemons
- polling processes

The Claude Mod should execute inside Claude Code.

The Codex version should use Codex's existing pet renderer.

This is substantially lighter than a standalone desktop pet architecture.

---

# 25. Privacy

The plugin must be local-first.

Runtime must make:

```text
NO network requests
NO telemetry
NO analytics
NO external API calls
```

Do not send:

- prompts
- source code
- file names
- shell commands
- project names

anywhere externally.

The reference `pixel-pet` similarly emphasizes that its mod makes no network requests and only uses local/session information required for rendering. [GitHub](https://github.com/namenomeaning/pixel-pet)

---

# 26. Status Text

Keep status text short.

Examples:

```text
◈ thinking...
◈ scanning...
◈ editing...
◈ executing...
◈ contacting mission control...
◈ waiting...
◈ mission complete
```

Avoid:

```text
Running `npm install @company/private-package --registry=...`
```

Default to generic descriptions.

Add an opt-in setting if detailed targets are eventually desired.

---

# 27. Animation State Machine

Implement a small shared conceptual state machine:

```text
IDLE
  ↓
THINKING
  ↓
WORKING
  ├── READING
  ├── EDITING
  ├── TERMINAL
  ├── SEARCHING
  └── SUBAGENT
  ↓
WAITING
  ↓
SUCCESS / FAILURE
  ↓
IDLE
```

The renderer should never need to understand Claude-specific or Codex-specific events.

Adapters translate:

```text
Claude/Codex event
       ↓
shared astronaut state
       ↓
visual state
```

---

# 28. Testing

Create tests for:

### Core

```text
theme parsing
palette validation
animation state transitions
sprite validation
```

### Claude

```text
plugin validation
hook registration
tool event handling
rendering fallback
configuration
```

Use:

```bash
claude plugin validate claude --strict
claude plugin test claude
```

following the reference repository's validation workflow. [GitHub](https://github.com/namenomeaning/pixel-pet)

### Codex

Validate:

```text
pet.json
spritesheet dimensions
frame count
animation rows
transparent background
```

Test:

```text
CODEX_HOME=/tmp/test-codex
```

with an isolated custom pet directory.

---

# 29. Visual QA

Create a preview tool:

```bash
npm run preview
```

It should generate:

```text
preview/
├── idle.png
├── thinking.png
├── running.png
├── waiting.png
├── failed.png
├── jumping.png
└── spritesheet.png
```

Also create:

```bash
npm run demo
```

to produce a short GIF or MP4 showing:

```text
idle
→ thinking
→ working
→ success
→ idle
```

The visual preview should be usable when developing the sprite without launching Claude or Codex.

---

# 30. README

README should start with:

```text
# Astronaut Term

A tiny pixel astronaut for your AI coding terminal.

Works with:
• Claude Code
• OpenAI Codex
```

Then show:

```text
Claude Code      → Astronaut Mod
Codex            → Astronaut Pet
```

Installation:

```bash
npx ai-plugin-astronaut-term
```

Selection:

```text
Claude Code:
    reload/restart Claude Code

Codex:
    /pets
```

Keep README visual and concise.

---

# 31. Implementation Phases

## Phase 1 — Core visual system

Build:

- palette
- astronaut sprite
- moon
- rocket
- satellite
- basic animations
- shared theme definition

Deliverable:

```text
static astronaut + animated preview
```

---

## Phase 2 — Codex Pet

Build:

- V2 spritesheet
- `pet.json`
- validation
- local installation
- `/pets` selection

Deliverable:

```text
Codex
→ /pets
→ Astronaut Term
→ working animated astronaut
```

---

## Phase 3 — Claude Code Mod

Build:

- `.claude-plugin/plugin.json`
- hooks
- renderer
- animation state machine
- tool mapping
- status line
- optional moon scene

Deliverable:

```text
Claude Code
→ astronaut appears above prompt
→ reacts to tools
```

---

## Phase 4 — `npx` Installer

Build:

```bash
npx ai-plugin-astronaut-term
```

Support:

```bash
npx ai-plugin-astronaut-term install
npx ai-plugin-astronaut-term uninstall
npx ai-plugin-astronaut-term doctor
```

---

## Phase 5 — Polish

Add:

- reduced-motion mode
- configuration
- better idle animations
- subagent satellites
- rocket completion animation
- moon sleeping scene
- README screenshots/GIF
- CI
- release packaging

---

# 32. Non-Goals

Do **not** implement in v1:

- desktop floating pet
- Electron/Tauri app
- sound effects
- AI-generated dialogue
- LLM calls
- telemetry
- remote configuration
- complex game mechanics
- XP/level system
- hunger system
- cloud synchronization
- elaborate HUD
- heavy animation engine

The product should feel like a **small terminal companion**, not another application running beside the terminal.

---

# 33. Acceptance Criteria

The implementation is complete when all of the following are true:

### Claude Code

- [ ] Claude Code plugin installs successfully.
- [ ] Astronaut appears above the prompt.
- [ ] Astronaut is pixel-art.
- [ ] Moon/space visual theme is visible.
- [ ] Colors are blue/deep-blue/navy.
- [ ] Astronaut reacts to thinking.
- [ ] Astronaut reacts to tools.
- [ ] Astronaut reacts to completion.
- [ ] Astronaut reacts to failures.
- [ ] Subagents can optionally appear as satellites.
- [ ] No external network calls.
- [ ] CPU usage remains negligible while idle.

### Codex

- [ ] Custom pet is recognized by Codex.
- [ ] `/pets` can select Astronaut Term.
- [ ] Animation works in supported terminals.
- [ ] V2 sprite contract is valid.
- [ ] Sprite package is small.
- [ ] No background daemon is required.

### Installer

- [ ] `npx ai-plugin-astronaut-term` works.
- [ ] Detects Claude Code.
- [ ] Detects Codex.
- [ ] Installs the correct adapter.
- [ ] Does not destroy existing configuration.
- [ ] Supports uninstall.
- [ ] Supports doctor/diagnostics.

### Design

- [ ] Astronaut is recognizable at small size.
- [ ] Moon is recognizable.
- [ ] Rocket is recognizable.
- [ ] Visual language is consistent.
- [ ] Palette is limited.
- [ ] No unnecessary neon/cyberpunk styling.
- [ ] Overall appearance feels like a technical space mission console.

---

# 34. Critical Implementation Principle

Do **not** simply clone `pixel-pet` and replace the slime with an astronaut.

Instead:

```text
pixel-pet architecture
        +
Codex native pet format
        +
your own astronaut visual system
        +
lightweight shared theme
        =
ai-plugin-astronaut-term
```

The reference repository is the **engineering pattern**, not the product design.

Claude Code should behave like a lightweight Mod inspired by `pixel-pet`, while Codex should use its native custom-pet mechanism. This gives the project the best compatibility with both platforms without introducing a heavyweight third-party renderer. [GitHub](https://github.com/namenomeaning/pixel-pet)

# 35. First Task for the Coding Agent

Start by implementing **Phase 1 only**.

Before writing the Claude Mod or installer:

1. Create the repository structure.
2. Define the shared palette.
3. Create the astronaut pixel character.
4. Create idle/thinking/running/waiting/failed/jumping frames.
5. Create moon, rocket and satellite assets.
6. Build the Codex-compatible V2 spritesheet.
7. Validate the spritesheet.
8. Generate a visual preview.
9. Do not proceed to Phase 2 until the visual identity is coherent.

The astronaut should be the **hero of the entire system**. Everything else — moon, rocket, satellite, colors and UI — should support that character.
```

### My recommendation

The key correction versus the initial requirement is **not to build one generic “terminal UI plugin” and hope both products render it**. Claude Code and Codex now have different extension surfaces: Claude Mods can directly render terminal UI, while Codex has a native custom-pet system and plugin/hooks architecture. Codex also supports custom terminal pets through `/pets` and `$CODEX_HOME/pets`, making that the cleanest path for the Codex side. :chatgpt-content-reference{index="14"}

That separation will keep `ai-plugin-astronaut-term` **small, maintainable, and much less fragile against either tool changing its TUI internals**.