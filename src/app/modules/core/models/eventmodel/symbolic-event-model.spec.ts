import { SymbolicEventModel } from './symbolic-event-model';

describe('SymbolicEventModel', () => {
    it('should create an instance', () => {
        let agents = ['a'];
        let variables = ['xa1', 'xa2'];
        expect(new SymbolicEventModel(agents, variables, undefined, undefined, '')).toBeTruthy();
    });
});
