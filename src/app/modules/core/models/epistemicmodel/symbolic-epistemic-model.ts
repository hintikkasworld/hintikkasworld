import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';
import { Formula, AndFormula, ExactlyFormula, NotFormula, EquivFormula, AtomicFormula, FormulaFactory, TrueFormula, KposFormula } from '../formula/formula';
import { BDD} from '../formula/bdd';
import * as types from './../formula/formula';
import { BddService } from '../../../../services/bdd.service';

interface WorldValuationType extends Function { new(val: Valuation): WorldValuation; }

export type BDDNode = number;

/**
 * 
 */
export class SymbolicEpistemicModel implements EpistemicModel{   

    protected pointed: Valuation;
    protected propositionalAtoms:string[];
    protected propositionalPrimes:string[];
    protected notPrimetoPrime: Map<string, string>;
    protected primeToNotPrime: Map<string, string>;
    
    protected initialFormula: BDD;
    protected agents:string[];

    protected worldClass: WorldValuationType;

    /**
     * Store for each agent the correspondant BDDNode
     */
    protected graphe: Map<string, BDD>;

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
     static getPrimedVarName(varName:string){
        return varName + SymbolicEpistemicModel.getPrimedString();
    }

    /**
     * Return the primed symbol
     * @param varName
     */
    static getPrimedString(){
        return "_p";
    }

    /**
     * Return if the variable is a prime variable
     * @param str 
     */
    static isPrimed(str: string){
        return str.includes(SymbolicEpistemicModel.getPrimedString());
    }

    /**
     * @param worldClass the type of worlds that the symbolic epistemic models returns (e.g. BeloteWorld)
     * @param agents list of agents as string
     * @param atoms list of propositional atoms describing the example
     * @param relations Map of agent : accessibility relations
     * @param rules specific rules of the game as Formula
     */
    static build(worldClass : WorldValuationType, agents: string[], atoms:string[], relations:Map<string, SymbolicRelation>, rules: Formula){
        
        
        let propositionalAtoms = [];
        let propositionalPrimes = []

        let to_prime = new Map();
        let not_to_prime = new Map();
        atoms.forEach( (value) => {
            let prime = SymbolicEpistemicModel.getPrimedVarName(value);
            propositionalAtoms.push(value);
            propositionalPrimes.push(prime);
            to_prime[value] = prime;
            not_to_prime[prime] = to_prime;

        });

        let rename = rules.renameAtoms( (name) => { return SymbolicEpistemicModel.getPrimedVarName(name); } );
        let and_rules = new AndFormula([rename, rules]);

        let initialFormula = BDD.buildFromFormula(and_rules);

        let graphe = new Map();
        relations.forEach((value: SymbolicRelation, key: string) => {
            graphe[key] = BDD.and([and_rules, value.toBDD()]);
        });

        return new SymbolicEpistemicModel(graphe, worldClass, agents, propositionalAtoms, propositionalPrimes, to_prime, not_to_prime, initialFormula);

    }

    constructor(agentMap: Map<string, BDD>, worldClass : WorldValuationType, agents: string[],
        propositionalAtoms: string[], propositionalsPrimes: string[], toprime: Map<string, string>,
        nottoprime: Map<string, string>, formula: BDD){

        this.agents = agents;
        this.pointed = null;
        this.worldClass = worldClass;
        this.propositionalAtoms = propositionalAtoms;
        this.propositionalPrimes = propositionalsPrimes;
        this.notPrimetoPrime = toprime;
        this.primeToNotPrime = nottoprime;
        this.initialFormula = formula;
    
        this.graphe = new Map();
        agentMap.forEach((value: BDD, key: string) => {
            this.graphe[key] = value;
        });
    }
    
    /**
    @returns the pointed world
    **/
   getPointedWorld() {
        return new this.worldClass(this.pointed);
   }

