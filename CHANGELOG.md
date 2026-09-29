# Changelog

## 1.3.1

- Remove the top-right player counter.
- Give death skulls a 66px slot with room for the full 50px icon and its reveal animation.
- Add images.json for replacing team logos, roster/observer portraits, status icons and weapon images without code edits, including full-color images.

## 1.3.0

- Use the installed default JT HUD's theme, team logos and portraits with horizontal 3v3 cards, weapon silhouettes, round-kill cards, a central observer panel and an alive counter.
- Preserve native death/skull effects and delayed health trails while fitting names and images within the 1440p layout.
- Display RUSH rounds 1–14 and the 7–7 tiebreak instead of competitive round rules.
- Include Lexogrine weapon/status SVGs with their MIT notice; load the default theme and portraits from the manager.

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
