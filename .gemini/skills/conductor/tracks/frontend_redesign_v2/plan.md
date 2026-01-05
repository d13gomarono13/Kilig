# Frontend Redesign V2 (Tailwind v4 + RetroUI Integration)

## Objective
Upgrade the frontend to Tailwind CSS v4, integrate the RetroUI component library, and enhance the Neo-Brutalist design system (PxBorder, FocusRing, etc.).

## Context
- **Current State:** Vite + React + TS, Tailwind v4, RetroUI Components ported.
- **Goal:** Full page enhancement and final design polish.
- **References:** RetroUI (Core library reference for UI components).

## Phases

### Phase 1: Tailwind v4 Migration
- [x] **Install Tailwind v4**: Add `tailwindcss` (v4) and `@tailwindcss/vite` plugin to `web/package.json`.
- [x] **Update Vite Config**: Modify `web/vite.config.ts` to use the Tailwind v4 plugin.
- [x] **Migrate CSS**: Update `web/src/index.css`:
    - Replace `@tailwind` directives with `@import "tailwindcss"`.
    - Convert theme tokens to `@theme` format.
    - Implement custom utilities using `@utility`.
- [x] **Preserve Design Tokens**: Ensure Neo colors, Shadow system (hard drops), Fonts (Space Grotesk/Mono), and Border radius are maintained.

### Phase 2: RetroUI Component Integration
- [x] **Setup Directory**: Create `web/src/components/retroui`.
- [x] **Port Components**: Copy and adapt the following from `RetroUI/components/retroui`:
    - [x] `Button`
    - [x] `Card`
    - [x] `Input`
    - [x] `Badge`
    - [x] `Checkbox`, `Radio`, `Select`, `Switch`, `Tabs`
    - [x] `Charts` (Area, Bar, Line, Pie)
    - [x] `Text`

### Phase 3: Component Enhancements
- [x] **Create Utility Components** in `web/src/components/ui` (or shared):
    - [x] `PxBorder`: Pixel-perfect borders (configurable width, radius).
    - [x] `FocusRing`: Keyboard focus indicator matching border style.
- [x] **Background Utilities**: Add `cube-bg` and `diamond-bg` patterns to CSS/utilities.
- [x] **Enhance Button**:
    - Integrated `PxBorder` and `FocusRing` in `web/src/components/ui/button.tsx`.
    - Added 3D shadow hover effects.

### Phase 4: Style System Updates
- [x] **Refine Color Palette**:
    - Primary: `oklch(46.36% 0.1058 251.87deg)` (Deep Blue)
    - Secondary: `oklch(67.75% 0.1381 278.35deg)` (Purple)
    - Accent: `oklch(88.27% 0.1755 104.11deg)` (Green)
    - Background: `oklch(78.51% 0.1421 180.34deg)` (Light Cyan)
    - Warning (Orange), Destructive (Red).
- [x] **Update Shadow System**: Ensure hard black shadows (`1px` to `12px` offsets).

### Phase 5: Page Enhancement
- [x] **Update `Index.tsx`**: Use RetroUI Buttons, Cards, and new layout.
- [ ] **Update `Dashboard.tsx`**: Integrate RetroUI Charts and Data Tables.
- [ ] **Update `Studio.tsx`**: Use enhanced form components.
- [x] **New Components**:
    - [x] Updated Navbar and Footer with new style.

## Definition of Done
- [x] Tailwind v4 installed and building.
- [x] RetroUI components integrated and functional in `web/src`.
- [x] `PxBorder` and `FocusRing` implemented.
- [x] Enhanced `Button` component working with shadow effects.
- [x] Color system updated to OKLCH values.
- [ ] Pages (`Index`, `Dashboard`, `Studio`) updated with new components.
- [x] Type safety (no TS errors).
