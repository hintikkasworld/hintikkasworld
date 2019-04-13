import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';
import { Formula, AndFormula, ExactlyFormula, NotFormula, EquivFormula, AtomicFormula, FormulaFactory, TrueFormula } from '../formula/formula';
import { BDD } from '../formula/bdd';
import * as types from './../formula/formula';

interface WorldValuationType extends Function { new(val: Valuation): WorldValuation; }

export type BDDNode = number;

/**
 * 
 */
export class SymbolicEpistemicModel implements EpistemicModel{   

    protected pointed: Valuation;
    protected propositionalAtoms:string[];
    protected propositionalPrimes:string[];
    protected toPrime: Map<string, string>;
    
    protected initialFormula:BDD;
    protected agents:string[];
    protected mapAtomDDNode:Map<string, number>;
    protected worldClass: WorldValuationType;

    protected graphe: Map<string, number>;

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
     * @param worldClass the type of worlds that the symbolic epistemic models returns (e.g. BeloteWorld)
     * @param atoms list of propositional atoms describing the example
     * @param relations Map of agent : accessibility relations
     */
    constructor(worldClass : WorldValuationType, agents: string[], atoms:string[], relations:Map<string, SymbolicRelation>, rules: Formula){
        
        this.agents = agents;
        this.pointed = null;
        this.worldClass = worldClass;

        this.propositionalAtoms = [];
        this.propositionalPrimes = []

        let to_prime = new Map();

        atoms.forEach( (value) => {
            let prime = SymbolicEpistemicModel.getPrimedVarName(value);
            this.propositionalAtoms.push(value);
            this.propositionalPrimes.push(prime);
            to_prime[value] = prime;
        });
        this.toPrime = to_prime;

        let rename = rules.renameAtoms( (name) => { return SymbolicEpistemicModel.getPrimedVarName(name); } );
        let and_rules = new AndFormula([rename, rules]);

        this.initialFormula = BDD.buildFromFormula(and_rules);

        this.graphe = new Map();
        relations.forEach((value: SymbolicRelation, key: string) => {
            this.graphe[key] = BDD.and([and_rules, value.toBDD()]);
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
   setPointedWorld(newPointedWorld: any) {
        this.pointed = newPointedWorld;
    }


    getSuccessors(w: World, a: string){

        /**
         * in this method, we will use new this.worldClass(val) to instantiate world with valuation val
         */
        /* Caution : w must be a BDD, need rename function
        
        BDD.rename(BDD.universalforget(BDD.and([this.graphe[a], BDD.cube(w.valuation())]), this.propositionalAtoms), this.toPrime); 
        
        */
        
        return null;
    };

    get formulaInitial() {
        return this.initialFormula
    }

    check(formula: Formula): boolean {

        let pointeur = this.query_worlds(formula);

        let res = BDD.and([BDD.buildFromFormula(this.valuationToFormula(this.pointed)), pointeur])
        return BDD.bddService.isTrue(res.thisbddNode)
    }

    private query_worlds(phi: Formula): BDD {

        if (phi instanceof types.KposFormula){

        }

        if (phi instanceof types.KwFormula){
        
        }

        /* else */
        return null;
    }

        

    valuationToFormula(valuation: Valuation): Formula{
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


