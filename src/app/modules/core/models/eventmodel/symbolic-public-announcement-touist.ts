import { AndFormula, Formula } from 'src/app/modules/core/models/formula/formula';
import { EventModel } from './event-model';
import { SEModelDescriptor } from '../epistemicmodel/descriptor/se-model-descriptor';
import { SymbolicEpistemicModelTouist } from '../epistemicmodel/symbolic-epistemic-model-touist';
import { FormulaRelation, Obs, SymbolicRelation } from '../epistemicmodel/symbolic-relation';

/**
 * Only supports boolean formulas for now
 */
export class SymbolicPublicAnnouncementTouist implements EventModel<SymbolicEpistemicModelTouist> {
    private precondition: Formula;
    /** The agents who observe the announcement */
    private observers: string[];

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

    apply(M: SymbolicEpistemicModelTouist): SymbolicEpistemicModelTouist {
        let validWorlds = new AndFormula([this.precondition, M.validWorlds]);
        let possibleWorlds = this.precondition;
        let possibleWorldsPrime = this.precondition.renameAtoms((p) => SymbolicEpistemicModelTouist.getPrimedVarName(p));

        let observers = this.observers;

        const newDescr: SEModelDescriptor = {
            getAgents: () => M.getAgents(),
            getAtomicPropositions: () => M.propositionalAtoms,

            getSetWorldsFormulaDescription(): Formula {
                return validWorlds;
            },

            getRelationDescription: (agent: string): SymbolicRelation => {
                let previousRelation = M.getRelation(agent);

                if (observers == undefined || observers.includes(agent)) {
                    return new FormulaRelation(new AndFormula([previousRelation, possibleWorlds, possibleWorldsPrime]));
                } else {
                    return new FormulaRelation(previousRelation);
                }
            },

            getPointedValuation: () => M.getPointedWorld().valuation
        };

        return new SymbolicEpistemicModelTouist((val) => M.getWorld(val), newDescr);
    }

    async isApplicableIn(M: SymbolicEpistemicModelTouist): Promise<boolean> {
        return await M.check(this.precondition);
    }
}
