# Remove unused interface components

The project ships the full starter component library, but the app only uses a small part of it. Removing the rest makes the codebase smaller and easier to work with. Nothing visible on the site changes.

## What stays

The pieces your pages actually use: buttons, inputs, text areas, labels, checkboxes, dropdown selects, tabs, badges, progress bars, loading placeholders, and the toast notifications.

## What gets removed

The 30+ components no page imports, including: accordion, alert, alert dialog, aspect ratio, avatar, breadcrumb, calendar, card, carousel, chart, collapsible, command palette, context menu, drawer, dropdown menu, form, hover card, one-time-code input, menubar, navigation menu, pagination, popover, radio group, resizable panels, scroll area, sidebar, slider, switch, table, and toggle group.

Removing the sidebar, command palette and toggle group also frees four more components that only they used: sheet, tooltip, separator, and toggle.

Note: `chart`, `calendar` and `context-menu` are among these — the three files flagged by the adviser. None had real defects, but they are unused, so they go too.

## Technical notes

- Delete the corresponding files under `src/components/ui/`.
- Remove now-orphaned helpers pulled in only by deleted files (e.g. the mobile-breakpoint hook used solely by the sidebar) after confirming nothing else imports them.
- Uninstall the npm packages that only the deleted components depended on: the unused `@radix-ui/*` packages plus `recharts`, `react-day-picker`, `cmdk`, `embla-carousel-react`, `input-otp`, `vaul`, `react-resizable-panels`, and `react-hook-form` — each verified as unreferenced before removal.
- Verify with a typecheck and a clean build, and load the hub, admin and landing pages to confirm no regression.
