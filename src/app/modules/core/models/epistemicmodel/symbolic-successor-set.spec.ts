import { SymbolicSuccessorSet } from './symbolic-successor-set';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { WorldValuation } from './world-valuation';

describe('SymbolicSuccessorSet', () => {
    it('should create an instance', () => {
        expect(new SymbolicSuccessorSet((val) => undefined, ['p'], Promise.resolve(0))).toBeTruthy();
    });
});
