import { BDD } from './../formula/bdd';
import { BDDNode } from './../../../../services/bdd.service';
import { SuccessorSet } from './successor-set';
import { World } from './world';
import { WorldValuationType } from './world-valuation-type';
import { Valuation } from './valuation';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';

export class SymbolicSuccessorSet implements SuccessorSet {

    private readonly bdd: BDDNode;
    private readonly atoms: string[];
    private readonly M: SymbolicEpistemicModel;

    constructor(M: SymbolicEpistemicModel, bdd: BDDNode, atoms: string[]) {
        this.M = M;
        this.bdd = bdd;
        this.atoms = atoms;
    }
    
    getNumber(): number {
        return BDD.bddService.countSolutions(this.bdd, this.atoms);;
    }

    async getSomeSuccessors(): Promise<World[]> {
        let sols: Valuation[] = BDD.bddService.pickSolutions(this.bdd, 5, this.atoms);
        return sols.map((val: Valuation) => this.M.getWorld(val));
    }

    async getRandomSuccessor(): Promise<World> {
        let val: Valuation = BDD.bddService.pickOneSolution(this.bdd, this.atoms);
        return this.M.getWorld(val);
    }

}