    /**
    @returns the pointed world
    **/
   setPointedWorld(newPointedWorld: Valuation) {
        if(newPointedWorld instanceof WorldValuation) {
            this.pointed = newPointedWorld.valuation;
        }
        this.pointed = newPointedWorld;
    }

    getSuccessors(w: World, a: string){

        /**
         * in this method, we will use new this.worldClass(val) to instantiate world with valuation val
         */
        /* Caution : w must be a BDD, need rename function
        
        BDD.rename(BDD.universalforget(BDD.and([this.graphe[a], BDD.cube(w.valuation())]), this.propositionalAtoms), this.notPrimetoPrime); 
        */
        
        return null;
    };

    getAgentGraphe(agent: string): BDD {
        return this.graphe[agent];
    }

    setAgentGraphe(agent: string, pointeur: BDD): void {
        this.graphe[agent] = pointeur;
    }

    getInitialFormula(): BDD {
        return this.initialFormula
    }

    getNotPrimeToPrime(): Map<string, string> {
        return this.notPrimetoPrime;
    }

    getPrimeToNotPrime(): Map<string, string> {
        return this.primeToNotPrime;
    }

    getPropositionalAtoms(){
        return this.propositionalAtoms;
    }

    getPropositionalPrimes(){
        return this.propositionalPrimes;
    }

    getWorldClass(){
        return this.worldClass;
    }

    check(formula: Formula): boolean {

        let pointeur = this._query_worlds(formula);
        let res = null;
        // res = BDD.bddService.let(this.pointed, pointeur)
        return BDD.bddService.isTrue(res)
    }

    private _query_worlds(phi: Formula): BDDNode {

        let f = new BDD(BDD.bddService.createFalse());

        let pointeur = null;
        /*pointeur = BDD.bddService.cube(this.pointed.propositions); */

        this.graphe.forEach((value: BDD, key: string) => {
            let f2 = new BDD(BDD.bddService.applyUniversalForget(pointeur, this.propositionalPrimes));
            f = BDD.or([f, f2]);
        });

        return this._query(f, phi);
    }

    private _query(bdd: BDD, phi: Formula): BDDNode {

        if (phi instanceof types.TrueFormula){return BDD.bddService.createTrue();}
        if (phi instanceof types.FalseFormula){return BDD.bddService.createFalse();}
        if (phi instanceof types.AtomicFormula){return BDD.bddService.createLiteral((<types.AtomicFormula>phi).getAtomicString());}
        if (phi instanceof types.AndFormula){
            return BDD.bddService.applyAnd((<types.AndFormula>phi).formulas.map((f) => this._query(bdd, f)));
        }
        if (phi instanceof types.OrFormula){
            return BDD.bddService.applyOr((<types.OrFormula>phi).formulas.map((f) => this._query(bdd, f)));
        }
        if (phi instanceof types.NotFormula){
            return BDD.bddService.applyNot(this._query(bdd, (<types.NotFormula>phi).formula));
        }
        if (phi instanceof types.KFormula){
            /* Kpos == K_hat ? */
            return this._query(bdd, new NotFormula(new KposFormula(phi.agent, phi.formula)));
        }
        if (phi instanceof types.KposFormula){
            let mp = null;
            /* mp = BDD.let(this.primeToNotPrime, this._query(bdd, phi.formula)) */
            let bdd_a = this.graphe[phi.agent];
            let bdd_and = BDD.bddService.applyAnd([bdd_a, mp]);
            return BDD.bddService.applyUniversalForget(bdd_and, this.propositionalPrimes);
        }
        if (phi instanceof types.KwFormula){
            /* What is this ? */
            throw new Error("formula should be propositional");
        }        

        /* else */
        throw new Error("Unknown instance of phi.");
    }

        

    static valuationToFormula(valuation: Valuation): Formula{
        let liste = [];
        for (var element in valuation.propositions) {
            if(valuation[element]){
                liste.push(new AtomicFormula(element));
            }else{
                liste.push(new NotFormula(new AtomicFormula(element)));
            }
            
          }
        return new AndFormula(liste);
    }
}


