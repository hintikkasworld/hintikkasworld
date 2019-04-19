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
    //protected notPrimetoPrime: Map<string, string>;
    //protected primeToNotPrime: Map<string, string>;

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

        console.log("getSucessors", this.getAgentGraphe(a))

        let wValuation = <WorldValuation> w;
        let props: Map<string, boolean> = SymbolicEpistemicModel.valuationToMap(wValuation.valuation);
        //console.log("Props", props);
        let bdd = BDD.bddService.createCube(props);
        
        /**
         * in this method, we will use new this.worldClass(val) to instantiate world with valuation val
         */
        /* Caution : w must be a BDD, need rename function.
        // François says: w is a World, more precisely a ValuationWorld. You should extract a BDD from it. */
        
        //console.log("cube", BDD.bddService.pickAllSolutions(bdd));

        //console.log("graphe", BDD.bddService.pickAllSolutions(this.getAgentGraphe(a)));

        let bdd_and = BDD.bddService.applyAnd([
            BDD.bddService.createCopy(this.getAgentGraphe(a)),
            bdd]);
        
        //console.log("AND", BDD.bddService.pickAllSolutions(bdd_and));

        let forget = BDD.bddService.applyExistentialForget(
            bdd_and,
            this.propositionalAtoms);
        
        //console.log("forget", this.propositionalAtoms, BDD.bddService.pickAllSolutions(forget));

        let res = BDD.bddService.applyRenaming(
            forget,
            SymbolicEpistemicModel.getPrimeToNotPrime(this.propositionalAtoms)); 
        
        //console.log("Calcul bdd sucessors", res);
        
        let sols: Valuation[] = BDD.bddService.pickAllSolutions(res);
        //console.log("Solutions", sols);
        return sols;
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
        console.log("check middle", BDD.bddService.pickAllSolutions(pointeur), SymbolicEpistemicModel.valuationToMap(this.pointed));
        let res = BDD.bddService.applyConditioning(pointeur, SymbolicEpistemicModel.valuationToMap(this.pointed));
        console.log("check end",  BDD.bddService.pickAllSolutions(res))
        return BDD.bddService.isConsistent(res)
    }

    private _query_worlds(phi: Formula): BDDNode {

        let all_worlds = BDD.bddService.createFalse();
        this.graphe.forEach((value: BDDNode, key: string) => {
            console.log("_query_worlds", key, value)
            let f2 = BDD.bddService.applyExistentialForget(BDD.bddService.createCopy(value), this.propositionalPrimes);
            all_worlds = BDD.bddService.applyOr([all_worlds, f2]);
        });

        console.log("f of _query_worlds", BDD.bddService.pickAllSolutions(all_worlds))

        let res = this._query(all_worlds, phi);

        console.log("end _query_worlds", res);
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
            return  BDD.bddService.applyAnd(
                ((<types.AndFormula>phi).formulas).map(
                    (f) => this._query(all_worlds, f)
                )
            );
        }
        if (phi instanceof types.OrFormula) {
            return  BDD.bddService.applyOr(
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
            console.log("new form", form);
            return this._query(all_worlds, form);
        }
        if (phi instanceof types.KposFormula) {
            //console.log("Kpos")
            let mp = BDD.bddService.applyRenaming(
                this._query(all_worlds, (<types.KposFormula>phi).formula),
                SymbolicEpistemicModel.getPrimeToNotPrime(this.propositionalAtoms)
            );
            console.log("mp", BDD.bddService.pickAllSolutions(mp));
            let bdd_a = this.getAgentGraphe((<types.KposFormula>phi).agent);
            let bdd_and = BDD.bddService.applyAnd([BDD.bddService.createCopy(bdd_a), mp]);
            console.log("bdd_and", BDD.bddService.pickAllSolutions(bdd_and).map(v => v.toAssignment(this.propositionalAtoms.concat(this.propositionalPrimes))), this.propositionalPrimes);
            let res = BDD.bddService.applyExistentialForget(bdd_and, this.propositionalPrimes);
            console.log("res Kpos", BDD.bddService.pickAllSolutions(res).map(v => v.toAssignment(this.propositionalAtoms)));
            return res
        }
        if (phi instanceof types.KwFormula) {
            throw new Error("Kw not implemented");
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


    static valuationToMap(valuation: Valuation): Map<string, boolean> {
        let map = new Map<string, boolean>();
        for (var element in valuation.propositions){
            // console.log(element, valuation.propositions[element])
            map.set(element, valuation.propositions[element]);
        }
        return map

    } 

}

