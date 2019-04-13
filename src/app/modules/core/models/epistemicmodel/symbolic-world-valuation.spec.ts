import { SymbolicRelation } from './symbolic-relation';
import { Obs } from './symbolic-relation';
import { SymbolicWorldValuation } from './symbolic-world-valuation';
import { BDD } from '../formula/bdd';

describe('Program', () => {
  it('should create an instance', () => {
    expect(new SymbolicWorldValuation(new BDD(0))).toBeTruthy();
  });
});
