# Changelog

## 1.2.0

- Adapt JT-style panel entrances, team gradients, damage numbers, delayed health trails, death transitions and score/observer change animations to the RUSH layout.
- Preserve rendered panels across GSI updates so timer changes do not restart animations.
- Respect reduced-motion preferences and suppress damage effects on reconnects and round resets.

## 1.1.0

First public release of JTs-Hud-Rush-Addon.

- Live RUSH spectator data through JT Hud Manager's existing GSI connection.
- Three-player team panels, reported scores, phase timer, health, armor, weapons, money, K/A/D, and observed-player ammunition.
- Native 2560 × 1440 layout with proportional scaling, safe margins, and long-name fitting.
- Waiting states for incomplete rosters and stale/disconnected feeds.
- Labeled synthetic preview and long-text stress preview.
- Importable `rush-hud.zip`, build script, and download checksum.

Tower ownership, castle progression, custom radar, and killfeed are not provided. Retain the native game displays for those features.
