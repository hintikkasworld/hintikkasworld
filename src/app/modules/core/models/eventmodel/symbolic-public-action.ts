import { BDDNode } from '../epistemicmodel/bddnode';
import { BDDWorkerService } from 'src/app/services/bddworker.service';
import { EventModel } from './event-model';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Formula } from '../formula/formula';

/**
 *  New formulas :
 *  post(AP) = bigand_{a in AP} (p <-> Old(post(p)))
 *  chi = Forget(Old(pre and chi) and post(AP))
 *  Ra = Forget(Old(Ra) and post(AP) and post(AP'))
 */

export class SymbolicPublicAction implements EventModel<SymbolicEpistemicModel> {
    private precondition: Formula;
    private postcondition: { [p: string]: Formula };

    constructor(pre: Formula, post: { [p: string]: Formula }) {
        this.precondition = pre;
        this.postcondition = post;
    }

    apply(M: SymbolicEpistemicModel): SymbolicEpistemicModel {
        // TODO We have to do the post (!)
        const BS = BDDWorkerService;

        const descr = M.getInternalDescription();
        const bddWorldsPromise = M.queryWorldsSatisfying(this.precondition);

        const newDescr = {
            getAgents: descr.getAgents,
            getAtomicPropositions: descr.getAtomicPropositions,
            getSetWorldsBDDDescription: async () => await bddWorldsPromise,
            getPointedValuation: descr.getPointedValuation,

            getRelationBDD: async (agent: string): Promise<BDDNode> => {
                const previousRelation = await descr.getRelationBDD(agent);
                await BS.debugInfo('previousRelation', previousRelation);

                const possibleWorlds = await bddWorldsPromise;
                await BS.debugInfo('possibleWorlds', possibleWorlds);

                const possibleWorldsPrime = await BS.applyRenaming(
                    await BS.createCopy(possibleWorlds),
                    SymbolicEpistemicModel.getMapNotPrimeToPrime(M.getPropositionalAtoms())
                );
                await BS.debugInfo('possibleWorldsPrime', possibleWorldsPrime);

                const clique = await BS.applyAnd([await BS.createCopy(possibleWorlds), possibleWorldsPrime]);
                await BS.debugInfo('clique', clique);

                return await BS.applyAnd([await BS.createCopy(previousRelation), await BS.createCopy(clique)]);
            }
        };

        return new SymbolicEpistemicModel(M.getWorldClass(), newDescr);
    }

    async isApplicableIn(M: SymbolicEpistemicModel): Promise<boolean> {
        return await M.check(this.precondition);
    }
}
