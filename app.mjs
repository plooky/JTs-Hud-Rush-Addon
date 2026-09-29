import { normalize, display } from './model.mjs';
import { updateMarkup, changes } from './motion.mjs';

const root = document.querySelector('#hud');
const preview = new URLSearchParams(location.search).get('preview') === '1';
let latest = null;
let received = 0;
let connected = false;
let hidden = false;
let lastMarkup = '';
let previousGame = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
function animate(node, frames, options) {
  if (node && !reducedMotion.matches) node.animate(frames, options);
}
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const money = value => value === null ? '—' : `$${value.toLocaleString('en-US')}`;
const stat = value => escape(display(value));
const labels = { warmup: 'Warmup', freezetime: 'Buy phase', live: 'Live', over: 'Round over',
  gameover: 'Match ended', paused: 'Paused', timeout_ct: 'CT timeout', timeout_t: 'T timeout' };

function playerCard(p) {
  const dead = p.health === 0;
  return `<article data-key="player-${escape(p.id)}" class="player ${dead ? 'dead' : ''} ${p.observed ? 'observed' : ''}">
    <span class="damage-number" aria-hidden="true"></span>
    <div class="player-heading"><span class="slot">${stat(p.slot === 0 ? 10 : p.slot)}</span><strong class="player-name fit-text" data-min-size="14">${escape(p.name)}</strong><span class="health">${dead ? 'OUT' : `${stat(p.health)} <small>HP</small>`}</span></div>
    <div class="loadout"><span class="weapon fit-text" data-min-size="13">${escape(p.weapon)}</span><span class="money">${money(p.money)}</span></div>
    <div class="details"><span class="armor">${p.helmet ? 'H + ' : ''}ARM ${stat(p.armor)}</span><span class="flash">${p.flashed ? 'FLASH' : ''}</span><span class="stats">${stat(p.kills)} / ${stat(p.assists)} / ${stat(p.deaths)} <small>K/A/D</small></span></div>
    <div class="health-track"><i class="health-trail" style="width:${Math.max(0, Math.min(100, p.health ?? 0))}%"></i><i class="health-fill" style="width:${Math.max(0, Math.min(100, p.health ?? 0))}%"></i></div>
  </article>`;
}
function teamColumn(team) {
  return `<section data-key="roster-${team.side}" class="roster ${team.side}"><div class="roster-title"><span class="fit-text" data-min-size="12">${escape(team.name)}</span><span class="alive">${stat(team.alive)} ALIVE</span></div>
    ${team.players.map(playerCard).join('')}
    ${Array.from({ length: Math.max(0, 3 - team.players.length) }, () => '<div class="empty-player">Waiting for player</div>').join('')}
  </section>`;
}
function render() {
  const fresh = connected && received > 0 && performance.now() - received < 10000;
  const game = normalize(fresh ? latest : {});
  let status = !connected ? 'Connecting to JT Hud Manager' : !fresh ? 'Waiting for live game data' : !game.isRush ? 'Waiting for a RUSH match' : !game.hasRoster ? 'Waiting for spectator data' : game.count !== 6 ? `Spectator roster · ${game.count} / 6 players` : '';
  if (connected && received && !fresh) status = 'Game feed paused · waiting for fresh data';
  const show = fresh && game.isRush;
  const p = game.observed;
  const html = `<div class="stage ${hidden ? 'hidden' : ''}">
    ${preview ? '<div class="preview-tag">PREVIEW · SYNTHETIC TEST DATA</div>' : ''}
    <header data-key="scoreboard" class="scoreboard"><div class="team-name CT"><span class="fit-text" data-min-size="18">${show ? escape(game.ct.name) : 'Counter-Terrorists'}</span></div><div class="score CT">${show ? stat(game.ct.score) : '—'}</div>
      <div class="match"><div class="mode">RUSH <span>3V3</span></div><div class="timer">${show ? game.time : '—:—'}</div><div class="phase">${show ? escape(labels[game.phase] || game.phase.replaceAll('_', ' ')) : 'AWAITING FEED'}</div></div>
      <div class="score T">${show ? stat(game.t.score) : '—'}</div><div class="team-name T"><span class="fit-text" data-min-size="18">${show ? escape(game.t.name) : 'Terrorists'}</span></div></header>
    ${status ? `<div data-key="status" class="status">${escape(status)}</div>` : ''}
    ${show ? teamColumn(game.ct) + teamColumn(game.t) : ''}
    ${show && p ? `<section data-key="observed" class="observed-player ${p.side}"><div class="observed-heading"><span class="eyebrow">OBSERVING</span><strong class="fit-text" data-min-size="18">${escape(p.name)}</strong></div><div class="observed-loadout"><span class="fit-text" data-min-size="14">${escape(p.weapon)}</span><b class="ammo">${stat(p.ammo)} <small>/ ${stat(p.reserve)}</small></b></div><div class="inventory">${p.inventory.map(item => `<span>${escape(item)}</span>`).join('')}</div></section>` : ''}
    <footer data-key="footer">RUSH <span>LIVE</span><small>${show ? escape(game.map) : 'JT HUD'}</small></footer>
  </div>`;
  if (html !== lastMarkup) {
    // Damage text is managed by its animation, not by the markup diff.
    const damageText = new Map([...root.querySelectorAll('.player')].map(node => [node.dataset.key, node.querySelector('.damage-number')?.textContent]));
    updateMarkup(root, html);
    for (const node of root.querySelectorAll('.player')) node.querySelector('.damage-number').textContent = damageText.get(node.dataset.key) || '';
    lastMarkup = html;
    // Fit actual glyphs after wrapping; health, money and ammo retain fixed sizes.
    for (const node of root.querySelectorAll('.fit-text')) {
      const style = getComputedStyle(node);
      let size = parseFloat(style.fontSize);
      const height = parseFloat(style.maxHeight);
      const minimum = Number(node.dataset.minSize);
      while (size > minimum && (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > height)) {
        node.style.fontSize = `${--size}px`;
      }
    }
    for (const event of changes(previousGame, game)) {
      const card = [...root.querySelectorAll('.player')].find(node => node.dataset.key === `player-${event.id}`);
      const badge = card?.querySelector('.damage-number');
      if (badge) {
        badge.textContent = `−${event.damage}`;
        badge.getAnimations().forEach(animation => animation.cancel());
        animate(badge, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)', offset: .18 }, { opacity: 1, offset: .7 }, { opacity: 0, transform: 'translateY(-14px)' }], { duration: 1100, easing: 'ease-out' });
        animate(card, [{ boxShadow: 'inset 0 0 0 2px #ff6575, 0 0 22px #ff344f55' }, { boxShadow: 'inset 0 0 0 0px transparent' }], { duration: 450 });
        if (event.died) animate(card.querySelector('.health'), [{ transform: 'scale(1.3)', opacity: .2 }, { transform: 'scale(1)', opacity: 1 }], { duration: 600, easing: 'cubic-bezier(.23,1,.32,1)' });
      }
    }
    if (previousGame?.isRush && show) {
      for (const side of ['ct', 't']) if (previousGame[side].score !== null && game[side].score > previousGame[side].score) {
        animate(root.querySelector(`.score.${side.toUpperCase()}`), [{ filter: 'brightness(2)', transform: 'scale(1.12)' }, { filter: 'brightness(1)', transform: 'scale(1)' }], { duration: 650, easing: 'ease-out' });
      }
      if (p && previousGame.observed?.id !== p.id) animate(root.querySelector('.observed-player'), [{ opacity: 0, transform: 'translateY(18px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 300, easing: 'ease-out' });
    }
    previousGame = show ? game : null;
  }
  root.style.setProperty('--scale', Math.min(innerWidth / 2560, innerHeight / 1440));
}
function accept(payload) {
  if (!payload || typeof payload !== 'object') return;
  latest = payload;
  received = performance.now();
}
if (preview) {
  const { fixture, stressFixture } = await import('./preview.mjs');
  const previewData = new URLSearchParams(location.search).get('stress') === '1' ? stressFixture : fixture;
  connected = true;
  accept(previewData);
  setInterval(() => accept(previewData), 1000);
} else if (typeof window.io === 'function') {
  const socket = window.io(location.origin);
  socket.on('connect', () => { connected = true; received = 0; socket.emit('started'); });
  socket.on('readyToRegister', () => socket.emit('register', 'rush-hud', false, 'cs2', 'DEFAULT'));
  socket.on('update', accept);
  socket.on('disconnect', () => { connected = false; latest = null; received = 0; render(); });
  socket.on('connect_error', () => { connected = false; render(); });
  socket.on('refreshHUD', () => location.reload());
  socket.on('hud_action', data => { if (data?.action === 'boxesState') hidden = data.data === 'hide'; });
} else {
  root.textContent = 'Open this HUD through JT Hud Manager.';
}
setInterval(render, 100);
render();
