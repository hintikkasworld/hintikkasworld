import { BDDNode } from '../epistemicmodel/bddnode';
import { BDDWorkerService } from 'src/app/services/bddworker.service';
import { EventModel } from './event-model';
import { SymbolicEpistemicModelBDD } from '../epistemicmodel/symbolic-epistemic-model-bdd';
import { Formula } from '../formula/formula';

/**
 *  New formulas :
 *  post(AP) = bigand_{a in AP} (p <-> Old(post(p)))
 *  chi = Forget(Old(pre and chi) and post(AP))
 *  Ra = Forget(Old(Ra) and post(AP) and post(AP'))
 */

export class SymbolicPublicAction implements EventModel<SymbolicEpistemicModelBDD> {
    private precondition: Formula;
    private postcondition: { [p: string]: Formula };

    constructor(pre: Formula, post: { [p: string]: Formula }) {
        this.precondition = pre;
        this.postcondition = post;
    }

    apply(M: SymbolicEpistemicModelBDD): SymbolicEpistemicModelBDD {
        // TODO We have to do the post (!)
        const BS = BDDWorkerService;

        const bddWorldsPromise = M.queryWorldsSatisfying(this.precondition);

        const newDescr = {
            getAgents: () => M.getAgents(),
            getAtomicPropositions: () => M.getPropositionalAtoms(),
            getSetWorldsBDDDescription: async () => await bddWorldsPromise,
            getPointedValuation: () => M.getPointedValuation(),

            getRelationBDD: async (agent: string): Promise<BDDNode> => {
                const previousRelation = await M.getRelationBDD(agent);
                await BS.debugInfo('previousRelation', previousRelation);

                const possibleWorlds = await bddWorldsPromise;
                await BS.debugInfo('possibleWorlds', possibleWorlds);

                const possibleWorldsPrime = await BS.applyRenaming(
                    await BS.createCopy(possibleWorlds),
                    SymbolicEpistemicModelBDD.getMapNotPrimeToPrime(M.getPropositionalAtoms())
                );
                await BS.debugInfo('possibleWorldsPrime', possibleWorldsPrime);

                const clique = await BS.applyAnd([await BS.createCopy(possibleWorlds), possibleWorldsPrime]);
                await BS.debugInfo('clique', clique);

                return await BS.applyAnd([await BS.createCopy(previousRelation), await BS.createCopy(clique)]);
            }
        };

        return new SymbolicEpistemicModelBDD((val) => M.getWorld(val), newDescr);
    }

    async isApplicableIn(M: SymbolicEpistemicModelBDD): Promise<boolean> {
        return await M.check(this.precondition);
    }
}
