# GoGaze Client UI Revamp — Design Spec

## Overview

Full UI overhaul of the GoGaze Next.js frontend. Replace the current purple/slate gradient theme with a neutral charcoal dark theme using blue accents. Restyle all pages using shadcn/ui components with a centralized CSS variable-based color system. No light mode toggle — single dark theme.

## Approach

Extend the existing shadcn setup (10 components already installed). Add missing components (tooltip, dropdown-menu, skeleton, progress). Define the full theme via CSS variables in `globals.css`. Restyle every page in place.

---

## 1. Theme & Color System

All colors defined as CSS variables in `globals.css`. Every shadcn component consumes these automatically.

### Core Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--background` | `#0f1117` | Page background (near-black charcoal) |
| `--foreground` | `#f0f0f3` | Primary text |
| `--card` | `#161922` | Card/surface backgrounds |
| `--card-foreground` | `#f0f0f3` | Card text |
| `--muted` | `#1e2130` | Subtle backgrounds (hover states, inactive areas) |
| `--muted-foreground` | `#8b8fa3` | Secondary/dimmed text |
| `--border` | `#262a3a` | Borders — subtle, low-contrast |
| `--input` | `#262a3a` | Input borders |
| `--ring` | `#3b82f6` | Focus rings (blue-500) |
| `--primary` | `#3b82f6` | Primary buttons/actions (blue-500) |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#1e2130` | Secondary buttons |
| `--secondary-foreground` | `#f0f0f3` | Text on secondary |
| `--accent` | `#1e2130` | Accent backgrounds |
| `--accent-foreground` | `#f0f0f3` | Accent text |
| `--destructive` | `#ef4444` | Delete/error actions (red-500) |
| `--destructive-foreground` | `#ffffff` | Text on destructive |
| `--popover` | `#161922` | Dropdown/tooltip backgrounds |
| `--popover-foreground` | `#f0f0f3` | Dropdown/tooltip text |

### Sidebar Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-background` | `#0c0e14` | Slightly darker than page bg |
| `--sidebar-foreground` | `#8b8fa3` | Nav item text (muted) |
| `--sidebar-accent` | `#1a1d2b` | Hovered/active nav item bg |
| `--sidebar-accent-foreground` | `#f0f0f3` | Active nav item text |
| `--sidebar-border` | `#1e2130` | Sidebar right border |

### Radius

`--radius: 0.5rem` (8px) — consistent border radius for all components.

### No Purple

Zero purple anywhere. All accent interactions use `--primary` (blue-500). Status colors remain semantic: red for destructive, green for success, yellow for warnings.

---

## 2. Sidebar — Collapsible

### Structure

- **Expanded:** 256px wide, icon + label for each nav item
- **Collapsed:** 64px wide, icon only with tooltips on hover
- **Toggle:** Chevron button at the bottom of the sidebar, flips direction based on state
- **Persistence:** Collapse state stored in localStorage

### Content (Top to Bottom)

1. **Logo** — "GoGaze" text when expanded, "G" monogram when collapsed
2. **Separator**
3. **Nav items** — Dashboard, Upload, Gallery, Settings. Each has an icon + label. Active item: `sidebar-accent` bg + `sidebar-accent-foreground` text + 3px left blue border indicator
4. **Flex spacer**
5. **User section** — Avatar + display name when expanded, avatar only when collapsed. Click opens a dropdown-menu with: Settings, Logout
6. **Collapse toggle button**

### Animation

`transition-all duration-200` on sidebar width. Main content area adjusts via flex layout.

### New Components

- `tooltip` — collapsed nav item labels on hover
- `dropdown-menu` — user menu

---

## 3. Dashboard Page — Content-First

### Layout (Top to Bottom)

1. **Header bar** — single row:
   - Left: Page title "Dashboard"
   - Right: Compact stat pills inline — `12 uploads · 8 videos · 4 images`. Counts in bold white, labels in muted text. No big stat cards.

2. **Quick actions row** — Two compact buttons:
   - "Upload New" — primary blue button
   - "Browse Gallery" — secondary/outline button

