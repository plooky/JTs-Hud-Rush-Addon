import { display } from './model.mjs';
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const stat = value => escape(display(value));
const money = value => value === null ? '—' : `$${value.toLocaleString('en-US')}`;
const hp = p => Math.max(0, Math.min(100, p.health ?? 0));
const icons = { skull: 'icon_skull_default', kills: 'icon_kills', armor: 'icon_armor_full_default', helmet: 'icon_armor_helmet_default', bullets: 'icon_bullets_default' };
const icon = name => `<span class="hud-icon" aria-hidden="true" style="--icon:url('./assets/icons/${icons[name]}.svg')"></span>`;
const phases = { warmup: 'Warmup', freezetime: 'Buy phase', live: 'Live', over: 'Round over', gameover: 'Match ended', paused: 'Paused', timeout_ct: 'CT timeout', timeout_t: 'T timeout' };
function weapon(id, name, theme) {
  return theme.weapons.has(id) ? `<img class="weapon" src="./assets/weapons/${id}.svg" alt="${escape(name)}" title="${escape(name)}">` : `<span class="weapon-fallback fit-text" data-min-size="11">${escape(name)}</span>`;
}
function killCard(p) {
  return p.roundKills > 0 ? `<div data-key="round-kills" class="round_kills_card" title="Kills this round"><div class="card_corner top_left">${icon('kills')}</div><div class="card_center"><div class="count">${stat(p.roundKills)}</div></div><div class="card_corner bottom_right">${icon('kills')}</div></div>` : '';
}
function playerCard(p, theme) {
  const dead = p.health === 0;
  return `<article data-key="player-${escape(p.id)}" class="player-horizontal-container ${dead ? 'dead' : ''}">
    <div class="player-horizontal-card vertical-flow ${p.observed ? 'active' : ''}">
      <span class="damage-indicator" aria-hidden="true"></span>${killCard(p)}
      <div class="card-avatar-section ${p.flashed ? 'flashed' : ''}"><div class="avatar">${dead ? icon('skull') : `<img src="${theme.portraits[p.side]}" alt="">`}</div><span class="slot-pill ${p.side}">${stat(p.slot === 0 ? 10 : p.slot)}</span></div>
      <div class="card-info-section"><div class="username-row"><strong class="name fit-text" data-min-size="11">${escape(p.name)}</strong><div class="health-armor-group" title="Armor ${stat(p.armor)}${p.helmet ? ', helmet' : ''}"><span class="armor-container">${p.armor > 0 ? icon(p.helmet ? 'helmet' : 'armor') : ''}</span><span class="health-text">${stat(p.health)}</span></div></div>
        <div class="stats-row"><div class="stat-group" title="Kills / assists / deaths"><span class="stat-item">${icon('kills')}${stat(p.kills)}</span><span class="stat-item assists">A ${stat(p.assists)}</span><span class="stat-item">${icon('skull')}${stat(p.deaths)}</span></div><span class="money">${money(p.money)}</span></div>
      </div>
      <div class="card-weapons-section"><div class="health-bar-red" style="width:${hp(p)}%"></div><div class="health-bar" style="width:${hp(p)}%"></div><div class="main-weapon-container">${weapon(p.weaponId, p.weapon, theme)}</div><div class="grenade-strip">${p.grenades.map(g => `<span class="${g.active ? 'active' : ''}">${weapon(g.id, g.name, theme)}</span>`).join('')}</div></div>
    </div>
  </article>`;
}
function roster(team, theme, position) {
  return `<section data-key="roster-${team.side}" class="teambox layout-horizontal ${team.side} ${position}" aria-label="${escape(team.name)} roster">${team.players.map(p => playerCard(p, theme)).join('')}${Array.from({ length: Math.max(0, 3 - team.players.length) }, (_, i) => `<div data-key="empty-${i}" class="empty-player">Waiting for player</div>`).join('')}</section>`;
}
function teamHeader(team, theme, position, show) {
  return `<div class="team ${position} ${team.side}"><div class="score-container"><div class="score ${team.side}">${show ? stat(team.score) : '—'}</div></div><div class="team-name"><span class="fit-text" data-min-size="16">${escape(team.name)}</span></div><div class="logo"><img src="${theme.logos[team.side]}" alt="${team.side}"></div></div>`;
}
export function view(game, { show, status, preview, hidden, theme }) {
  const p = game.observed;
  return `<div class="stage ${hidden ? 'hidden' : ''}">
    <header data-key="scoreboard" id="matchbar">${teamHeader(game.ct, theme, 'left', show)}<div id="timer"><div id="round_now">${show ? escape(game.roundLabel) : 'RUSH'}</div><div id="round_timer_text">${show ? game.time : '—:—'}</div></div>${teamHeader(game.t, theme, 'right', show)}</header>
    <div data-key="phase" class="rush-phase">RUSH 3V3 · ${show ? escape(phases[game.phase] || game.phase.replaceAll('_', ' ')) : 'AWAITING FEED'}</div>
    <div data-key="alive" class="players_alive" aria-label="Players alive"><div class="team_panel left CT"><div class="team_counter CT">${show ? stat(game.ct.alive) : '—'}</div></div><div class="vs_counter">VS</div><div class="team_panel right T"><div class="team_counter T">${show ? stat(game.t.alive) : '—'}</div></div></div>
    ${status ? `<div data-key="status" class="status">${escape(status)}</div>` : ''}
    ${preview ? '<div data-key="preview" class="preview-tag">PREVIEW · SYNTHETIC TEST DATA</div>' : ''}
    ${show ? roster(game.ct, theme, 'left') + roster(game.t, theme, 'right') : ''}
    ${show && p ? `<section data-key="observed" class="observed ${p.side}">${killCard(p)}<div class="avatar_container"><div class="avatar"><img src="${theme.portraits[p.side]}" alt=""></div></div><div class="main_container"><div class="health_armor_container"><div class="health_armor_icon">${p.armor > 0 ? icon(p.helmet ? 'helmet' : 'armor') : ''}</div><div class="health_value">${stat(p.health)}</div></div><div class="info_container"><strong class="username fit-text" data-min-size="12">${escape(p.name)}</strong></div><div class="weapon_container"><div class="ammo_container"><div class="ammo_values"><span class="clip">${stat(p.ammo)}</span><span class="divider">/</span><span class="reserve">${stat(p.reserve)}</span></div><span class="ammo_icon">${icon('bullets')}</span></div></div></div><div class="health_bar_container"><div class="health-bar-red" style="width:${hp(p)}%"></div><div class="health_bar_bg" style="width:${hp(p)}%"></div></div><div class="observed-weapon">${weapon(p.weaponId, p.weapon, theme)}</div></section>` : ''}
  </div>`;
}
