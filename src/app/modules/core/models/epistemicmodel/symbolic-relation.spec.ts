import { SymbolicRelation } from './symbolic-relation';
import { Obs } from './symbolic-relation';

describe('Program', () => {
  it('should create an instance', () => {
    expect(new Obs([])).toBeTruthy();
  });
});
