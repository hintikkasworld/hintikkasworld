import { SymbolicSuccessorSet } from './symbolic-successor-set';
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
import { WorldValuationType } from './world-valuation-type';




/**
 * it implements an epistemic model described symbolically by means of BDDs
 */
export class SymbolicEpistemicModel implements EpistemicModel {

    protected pointedValuation: Valuation; //the valuation that corresponds to the pointed world
    protected readonly propositionalAtoms: string[];
    protected readonly propositionalPrimes: string[];

    protected readonly formulaSetWorlds: BDDNode;
    protected readonly agents: string[];

    protected readonly worldClass: WorldValuationType;

    /**
     * Store for each agent the correspondant BDDNode
     */
    protected symbolicRelations: Map<string, BDDNode>;

    
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
    public getWorld(valuation: Valuation): WorldValuation {
        let key = valuation.toString();
        if (this.worlds[key] == undefined)
            this.worlds[key] = new this.worldClass(valuation);
        // console.log("GET WORLD", this.worlds[key], this.worlds[key].valuation)
        return this.worlds[key];
    }

    

    getAgents(): string[] { return this.agents; }

    /**
     * @param varName
     * @returns the name of the primed variable 
     */
    static getPrimedVarName(varName: string) { return varName + SymbolicEpistemicModel.getPrimedString(); }

