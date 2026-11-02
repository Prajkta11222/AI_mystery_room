import test from 'node:test';
import assert from 'node:assert/strict';
import { randomPremise } from '../src/services/randomPremises.js';

test('random premise selection supports every documented category with fictional seed text', () => {
  for (const category of ['general', 'locked_room', 'art_theft', 'disappearance', 'historical', 'espionage']) {
    const premise = randomPremise(category);
    assert.equal(typeof premise, 'string');
    assert.ok(premise.length >= 30);
    assert.match(premise, /fictional|archive|gallery|museum|room|observatory|theatre|lighthouse|manor|institute|lab|railway|garden|greenhouse|watch|journal|key|message|portrait|exhibition/i);
  }
  assert.equal(typeof randomPremise('unknown'), 'string', 'unknown categories safely fall back to general');
});
