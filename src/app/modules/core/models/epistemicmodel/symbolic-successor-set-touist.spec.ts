import { SymbolicSuccessorSetTouist } from './symbolic-successor-set-touist';
import { AtomicFormula } from '../formula/formula';

describe('SymbolicSuccessorSetTouist', () => {
    it('should create an instance', () => {
        expect(new SymbolicSuccessorSetTouist((val) => undefined, ['p_pr'], () => undefined, new AtomicFormula('p_pr'))).toBeTruthy();
    });
});
