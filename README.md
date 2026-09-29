# JTs-Hud-Rush-Addon

A CS2 RUSH spectator HUD for [JT Hud Manager](https://github.com/JohnTimmermann/JTs-Hud), using the default JT HUD's visual theme with RUSH-specific statistics. Designed for a transparent 2560 × 1440 broadcast source. Install it as a custom HUD in the existing manager.

[Download rush-hud.zip](https://github.com/plooky/JTs-Hud-Rush-Addon/releases/latest/download/rush-hud.zip) · [Releases and checksums](https://github.com/plooky/JTs-Hud-Rush-Addon/releases)

![Synthetic six-player preview](https://raw.githubusercontent.com/plooky/JTs-Hud-Rush-Addon/main/docs/preview.png)

The screenshot uses labeled synthetic data.

## Install

1. Install and run [JT Hud Manager](https://github.com/JohnTimmermann/JTs-Hud/releases). This addon was tested with its July 13, 2026 release.
2. Use the manager's GSI installation setting to install its CS2 configuration, then restart CS2.
3. Download **rush-hud.zip** from this project's release assets. GitHub's **Source code** ZIP is not the import package.
4. In the manager's **HUDs** tab, import `rush-hud.zip` and launch **RUSH Live for JT Hud**.
5. Join a RUSH game as a spectator or through GOTV. Keep CS2 and JT Hud Manager running.
6. For OBS or vMix on the same PC, add a browser source with width **2560**, height **1440**, and this default URL:

```text
http://localhost:1349/huds/rush-hud/index.html
```

The background is transparent. The layout scales proportionally to other 16:9 sizes. If your manager uses a different address, use its HUD URL. Keep the downloaded filename `rush-hud.zip`, because the manager uses it for the HUD's installation ID.

End users do not need Node.js or a separate addon server. Keep the manager's default HUD installed: the addon loads its stylesheet, team logos and character portraits from the same manager. Asset filenames are discovered automatically; the tested theme is the July 13, 2026 release. A future incompatible theme may require an addon update. Remove the addon through the manager's HUDs tab.

## Displayed data

- Three-player CT/T rosters, reported team scores, game phase and countdown.
- The label beneath the scoreboard shows live CT-versus-T survivors, such as `RUSH 2V3 · Live`, updating on deaths and respawns. Missing or stale data displays dashes.
- RUSH rounds 1–14 and a **Tiebreak** label at 7–7. No competitive /24 counter, overtime sets, halftime or loss-bonus calculations.
- Health, armor, money, active weapons, kills, assists and deaths.
- Observed-player highlighting and ammunition.
- The default JT HUD's horizontal portrait cards, team logos, central observed-player portrait, weapon silhouettes, gradients, skull/death transitions and delayed red health trails. Floating damage numbers and score/observer transitions preserve their state across updates. Animations respect reduced-motion preferences. The top-right player counter is omitted.
- Round-kill cards use reported `state.round_kills`, separately from cumulative match kills.
- Waiting states for missing rosters and unavailable values. Old data clears after ten seconds without updates or immediately on disconnection.

The 1440p layout follows the default HUD: a top-center scoreboard and bottom-center observer panel flanked by horizontal team cards. The cards are enlarged for readable 3v3 data, with 36px bottom spacing. Long names wrap and shrink within their panels. Portraits and weapon images preserve their aspect ratio. The center of gameplay stays clear.

## Limits and troubleshooting

**Retain CS2's native RUSH objective display.** Tower ownership, castle capture and room progression were absent from the captured GSI packets. The addon does not infer them from team scores. It also does not provide a custom radar or killfeed.

Full-team data requires CS2 to send an `allplayers` roster. A player-view feed may omit it. If the HUD is waiting, check that CS2 is in RUSH, that you are observing, and that the manager is receiving GSI updates. Restart CS2 after installing the GSI configuration. If the browser source cannot connect, check that the manager is running and the source uses its current address.

Verified with a local RUSH spectator session: warmup, active play, score changes, the following buy phase, health, weapons and ammunition. The local session reported five bots. Six-player layout and long-name fitting were tested using synthetic data at 2560 × 1440. Valve matchmaking/GOTV has not been separately validated.

## Replacing images

Edit **images.json** in the HUD folder. On Windows the installed folder is normally `%USERPROFILE%\jthm-huds\rush-hud`. Put replacement files in `assets/custom/`, then set their paths in `images.json` and refresh the OBS browser source. No JavaScript or CSS edits are required. Back up custom files and your configuration before importing an addon update, which may replace the installed folder.

- `portraits.CT` and `portraits.T`: roster portraits. `null` uses the installed default JT portrait.
- `observedPortraits.CT` and `observedPortraits.T`: central observer portraits. `null` uses the corresponding roster portrait.
- `logos.CT` and `logos.T`: scoreboard logos. `null` uses the default JT logo.
- `icons`: skull, kills, armor, helmet and bullets. Each has a `src` path and `tint` option. Set `tint` to `false` for a full-color image; `true` uses the image's transparency as a team-colored silhouette.
- `weapons`: optional overrides keyed by GSI weapon name without `weapon_`, such as `ak47` or `flashbang`. Each accepts `src` and `tint`; `false` preserves colors, `true` renders a white silhouette. Existing weapon SVGs can also be replaced directly in `assets/weapons/`.

For example, change `portraits.CT` to `"./assets/custom/ct.png"`, or add `"ak47": { "src": "./assets/custom/ak47.png", "tint": false }` inside `weapons`. PNG, WebP and SVG files work; transparent backgrounds are recommended. Images use contain sizing so their aspect ratio is preserved without cropping.

## Development

Use Node.js 20 or later and PowerShell. From this folder:

```powershell
node --test model.test.mjs motion.test.mjs
powershell -NoProfile -File .\Build-RushHud.ps1
```

The build runs the tests and syntax check, then writes `dist/rush-hud.zip` and `dist/SHA256SUMS.txt`. To build and import into a running manager, use PowerShell 7:

```powershell
pwsh -NoProfile -File .\Build-RushHud.ps1 -Install
```

Append `?preview=1` to the installed HUD URL for a labeled synthetic preview, or `?preview=1&stress=1` for long names and extreme values. Remove these parameters for a live broadcast. Tests use synthetic data; local game captures are excluded from the repository and package.

The HUD registers in the manager's Socket.IO `huds` room and consumes raw `update` snapshots. It activates for `map.mode === "rush"`, takes rosters from `allplayers`, and matches the observed player's `spectarget` or `steamid` against roster IDs.

## Local RUSH testing

On a locally hosted CS2 server, load RUSH in the developer console:

```text
game_type 0; game_mode 6; mapgroup mg_rush_001; map rush_001
```

After the map loads, these server commands support a spectator-only bot test and end warmup:

```text
bot_join_after_player 0
bot_quota_mode normal
bot_quota 6
mp_warmup_pausetimer 0
mp_warmup_end
```

Actual bot count depends on available slots. These commands require control of the server; they are not a Valve matchmaking setup procedure.

## License and credits

Addon code is provided under the [MIT license](LICENSE). Weapon and status SVGs come from the Lexogrine/OpenHud React HUD template and retain their [MIT notice](assets/LICENSE-Lexogrine.txt). The bundled Oswald font is distributed under its [SIL Open Font License](assets/fonts/OFL.txt). JT Hud Manager is a separate project by its upstream authors. Its default theme and portraits are loaded from the installed manager and are not redistributed in this package.
