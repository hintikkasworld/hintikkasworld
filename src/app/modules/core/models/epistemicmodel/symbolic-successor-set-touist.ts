import { SuccessorSet } from './successor-set';
import { World } from './world';
import { Valuation } from './valuation';
import { Formula } from '../formula/formula';
import { TouistService } from '../../services/touist.service';

export class SymbolicSuccessorSetTouist implements SuccessorSet {
    private primeAtoms: Set<string>;
    private toWorld: (Valuation) => World;
    private possibleWorlds: Formula;
    private successorsCache: Valuation[];
    private primeMap: (string) => string;
    private n_successors: number;
    private fetched: Promise<void>;

    constructor(toWorld: (Valuation) => World, primeAtoms: string[], primeMap: (string) => string, possibleWorlds: Formula) {
        this.toWorld = toWorld;
        this.possibleWorlds = possibleWorlds;
        this.primeMap = primeMap;
        this.successorsCache = [];

        this.primeAtoms = new Set<string>();
        for (let atom of primeAtoms) {
            this.primeAtoms.add(atom);
        }
        this.n_successors = 0;
        this.fetched = this.fetchData();
    }

    async fetchData() {
        let vals = await TouistService.fetchModels(this.possibleWorlds, 50);
        this.n_successors = vals.length;

        console.log('Touist returned vals: ', vals);
        for (let rawProps of vals) {
            let props = rawProps.filter((p) => this.primeAtoms.has(p)).map(this.primeMap);

            this.successorsCache.push(new Valuation(props));
        }
    }

    /**
     * @returns the number of successors
     */
    async length(): Promise<number> {
        await this.fetched;
        return this.n_successors; // This is very expensive for SAT based solvers, so it is only accurate when touist returned all successors
    }

    async getSomeSuccessors(): Promise<World[]> {
        await this.fetched;

        let sols: World[] = [];
        for (let i = 0; i < 5 && this.successorsCache.length > 0; i++) {
            sols.push(this.toWorld(this.successorsCache.pop()));
        }
        return sols;
    }

    async getRandomSuccessor(): Promise<World> {
        await this.fetched;

        if (this.successorsCache.length > 0) {
            return this.toWorld(this.successorsCache.pop());
        } else {
            return null;
        }
    }
}
