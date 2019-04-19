import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';
import { Formula, AndFormula, ExactlyFormula, NotFormula, EquivFormula, AtomicFormula, FormulaFactory, TrueFormula, KposFormula } from '../formula/formula';
import { BDD } from '../formula/bdd';
import * as types from './../formula/formula';
import { BddService, BDDNode } from '../../../../services/bdd.service';

interface WorldValuationType extends Function { new(val: Valuation): WorldValuation; }

/**
 * 
 */
export class SymbolicEpistemicModel implements EpistemicModel {

    protected pointed: Valuation;
    protected propositionalAtoms: string[];
    protected propositionalPrimes: string[];
    protected notPrimetoPrime: Map<string, string>;
    protected primeToNotPrime: Map<string, string>;

    protected initialFormula: BDDNode;
    protected agents: string[];

    protected worldClass: WorldValuationType;

    /**
     * Store for each agent the correspondant BDDNode
     */
    protected graphe: Map<string, BDDNode>;

    getAgents(): string[] {
        return this.agents;
    }
    /**
     * Implementation of Symbolic Epistemique Model
     * Here, with BDD and Cudd
     */

    /*********
     * STATIC
     *********/

    /**
     * Return the name of the primed variable 
     * @param varName
     */
    static getPrimedVarName(varName: string) {
        return varName + SymbolicEpistemicModel.getPrimedString();
    }

    /**
     * Return the primed symbol
     * @param varName
     */
    static getPrimedString() { return "_pr"; }

    /**
     * @param str 
     * @returns true if the variable is a prime variable
     * TODO: François says: only containing "_p" is not correct. It should finish by "_p" no?
     */
    static isPrimed(str: string) {
        return str.includes(SymbolicEpistemicModel.getPrimedString());
    }

    /**
     * @param worldClass the type of worlds that the symbolic epistemic models returns (e.g. BeloteWorld)
     * @param agents list of agents as string
     * @param atoms list of propositional atoms describing the example
     * @param relations Map of agent : accessibility relations
     * @param rules specific rules of the game as Formula
     */
    static build(worldClass: WorldValuationType, agents: string[], atoms: string[], relations: Map<string, SymbolicRelation>, rules: Formula) {

        let propositionalAtoms = [];
        let propositionalPrimes = []

        let to_prime = new Map();
        let not_to_prime = new Map();
        atoms.forEach((value) => {
            let prime = SymbolicEpistemicModel.getPrimedVarName(value);
            propositionalAtoms.push(value);
            propositionalPrimes.push(prime);
            to_prime[value] = prime;
            not_to_prime[prime] = to_prime;

        });

        let rename = rules.renameAtoms((name) => { return SymbolicEpistemicModel.getPrimedVarName(name); });
        let and_rules = new AndFormula([rename, rules]);

        console.log("AND RULES", and_rules);
        let initialFormula = BDD.buildFromFormula(and_rules);
        console.log("AND RULES END");

        let graphe = new Map<string, BDDNode>();
        console.log("ENTER relations", relations);
        relations.forEach((value: SymbolicRelation, key: string) => {
            console.log("parcous relations", value, key);
            let bdd =  value.toBDD();
            console.log("bdd", bdd);
            graphe.set(key, BDD.bddService.applyAnd([BDD.bddService.createCopy(initialFormula), bdd]));
        });

        console.log("Graphe", graphe);

        return new SymbolicEpistemicModel(graphe, worldClass, agents, propositionalAtoms, propositionalPrimes, initialFormula);

    }

    constructor(agentMap: Map<string, BDDNode>, worldClass: WorldValuationType, agents: string[],
        propositionalAtoms: string[], propositionalsPrimes: string[], formula: BDDNode) {

        // console.log("Agents of SymbolicEpistemicModel", agents);

        this.agents = agents;
        this.pointed = null;
        this.worldClass = worldClass;
        this.propositionalAtoms = propositionalAtoms;
        this.propositionalPrimes = propositionalsPrimes;
        this.initialFormula = formula;

        this.graphe = new Map<string, BDDNode>();
        agentMap.forEach((value: BDDNode, key: string) => {
            this.graphe.set(key, value);
            console.log("BDD of", key, value);
        });
    }

    /**
    @returns the pointed world
    **/
    getPointedWorld() { return new this.worldClass(this.pointed); }

    /**
    @returns the pointed world
    TODO François says: newPointedWorld instanceof WorldValuation should never be the case
    **/
    setPointedWorld(newPointedWorld: Valuation) {
        if (newPointedWorld instanceof WorldValuation) {
            this.pointed = newPointedWorld.valuation;
        }
        this.pointed = newPointedWorld;
    }

