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


/**
 * this interface implements a super type of WorldValuation
 */
interface WorldValuationType extends Function { new(val: Valuation): WorldValuation; }

/**
 * it implements an epistemic model described symbolically by means of BDDs
 */
export class SymbolicEpistemicModel implements EpistemicModel {

    protected pointedValuation: Valuation; //the valuation that corresponds to the pointed world
    protected readonly propositionalAtoms: string[];
    protected readonly propositionalPrimes: string[];

    protected readonly initialFormula: BDDNode;
    protected readonly agents: string[];

    protected readonly worldClass: WorldValuationType;

    /**
     * stores the worlds (that are of type WorldValuation) that the user already asked for.
     * keys are strings (from a valuation, you call valuation.toString() to get the key... hhmm.. still a bit weird
     * but I do not know how to improve it yet)
     * values are the worlds themselves.
     */
    private readonly worlds = {};

    /**
     * @param valuation 
     * @retuns the world that has this valuation (PS : we suppose unicity of the current world in symbolic model)
     */
    private getWorld(valuation: Valuation): WorldValuation {
        let key = valuation.toString();
        if (this.worlds[key] == undefined)
            this.worlds[key] = new this.worldClass(valuation);

        return this.worlds[key];
    }

    /**
     * Store for each agent the correspondant BDDNode
     */
    protected symbolicRelations: Map<string, BDDNode>;

    getAgents(): string[] { return this.agents; }
    /**
     * Implementation of Symbolic Epistemique Model
     * Here, with BDD and Cudd
     */

    /*********
     * STATIC
     *********/

    /**
     * @returns the name of the primed variable 
     * @param varName
     */
    static getPrimedVarName(varName: string) { return varName + SymbolicEpistemicModel.getPrimedString(); }

    /**
     * @returns the primed symbol
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


        let initialFormula = BDD.buildFromFormula(and_rules);
        console.log("INITIAL RULES", and_rules, "=>", initialFormula);

        let graphe = new Map<string, BDDNode>();
        relations.forEach((value: SymbolicRelation, key: string) => {
            let bdd = value.toBDD();
            graphe.set(key, BDD.bddService.applyAnd([BDD.bddService.createCopy(initialFormula), bdd]));
        });
        console.log("Symbolic Relations", relations, "=>", graphe);

        return new SymbolicEpistemicModel(graphe, worldClass, agents, propositionalAtoms, propositionalPrimes, initialFormula);

    }

    constructor(agentMap: Map<string, BDDNode>, worldClass: WorldValuationType, agents: string[],
        propositionalAtoms: string[], propositionalsPrimes: string[], formula: BDDNode) {

        // console.log("Agents of SymbolicEpistemicModel", agents);

        this.agents = agents;
        this.pointedValuation = null;
        this.worldClass = worldClass;
        this.propositionalAtoms = propositionalAtoms;
        this.propositionalPrimes = propositionalsPrimes;
        this.initialFormula = formula;

        this.symbolicRelations = new Map<string, BDDNode>();
        agentMap.forEach((value: BDDNode, key: string) => {
            this.symbolicRelations.set(key, value);
        });
    }

    /**
    @returns the pointed world
    **/
    getPointedWorld() { return this.getWorld(this.pointedValuation); }

    /**
    @param a valuation
    Makes that valuation to be the pointed one
    **/
    setPointedValuation(valuation: Valuation) { this.pointedValuation = valuation; }

    getSuccessors(w: World, a: string): World[] {

        // console.log("getSucessors", this.getAgentSymbolicRelation(a))

        let props: Map<string, boolean> = SymbolicEpistemicModel.valuationToMap((<WorldValuation>w).valuation);
        //console.log("Props", props);
        let wBDD = BDD.bddService.createCube(props);

        /**
         * in this method, we will use new this.worldClass(val) to instantiate world with valuation val
         */
        /* Caution : w must be a BDD, need rename function.
        // François says: w is a World, more precisely a ValuationWorld. You should extract a BDD from it. */

        //console.log("cube", BDD.bddService.pickAllSolutions(bdd));

        //console.log("graphe", BDD.bddService.pickAllSolutions(this.getAgentGraphe(a)));

        let bddRelationOnW = BDD.bddService.applyAnd([
            BDD.bddService.createCopy(this.getAgentSymbolicRelation(a)),
            wBDD]);

        //console.log("AND", BDD.bddService.pickAllSolutions(bdd_and));

        let bddSetSuccessorsWithPrime = BDD.bddService.applyExistentialForget(
            bddRelationOnW,
            this.propositionalAtoms);

        //console.log("forget", this.propositionalAtoms, BDD.bddService.pickAllSolutions(forget));

        let bddSetSuccessors = BDD.bddService.applyRenaming(
            bddSetSuccessorsWithPrime,
            SymbolicEpistemicModel.getMapPrimeToNotPrime(this.propositionalAtoms));

        //console.log("Calcul bdd sucessors", res);

        let sols: Valuation[] = BDD.bddService.pickSolutions(bddSetSuccessors, 4, this.propositionalAtoms);
        //console.log("Solutions", sols);
        return sols.map((val: Valuation) => this.getWorld(val));
    };

    getAgentSymbolicRelation(agent: string): BDDNode {
        return this.symbolicRelations.get(agent);
    }

    setAgentSymbolicRelation(agent: string, bddPointer: BDDNode): void {
        this.symbolicRelations.set(agent, bddPointer);
    }

    getInitialFormula(): BDDNode {
        return this.initialFormula
    }

