# Default JT HUD versus RUSH Live

Compared against the installed July 13, 2026 default HUD bundle and its panel.json. This is an implementation comparison, not a claim that every compiled default feature receives usable live data.

## Implemented

- Default visual theme, Oswald font, team logos and portraits, horizontal player cards, observed-player panel, weapon/grenade silhouettes, health/armor, money, K/A/D, ammunition and round-kill cards.
- Damage numbers, delayed health trails, flash brightness, skull/death transitions, observer highlight and score effects. Exact damage-number accumulation/timing still differs from the default.
- RUSH round labels, 7-7 tiebreak and live survivor counts under the scoreboard. The separate top-right count remains removed as requested.
- Version 1.4.0 adds the default-style animated end-of-match screen: winner, final scores, replaceable team logos and three-player K/A/D lists. It appears three seconds after gameover and remains while connected until the game state changes. Missing/tied results do not fabricate a winner. An explicit completed round-15 tiebreak winner can resolve a retained 7-7 score.
- Local image overrides, reduced motion, stale live-data clearing and disconnect cleanup.

## Missing features that can be adapted

1. **Round-win announcement:** the default has a team-logo “WINS THE ROUND!” banner. RUSH currently only shows “Round over.” Use an explicit reported round winner; do not derive objective progress from it.
2. **Pause and timeout panels:** dedicated overlays with team logo, countdown and remaining timeouts. RUSH currently shows the phase in the small label. Only show remaining timeouts when supplied.
3. **Team utility totals:** the default buy-phase panel sums grenades. RUSH shows each player's grenades but has no team summary. Grenade quantities must use the actual reported count rather than the number of weapon entries.
4. **Tournament name and stage:** the default panel exposes these fields and animates them beneath the scoreboard. No corresponding RUSH panel exists.
5. **Display controls:** manager-driven CT/T colors, sharp corners, compact matchbar, team-model/silhouette switch, advertisement spacing and layout variants. RUSH uses one horizontal layout and images.json; it does not consume these default panel settings.
6. **Manager profiles and match assignments:** custom player names/photos, team identities/logos and configured side reversal. RUSH uses raw GSI names/sides and local image overrides, not the default's profile/match enrichment pipeline. Preserve explicit team identity when changing sides.
7. **Series overlays:** best-of/map picks, series-win pips, next-map information and veto panels. These need an explicitly configured RUSH series; they must not assume competitive map rules.
8. **Full inventory presentation:** the default chooses primary/pistol equipment and offers layout-specific details. RUSH emphasizes the active weapon and grenades. Preserve the distinction between active weapon and carried equipment.
9. **Damage-number behavior:** default damage indicators accumulate rapid hits and have specific exit timing. RUSH currently shows each observed health-loss delta with similar animation.

## Data-dependent or unsuitable without adaptation

- **Radar:** default radar assets/calibration cover competitive maps. RUSH needs room-aware map assets, positions and reliable room selection. No verified room/objective feed is currently integrated.
- **Killfeed:** the default contains a renderer subscribing to kill events, but its manifest advertises killfeed=false. Raw GSI health/K/D snapshots do not reliably supply killer/victim/weapon/headshot attribution. A verified event source is required; the default renderer's presence does not prove a working feed.
- **ADR:** default results show K/D/ADR. RUSH results show K/A/D. Reliable ADR needs authoritative damage totals and round accounting, or complete captured round damage from the match start. Joining mid-match cannot recover missing damage history.
- **Player cameras:** the default avatar component has camera hooks. These require a separately configured video feed; the RUSH addon does not integrate it.
- **Bomb, plant and defuse widgets:** these are competitive objectives, not replacements for RUSH towers or castle captures.
- **Loss bonuses, competitive halftime and overtime sets:** do not reuse competitive calculations in RUSH without verified equivalent rules.
- **RUSH towers/castles:** this is a RUSH-specific addition, not a missing default JT feature. The captured GSI feed does not expose the required state; retain the native objective display.

## Recommended implementation order

Round-win and pause/timeout panels; manager display settings and tournament branding; utility totals and inventory parity; profile/side integration; optional series and camera support. Radar, killfeed, ADR and objectives remain conditional on verified inputs.
