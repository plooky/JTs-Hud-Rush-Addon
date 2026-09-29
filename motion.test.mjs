import test from 'node:test';
import assert from 'node:assert/strict';
import { changes } from './motion.mjs';
import { normalize } from './model.mjs';
import { fixture } from './preview.mjs';

test('damage and death effects only follow observed health loss', () => {
  const before = normalize(fixture);
  const raw = structuredClone(fixture);
  raw.allplayers.ct2.state.health = 43;
  raw.allplayers.t3.state.health = 0;
  assert.deepEqual(changes(before, normalize(raw)), [
    { id: 'ct2', damage: 21, died: false }, { id: 't3', damage: 26, died: true }
  ]);
  assert.deepEqual(changes(before, before), []);
  assert.deepEqual(changes(normalize(raw), before), []);
});

test('joining, reconnecting, missing health and round resets do not produce damage', () => {
  const before = normalize(fixture);
  const raw = structuredClone(fixture);
  raw.allplayers.ct2.state.health = 0;
  const after = normalize(raw);
  assert.deepEqual(changes(null, after), []);
  assert.deepEqual(changes(normalize({}), after), []);
  assert.deepEqual(changes(before, { ...after, round: 2 }), []);
  assert.deepEqual(changes(before, { ...after, map: 'another_map' }), []);
  assert.deepEqual(changes(before, { ...after, ct: { ...after.ct, score: 3 } }), []);
  delete raw.allplayers.ct2.state.health;
  assert.deepEqual(changes(before, normalize(raw)), []);
});
