import { EventModel } from './event-model';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Formula } from '../formula/formula';
import { BDD } from '../formula/bdd';

export class SymbolicPublicAnnouncement implements EventModel<SymbolicEpistemicModel> {

    /**
     * @param precondition the formula that is announced. can be an epistemic formula.
     * @param observers the list of agents who hear the announcement. if left out, the announcement is fully public.
     */
    constructor(precondition: Formula, observers?: string[]) {
        this.precondition = precondition;
        this.observers = observers;
    }

    apply(M: SymbolicEpistemicModel): SymbolicEpistemicModel {
        const BS = BDD.bddService;
        const possibleWorlds = M.queryWorldsSatisfying(this.precondition);
        const possibleWorldsPrime = BS.applyRenaming(BS.createCopy(possibleWorlds), SymbolicEpistemicModel.getMapNotPrimeToPrime(M.getPropositionalAtoms()));
        const clique = BS.applyAnd([possibleWorlds, possibleWorldsPrime]);
        const newSEM = M.clone();
        const observers = this.observers !== undefined ? this.observers : M.getAgents();
        for (const agent of observers) {
            const currentRel = M.getAgentSymbolicRelation(agent);
            const newRel = BS.applyAnd([BS.createCopy(currentRel), BS.createCopy(clique)]);
            newSEM.setAgentSymbolicRelation(agent, newRel);
        }
        BS.destroy(clique);
        return newSEM;
    }

    isApplicableIn(M: SymbolicEpistemicModel): boolean {
        return M.check(this.precondition);
    }

    private precondition: Formula;

    /** The agents who observe the announcement */
    private observers: string[];
}