    /**
     * @param varName
     * @returns the primed symbol
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
     * @param relations Map of agent: accessibility relations
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

        let rulesPrime = rules.renameAtoms((name) => { return SymbolicEpistemicModel.getPrimedVarName(name); });
        let rulesAndRulesPrime = new AndFormula([rulesPrime, rules]);

        let bddRulesAndRulesPrime = BDD.buildFromFormula(rulesAndRulesPrime);
        console.log("INITIAL RULES", rulesAndRulesPrime, "=>", bddRulesAndRulesPrime);

        let relationsRestrictedToInitialFormula = new Map<string, BDDNode>();
        relations.forEach((value: SymbolicRelation, key: string) => {
            console.log("Starting the computation of the BDD of the symbolic Relation for " + key + "...");
            let bddRelation = value.toBDD();
            console.log("Computation of the BDD of the symbolic Relation for " + key + " finished!");
            relationsRestrictedToInitialFormula.set(key, BDD.bddService.applyAnd([BDD.bddService.createCopy(bddRulesAndRulesPrime), bddRelation]));
            console.log("Computation of the BDD ofthe mix with the rules BDD for the symbolic Relation for " + key + " finished!");
        });
    //    console.log("Symbolic Relations", relations, "=>", relationsRestrictedToInitialFormula);
        console.log("Symbolic relations processed!")
        return new SymbolicEpistemicModel(relationsRestrictedToInitialFormula, worldClass, agents, propositionalAtoms, propositionalPrimes, bddRulesAndRulesPrime);

    }

    constructor(relations: Map<string, BDDNode>, worldClass: WorldValuationType, agents: string[],
        propositionalAtoms: string[], propositionalsPrimes: string[], formulaSetWorlds: BDDNode) {

        // console.log("Agents of SymbolicEpistemicModel", agents);

        this.agents = agents;
        this.pointedValuation = null;
        this.worldClass = worldClass;
        this.propositionalAtoms = propositionalAtoms;
        this.propositionalPrimes = propositionalsPrimes;
        this.formulaSetWorlds = formulaSetWorlds;
        this.symbolicRelations = relations;

        /**François commented this:
        this.symbolicRelations = new Map<string, BDDNode>();
        relations.forEach((value: BDDNode, key: string) => {
            this.symbolicRelations.set(key, value);
        });*/
    }

    /**
    @returns the pointed world
    **/
    getPointedWorld() { return this.getWorld(this.pointedValuation); }

    /**
    @param a valuation
    Makes that valuation to be the pointed one
    **/
    setPointedValuation(valuation: Valuation) { this.pointedValuation = valuation; console.log("SET VALUATION", valuation); }

    getSuccessors(w: World, a: string): SymbolicSuccessorSet {

        // console.log("getSucessors", a, this.getAgentSymbolicRelation(a))

        let props: Map<string, boolean> = SymbolicEpistemicModel.valuationToMap((<WorldValuation>w).valuation);
        //console.log("Props", props);
        let wBDD = BDD.bddService.createCube(props);

    //    console.log("after cube")
        //console.log("cube", BDD.bddService.pickAllSolutions(bdd));
        //console.log("graphe", BDD.bddService.pickAllSolutions(this.getAgentGraphe(a)));

        let bddRelationOnW = BDD.bddService.applyAnd([
            BDD.bddService.createCopy(this.getAgentSymbolicRelation(a)),
            wBDD]);

      //  console.log("after and", BDD.bddService.pickAllSolutions(bddRelationOnW))
        //console.log("AND", BDD.bddService.pickAllSolutions(bdd_and));

        let bddSetSuccessorsWithPrime = BDD.bddService.applyExistentialForget(
            bddRelationOnW,
            this.propositionalAtoms);

        //console.log("after forget", BDD.bddService.pickAllSolutions(bddSetSuccessorsWithPrime))
        //console.log("forget", this.propositionalAtoms, BDD.bddService.pickAllSolutions(forget));

        let bddSetSuccessors = BDD.bddService.applyRenaming(
            bddSetSuccessorsWithPrime,
            SymbolicEpistemicModel.getMapPrimeToNotPrime(this.propositionalAtoms));

        //console.log("Calcul bdd sucessors", BDD.bddService.pickAllSolutions(bddSetSuccessors));

        
        //console.log("Solutions", sols);
        return new SymbolicSuccessorSet(this, bddSetSuccessors, this.propositionalAtoms); 
    };

    getAgentSymbolicRelation(agent: string): BDDNode {
        return this.symbolicRelations.get(agent);
    }

    setAgentSymbolicRelation(agent: string, bddPointer: BDDNode): void {
        this.symbolicRelations.set(agent, bddPointer);
    }

    getInitialFormula(): BDDNode {
        return this.formulaSetWorlds
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

    getWorldClass() { return this.worldClass; }

    /**
     * @param formula a modal formula
     * @returns true if the formula is true in the real world (the pointed one)
     */
    check(formula: Formula): boolean {
        let bddFormulaSemantics = this.queryWorldsSatisfying(formula);
        // console.log("check middle", BDD.bddService.pickAllSolutions(pointeur), SymbolicEpistemicModel.valuationToMap(this.pointed));
        let res = BDD.bddService.applyConditioning(bddFormulaSemantics, SymbolicEpistemicModel.valuationToMap(this.pointedValuation));
        //console.log("check end",  BDD.bddService.pickAllSolutions(res))
        return BDD.bddService.isConsistent(res)
    }

    queryWorldsSatisfying(phi: Formula): BDDNode {

        let allWorlds = BDD.bddService.createFalse();
        this.symbolicRelations.forEach((value: BDDNode, key: string) => {
            let f2 = BDD.bddService.applyExistentialForget(BDD.bddService.createCopy(value), this.propositionalPrimes);
            allWorlds = BDD.bddService.applyOr([allWorlds, f2]);
        });

        // console.log("f of _query_worlds", BDD.bddService.pickAllSolutions(all_worlds))

        let res = this._query(allWorlds, phi);

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
        if (phi instanceof types.ExactlyFormula){
            return BDD.bddService.applyAnd([BDD.buildFromFormula(phi), BDD.bddService.createCopy(all_worlds)])
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
        let literals = [];
        for (var proposition in valuation.propositions) {
            if (valuation.propositions[proposition]) {
                literals.push(new AtomicFormula(proposition));
            } else {
                literals.push(new NotFormula(new AtomicFormula(proposition)));
            }

        }
        // console.log("VALUATION TO FORMULA", valuation, literals)
        return new AndFormula(literals);
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

    clone(): SymbolicEpistemicModel{

        let relations = new Map();
        this.symbolicRelations.forEach((value: BDDNode, key: string) => {
            relations.set(key, BDD.bddService.createCopy(value));
        });
        let formula = BDD.bddService.createCopy(this.formulaSetWorlds);
        return new SymbolicEpistemicModel(relations, this.worldClass, this.agents, this.propositionalAtoms, this.propositionalPrimes, formula)

    }

}

