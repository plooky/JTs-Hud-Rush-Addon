// JT sends complete GSI snapshots. Never merge previously/added into current state.
export const number = value => typeof value === 'number' && Number.isFinite(value) ? value : null;
export const display = value => value === null || value === undefined ? '—' : String(value);
export function clock(value) {
  if (value === null || value === undefined || value === '') return '—:—';
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds < 0) return '—:—';
  const rounded = Math.ceil(seconds);
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}
const weaponNames = { hkp2000: 'P2000', usp_silencer: 'USP-S', m4a1_silencer: 'M4A1-S',
  m4a1: 'M4A4', ak47: 'AK-47', elite: 'Dual Berettas', glock: 'Glock-18',
  hegrenade: 'HE', smokegrenade: 'Smoke', flashbang: 'Flash', incgrenade: 'Incendiary',
  molotov: 'Molotov', knife_t: 'Knife', knife: 'Knife' };
export function weaponName(value) {
  if (typeof value !== 'string') return '—';
  const name = value.replace(/^weapon_/, '');
  return weaponNames[name] || name.replaceAll('_', ' ').toUpperCase();
}
export function normalize(payload = {}) {
  const map = payload.map || {};
  const isRush = map.mode === 'rush';
  const phase = map.phase === 'gameover' ? 'gameover' : payload.phase_countdowns?.phase || payload.round?.phase || map.phase || 'waiting';
  // RUSH free-camera packets use spectarget rather than the usual player.steamid.
  const observed = String(payload.player?.spectarget ?? payload.player?.steamid ?? '');
  const roster = payload.allplayers && typeof payload.allplayers === 'object' ? payload.allplayers : {};
  const players = Object.entries(roster).filter(([, p]) => p && ['CT', 'T'].includes(p.team))
    .map(([id, p]) => {
      const weapons = Object.values(p.weapons || {}).filter(Boolean);
      const active = weapons.find(w => w.state === 'active');
      return { id, name: p.name || 'Unknown player', side: p.team,
        slot: number(p.observer_slot), health: number(p.state?.health), armor: number(p.state?.armor),
        helmet: p.state?.helmet === true, money: number(p.state?.money),
        kills: number(p.match_stats?.kills), assists: number(p.match_stats?.assists),
        deaths: number(p.match_stats?.deaths), observed: observed === id,
        weapon: weaponName(active?.name), ammo: number(active?.ammo_clip),
        reserve: number(active?.ammo_reserve), flashed: (number(p.state?.flashed) || 0) > 0,
        inventory: weapons.filter(w => w.type !== 'Knife').map(w => weaponName(w.name)) };
    }).sort((a, b) => (a.slot === 0 ? 10 : a.slot ?? 99) - (b.slot === 0 ? 10 : b.slot ?? 99) || a.id.localeCompare(b.id));
  const team = side => {
    const data = map[side === 'CT' ? 'team_ct' : 'team_t'] || {};
    const members = players.filter(p => p.side === side);
    return { side, name: data.name || (side === 'CT' ? 'Counter-Terrorists' : 'Terrorists'),
      score: number(data.score), players: members,
      alive: members.length && members.every(p => p.health !== null) ? members.filter(p => p.health > 0).length : null };
  };
  return { isRush, map: map.name || '', round: number(map.round), phase, time: clock(payload.phase_countdowns?.phase_ends_in),
    ct: team('CT'), t: team('T'), count: players.length,
    hasRoster: Object.hasOwn(payload, 'allplayers'), observed: players.find(p => p.observed) || null };
}
