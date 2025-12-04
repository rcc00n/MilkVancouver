# Design Notes

This doc captures the shared tokens and styling rules for the refreshed marketing shell.

## Palette & gradients
- Base palette (from `styles/globals.css`): primary/navy `#0f2f4d`, amber accent `#f2a950`, neutrals set by `--background`/`--foreground`.
- New gradients (light / dark tokens):
  - `--gradient-hero`: lilac → amber → sky wash for hero bands; use via `bg-hero-gradient`.
  - `--gradient-flavor-1..4`: bold card fills (purple→pink→orange, blue→lilac, sunrise citrus, navy→blue→teal) for badges, callouts, and elevated cards.
  - `--gradient-lilac-band`, `--gradient-sunrise-band`: wide banded backgrounds applied on the homepage shell and available as `bg-lilac-band` / `bg-sunrise-band`.

## Radii, shadows, spacing, type
- Radii: `--radius-sm` 4px, `--radius-md` 8px, `--radius` 0.5rem, `--radius-lg` 16px, `--radius-xl` 24px, `--radius-pill` 999px.
- Shadows: `--shadow-elevated` for primary cards/buttons; `--shadow-glow` for hover/focus glow lines; existing `--shadow-soft` remains for lighter cards.
- Spacing scale: `--space-1..6` (4/8/12/16/24/32px). Content widths: `--content-max` 1180px, `--content-max-wide` 1400px for the homepage.
- Typography: headings use `--font-heading` (Sora) with default sizes `--text-2xl` / `--text-xl` / `--text-lg`; body `--font-body` (DM Sans) at `--text-base`. Use the built-in eyebows/pills for uppercase labels.

## Reusable styles
- Gradient utilities (Tailwind-ready): `bg-hero-gradient`, `bg-flavor-card-1/2/3/4`, `bg-lilac-band`, `bg-sunrise-band`.
- Buttons: `.pill-button` (gradient fill, pill radius, bold text) and `.pill-button--ghost` for high-contrast outlines.
- Cards: `.elevated-card` (gradient frame, soft shadow) with `.elevated-card__surface`; switch tones via `data-tone="cool"` or `"citrus"`.

## Layout shell updates
- Homepage shell (`Layout.tsx`): uses banded gradients above and below the content and widens the inner container to 1400px while keeping sections in a centered flow.
- Header: bright yellow ribbon, thicker nav bar, and a gradient glow line under the nav; mobile sheet is rounded with a light hero gradient background.
- Footer: deep purple/navy gradient band with higher-contrast links.
- Cart surfaces: floating cart FAB and drawer use the new warm gradients and softer, rounded shadows.

## Primary homepage
- `/` (`pages/Home.tsx`) remains the router entry and the primary marketing surface to extend; `/home/legacy` (`HomePage.tsx`) holds the denser legacy marketing layout for reference.
