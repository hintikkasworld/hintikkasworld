import { SymbolicSuccessorSetBDD } from './symbolic-successor-set-bdd';

describe('SymbolicSuccessorSet', () => {
    it('should create an instance', () => {
        expect(new SymbolicSuccessorSetBDD((val) => undefined, ['p'], Promise.resolve(0))).toBeTruthy();
    });
});
