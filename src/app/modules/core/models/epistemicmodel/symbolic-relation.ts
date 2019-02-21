import { Formula, FormulaFactory } from '../formula/formula';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { BddService } from '../../../../services/bdd.service';
import { BDD } from '../formula/bdd';

export interface SymbolicRelation {
    toFormula():Formula;
    toBDD();
}

export class Obs implements SymbolicRelation{

    protected variables:string[];

    constructor(atoms:string[]){
        this.variables = atoms;
    }
    toFormula(){
        let strFormula:string = "";
        this.variables.forEach(atom => {
            strFormula += "(" + atom + "<->" + SymbolicEpistemicModel.getPrimedVarName(atom) + ")";
        });
        return FormulaFactory.createFormula(strFormula);
    };
    toBDD(){
        return BDD.buildFromFormula(this.toFormula());
    };
}
