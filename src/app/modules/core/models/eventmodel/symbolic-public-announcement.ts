import { Formula } from 'src/app/modules/core/models/formula/formula';
import { BDDNode } from 'src/app/services/bdd.service';
import { EventModel } from './event-model';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { BDDWorkerService } from 'src/app/services/bddworker.service';
import { SEModelBddDescriptor } from '../epistemicmodel/descriptor/se-model-bdd-descriptor';

/**
 * Only supports boolean formulas for now
 */
export class SymbolicPublicAnnouncement implements EventModel<SymbolicEpistemicModel> {
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

    apply(M: SymbolicEpistemicModel): SymbolicEpistemicModel {
        console.log('SymbolicPublicAnnouncement.apply');
        const BS = BDDWorkerService;

        const descr = M.getInternalDescription();
        const bddWorldsPromise = M.queryWorldsSatisfyingBooleanFormula(this.precondition);

        const newDescr: SEModelBddDescriptor = {
            getAgents: () => descr.getAgents(),
            getAtomicPropositions: () => descr.getAtomicPropositions(),
            getSetWorldsBDDDescription: async (): Promise<BDDNode> => await bddWorldsPromise,

            getRelationBDD: async (agent: string): Promise<BDDNode> => {
                const previousRelation = M.getRelationBDD(agent);

                if (this.observers == undefined || this.observers.includes(agent)) {
                    // await BS.debugInfo("previousRelation", previousRelation);

                    const possibleWorlds = await bddWorldsPromise;
                    await BS.debugInfo('possibleWorlds', possibleWorlds);

                    const possibleWorldsPrime = await BS.applyRenaming(
                        await BS.createCopy(possibleWorlds),
                        SymbolicEpistemicModel.getMapNotPrimeToPrime(M.getPropositionalAtoms())
                    );
                    await BS.debugInfo('possibleWorldsPrime', possibleWorldsPrime);
                    /*  const clique = await BS.applyAnd([await BS.createCopy(possibleWorlds), possibleWorldsPrime]);
                      await BS.debugInfo("clique", clique);*/
                    return await BS.applyAnd([previousRelation, await BS.createCopy(possibleWorlds), possibleWorldsPrime]);
                } else {
                    return await descr.getRelationBDD(agent);
                }
            },

            getPointedValuation: () => descr.getPointedValuation()
        };

        return new SymbolicEpistemicModel(M.getValToWorld(), newDescr);
    }

    async isApplicableIn(M: SymbolicEpistemicModel): Promise<boolean> {
        return await M.check(this.precondition);
    }
}
