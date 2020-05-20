import { SymbolicSuccessorSet } from './symbolic-successor-set';

describe('SymbolicSuccessorSet', () => {
    it('should create an instance', () => {
        expect(new SymbolicSuccessorSet((val) => undefined, ['p'], Promise.resolve(0))).toBeTruthy();
    });
});
