import { EventModel } from './event-model';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Formula } from './../epistemicmodel/formula';
import { BDDServiceWorkerService } from 'src/app/services/bddservice-worker.service';

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
        const BS = BDDServiceWorkerService;

        const descr = M.getInternalDescription();

        const newDescr = {
            getAgents: () => descr.getAgents(),
            getAtomicPropositions: () => descr.getAtomicPropositions(),
            getSetWorldsBDDDescription: () => 0,// TODO M.queryWorldsSatisfying(this.precondition),
            getRelationBDD: (agent: string) => {
                /*  const possibleWorlds = M.queryWorldsSatisfying(this.precondition);
                  const possibleWorldsPrime = BS.applyRenaming(BS.createCopy(possibleWorlds), SymbolicEpistemicModel.getMapNotPrimeToPrime(M.getPropositionalAtoms()));
                  const clique = BS.applyAnd([possibleWorlds, possibleWorldsPrime]);
  
                  if(this.observers == undefined || this.observers.includes(agent))
                      return BS.applyAnd([BS.createCopy(descr.getRelationBDD(agent)), BS.createCopy(clique)]);
                  else
                      return descr.getRelationBDD(agent);*/
                return undefined;
            },
            getPointedValuation: () => descr.getPointedValuation()
        }

        return new SymbolicEpistemicModel(M.getWorldClass(), newDescr);
    }

    async isApplicableIn(M: SymbolicEpistemicModel): Promise<boolean> {
        return M.check(this.precondition);
    }

    private precondition: Formula;

    /** The agents who observe the announcement */
    private observers: string[];
}
