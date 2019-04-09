import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';

describe('WorldValuation', () => {
  it('should create an instance', () => {
    expect(new WorldValuation(new Valuation([]))).toBeTruthy();
  });
});
