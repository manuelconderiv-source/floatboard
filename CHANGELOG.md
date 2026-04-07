# Changelog

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
