import { BDDWorkerService } from '../../../../services/bddworker.service';
import { SuccessorSet } from './successor-set';
import { World } from './world';
import { Valuation } from './valuation';
import { SymbolicEpistemicModel } from './symbolic-epistemic-model';
import { BDDNode } from './bddnode';
import { WorldValuation } from './world-valuation';

export class SymbolicSuccessorSet implements SuccessorSet {
    private bdd: Promise<BDDNode>;
    private atoms: string[];
    private toWorld: (Valuation) => World;
    private number: number = undefined; // number of successors (memoization)
    private finished = false;

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
        return this.alreadyOutput[key] != undefined;
    }

    /**
     *
     * @param valuation
     * declare that the (world corresponding to) valuation has already been output by getSomeSuccessors
     */
    private declareAlreadyOutput(valuation: Valuation) {
        let key = valuation.toString();
        this.alreadyOutput[key] = true;
    }

    constructor(toWorld: (Valuation) => World, atoms: string[], bdd: Promise<BDDNode>) {
        this.toWorld = toWorld;
        this.atoms = atoms;
        this.bdd = bdd;
    }

    /**
     * @returns the number of successors
     */
    async getNumber(): Promise<number> {
        console.log('le BDD est : ' + (await this.bdd));
        if (this.number == undefined) {
            this.number = await BDDWorkerService.countSolutions(await this.bdd, this.atoms);
        } // memoization
        return this.number;
    }

    async getSomeSuccessors(): Promise<World[]> {
        console.log('load getSomeSuccessors');
        const arrayValToArrayWorlds = (A: Valuation[]): World[] => {
            return A.map((val: Valuation) => this.toWorld(val));
        };

        if ((await this.getNumber()) < 10) {
            console.log('...less than 10 succs');
            if (this.finished) {
                console.log('set of successors finished!');
                return [];
            } else {
                this.finished = true;
                console.log('set of successors: we compute the ' + (await this.getNumber()) + ' successors!');
                let A = await BDDWorkerService.pickAllSolutions(await this.bdd, this.atoms);
                let V = A.map((props) => new Valuation(props));
                return arrayValToArrayWorlds(V);
            }
        } else {
            console.log('...more than 10 succs');
            const sols = [];
            for (let i = 0; i < 5; i++) {
                const val: Valuation = new Valuation(await BDDWorkerService.pickRandomSolution(await this.bdd, this.atoms));
                if (!this.isAlreadyBeenOutput(val)) {
                    sols.push(val);
                    this.declareAlreadyOutput(val);
                }
            }
            console.log('getSomeSuccessors outputs ' + sols.length + ' solutions.');
            return arrayValToArrayWorlds(sols);
        }
    }

    async getRandomSuccessor(): Promise<World> {
        let val: Valuation = new Valuation(await BDDWorkerService.pickRandomSolution(await this.bdd, this.atoms));
        return this.toWorld(val);
    }
}
