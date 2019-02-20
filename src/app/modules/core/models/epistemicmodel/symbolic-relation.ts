import { Formula } from '../formula/formula';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';

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
        this.variables.forEach(var => {
            strFormula += "(" + var + "<->" + SymbolicEpistemicModel.getPrimedVarName(var) + ")";
        });
        return null;
    };
    toBDD(){
        /* TO DO */
        return null;
    };
}
