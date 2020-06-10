import { Formula } from 'src/app/modules/core/models/formula/formula';
import { BDDNode } from 'src/app/services/bdd.service';
import { EventModel } from './event-model';
import { BDDWorkerService } from 'src/app/services/bddworker.service';
import { SEModelBddDescriptor } from '../epistemicmodel/descriptor/se-model-bdd-descriptor';
import { SymbolicEpistemicModelBDD } from '../epistemicmodel/symbolic-epistemic-model-bdd';

/**
 * Only supports boolean formulas for now
 */
export class SymbolicPublicAnnouncementBDD implements EventModel<SymbolicEpistemicModelBDD> {
    /**
     * @param precondition the formula that is announced. can be an epistemic formula.
     * @param observers the list of agents who hear the announcement. if left out, the announcement is fully public.
     */
    constructor(precondition: Formula, observers?: string[]) {
        if (!precondition.isBoolean()) {
            throw new Error('precondition should be a boolean, but got ' + precondition);
        }
        this.precondition = precondition;
        this.observers = observers;
    }

    private precondition: Formula;

    /** The agents who observe the announcement */
    private observers: string[];

    apply(M: SymbolicEpistemicModelBDD): SymbolicEpistemicModelBDD {
        const BS = BDDWorkerService;

        const bddWorldsPromise = M.queryWorldsSatisfyingBooleanFormula(this.precondition);

        const newDescr: SEModelBddDescriptor = {
            getAgents: () => M.getAgents(),
            getAtomicPropositions: () => M.getPropositionalAtoms(),
            getSetWorldsBDDDescription: async (): Promise<BDDNode> => await bddWorldsPromise,

            getRelationBDD: async (agent: string): Promise<BDDNode> => {
                const previousRelation = M.getRelationBDD(agent);

                if (this.observers == undefined || this.observers.includes(agent)) {
                    const possibleWorlds = await bddWorldsPromise;

                    const possibleWorldsPrime = await BS.applyRenaming(
                        await BS.createCopy(possibleWorlds),
                        SymbolicEpistemicModelBDD.getMapNotPrimeToPrime(M.getPropositionalAtoms())
                    );

                    return await BS.applyAnd([previousRelation, await BS.createCopy(possibleWorlds), possibleWorldsPrime]);
                } else {
                    return M.getRelationBDD(agent);
                }
            },

            getPointedValuation: () => M.getPointedValuation()
        };

        return new SymbolicEpistemicModelBDD((val) => M.getWorld(val), newDescr);
    }

    async isApplicableIn(M: SymbolicEpistemicModelBDD): Promise<boolean> {
        return await M.check(this.precondition);
    }
}
