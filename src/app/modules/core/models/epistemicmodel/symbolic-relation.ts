import { Formula, FormulaFactory } from '../formula/formula';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { BddService, BDDNode } from '../../../../services/bdd.service';
import { BDD } from '../formula/bdd';

export interface SymbolicRelation {
    toFormula(): Formula;
    toBDD(): BDDNode;
}

/**
 * this class implements a SymbolicRelation for an agent that observes
 * the truth values of some propositional variables.
 */
export class Obs implements SymbolicRelation {

    protected observedVariables: string[];

    constructor(observedVariables: string[]) {
        this.observedVariables = observedVariables;
    }
    toFormula() : Formula {
        let strFormula: string = "";
        this.observedVariables.forEach(atom => {
            strFormula += "(" + atom + "<->" + SymbolicEpistemicModel.getPrimedVarName(atom) + ")";
        });
        return FormulaFactory.createFormula(strFormula);
    }

    toBDD() : BDDNode {
        return BDD.buildFromFormula(this.toFormula());
    }
}
