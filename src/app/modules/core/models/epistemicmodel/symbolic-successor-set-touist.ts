import { SuccessorSet } from './successor-set';
import { World } from './world';
import { Valuation } from './valuation';
import { Formula } from '../formula/formula';
import { LazyModelFetcher, TouistService } from '../../services/touist.service';

export class SymbolicSuccessorSetTouist implements SuccessorSet {
    private toWorld: (Valuation) => World;

    private primeAtoms: Set<string>;
    private primeMap: (string) => string;

    private successorsCache: Valuation[];
    private n_successors_given: number;

    private fetcher: LazyModelFetcher;

    constructor(toWorld: (Valuation) => World, primeAtoms: string[], primeMap: (string) => string, possibleWorlds: Formula) {
        this.toWorld = toWorld;
        this.primeMap = primeMap;
        this.successorsCache = [];

        this.primeAtoms = new Set<string>();
        for (let atom of primeAtoms) {
            this.primeAtoms.add(atom);
        }
        this.n_successors_given = 0;
        this.fetcher = TouistService.lazyModelFetcher(possibleWorlds);
    }

    async fetchMore(n: number) {
        for (let rawProps of await this.fetcher.fetchModels(n)) {
            let props = rawProps.filter((p) => this.primeAtoms.has(p)).map(this.primeMap);
            this.successorsCache.push(new Valuation(props));
        }
    }

    /**
     * @returns the number of successors
     */
    async length(): Promise<number> {
        return this.successorsCache.length; // This is very expensive for SAT based solvers, so it is only accurate when touist returned all successors
    }

    async getSuccessor(): Promise<World> {
        await this.fetchMore(1);
        let n = this.n_successors_given;

        if (n < this.successorsCache.length) {
            this.n_successors_given++;
            return this.toWorld(this.successorsCache[n]);
        }
        return undefined;
    }

    async getRandomSuccessor(): Promise<World> {
        await this.fetchMore(1);

        return this.toWorld(this.successorsCache[Math.floor(Math.random() * this.successorsCache.length)]);
    }
}
