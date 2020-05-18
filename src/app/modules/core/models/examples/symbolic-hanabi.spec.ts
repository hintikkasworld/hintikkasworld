import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { SimpleSymbolicHanabi } from './symbolic-hanabi';

describe('SymbolicEpistemicModel', () => {
    it('Test creation SimpleSymbolicHanabi', () => {
        let hanabi = new SimpleSymbolicHanabi();
        expect(hanabi).toBeTruthy();
        console.log('Name', hanabi.getName());
        console.log('Variable', SimpleSymbolicHanabi.getVarName('a', 1));
        let m = hanabi.getInitialEpistemicModel();
        console.log('FormulaInitiale', m.getInitialFormula());
    });
});
