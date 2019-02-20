import { Formula, FormulaType } from './formula';

describe('Formula', () => {
  it('should be able to create an atom', () => {
    expect(new Formula("ma").getType() == FormulaType.Atomic).toBeTruthy();
  });

  it('should be able to create a disjunction (and not atomic!)', () => {
    expect(new Formula("(ma or mb)").getType() != FormulaType.Atomic).toBeTruthy();
  });

  it('should be able to create a disjunction', () => {
    expect(new Formula("(ma or mb)").getType() == FormulaType.Or).toBeTruthy();
  });
  it('should be able to create a conjuncion', () => {
    expect(new Formula("(ma and mb)").getType() == FormulaType.And).toBeTruthy();
  });

  
  
});
