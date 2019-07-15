import { BDDNode } from 'src/app/services/bdd.service';
import { EventModel } from './event-model';
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
            getSetWorldsBDDDescription: async () : Promise<BDDNode> => await M.queryWorldsSatisfying(this.precondition),
            getRelationBDD: async (agent: string) : Promise<BDDNode> =>  {
                  const possibleWorlds = await M.queryWorldsSatisfying(this.precondition);
                  const possibleWorldsPrime = await BS.applyRenaming(await BS.createCopy(possibleWorlds), SymbolicEpistemicModel.getMapNotPrimeToPrime(M.getPropositionalAtoms()));
                  const clique = await BS.applyAnd([possibleWorlds, possibleWorldsPrime]);
  
                  if(this.observers == undefined || this.observers.includes(agent))
                      return await BS.applyAnd([await BS.createCopy(await descr.getRelationBDD(agent)), await BS.createCopy(clique)]);
                  else
                      return await descr.getRelationBDD(agent);
            },
            getPointedValuation: () => descr.getPointedValuation()
        }

        return new SymbolicEpistemicModel(M.getWorldClass(), newDescr);
    }

    async isApplicableIn(M: SymbolicEpistemicModel): Promise<boolean> {
        return await M.check(this.precondition);
    }

    private precondition: Formula;

    /** The agents who observe the announcement */
    private observers: string[];
}
