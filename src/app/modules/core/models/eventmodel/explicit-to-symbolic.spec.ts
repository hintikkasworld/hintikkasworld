import { ExplicitToSymbolic } from './explicit-to-symbolic';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import {FormulaFactory} from '../formula/formula'
import { PropositionalAssignmentsPostcondition } from './../eventmodel/propositional-assignments-postcondition';

describe('ExplicitToSymbolic', () => {

  it('should create an instance', () => {
    expect(new ExplicitToSymbolic()).toBeTruthy();
  });

  it('should create an instance', () => {
    let expl_em = new ExplicitEventModel();
    expl_em.addAction("e", FormulaFactory.createFormula("a"), new PropositionalAssignmentsPostcondition({ "a": "bottom" }));
    expl_em.makeReflexiveRelation("a");
    expl_em.setPointedAction("e");
    expect(ExplicitToSymbolic.translate(expl_em)).toBeTruthy();
  });

});