    getSuccessors(w: World, a: string) {

        let w2 = <WorldValuation> w;
        let props: Map<string, boolean> = SymbolicEpistemicModel.valuationToMap(w2.valuation);
        let bdd = BDD.bddService.createCube(props);
        
        /**
         * in this method, we will use new this.worldClass(val) to instantiate world with valuation val
         */
        /* Caution : w must be a BDD, need rename function.
        // François says: w is a World, more precisely a ValuationWorld. You should extract a BDD from it. */
        
        let res = BDD.bddService.applyRenaming(
            BDD.bddService.applyUniversalForget(
                BDD.bddService.applyAnd([this.graphe[a], bdd]),
                this.propositionalAtoms),
            this.notPrimetoPrime); 
        // return Valuation
        return BDD.bddService.pickSolutions(res);
    };

    getAgentGraphe(agent: string): BDDNode {
        return this.graphe.get(agent);
    }

    setAgentGraphe(agent: string, pointeur: BDDNode): void {
        this.graphe.set(agent, pointeur);
    }

    getInitialFormula(): BDDNode {
        return this.initialFormula
    }

    static getNotPrimeToPrime(atoms: string[]): Map<string, string> {
        let map = new  Map<string, string>();
        atoms.forEach((value) => {
            map.set(SymbolicEpistemicModel.getPrimedVarName(value), value);
        });
        return map;
    }

    static getPrimeToNotPrime(atoms: string[]): Map<string, string> {
        let map = new Map<string, string>();
        atoms.forEach((value) => {
            map.set(value, SymbolicEpistemicModel.getPrimedVarName(value));
        });
        return map;
    }

    getPropositionalAtoms() {
        return this.propositionalAtoms;
    }

    getPropositionalPrimes() {
        return this.propositionalPrimes;
    }

    getWorldClass() {
        return this.worldClass;
    }

    /**
     * 
     * @param formula a modal formula
     */
    check(formula: Formula): boolean {

        let pointeur = this._query_worlds(formula);
        let res = BDD.bddService.applyConditioning(pointeur, SymbolicEpistemicModel.valuationToMap(this.pointed));
        return BDD.bddService.isTrue(res)
    }

    private _query_worlds(phi: Formula): BDDNode {

        let f = new BDD(BDD.bddService.createFalse());

        // let pointeur: BDDNode = BDD.bddService.createCube(SymbolicEpistemicModel.valuationToMap(this.pointed));

        this.graphe.forEach((value: BDDNode, key: string) => {
            let f2 = new BDD(BDD.bddService.applyUniversalForget(value, this.propositionalPrimes));
            f = BDD.or([f, f2]);
        });

        return this._query(f, phi);
    }

    private _query(bdd: BDD, phi: Formula): BDDNode {

        if (phi instanceof types.TrueFormula) { return BDD.bddService.createTrue(); }
        if (phi instanceof types.FalseFormula) { return BDD.bddService.createFalse(); }
        if (phi instanceof types.AtomicFormula) { return BDD.bddService.createLiteral((<types.AtomicFormula>phi).getAtomicString()); }
        if (phi instanceof types.AndFormula) {
            return BDD.bddService.applyAnd((<types.AndFormula>phi).formulas.map((f) => this._query(bdd, f)));
        }
        if (phi instanceof types.OrFormula) {
            return BDD.bddService.applyOr((<types.OrFormula>phi).formulas.map((f) => this._query(bdd, f)));
        }
        if (phi instanceof types.NotFormula) {
            return BDD.bddService.applyNot(this._query(bdd, (<types.NotFormula>phi).formula));
        }
        if (phi instanceof types.KFormula) {
            /* Kpos == K_hat ? */
            return this._query(bdd, new NotFormula(new KposFormula(phi.agent, phi.formula)));
        }
        if (phi instanceof types.KposFormula) {
            let mp = null;
            /* mp = BDD.let(this.primeToNotPrime, this._query(bdd, phi.formula)) */
            let bdd_a = this.graphe[phi.agent];
            let bdd_and = BDD.bddService.applyAnd([bdd_a, mp]);
            return BDD.bddService.applyUniversalForget(bdd_and, this.propositionalPrimes);
        }
        if (phi instanceof types.KwFormula) {
            /* What is this ? */
            throw new Error("formula should be propositional");
        }

        /* else */
        throw new Error("Unknown instance of phi.");
    }


/**
 * 
 * @param valuation 
 * @returns a Boolean formula, actually a conjunction of litterals that 
 * describes that valuation.
 */
    static valuationToFormula(valuation: Valuation): Formula {
        let liste = [];
        for (var element in valuation.propositions) {
            if (valuation[element]) {
                liste.push(new AtomicFormula(element));
            } else {
                liste.push(new NotFormula(new AtomicFormula(element)));
            }

        }
        return new AndFormula(liste);
    }


    static valuationToMap(valuation: Valuation): Map<string, boolean> {
        let map = new Map<string, boolean>();
        for (var element in valuation.propositions){
            map.set(element, valuation[element]);
        }
        return map

    } 

}