    static getMapNotPrimeToPrime(atoms: string[]): Map<string, string> {
        let map = new Map<string, string>();
        atoms.forEach((value) => {
            map.set(value, SymbolicEpistemicModel.getPrimedVarName(value));
        });
        return map;
    }

    static getMapPrimeToNotPrime(atoms: string[]): Map<string, string> {
        let map = new Map<string, string>();
        atoms.forEach((value) => {
            map.set(SymbolicEpistemicModel.getPrimedVarName(value), value);
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
     * @returns true if the formula is true in the real world (the pointed one)
     */
    check(formula: Formula): boolean {
        let pointeur = this._query_worlds(formula);
        // console.log("check middle", BDD.bddService.pickAllSolutions(pointeur), SymbolicEpistemicModel.valuationToMap(this.pointed));
        let res = BDD.bddService.applyConditioning(pointeur, SymbolicEpistemicModel.valuationToMap(this.pointedValuation));
        //console.log("check end",  BDD.bddService.pickAllSolutions(res))
        return BDD.bddService.isConsistent(res)
    }

    private _query_worlds(phi: Formula): BDDNode {

        let all_worlds = BDD.bddService.createFalse();
        this.symbolicRelations.forEach((value: BDDNode, key: string) => {
            // console.log("_query_worlds", key, value)
            let f2 = BDD.bddService.applyExistentialForget(BDD.bddService.createCopy(value), this.propositionalPrimes);
            all_worlds = BDD.bddService.applyOr([all_worlds, f2]);
        });

        // console.log("f of _query_worlds", BDD.bddService.pickAllSolutions(all_worlds))

        let res = this._query(all_worlds, phi);

        // console.log("end _query_worlds", res);
        return res;
    }

    private _query(all_worlds: BDDNode, phi: Formula): BDDNode {
        // console.log("Query", bdd, phi)

        if (phi instanceof types.TrueFormula) { return BDD.bddService.createCopy(all_worlds); }
        if (phi instanceof types.FalseFormula) { return BDD.bddService.createFalse(); }
        if (phi instanceof types.AtomicFormula) {
            // console.log("Atom ", (<types.AtomicFormula>phi).getAtomicString())
            return BDD.bddService.applyAnd([
                BDD.bddService.createLiteral((<types.AtomicFormula>phi).getAtomicString()),
                BDD.bddService.createCopy(all_worlds)
            ]
            );
        }
        if (phi instanceof types.AndFormula) {
            return BDD.bddService.applyAnd(
                ((<types.AndFormula>phi).formulas).map(
                    (f) => this._query(all_worlds, f)
                )
            );
        }
        if (phi instanceof types.OrFormula) {
            return BDD.bddService.applyOr(
                ((<types.OrFormula>phi).formulas).map(
                    (f) => this._query(all_worlds, f)
                )
            );
        }
        if (phi instanceof types.NotFormula) {
            //console.log("Not", (<types.NotFormula>phi).formula);
            let res = BDD.bddService.applyNot(this._query(all_worlds, (<types.NotFormula>phi).formula));
            let res2 = BDD.bddService.applyAnd([BDD.bddService.createCopy(all_worlds), res]);
            return res2;
        }
        if (phi instanceof types.KFormula) {
            //console.log("KFormula", (<types.KFormula>phi).agent, (<types.KFormula>phi).formula)
            let form = new types.NotFormula(
                new types.KposFormula(
                    (<types.KFormula>phi).agent,
                    new types.NotFormula((<types.KFormula>phi).formula)
                ));
            // console.log("new form", form);
            return this._query(all_worlds, form);
        }
        if (phi instanceof types.KposFormula) {
            //console.log("Kpos")
            let mp = BDD.bddService.applyRenaming(
                this._query(all_worlds, (<types.KposFormula>phi).formula),
                SymbolicEpistemicModel.getMapPrimeToNotPrime(this.propositionalAtoms)
            );
            // console.log("mp", BDD.bddService.pickAllSolutions(mp));
            let bdd_a = this.getAgentSymbolicRelation((<types.KposFormula>phi).agent);
            let bdd_and = BDD.bddService.applyAnd([BDD.bddService.createCopy(bdd_a), mp]);
            // console.log("bdd_and", BDD.bddService.pickAllSolutions(bdd_and).map(v => v.toAssignment(this.propositionalAtoms.concat(this.propositionalPrimes))), this.propositionalPrimes);
            let res = BDD.bddService.applyExistentialForget(bdd_and, this.propositionalPrimes);
            // console.log("res Kpos", BDD.bddService.pickAllSolutions(res).map(v => v.toAssignment(this.propositionalAtoms)));
            return res
        }
        if (phi instanceof types.KwFormula) {
            // K p or K neg p
            let Knp = new types.KFormula(
                (<types.KwFormula>phi).agent,
                new types.NotFormula((<types.KwFormula>phi).formula)
            );
            let Kp = new types.KFormula(
                (<types.KwFormula>phi).agent,
                new types.NotFormula((<types.KwFormula>phi).formula)
            );
            return this._query(all_worlds, new types.OrFormula([Knp, Kp]));
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
            if (valuation.propositions[element]) {
                liste.push(new AtomicFormula(element));
            } else {
                liste.push(new NotFormula(new AtomicFormula(element)));
            }

        }
        return new AndFormula(liste);
    }

    /**
     * 
     * @param valuation 
     * @returns a Map that associates a Boolean to each proposition (the Boolean is the truth value of that proposition)
     */
    static valuationToMap(valuation: Valuation): Map<string, boolean> {
        let map = new Map<string, boolean>();
        for (var element in valuation.propositions)
            map.set(element, valuation.propositions[element]);

        return map;
    }

}

