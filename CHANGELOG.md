# Changelog

## v1.2.0 — 2026-04-18

First public Pro release. Five themes, real license activation, major timeline rework.

### New

- **Floatboard Pro** — $4.99 one-time license unlocks all premium features (Gumroad-backed)
- **Five themes** — Default (minimal monochrome), Warm (gold earth tones), Cold (teal), Glass (frosted blur with OS acrylic on Win 11), Neumorphism (soft cream)
- **Block-with-subtasks schedule format** — paste AI-generated day plans with time ranges + nested tasks and they render as stacked subtask blocks
- **Cascading schedule layout** — dense time clusters auto-flow; time gaps render as real empty space
- **Live resize preview** — dragging a block's bottom edge shows a dashed duration marker and pushes follower blocks in real time
- **Sticky input toolbar** on schedule cards so you can keep adding tasks when scrolled deep
- **Themed splash screen** — pulsating logo with expanding ripples matching your last-used theme
- **Floating success toast** anchored to the triggering action (e.g. license activation confirmation pops above the Activate button)
- **Alt+drag** a card to duplicate it while dragging (Figma convention)
- **Multi-line paste** on todo cards — paste a checklist with `[ ]` / `[x]` / bullets and each line becomes a separate item
- **Settings → License section** — status, masked key, email, sign out
- **Settings → About section** — version, keyboard shortcuts reference, changelog, support link
- **Screenshot studio** (dev only) — one-shortcut mock board + batch capture across all themes and UI states

### Improved

- Per-theme picker icon colors (warm tones in Warm, cool tones in Cold, etc.)
- Every card body capped at 80vh with smooth internal scroll + top/bottom fade overlays
- Contrast bumped across all themes (hour labels, empty states, settings labels, version text)
- 12h / 24h toggle now styled per theme
- Usage card prompts you to pick Pro / Max 5× / Max 20× plan on first open
- Subtask blocks auto-expand to fit all content
- Picker icons are monotone in Default theme for minimal feel
- New logo integrated across tray, taskbar, pill, splash

### Fixed

- Scroll on tall schedule cards (a `.card .card-body { overflow: hidden }` rule was overriding scroll)
- Subtask content no longer clips inside short blocks
- Glass theme renders proper frosted backdrop (was showing nearly solid)
- Settings panel closes on outside click when open
- `+` button now closes settings before opening the picker
- Pin icon visibility in neumorphism (was white on cream)
- License activation now clears any stale dev override so the license takes effect immediately

### Dev

- Single-instance lock — `npm start` reloads existing window instead of stacking
- CLI `--dev` flag gates all dev shortcuts so shipped installers are tamper-proof
- Dev cheat-sheet badge at top-center of screen in dev mode only

## v1.1.0 — 2026-04-07

### Premium Features
- Themes: Glass (frosted blur) and Neumorphism (soft embossed)
- Pomodoro timer card with work/break cycles
- Stopwatch card with lap tracking
- Countdown card with date target and progress bar
- Habit tracker card with 7-day grid and streaks
- Schedule timeline card (paste from Claude)
- Claude Code usage tracker card
- 3 save slots (board switcher)
- Card opacity slider
- Custom accent colors (color picker)
- Card templates (save/load board layouts)
- Export board as image

### New Features (Free)
- Settings gear button with themed panel
- Categorized card picker (Essentials, Time, Tracking)
- Favorites system for card types (right-click to pin)
- Collect cards with directional alignment (left, right, top, bottom)
- Group lock (prevents moving group and members)
- Minimize to pill bar with suction animation
- Themed confirmation dialogs (replaces browser alerts)
- Clear all cards option

### Improvements
- Micro-interactions: card spawn/delete animations, checkbox bounce, toast slide-in, button press feedback, context menu pop-in, add button pulse
- Accessibility: ARIA labels, focus-visible styles, keyboard navigation, contrast improvements
- Group frame click-through fix (cards inside groups fully interactive)
- Group frame syncs instantly during drag and card resize
- Window stays on primary screen when displays change
- Empty canvas for new users (no default cards)
- GPU cache error suppression
- Better performance with targeted will-change hints

## v1.0.0 — 2026-04-03

Initial release.

- Note, todo, and image cards
- Drag, resize, and free placement
- Magnetic snap and card grouping
- Always-on-top with pin/unpin toggle
- Minimize cards to header-only
- Lock cards to prevent accidental moves
- Click-through transparent canvas
- Undo support (up to 50 steps)
- Floating format toolbar for text notes
- Context menus for cards, groups, and canvas
- Export/import board as JSON
- Auto-save to disk
- System tray with show/hide/quit
- Global shortcut: Ctrl+Shift+F (Cmd+Shift+F on Mac)
- Windows installer + portable exe
- macOS DMG (Intel + Apple Silicon)
