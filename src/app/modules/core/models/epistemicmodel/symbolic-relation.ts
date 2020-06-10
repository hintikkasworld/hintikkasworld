import { AndFormula, AtomicFormula, EquivFormula, Formula } from '../formula/formula';
import { SymbolicEpistemicModelBDD } from './symbolic-epistemic-model-bdd';

export interface SymbolicRelation {
    formula(): Formula;
}

export class FormulaRelation implements SymbolicRelation {
    /**
     * What is known by the agent : String (which are atoms), or Formula.
     * "a" <=> AtomicFormula("a")
     */
    protected readonly _formula: Formula;

    constructor(formula: Formula) {
        this._formula = formula;
    }

    /**
     * Return the formula of the SymbolicRelation
     */
    formula(): Formula {
        return this._formula;
    }
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
    formula(): Formula {
        let list_formula: Formula[] = this.observedVariables.map((form) => {
            if (typeof form === 'string') {
                return new EquivFormula(new AtomicFormula(form), new AtomicFormula(SymbolicEpistemicModelBDD.getPrimedVarName(form)));
            } else {
                return new EquivFormula(form, form.renameAtoms(SymbolicEpistemicModelBDD.getPrimedVarName));
            }
        });
        return new AndFormula(list_formula);
    }
}
