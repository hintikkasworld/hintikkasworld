import { BDDNode } from 'src/app/services/bdd.service';
import { Valuation } from '../valuation';

/**
 * Unlike SEModelDescriptor, every class which implements
 * this interface has the ability to access directly to
 * the memory to get any information they need to know
 * about the symbolic epistemic model object. Keep in mind
 * that in order to create a symbolic epistemic model we need
 * to pass to its constructor a SEModelDescriptor or a
 * SEModelInternalDescriptor.
 */
export interface SEModelInternalDescriptor {
    getAtomicPropositions(): string[];

    getAgents(): string[];

    getSetWorldsBDDDescription(): Promise<BDDNode>;

    getRelationBDD(agent: string): Promise<BDDNode>;

    getPointedValuation(): Valuation;
}
