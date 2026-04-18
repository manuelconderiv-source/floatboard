# Floatboard

A floating desktop workspace for the cards you need at a glance — todos, notes, timers, schedules, and habits. Always on top, click-through where you want it, invisible where you don't.

Floatboard sits on top of your apps as a transparent layer with draggable cards. Never switch windows to check a quick note or tick off a task.

## Themes

Five themes ship with Floatboard — pick the one that suits your desktop:

| Theme | Vibe |
|---|---|
| **Default** | Minimal monochrome — readability first |
| **Warm** | Brand-forward gold + earth tones |
| **Cold** | Cool teals and slate |
| **Glass** | Frosted acrylic blur of your desktop |
| **Neumorphism** | Soft cream UI with pressed/embossed depth |

## Free version

- **Todo cards** — checklists with drag-to-reorder items
- **Text cards** — quick notes with inline formatting
- **Image cards** — drop in references, screenshots, mockups (paste with `Ctrl+V`)
- **Drag, resize, snap** — arrange cards freely; they snap together when close
- **Card grouping** — drag cards near each other to form groups with shared headers
- **Minimize & lock** — collapse cards to headers or lock them in place
- **Click-through canvas** — empty space passes clicks to the app below
- **Auto-save** — your board is saved automatically and restored on launch
- **System tray** — runs quietly in the tray; right-click to show, hide, or quit
- **Global show/hide** — `Ctrl+Shift+F` (Cmd+Shift+F on Mac) from anywhere

## Floatboard Pro — $4.99 one-time

Unlock the full set of productivity cards and themes:

- 🍅 **Pomodoro** timer with work/break cycles and session tracking
- ⏱ **Stopwatch** with lap support
- ⏳ **Countdown** to any date with progress bar
- 📅 **Schedule timeline** — paste block-format schedules from AI with subtasks, live resize, cascading layout
- ✅ **Habit tracker** — daily check-ins with 7-day history grid
- 📊 **Claude usage tracker** — live token consumption from `~/.claude/projects`
- 🎨 All 5 themes (free version has Default only)
- 💾 3 save slots — switch between work / personal / project boards
- 🖼 Export board as PNG
- 📋 Board templates — save and reload layouts
- 🎛 Per-card opacity and custom accent colors

One-time purchase. Lifetime updates. No subscription.

**[Buy on Gumroad →](https://conderiv.gumroad.com/l/yejuk)**

## Download

- [GitHub Releases](https://github.com/manuelconde/floatboard/releases) — Windows `.exe` + macOS `.dmg`
- [itch.io](https://manuelconde.itch.io/floatboard) — free download (community tipping optional)

## System Requirements

- **Windows** 10 or later (x64)
- **macOS** 10.13 or later (Intel and Apple Silicon)

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl+Shift+F` / `Cmd+Shift+F` | Toggle show/hide (global) |
| `Ctrl+Z` | Undo |
| `Delete` / `Backspace` | Remove selected card |
| Right-click card | Context menu (color, lock, opacity, duplicate) |
| Right-click canvas | Export / Import board |
| Double-click card title | Rename card |
| `Ctrl+V` on image card | Paste image from clipboard |
| `Ctrl+V` on schedule card | Paste multi-line schedule |

Full reference in-app: Settings → Keyboard shortcuts.

## Screenshots

_See [itch.io](https://manuelconde.itch.io/floatboard) or the [Gumroad page](https://conderiv.gumroad.com/l/yejuk) for the latest screenshots across all themes._

## Support & Community

- 🐛 [Report a bug](https://github.com/manuelconde/floatboard/issues)
- 💡 [Request a feature](https://github.com/manuelconde/floatboard/discussions)
- ☕ [Buy me a coffee on Ko-fi](https://ko-fi.com/manuelconde)

## Development

```sh
npm install
npm start          # runs with --dev flag (enables dev shortcuts)
npm run start:prod # runs as production (no dev shortcuts)
npm run build      # builds installers for current platform
npm run build:win  # Windows .exe + portable
npm run build:mac  # macOS .dmg
```

## License

Copyright © 2026 Manuel Conde. All rights reserved.
Free version is free for personal use. Pro features require a valid license key.
See [LICENSE](LICENSE) for details.
