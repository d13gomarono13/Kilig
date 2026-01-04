# Frontend Redesign V2 (Tailwind v4 + RetroUI Integration)

## Objective
Upgrade the frontend to Tailwind CSS v4, integrate the RetroUI component library, and enhance the Neo-Brutalist design system with features from the "Final result" reference (PxBorder, FocusRing, etc.).

## Context
- **Current State:** Vite + React + TS, Tailwind v3, Shadcn UI.
- **Goal:** Tailwind v4, RetroUI integration, Enhanced Neo-Brutalism.
- **References:** `RetroUI` folder (root), `web/Final result` folder.

## Phases

### Phase 1: Tailwind v4 Migration
- [ ] **Install Tailwind v4**: Add `tailwindcss` (v4) and `@tailwindcss/vite` plugin to `web/package.json`.
- [ ] **Update Vite Config**: Modify `web/vite.config.ts` to use the Tailwind v4 plugin.
- [ ] **Migrate CSS**: Update `web/src/index.css`:
    - Replace `@tailwind` directives with `@import "tailwindcss"`.
    - Convert theme tokens to `@theme inline` format.
    - Implement custom utilities using `@utility`.
- [ ] **Preserve Design Tokens**: Ensure Neo colors, Shadow system (hard drops), Fonts (Space Grotesk/Mono), and Border radius are maintained.

### Phase 2: RetroUI Component Integration
- [ ] **Setup Directory**: Create `web/src/components/retroui`.
- [ ] **Port Components**: Copy and adapt the following from `RetroUI/components/retroui`:
    - [ ] `Button` (Enhanced with shadow effects)
    - [ ] `Card` (Neo-brutalist with borders)
    - [ ] `Input`
    - [ ] `Badge`
    - [ ] `Checkbox`, `Radio`, `Select`, `Switch`, `Tabs`
    - [ ] `Charts` (Area, Bar, Line, Pie)

### Phase 3: Final Result Components
- [ ] **Create Utility Components** in `web/src/components/ui` (or shared):
    - [ ] `PxBorder`: Pixel-perfect borders (configurable width, radius).
    - [ ] `FocusRing`: Keyboard focus indicator matching border style.
- [ ] **Background Utilities**: Add `cube-bg` and `diamond-bg` patterns to CSS/utilities.
- [ ] **Enhance Button**:
    - Integrate `PxBorder` and `FocusRing`.
    - Add 3D shadow hover effects.
    - Support shadow/no-shadow variants.

### Phase 4: Style System Updates
- [ ] **Refine Color Palette**:
    - Primary: `oklch(46.36% 0.1058 251.87deg)` (Deep Blue)
    - Secondary: `oklch(67.75% 0.1381 278.35deg)` (Purple)
    - Accent: `oklch(88.27% 0.1755 104.11deg)` (Green)
    - Background: `oklch(78.51% 0.1421 180.34deg)` (Light Cyan)
    - Warning (Orange), Destructive (Red).
- [ ] **Update Shadow System**: Ensure hard black shadows (`1px` to `12px` offsets).

### Phase 5: Page Enhancement
- [ ] **Update `Index.tsx`**: Use RetroUI Buttons, Cards, and new layout.
- [ ] **Update `Dashboard.tsx`**: Integrate RetroUI Charts and Data Tables.
- [ ] **Update `Studio.tsx`**: Use enhanced form components.
- [ ] **New Components**:
    - Enhanced Card variants (Product/Feature).
    - Styled Form inputs with `PxBorder`.
    - Updated Navbar and Footer.

## Definition of Done
- [ ] Tailwind v4 installed and building.
- [ ] RetroUI components integrated and functional in `web/src`.
- [ ] `PxBorder` and `FocusRing` implemented.
- [ ] Enhanced `Button` component working with shadow effects.
- [ ] Color system updated to OKLCH values.
- [ ] Pages (`Index`, `Dashboard`, `Studio`) updated with new components.
- [ ] Type safety (no TS errors).
