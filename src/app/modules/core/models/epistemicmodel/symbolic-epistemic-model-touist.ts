import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { World } from './world';
import { AndFormula, Formula } from '../formula/formula';
import { SEModelDescriptor } from './descriptor/se-model-descriptor';
import { BehaviorSubject } from 'rxjs';
import { SuccessorSet } from './successor-set';
import { SymbolicSuccessorSetTouist } from './symbolic-successor-set-touist';
import { TouistService } from '../../services/touist.service';

/**
 * it implements an epistemic model described symbolically by means of BDDs
 */
export class SymbolicEpistemicModelTouist implements EpistemicModel {
    static primedString = '_pr';
    private _isLoaded: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private pointedValuation: Valuation; // the valuation that corresponds to the pointed world
    public readonly propositionalAtoms: string[];
    public readonly propositionalPrimes: string[];
    public readonly validPrimeWorlds: Formula;
    public readonly validWorlds: Formula;

    private readonly agents: string[];
    private readonly valToWorld: (val: Valuation) => WorldValuation;
    /**
     * Store for each agent the corresponding Formula
     * this.symbolicRelations[a] represents the relation ---- a --> = {(w, u') | w -- a --> u'}
     */
    private symbolicRelations: { [agent: string]: Formula };

    /**
     * stores the worlds (that are of type WorldValuation) that the user already asked for.
     * keys are strings (from a valuation, you call valuation.toString() to get the key... hhmm.. still a bit weird
     * but I do not know how to improve it yet)
     * values are the worlds themselves.
     */
    private worlds: { [val: string]: WorldValuation } = {};

    /**
     * Creates a symbolic epistemic model using touist as a service for SAT solving the formulas.
     * @param valToWorld a function to transform a valuation into the symbolic world
     * @param descr a descriptor to initialize every
     */
    constructor(valToWorld: (val: Valuation) => WorldValuation, descr: SEModelDescriptor) {
        this.valToWorld = valToWorld;
        this.pointedValuation = descr.getPointedValuation();
        this.agents = descr.getAgents();

        this.propositionalAtoms = descr.getAtomicPropositions();
        this.propositionalPrimes = this.propositionalAtoms.map(SymbolicEpistemicModelTouist.getPrimedVarName);

        this.validWorlds = descr.getSetWorldsFormulaDescription();
        this.validPrimeWorlds = this.validWorlds.renameAtoms((s) => SymbolicEpistemicModelTouist.getPrimedVarName(s));

        this.symbolicRelations = {};
        for (let agent of this.agents) {
            this.symbolicRelations[agent] = descr.getRelationDescription(agent).formula();
        }

        this._isLoaded.next(true);
    }

    /**
     * @param varName
     * @returns the name of the primed variable
     */
    static getPrimedVarName(varName: string) {
        return varName + SymbolicEpistemicModelTouist.primedString;
    }

    /**
     * @param valuation
     * @retuns the world that has this valuation (PS : we suppose unicity of the current world in symbolic model)
     */
    public getWorld(valuation: Valuation): WorldValuation {
        let key = valuation.toString();
        if (this.worlds[key] == undefined) {
            this.worlds[key] = this.valToWorld(valuation);
        }
        return this.worlds[key];
    }

    getMapPrimeToNotPrime(): { [p: string]: string } {
        let map = {};
        for (const value of this.propositionalAtoms) {
            map[SymbolicEpistemicModelTouist.getPrimedVarName(value)] = value;
        }
        return map;
    }

    getRelation(agent: string): Formula {
        return this.symbolicRelations[agent];
    }

    isLoaded(): boolean {
        return this._isLoaded.value;
    }

    isLoadedObservable(): BehaviorSubject<boolean> {
        return this._isLoaded;
    }

    getAgents(): string[] {
        return this.agents;
    }

    /**
     @returns the pointed world
     **/
    getPointedWorld() {
        return this.getWorld(this.pointedValuation);
    }

    getSuccessors(w: WorldValuation, a: string): SuccessorSet {
        let w_formula = w.valuation.toFormula();

        let relation = this.symbolicRelations[a];

        // make the formula satisfied for all v': world, where w --> a --> v'
        let f = new AndFormula([w_formula, relation, this.validPrimeWorlds]);

        // primes will be removed by the successor set using the primeMap
        let primeMap = this.getMapPrimeToNotPrime();
        return new SymbolicSuccessorSetTouist(
            (val) => this.valToWorld(val),
            this.propositionalPrimes,
            (p) => primeMap[p],
            f
        );
    }

    /**
     * @param formula a modal formula
     * @returns true if the formula is true in the real world (the pointed one)
     */
    async check(formula: Formula): Promise<boolean> {
        let v = await TouistService.fetchModel(new AndFormula([this.pointedValuation.toFormula(), formula]));
        return v.length > 0;
    }
}