3. **Recent uploads grid** — Main content. Responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`):
   - Each card: thumbnail (aspect-video), small play icon overlay for videos, duration badge
   - Below thumbnail: filename (truncated), file type badge, upload date in muted text
   - Hover: subtle scale + blue border highlight
   - Skeleton loading states while data loads

4. **Empty state** — Centered: upload icon, "No media yet" heading, "Upload your first file" subtext, Upload button

### New Components

- `skeleton` — loading placeholders

---

## 4. Gallery Page — Grid with Preview Panel

### Two-Panel Layout

- **Left:** File grid/list (flex-1, shrinks when panel is open)
- **Right:** Fixed preview panel (400px width) that appears when a file is selected

### Grid Area (Left Side)

**Top bar:**
- Search input (left)
- Filter tabs: All / Videos / Images (center)
- Grid/list view toggle (right)

**Grid view:** Responsive columns. When preview panel is open, grid loses one column (e.g., 4 → 3). Selected file has a blue ring border.

**List view:** Table-like rows: thumbnail (small), filename, type badge, size, date, action buttons (play, stop, delete).

### Preview Panel (Right Side)

**Appears on file click, slides in from right.**

- **Close button** (X) top-right corner
- **Media preview:** Video player for videos, full image display for images (within scroll-area)
- **File details section:** Filename, type, size, upload date, dimensions or duration
- **Actions:** "Play on Device", "Stop", "Open Original", "Delete" — stacked vertically as full-width buttons

**Behavior:**
- Click file → opens panel with that file's details
- Click same file or X → closes panel
- Click different file → swaps preview content
- ESC key → closes panel
- Animation: `transition-all duration-200` slide-in

### No New Components

Uses existing primitives: button, badge, separator, scroll-area, tabs.

---

## 5. Login Page — Minimal Centered Card

- **Background:** Plain `--background` color (#0f1117), no gradients
- **Card:** Centered, `max-w-sm`, uses `--card` background
- **Above card:** "GoGaze" logo/text
- **Card content:**
  - Email input with label
  - Password input with label
  - "Sign In" button — full width, primary blue
  - Divider with "or" text
  - "Sign in with Google" button — outline style, Google icon
  - "Don't have an account? Sign Up" link below
- **Sign Up mode:** Same card, extra "Confirm Password" field, button changes to "Create Account"
- **Error display:** Subtle red banner inside the card below the form
- **No decorative elements**

---

## 6. Upload Page — Restyled

- **Page header:** "Upload Media" title, same header pattern as dashboard
- **Drag-and-drop zone:**
  - Default: dashed `--border` color border, centered upload-cloud icon + "Drag & drop or click to browse" text
  - Drag-over: border turns blue (`--primary`), subtle blue tint background (`primary/10`)
  - Inside a card surface
- **File selected state:**
  - Thumbnail preview, filename, file size
  - "Remove" button (ghost/destructive)
- **Upload action:**
  - "Upload" button — primary blue
  - Progress bar below using shadcn `progress` component, blue fill
  - Upload percentage text
- **Post-upload:** Success or error inline message

### New Components

- `progress` — upload progress bar

---

## 7. Settings Page — Restyled

- **Page header:** "Settings" title
- **Vertical stack of cards:**
  1. **Profile card:** Avatar (large), display name, email — all read-only display
  2. **Change Password card:** Current password, new password, confirm password inputs. "Update Password" button (primary)
  3. **Danger Zone card:** Subtle red-tinted border or header. "Sign Out" button (destructive variant)
- **Consistent spacing** between cards (gap-6)

---

## 8. Components to Add via shadcn CLI

```
npx shadcn@latest add tooltip
npx shadcn@latest add dropdown-menu
npx shadcn@latest add skeleton
npx shadcn@latest add progress
```

## 9. Files to Modify

| File | Changes |
|------|---------|
| `src/app/globals.css` | Replace CSS variables with new charcoal/blue theme |
| `components/DashboardLayout.tsx` | Full rewrite — collapsible sidebar, new nav styling, user dropdown |
| `src/app/dashboard/page.tsx` | Rewrite — content-first layout with stat pills and thumbnail grid |
| `src/app/login/page.tsx` | Restyle — minimal centered card, remove gradients |
| `src/app/gallery/page.tsx` | Add preview panel data handling |
| `src/app/gallery/GalleryClient.tsx` | Rewrite — two-panel layout with preview panel |
| `src/app/upload/page.tsx` | Restyle — new theme colors, add progress component |
| `src/app/settings/page.tsx` | Restyle — card-based sections |
| `components/ui/*.tsx` | May need minor tweaks if hardcoded colors exist |

## 10. Components to Create

| Component | Purpose |
|-----------|---------|
| `components/Sidebar.tsx` | Collapsible sidebar with nav, user menu, toggle |
| `components/SidebarContext.tsx` | React context for sidebar collapsed state + localStorage persistence |
| `components/MediaPreviewPanel.tsx` | Gallery preview panel for selected file |

## 11. What Does NOT Change

- Authentication flow (Firebase, AuthGuard, AuthContext, middleware)
- API layer (lib/api.ts, lib/server-api.ts, src/app/api/ routes)
- Data fetching logic
- File upload logic (XMLHttpRequest with progress)
- WebSocket integration
- Next.js config, PostCSS config
- Package versions (Next.js 15, React 19, Tailwind v4)
