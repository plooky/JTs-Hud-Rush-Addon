// Explicit visual test fixture. This is never posted to JT Manager or CS2.
const player = (name, team, slot, health, weapon, kills, money) => ({
  name, team, observer_slot: slot,
  state: { health, armor: 100, helmet: true, money },
  match_stats: { kills, assists: 2, deaths: 3 },
  weapons: { weapon_0: { name: `weapon_${weapon}`, state: 'active', type: 'Rifle', ammo_clip: 24, ammo_reserve: 60 } }
});
export const fixture = {
  map: { mode: 'rush', name: 'rush_001', phase: 'live', team_ct: { score: 2 }, team_t: { score: 1 } },
  phase_countdowns: { phase: 'live', phase_ends_in: '43' },
  player: { spectarget: 'ct2' },
  allplayers: {
    ct1: player('Player One', 'CT', 1, 100, 'm4a1_silencer', 5, 3250),
    ct2: player('Player Two', 'CT', 2, 64, 'awp', 7, 1550),
    ct3: player('Player Three', 'CT', 3, 0, 'usp_silencer', 2, 4300),
    t1: player('Player Four', 'T', 4, 82, 'ak47', 6, 2800),
    t2: player('Player Five', 'T', 5, 100, 'galilar', 3, 5400),
    t3: player('Player Six', 'T', 6, 26, 'ak47', 4, 1900)
  }
};

// Layout QA only: long names, full inventories, three-digit stats and flash state.
export const stressFixture = structuredClone(fixture);
stressFixture.map.team_ct.name = 'Counter-Terrorists International';
stressFixture.map.team_t.name = 'THE EXTREMELY LONG TEAM NAME CLUB';
stressFixture.map.team_ct.score = 7;
stressFixture.map.team_t.score = 7;
for (const p of Object.values(stressFixture.allplayers)) {
  p.name = 'WWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWW';
  p.state.money = 10000;
  p.state.flashed = 255;
  p.match_stats = { kills: 100, assists: 100, deaths: 100 };
  p.weapons.weapon_1 = { name: 'weapon_incgrenade', type: 'Grenade', state: 'holstered' };
  p.weapons.weapon_2 = { name: 'weapon_smokegrenade', type: 'Grenade', state: 'holstered' };
  p.weapons.weapon_3 = { name: 'weapon_flashbang', type: 'Grenade', state: 'holstered' };
}
stressFixture.allplayers.ct1.name = '玩家測試很長的名稱玩家測試很長的名稱';
