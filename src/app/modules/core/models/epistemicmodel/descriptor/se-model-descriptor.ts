import { BDD } from '../../formula/bdd';
import { BDDNode } from 'src/app/services/bdd.service';
import { Valuation } from '../valuation';
import { SymbolicRelation } from '../symbolic-relation';
import { Formula } from '../../formula/formula';

export interface SEModelDescriptor {
    getAtomicPropositions(): string[];
    getAgents(): string[];
    getSetWorldsFormulaDescription(): Formula;
    getRelationDescription(agent: string): SymbolicRelation;
    getPointedValuation(): Valuation;
}