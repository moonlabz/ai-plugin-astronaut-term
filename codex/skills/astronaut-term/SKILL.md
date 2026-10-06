---
name: astronaut-term
description: Use when someone asks to install, configure, disable, restore, validate, or make a sprite for the Astronaut Term Codex pet.
---

# Astronaut Term for Codex

Use the native Codex pet package; the plugin does not render the pet.

## Install or select

1. Install the package with `npx ai-plugin-astronaut-term install`.
2. The installer places the pet under `${CODEX_HOME:-$HOME/.codex}/pets/astronaut-term`.
3. In Codex, run `/pets` and select **Astronaut Term**.

The `codex/pet-v1` atlas targets the Codex CLI's 8×9, 192×208-frame reader. `codex/pet` contains the 8×11 V2 package for hosts that support that contract. The installer uses V1 unless a future Codex version advertises V2 support.

## Change, disable, or restore

- To change the sprite, edit the source under `codex/pet-v1` or `codex/pet`, then run `python3 tools/build_preview.py` to regenerate the atlas.
- To disable the pet, run `/pets` and choose the default pet.
- To remove the installed files, run `npx ai-plugin-astronaut-term uninstall`. The installer only removes a package whose manifest identifies it as Astronaut Term.
- To check paths and manifests, run `npx ai-plugin-astronaut-term doctor`.

Keep sprite cells transparent outside the astronaut. The V1 sheet is 1536×1872; the V2 sheet is 1536×2288. Both use 192×208 cells across eight columns.
