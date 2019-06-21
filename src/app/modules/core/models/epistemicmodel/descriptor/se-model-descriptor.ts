import { Valuation } from '../valuation';
import { SymbolicRelation } from '../symbolic-relation';
import { Formula } from '../../formula/formula';

/**
 * Every class which implements this interface will have the
 * ability to initialize symbolic epistemic model's property:
 * propositionalAtoms - an array of possible worlds
 * agents - an array of agents
 * formula - the formula needed to construct symbolic epistemic model
 * relation 
 * pointedValuation - the pointed world
 * Anytime when we create a symbolic epistemic model, we have to pass 
 * to its constructor a parameter as a SEModelDescriptor or a SEModelInternalDescriptor
 */
export interface SEModelDescriptor {
    getAtomicPropositions(): string[];
    getAgents(): string[];
    getSetWorldsFormulaDescription(): Formula;
    getRelationDescription(agent: string): SymbolicRelation;
    getPointedValuation(): Valuation;
}