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
    private fetched: boolean;
    private primeMap: (string) => string;

    constructor(toWorld: (Valuation) => World, primeAtoms: string[], primeMap: (string) => string, possibleWorlds: Formula) {
        this.toWorld = toWorld;
        this.possibleWorlds = possibleWorlds;
        this.fetched = false;
        this.primeMap = primeMap;

        this.primeAtoms = new Set<string>();
        for (let atom of primeAtoms) {
            this.primeAtoms.add(atom);
        }
    }

    async fetchSuccessors() {
        if (this.fetched) {
            return;
        }
        for (let rawProps of await TouistService.fetchModels(this.possibleWorlds, 50)) {
            let props = rawProps.filter((p) => this.primeAtoms.has(p))
                                .map(this.primeMap);

            this.successorsCache.push(new Valuation(props));
        }
        this.fetched = true;
    }

    /**
     * @returns the number of successors
     */
    async length(): Promise<number> {
        return 0; // This is very expensive for SAT based solvers (at least with touist at the moment)
    }

    async getSomeSuccessors(): Promise<World[]> {
        await this.fetchSuccessors();

        let sols: World[] = [];
        for (let i = 0; i < 5 && this.successorsCache.length > 0; i++) {
            sols.push(this.toWorld(this.successorsCache.pop()));
        }
        return sols;
    }

    async getRandomSuccessor(): Promise<World> {
        await this.fetchSuccessors();

        if (this.successorsCache.length > 0) {
            return this.toWorld(this.successorsCache.pop());
        } else {
            return null;
        }
    }
}
