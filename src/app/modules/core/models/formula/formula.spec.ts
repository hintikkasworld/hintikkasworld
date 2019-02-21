import {Formula, AtomicFormula, TrueFormula, OrFormula, FormulaFactory} from './formula';

describe('Formula', () => {

  it('should be able to create an atom', () => {
    expect((((FormulaFactory.createFormula("ma")) instanceof AtomicFormula) == true)).toBeTruthy();
  });

  it('should be able to create a disjunction', () => {
    expect((((FormulaFactory.createFormula("(ma or mb)")) instanceof OrFormula) == true)).toBeTruthy();
  });
  
  it('the first part of disjunction should be atomic', () => {
    expect((((<OrFormula>(FormulaFactory.createFormula(("(ma or mb)")).formulas[0])) instanceof AtomicFormula) == true)).toBeTruthy();
  }); 

  it('the pretty printer works on true', () => {
    expect((FormulaFactory.createFormula("true").prettyPrint()) == "true").toBeTruthy();
  }); 
 
  it('the pretty printer works on false', () => {
    expect((FormulaFactory.createFormula("false").prettyPrint()) == "false").toBeTruthy();
  }); 

  it('the pretty printer works on atoms 1', () => {
    expect((FormulaFactory.createFormula("p").prettyPrint()) == "p").toBeTruthy();
  }); 

  it('the pretty printer works on negation', () => {
    expect((FormulaFactory.createFormula("(not q)").prettyPrint()) == "(not q)").toBeTruthy();
  }); 

  it('the pretty printer works on disjunction with 2 elements', () => {
    expect((FormulaFactory.createFormula("(p or q)").prettyPrint()) == "(p or q)").toBeTruthy();
  }); 

  it('the pretty printer works on disjunction with 3 elements', () => {
    expect((FormulaFactory.createFormula("(p or q or r)").prettyPrint()) == "(p or q or r)").toBeTruthy();
  }); 

  it('the pretty printer works on disjunction with 4 elements', () => {
    expect((FormulaFactory.createFormula("(p or q or r or s)").prettyPrint()) == "(p or q or r or s)").toBeTruthy();
  });

  it('the pretty printer works on conjunction with 4 elements', () => {
    expect((FormulaFactory.createFormula("(p and q and r and s)").prettyPrint()) == "(p and q and r and s)").toBeTruthy();
  });

  it('the pretty printer works on xor with 4 elements', () => {
    expect((FormulaFactory.createFormula("(p xor q xor r xor s)").prettyPrint()) == "(p xor q xor r xor s)").toBeTruthy();
  });

  it('the alternate parsing of or works.', () => {
    expect((FormulaFactory.createFormula("(or p q r s)").prettyPrint()) == "(p or q or r or s)").toBeTruthy();
  });

  it('the alternate parsing of and works.', () => {
    expect((FormulaFactory.createFormula("(and p q r s)").prettyPrint()) == "(p and q and r and s)").toBeTruthy();
  });

  it('the alternate parsing of xor works.', () => {
    expect((FormulaFactory.createFormula("(xor p q r s)").prettyPrint()) == "(p xor q xor r xor s)").toBeTruthy();
  });  

  it('the pretty printer works on K', () => {
    expect((FormulaFactory.createFormula("(K a p)").prettyPrint()) == "(K a p)").toBeTruthy();
  });

  it('the pretty printer works on Kpos', () => {
    expect((FormulaFactory.createFormula("(Kpos a p)").prettyPrint()) == "(Kpos a p)").toBeTruthy();
  });

  it('the pretty printer works on Kw', () => {
    expect((FormulaFactory.createFormula("(Kw a p)").prettyPrint()) == "(Kw a p)").toBeTruthy();
  });

  it('the pretty printer works on ->', () => {
    expect((FormulaFactory.createFormula("(p -> q)").prettyPrint()) == "(p -> q)").toBeTruthy();
  });

  it('the pretty printer works on <->', () => {
    expect((FormulaFactory.createFormula("(p <-> q)").prettyPrint()) == "(p <-> q)").toBeTruthy();
  });

  it('the pretty printer works on exactly with 2 elements', () => {
    expect((FormulaFactory.createFormula("(exactly 1 p q)").prettyPrint()) == "(exactly 1 p q)").toBeTruthy();
  });

  it('the pretty printer works on exactly with 4 elements', () => {
    expect((FormulaFactory.createFormula("(exactly 2 p q r s)").prettyPrint()) == "(exactly 2 p q r s)").toBeTruthy();
  });
});
