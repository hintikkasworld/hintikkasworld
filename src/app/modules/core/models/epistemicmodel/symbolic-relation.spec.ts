import { SymbolicRelation } from './SymbolicRelation';
import { Obs } from './SymbolicRelation';

describe('Program', () => {
  it('should create an instance', () => {
    expect(new Obs([])).toBeTruthy();
  });
});
