import { BDDWorkerService } from '../../../../services/bddworker.service';
import { SuccessorSet } from './successor-set';
import { World } from './world';
import { Valuation } from './valuation';
import { BDDNode } from './bddnode';

export class SymbolicSuccessorSet implements SuccessorSet {
    private bdd: Promise<BDDNode>;
    private atoms: string[];
    private toWorld: (Valuation) => World;
    private n_sucessors: number = undefined; // number of successors (memoization)
    private successors_given = 0;

    /**
     * Set of worlds already output where identifier is their valuation as strings
     */
    private readonly alreadyOutput: { [val: string]: {} } = {};

    constructor(toWorld: (Valuation) => World, atoms: string[], bdd: Promise<BDDNode>) {
        this.toWorld = toWorld;
        this.atoms = atoms;
        this.bdd = bdd;
    }

    /**
     * @returns the number of successors
     */
    async length(): Promise<number> {
        console.log('le BDD est : ' + (await this.bdd));
        if (this.n_sucessors == undefined) {
            this.n_sucessors = await BDDWorkerService.countSolutions(await this.bdd, this.atoms);
        }
        return this.n_sucessors;
    }

    async getSomeSuccessors(): Promise<World[]> {
        console.log('load getSomeSuccessors');

        let n = await this.length();
        if (this.successors_given >= n) {
            console.log('set of successors finished!');
            return [];
        }

        if (n < 10) {
            console.log('...less than 10 succs, we compute all ' + n + ' of them.');
            this.successors_given = n;

            let A = await BDDWorkerService.pickAllSolutions(await this.bdd, this.atoms);
            return A.map((props) => this.toWorld(new Valuation(props)));
        } else {
            console.log('...more than 10 succs');
            let sols = [];
            for (let i = 0; i < 5; i++) {
                const val: Valuation = new Valuation(await BDDWorkerService.pickRandomSolution(await this.bdd, this.atoms));
                let val_s = val.toString();
                if (!this.alreadyOutput.hasOwnProperty(val_s)) {
                    sols.push(this.toWorld(val));
                    this.alreadyOutput[val_s] = {};
                }
            }
            console.log('getSomeSuccessors outputs ' + sols.length + ' solutions, ' + (n - this.successors_given) + ' to go');
            this.successors_given += sols.length;
            return sols;
        }
    }

    async getRandomSuccessor(): Promise<World> {
        let val: Valuation = new Valuation(await BDDWorkerService.pickRandomSolution(await this.bdd, this.atoms));
        return this.toWorld(val);
    }
}
