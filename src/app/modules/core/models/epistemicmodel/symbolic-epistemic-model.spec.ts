import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { BeloteTest } from './symbolic-epistemic-model';
import { SymbolicRelation, Obs } from './symbolic-relation';
import { AtomicFormula } from '../formula/formula';


describe('SymbolicEpistemicModel', () => {
  it('should create an instance, with good copy of agents', () => {
    let relationsSymboliques:Map<string, SymbolicRelation> = new Map(); 
    relationsSymboliques["a"] = new Obs(["var1"]);
    console.log(relationsSymboliques);
    let sem = new SymbolicEpistemicModel(["var1", "var2"], [], new AtomicFormula("var1"), relationsSymboliques)
    expect(sem).toBeTruthy();
    expect(sem.getAgents() == ["a"])
  });

  it('Test creation BeloteTest', () => {

    let belote = new BeloteTest();
    expect(belote).toBeTruthy();
    console.log(belote.getName());
    console.log(belote.getVarName("a", 1));
    let m = belote.getInitialEpistemicModel();
    console.log(m.formulaInitial.prettyPrint())
  });

});
