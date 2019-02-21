import * as types from '../formula/formula'
import { ExplicitEpistemicModel } from './explicit-epistemic-model';
import { MuddyChildren } from '../examples/muddy-children';
describe('ExplicitEpistemicModel', () => {
  it('should create an instance', () => {
    expect(new ExplicitEpistemicModel()).toBeTruthy();
  });
  let mc = new MuddyChildren()
  let m = mc.getInitialEpistemicModel();

  it('The formula top is true on the model', () => {
    expect((m.modelCheck("w", new types.TrueFormula())) == true).toBeTruthy();

  });

  it('The formula bottom is false on the model', () => {
    expect((m.modelCheck("w", new types.FalseFormula())) == false).toBeTruthy();

  }); 

  it('A positive atom is true on the model', () => {
    expect((m.modelCheck("w", new types.AtomicFormula("ma"))) == true).toBeTruthy();

  });   

  it('A negative atom is false on the model', () => {
    expect((m.modelCheck("u", new types.AtomicFormula("ma"))) == false).toBeTruthy();

  }); 
  
  it('Conjunction 1', () => {
    expect((m.modelCheck("w", new types.AndFormula([new types.AtomicFormula("ma"), new types.AtomicFormula("mb")]))) == true).toBeTruthy();

  }); 
  it('Conjunction 2', () => {
    expect((m.modelCheck("u", new types.AndFormula([new types.AtomicFormula("ma"), new types.AtomicFormula("mb")]))) == false).toBeTruthy();

  });   
  it('Disjunction 1', () => {
    expect((m.modelCheck("w", new types.OrFormula([new types.AtomicFormula("ma"), new types.AtomicFormula("mb")]))) == true).toBeTruthy();

  });   
  it('Disjunction 2', () => {
    expect((m.modelCheck("u", new types.OrFormula([new types.AtomicFormula("ma"), new types.AtomicFormula("mb")]))) == true).toBeTruthy();

  });     
  it('Negation', () => {
    expect((m.modelCheck("u", new types.NotFormula(new types.AtomicFormula("ma"))) == true)).toBeTruthy();

  });  
  it('K 1', () => {
    expect((m.modelCheck("u", new types.KFormula("a", new types.AtomicFormula("mb"))) == true)).toBeTruthy();

  });  
  it('K 2', () => {
    expect((m.modelCheck("u", new types.KFormula("a", new types.AtomicFormula("ma"))) == false)).toBeTruthy();

  });     
  it('Kpos 1', () => {
    expect((m.modelCheck("u", new types.KposFormula("a", new types.AtomicFormula("mb"))) == true)).toBeTruthy();

  });  
  it('Kpos 2', () => {
    expect((m.modelCheck("u", new types.KposFormula("a", new types.AtomicFormula("ma"))) == true)).toBeTruthy();

  }); 
  it('Kw 1', () => {
    expect((m.modelCheck("u", new types.KwFormula("a", new types.AtomicFormula("mb"))) == true)).toBeTruthy();

  });  
  it('Kw 2', () => {
    expect((m.modelCheck("u", new types.KwFormula("a", new types.AtomicFormula("ma"))) == false)).toBeTruthy();

  }); 
  it('Kw 3', () => {
    expect((m.modelCheck("t", new types.KwFormula("a", new types.AtomicFormula("mb"))) == true)).toBeTruthy();

  });  
  it('Kw 4', () => {
    expect((m.modelCheck("t", new types.KwFormula("a", new types.AtomicFormula("ma"))) == false)).toBeTruthy();

  });   
  it('Exactly 1', () => {
    expect((m.modelCheck("t", new types.ExactlyFormula(1,["ma","mb"]))) == false).toBeTruthy();

  });    
  it('Exactly 2', () => {
    expect((m.modelCheck("t", new types.ExactlyFormula(0,["ma","mb"]))) == true).toBeTruthy();

  });   
  it('Exactly 3', () => {
    expect((m.modelCheck("w", new types.ExactlyFormula(0,["ma","mb"]))) == false).toBeTruthy();

  });    
  it('Exactly 4', () => {
    expect((m.modelCheck("w", new types.ExactlyFormula(1,["ma","mb"]))) == false).toBeTruthy();

  }); 
  it('Exactly 5', () => {
    expect((m.modelCheck("w", new types.ExactlyFormula(2,["ma","mb"]))) == true).toBeTruthy();

  });    
  it('Exactly 6', () => {
    expect((m.modelCheck("w", new types.ExactlyFormula(3,["ma","mb"]))) == false).toBeTruthy();

  });   
  it('Exactly 7', () => {
    expect((m.modelCheck("w", new types.ExactlyFormula(2,["ma","mb","p"]))) == true).toBeTruthy();

  });   
});
