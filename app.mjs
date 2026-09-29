import { normalize } from './model.mjs';
import { updateMarkup, changes } from './motion.mjs';
import { loadDefaultTheme } from './theme.mjs';
import { view } from './view.mjs';

const root = document.querySelector('#hud');
const params = new URLSearchParams(location.search);
const preview = params.get('preview') === '1';
let latest = null, received = 0, connected = false, hidden = false;
let lastMarkup = '', previousGame = null;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let theme;
try { theme = await loadDefaultTheme(); }
catch (error) { root.textContent = `${error.message}. Keep JT Hud Manager's default HUD installed, then refresh this source.`; throw error; }

function animate(node, frames, options) {
  if (node && !reducedMotion.matches) node.animate(frames, options);
}
function render() {
  const fresh = connected && received > 0 && performance.now() - received < 10000;
  const game = normalize(fresh ? latest : {});
  const show = fresh && game.isRush;
  let status = !connected ? 'Connecting to JT Hud Manager' : !fresh ? 'Waiting for live game data' : !game.isRush ? 'Waiting for a RUSH match' : !game.hasRoster ? 'Waiting for spectator data' : game.count !== 6 ? `Spectator roster · ${game.count} / 6 players` : '';
  if (connected && received && !fresh) status = 'Game feed paused · waiting for fresh data';
  const html = view(game, { show, status, preview, hidden, theme });
  if (html !== lastMarkup) {
    const damageText = new Map([...root.querySelectorAll('.player-horizontal-container')].map(node => [node.dataset.key, node.querySelector('.damage-indicator')?.textContent]));
    updateMarkup(root, html);
    lastMarkup = html;
    for (const node of root.querySelectorAll('.player-horizontal-container')) node.querySelector('.damage-indicator').textContent = damageText.get(node.dataset.key) || '';
    for (const node of root.querySelectorAll('.fit-text')) {
      const style = getComputedStyle(node);
      let size = parseFloat(style.fontSize);
      const height = parseFloat(style.maxHeight);
      const minimum = Number(node.dataset.minSize);
      while (size > minimum && (node.scrollWidth > node.clientWidth + 1 || node.scrollHeight > height + 1)) node.style.fontSize = `${--size}px`;
    }
    for (const event of changes(previousGame, game)) {
      const card = [...root.querySelectorAll('.player-horizontal-container')].find(node => node.dataset.key === `player-${event.id}`);
      const badge = card?.querySelector('.damage-indicator');
      if (badge) {
        badge.textContent = `−${event.damage}`;
        badge.getAnimations().forEach(animation => animation.cancel());
        animate(badge, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)', offset: .2 }, { opacity: 1, transform: 'translateY(0)', offset: .8 }, { opacity: 0, transform: 'translateY(10px)' }], { duration: 1200, easing: 'ease-out' });
      }
    }
    if (previousGame?.isRush && show) {
      for (const side of ['ct', 't']) if (previousGame[side].score !== null && game[side].score > previousGame[side].score) {
        animate(root.querySelector(`.score.${side.toUpperCase()}`), [{ filter: 'brightness(2)', transform: 'scale(1.12)' }, { filter: 'brightness(1)', transform: 'scale(1)' }], { duration: 650, easing: 'ease-out' });
      }
      if (game.observed && previousGame.observed?.id !== game.observed.id) animate(root.querySelector('.observed .avatar_container'), [{ opacity: 0, translate: '0 15px' }, { opacity: 1, translate: '0 0' }], { duration: 300, easing: 'ease-out' });
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
  const previewData = params.get('stress') === '1' ? stressFixture : fixture;
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
} else root.textContent = 'Open this HUD through JT Hud Manager.';
setInterval(render, 100);
render();
document.fonts.ready.then(() => { lastMarkup = ''; render(); });
