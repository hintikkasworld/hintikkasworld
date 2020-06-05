import { SymbolicSuccessorSetBDD } from './symbolic-successor-set-bdd';

describe('SymbolicSuccessorSetBDD', () => {
    it('should create an instance', () => {
        expect(new SymbolicSuccessorSetBDD((val) => undefined, ['p'], Promise.resolve(0))).toBeTruthy();
    });
});
