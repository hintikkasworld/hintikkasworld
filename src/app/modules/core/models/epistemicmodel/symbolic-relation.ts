import { BDDWorkerService } from 'src/app/services/bddworker.service';
import { AndFormula, AtomicFormula, EquivFormula, Formula } from '../formula/formula';
import { SymbolicEpistemicModelBDD } from './symbolic-epistemic-model-bdd';
import { BDDNode } from '../../../../services/bdd.service';

export interface SymbolicRelation {
    toFormula(): Formula;

    toBDD(): Promise<BDDNode>;
}

/**
 * this class implements a SymbolicRelation for an agent that observes
 * the truth values of some propositional variables.
 */
export class Obs implements SymbolicRelation {
    /**
     * What is known by the agent : String (which are atoms), or Formula.
     * "a" <=> AtomicFormula("a")
     */
    protected readonly observedVariables: (Formula | string)[];

    constructor(observedVariables: (Formula | string)[]) {
        this.observedVariables = observedVariables;
    }

    /**
     * Return the formula of the SymbolicRelation
     */
    toFormula(): Formula {
        let list_formula: Formula[] = this.observedVariables.map((form) => {
            if (typeof form === 'string') {
                return new EquivFormula(new AtomicFormula(form), new AtomicFormula(SymbolicEpistemicModelBDD.getPrimedVarName(form)));
            } else {
                return new EquivFormula(form, form.renameAtoms(SymbolicEpistemicModelBDD.getPrimedVarName));
            }
        });
        return new AndFormula(list_formula);
    }

    /**
     * Return the BDD of the SymbolicRelation, build thanks to the toFormula()
     */
    async toBDD(): Promise<BDDNode> {
        let formula = this.toFormula();
        try {
            return BDDWorkerService.formulaToBDD(formula);
        } catch (error) {
            console.log('Erreur dans la contruction de la formule !');
            console.log('Trace : ', error);
            throw error;
        }
    }
}
