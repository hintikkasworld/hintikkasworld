import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { PropositionalAssignmentsPostcondition } from './propositional-assignments-postcondition';
import { Valuation } from '../epistemicmodel/valuation';

describe('PropositionalAssignmentsPostcondition', () => {
  it('should create an instance', () => {
    expect(new PropositionalAssignmentsPostcondition(null)).toBeTruthy();
  });

  let M = new ExplicitEpistemicModel();
  let world = new WorldValuation(new Valuation([]));
  M.addWorld("w", world);
  M.addWorld("u", world);

  it('PropositionalAssignmentsPostcondition: p is false initially', () => {
        expect(!world.modelCheck("p")).toBeTruthy();
  });


  let makingPTrue = new PropositionalAssignmentsPostcondition({"p": "top"});
  let resultingWorld = makingPTrue.perform(M, "w");

  it('PropositionalAssignmentsPostcondition: p is still false initially after the assignment (no side effect)', () => {
    expect(!world.modelCheck("p")).toBeTruthy();
  });

  it('PropositionalAssignmentsPostcondition: the assignment to p true works', () => {
    expect(resultingWorld.modelCheck("p")).toBeTruthy();
  });
    

});
