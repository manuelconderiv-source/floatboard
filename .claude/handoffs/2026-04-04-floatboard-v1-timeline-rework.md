# Handoff: Floatboard v1 — Timeline Schedule Card Rework

**Created:** 2026-04-04
**Project:** C:\Users\Malco\floatboard
**Branch:** main
**Last commit:** dd32232 (fix: increase icon to 512x512 for macOS requirement)
**Note:** There are uncommitted changes — all the work from this session.

---

## Current State Summary

Floatboard v1.0.0 is shipped on GitHub (manuelconderiv-source/floatboard) and itch.io. Windows installer + portable + macOS DMG all built via GitHub Actions.

This session added several premium features (gated behind Ctrl+Shift+P dev toggle):
- **Themes** (Glass, Neumorphism) — fully working, polished
- **Claude Usage card** — reads JSONL logs, shows progress bar
- **Schedule card** — PARTIALLY COMPLETE, currently being reworked into a visual timeline

The schedule card rework is **in progress**. The old flat-list schedule code still exists in the file. The plan is approved but CSS replacement hasn't been applied yet due to a text-matching issue with the Edit tool (large block replacement).

---

## What Was Accomplished This Session

1. ✅ Toolbar spacing adjustments (more tools button closer to +)
2. ✅ Collapse/expand icon for toolbar
3. ✅ + button color change (indigo #6366f1)
4. ✅ Electron-builder setup (Windows NSIS + portable + macOS DMG)
5. ✅ File-based persistence (~/.floatboard-data.json via IPC)
6. ✅ GPU cache error suppression
7. ✅ Window edge resize prevention (12px edge buffer in renderer)
8. ✅ Group header clipping fix (clamps frame position)
9. ✅ Mac compatibility in main.js (platform guards)
10. ✅ Tray icon uses real icon.png
11. ✅ Version label (v1.0.0)
12. ✅ package.json with Mac build target
13. ✅ LICENSE, README, CHANGELOG
14. ✅ Git repo + GitHub Actions CI/CD (release.yml)
15. ✅ GitHub release published (v1.0.0)
16. ✅ Premium toggle (Ctrl+Shift+P) with toast notification
17. ✅ Theme system (Default, Glass, Neumorphism) with PRO badges
18. ✅ Neumorphism: dark shadow only on canvas, full neumorphic inside groups (.in-group class)
19. ✅ Glass: heavy blur (40px), text shadows for contrast
20. ✅ Claude Usage card (JSONL parsing, progress bar, plan selector)
21. ✅ Schedule card v1 (flat list, paste parser, sections, checkmarks, completed accordion)
22. ✅ Display change handler (anchorToPrimary on display-added/removed/metrics-changed)
23. 🔄 Schedule card v2 — VISUAL TIMELINE REWORK (plan approved, implementation started)

---

## Immediate Next Steps (Timeline Rework)

### The approved plan is at:
`C:\Users\Malco\.claude\plans\tender-frolicking-badger.md`

### What needs to happen:

**Step 1: Replace schedule CSS (lines ~355-500)**
- Remove all `.schedule-list`, `.schedule-item`, `.schedule-time`, `.schedule-text`, `.schedule-section` classes
- Keep: `.schedule-check`, `.schedule-celebrate`, `.schedule-completed-*`, `.schedule-fmt-toggle`
- Add new `.tl-*` classes (timeline container, gutter, hour labels, track, blocks, drag ghost, gap dividers)
- Add neumorphism + glass overrides for `.tl-*`
- **NOTE:** The Edit tool failed on a large replacement. Try using Write to rewrite the CSS section, or break into smaller edits.

**Step 2: Add `--accent-rgb` CSS variable to buildCard**
- In `buildCard` function (~line 2141), after `el.style.cssText` is set, add:
  `el.style.setProperty('--accent-rgb', hexToRgbStr(data.accent));`
- `hexToRgbStr` already exists at ~line 1739

**Step 3: Add `computeVisibleRanges()` function**
- Insert before `buildScheduleBody` (~line 2635)
- Algorithm: collect task intervals, merge into clusters (gap ≤ 2hrs), pad ±1hr, compute y-offsets with 20px gap dividers between clusters

**Step 4: Rewrite `buildScheduleBody` (~lines 2635-2890)**
- Replace entire function with timeline version
- DOM structure: `.tl-body` > `.tl-toolbar` > `.tl-container` > `.tl-gutter` + `.tl-track` + blocks
- Each task = absolutely positioned `.tl-block` with top/height based on time/duration
- Drag-to-reschedule: mousedown/mousemove/mouseup, snap to 15min
- Resize-duration: bottom 6px handle, snap to 15min, clamp [15, 480]
- Paste: parse with existing `parseScheduleText`, infer duration from time gaps
- Completed accordion at bottom

**Step 5: Data migration**
- Items need `duration` field (default 60 minutes)
- `type: 'section'` items should be filtered out (timeline auto-generates time axis)
- Card needs `pxPerHour` field (default 60)

---

## Critical Files

| File | What's There |
|------|-------------|
| `floatboard.html` | Everything — CSS, HTML, JS (~4200 lines, single file) |
| `main.js` | Electron main process — window, tray, IPC handlers, display anchoring |
| `preload.js` | IPC bridge — saveData, loadData, readClaudeUsage |
| `package.json` | Build config — electron-builder for Win + Mac |
| `.github/workflows/release.yml` | CI/CD — tag push triggers builds |

### Key line ranges in floatboard.html:
- **Schedule CSS:** ~lines 355-500 (TO BE REPLACED)
- **Helper functions:** ~lines 2547-2633 (normalizeTime, parseScheduleLine, parseScheduleText, formatTime, getTimeSection — KEEP AS-IS)
- **buildScheduleBody:** ~lines 2635-2890 (TO BE REWRITTEN)
- **buildCard:** ~line 2141 (ADD --accent-rgb)
- **hexToRgbStr:** ~line 1739 (EXISTS, reuse)

---

## Key Patterns & Decisions

- **Premium toggle:** `premiumMode` boolean, toggled by Ctrl+Shift+P, stored in localStorage ('floatboard_premium'). Premium features check this before rendering.
- **Theme system:** `body[data-theme="glass"]` / `body[data-theme="neumorphism"]` — CSS overrides only. `currentTheme` variable, persisted in save data.
- **Card `.in-group` class:** Added when card joins a group, removed when leaves. Used by neumorphism theme to apply full dual-shadow inside group frames.
- **Save pattern:** `save()` for immediate, `scheduleSave()` for 150ms debounce on text input.
- **Block positioning math:** `top = (startMin - rangeStartMin) * pxPerMin`, `height = duration * pxPerMin`
- **Smart collapse:** Merge task clusters (gap ≤ 2hrs), pad ±1hr, compressed "···" dividers between.

---

## Potential Gotchas

1. **Edit tool large replacements** — Failed when trying to replace ~145 lines of CSS. Use Write tool to rewrite the full section, or break into smaller targeted edits.
2. **Window edge resize** — Partially fixed via renderer-side 12px edge buffer. The `thickFrame: false` + `hookWindowMessage` approach didn't fully work on Windows. The renderer fix is the reliable one.
3. **Paste in Electron** — `clipboardData.getData('text/plain')` works, but may need `getData('Text')` fallback on some systems. Always try multiple formats.
4. **The `.claude` folder inside the floatboard project** has a `handoffs/` dir now — make sure `.gitignore` covers it.
5. **Display anchoring** — `screen.on()` events must be inside `app.whenReady()` — crashes otherwise.

---

## User Context

- **Manuel Conde** (manuelconderiv-source on GitHub)
- Indie dev, new to Git/CI — needs step-by-step guidance for git/release operations
- Tests via `npm start`, batch rebuilds only when ready to ship
- Has Windows 11, no Mac (friend tests Mac builds)
- Ko-fi: ko-fi.com/manuelconde
- Business model: Free v1 with Ko-fi tips, paid v2 one-time purchase for premium features
