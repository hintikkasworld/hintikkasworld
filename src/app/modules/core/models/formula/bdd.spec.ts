import { FormulaFactory } from './formula';
import { BDD } from './bdd';

describe('BDD', () => {
    it('should create an instance', () => {
        expect(new BDD(FormulaFactory.createFormula('true'))).toBeTruthy();
    });
});
