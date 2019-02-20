import {Formula, AtomicFormula, TrueFormula, OrFormula, FormulaFactory} from './formula';

describe('Formula', () => {

  it('should be able to create an atom', () => {
    expect((((FormulaFactory.createformula("ma")) instanceof AtomicFormula) == true)).toBeTruthy();
  });

  it('should be able to create a disjunction', () => {
    expect((((FormulaFactory.createformula("(ma or mb)")) instanceof OrFormula) == true)).toBeTruthy();
  });
  
  it('the first part of disjunction should be atomic', () => {
    expect((((<OrFormula>(FormulaFactory.createformula(("(ma or mb)")).formula1)) instanceof AtomicFormula) == true)).toBeTruthy();
  }); 
});
