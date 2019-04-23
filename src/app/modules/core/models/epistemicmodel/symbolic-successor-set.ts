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
    private number: number = undefined;



    /**
     * stores the worlds (that are of type WorldValuation) that the user already asked for.
     * keys are strings (from a valuation, you call valuation.toString() to get the key... hhmm.. still a bit weird
     * but I do not know how to improve it yet)
     * values are the worlds themselves.
     */
    private readonly alreadyOutput = {};

    /**
     * @param valuation 
     * @retuns yes if the corresponding world has already been output
     */
    private isAlreadyBeenOutput(valuation: Valuation): boolean {
        let key = valuation.toString();
        return (this.alreadyOutput[key] != undefined);
    }


    private declareAlreadyOutput(valuation: Valuation) {
        let key = valuation.toString();
        this.alreadyOutput[key] = true;
    }


    constructor(M: SymbolicEpistemicModel, bdd: BDDNode, atoms: string[]) {
        this.M = M;
        this.bdd = bdd;
        this.atoms = atoms;
    }

    getNumber(): number {
        if (this.number == undefined)
            this.number = BDD.bddService.countSolutions(this.bdd, this.atoms);
        return this.number;
    }

    async getSomeSuccessors(): Promise<World[]> {
        const arrayValToArrayWorlds = (A: Valuation[]): World[] => {
            return A.map((val: Valuation) => this.M.getWorld(val));
        }


        if (this.getNumber() < 10)
            return arrayValToArrayWorlds(BDD.bddService.pickAllSolutions(this.bdd, this.atoms));
        else {
            const sols = [];
            for (let i = 0; i < 5; i++) {
                let val: Valuation = BDD.bddService.pickRandomSolution(this.bdd, this.atoms);
                if (!this.isAlreadyBeenOutput(val)) {
                    sols.push(val);
                    this.declareAlreadyOutput(val);
                }
            }
            return arrayValToArrayWorlds(sols);
        }
    }

    async getRandomSuccessor(): Promise<World> {
        let val: Valuation = BDD.bddService.pickRandomSolution(this.bdd, this.atoms);
        return this.M.getWorld(val);
    }

}