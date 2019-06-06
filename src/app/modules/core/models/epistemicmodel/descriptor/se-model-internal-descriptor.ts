import { BDDNode } from 'src/app/services/bdd.service';
import { Valuation } from '../valuation';

export interface SEModelInternalDescriptor {
    getAtomicPropositions(): string[];
    getAgents(): string[];
    getSetWorldsBDDDescription(): BDDNode;
    getRelationBDD(agent: string): BDDNode;
    getPointedValuation(): Valuation;
}