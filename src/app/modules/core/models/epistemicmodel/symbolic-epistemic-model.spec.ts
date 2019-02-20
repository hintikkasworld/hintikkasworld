import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { BeloteTest } from './symbolic-epistemic-model';


describe('SymbolicEpistemicModel', () => {
  it('should create an instance', () => {
    expect(new SymbolicEpistemicModel(null)).toBeTruthy();
  });

  it('should create an instance', () => {
    expect(new BeloteTest()).toBeTruthy();
  });

});
