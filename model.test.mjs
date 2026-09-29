import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize, clock, rushRoundLabel } from './model.mjs';
import { fixture } from './preview.mjs';

test('six-player spectator feed and RUSH spectarget resolve correctly', () => {
  const game = normalize(fixture);
  assert.equal(game.count, 6);
  assert.equal(game.ct.alive, 2);
  assert.equal(game.t.alive, 3);
  assert.equal(game.observed.name, 'Player Two');
  assert.equal(game.observed.weapon, 'AWP');
  assert.equal(game.ct.score, 2);
});
test('partial warmup spectator roster works without an observed player', () => {
  const raw = structuredClone(fixture);
  raw.map.phase = 'warmup';
  raw.phase_countdowns = { phase: 'warmup', phase_ends_in: '124.0' };
  raw.player = { spectarget: 'free-camera' };
  delete raw.allplayers.ct3;
  const game = normalize(raw);
  assert.equal(game.isRush, true);
  assert.equal(game.count, 5);
  assert.equal(game.observed, null);
  assert.equal(game.time, '2:04');
});
test('partial warmup, disconnects, and missing health do not fabricate data', () => {
  assert.equal(normalize({ map: { mode: 'rush' } }).count, 0);
  assert.equal(normalize({}).ct.score, null);
  assert.equal(normalize({ allplayers: { x: { team: 'CT' } } }).ct.alive, null);
  assert.equal(normalize({ player: { name: 'Observer', team: 'T' } }).count, 0);
  assert.equal(normalize({ previously: fixture, added: fixture }).count, 0);
});
test('missing roster replaces old roster; spectator and coach slots are not invented', () => {
  normalize(fixture);
  assert.equal(normalize({ map: fixture.map, allplayers: {} }).count, 0);
  assert.equal(normalize({ allplayers: { a: { team: 'SPECTATOR' } } }).count, 0);
});
test('mode detection does not mistake another 3v3 match for RUSH', () => {
  assert.equal(normalize({ ...fixture, map: { mode: 'competitive', name: 'rush_001' } }).isRush, false);
});
test('match end takes priority over the last round countdown', () => {
  assert.equal(normalize({ ...fixture, map: { ...fixture.map, phase: 'gameover' } }).phase, 'gameover');
});
test('timer uses only valid reported countdowns', () => {
  assert.equal(clock('60.1'), '1:01');
  assert.equal(clock('0'), '0:00');
  for (const value of [undefined, null, '', 'bad', -1]) assert.equal(clock(value), '—:—');
});

test('RUSH has fourteen regulation rounds and a 7-7 tiebreak, never competitive overtime', () => {
  const map = { mode: 'rush', phase: 'live', round: 0, team_ct: { score: 0 }, team_t: { score: 0 } };
  assert.equal(rushRoundLabel(map, 'live'), 'Round 1/14');
  assert.equal(rushRoundLabel({ ...map, round: 13, team_ct: { score: 7 }, team_t: { score: 6 } }, 'live'), 'Round 14/14');
  const tied = { ...map, round: 13, team_ct: { score: 7 }, team_t: { score: 7 } };
  assert.equal(rushRoundLabel(tied, 'over'), 'Round 14/14');
  assert.equal(rushRoundLabel({ ...tied, round: 14 }, 'freezetime'), 'Tiebreak');
  assert.equal(rushRoundLabel({ ...tied, round: undefined }, 'live'), 'Tiebreak');
  assert.equal(rushRoundLabel({ ...tied, round: 14 }, 'over'), 'Tiebreak');
  assert.equal(rushRoundLabel({ ...tied, phase: 'gameover' }, 'over'), 'Match ended');
  assert.equal(rushRoundLabel({ ...map, phase: 'warmup' }, 'warmup'), 'Warmup');
  assert.equal(rushRoundLabel({ mode: 'rush' }), 'RUSH');
  assert.equal(rushRoundLabel({ ...map, round: 24 }), 'RUSH');
  assert.equal(rushRoundLabel({ ...map, mode: 'competitive' }, 'live'), '');
});

test('round kill cards use reported round kills, not cumulative match kills', () => {
  const raw = structuredClone(fixture);
  raw.allplayers.ct2.state.round_kills = 2;
  delete raw.allplayers.ct1.state.round_kills;
  const game = normalize(raw);
  assert.equal(game.observed.roundKills, 2);
  assert.equal(game.observed.kills, 7);
  assert.equal(game.ct.players[0].roundKills, null);
  assert.equal(game.observed.weaponId, 'awp');
});
