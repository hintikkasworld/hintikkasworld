import { SuccessorSet } from './successor-set';
import { World } from './world';
import { Valuation } from './valuation';
import { Formula } from '../formula/formula';
import { TouistService } from '../../services/touist.service';

export class SymbolicSuccessorSetTouist implements SuccessorSet {
    private toWorld: (Valuation) => World;
    private possibleWorlds: Formula;

    private primeAtoms: Set<string>;
    private primeMap: (string) => string;

    private successorsCache: Valuation[];
    private n_successors_given: number;

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
        this.n_successors_given = 0;
        this.fetched = this.fetchData();
    }

    async fetchData() {
        let vals = await TouistService.fetchModels(this.possibleWorlds, 50);

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
        return this.successorsCache.length; // This is very expensive for SAT based solvers, so it is only accurate when touist returned all successors
    }

    async getSomeSuccessors(): Promise<World[]> {
        await this.fetched;

        let n = this.n_successors_given;
        let sols: World[] = [];
        for (let i = n; i < n + 5 && i + n < this.successorsCache.length; i++) {
            sols.push(this.toWorld(this.successorsCache[i+n]));
            this.n_successors_given += 1;
        }
        console.log(sols);
        return sols;
    }

    async getRandomSuccessor(): Promise<World> {
        await this.fetched;

        return this.toWorld(this.successorsCache[Math.floor(Math.random() * this.successorsCache.length)]);
    }
}

