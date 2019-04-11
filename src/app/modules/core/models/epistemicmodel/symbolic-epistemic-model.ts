import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';
import { Formula, AndFormula, ExactlyFormula, NotFormula, EquivFormula, AtomicFormula, FormulaFactory } from '../formula/formula';
import { BDD } from '../formula/bdd';
import { NONE_TYPE } from '@angular/compiler/src/output/output_ast';

interface WorldValuationType extends Function { new(val: Valuation): WorldValuation; }
/**
 * 
 */
export class SymbolicEpistemicModel implements EpistemicModel{
    check(formula: Formula) {
        throw new Error("Method not implemented.");
    }
    

    protected pointed: Valuation;
    protected propositionalAtoms:string[];
    protected propositionalPrimes:string[];
    
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
        return null;
    };

    get formulaInitial() {
        return this.initialFormula
    }
}


export class SimpleSymbolicHanabi extends ExampleDescription {

    private nbCards:number = 10;
    private agents = ["a", "b", "c", "d"];
    private owners = this.agents.concat(["t", "p", "e"]);  /* agents + t:table, p:draw, e:exil*/ 

    getName() { 
        return "SimpleSymbolicHanabi"; 
    }

    getVarName(agent:string, card:number){
        return "var_" + agent + "_" + card;
    }

    getInitialEpistemicModel() {
        /* Creation of all variables getVarName */
        let variables:string[] = [];
        let constructionVariables:string[] = [];
        this.agents.forEach( (agent) => {
            for(var i = 0; i<this.nbCards; i++) {
                variables.push(this.getVarName(agent, i));
            }
        });
        
        /* Create Obs <<SymbolicRelation>> which represent relations of each agent like var_a_c <-> var_a_c_p */
        var relationsSymboliques:Map<string, SymbolicRelation> = new Map(); 
        
        this.agents.forEach( (current_agent) => {
            let liste_rel = [];
            
            /* Reciprocity of cards : agent does'nt see all variables of himself and draw */
            this.owners.forEach( (agent) => {
                for(var c = 0; c<this.nbCards; c++) {
                    if(current_agent != agent && current_agent != "p"){
                        liste_rel.push(this.getVarName(agent, c));
                    };
                };
            });
            
            /* Enumeration of agent's card : : agent see the number of his cards : 0 <-> 0p and 1 <-> 1p and ... */

            for(var c = 0; c<this.nbCards; c++) {
                for(var i = 1; i<6; i++) {
                    liste_rel.push(new ExactlyFormula(i, [this.getVarName(current_agent, c)]));
                };
            };
            console.log("ListeRel", liste_rel);
            relationsSymboliques[current_agent] = new Obs(liste_rel);

        });
        
        console.log("RelationsSymboliques", relationsSymboliques);
        
        /* Unicity of cards : a card is here only once : a:1 but no b:1 ... */
        let liste_rules = [];
        for(var c = 0; c<this.nbCards; c++) {
            let cards = []
            this.owners.forEach( (agent) => {
                cards.push(this.getVarName(agent, c));
            });
            liste_rules.push(new ExactlyFormula(1, cards));
        }
        let rules = new AndFormula(liste_rules);

        console.log(rules);

        let M = new SymbolicEpistemicModel(WorldValuation, this.agents, variables, relationsSymboliques, rules);

        let cardInHand_Begin = 4;
        let count = 0;

        let propositions: { [id: string]: boolean } = {};
        this.agents.forEach( (current_agent) => {
            for(var c = 0; c<cardInHand_Begin; c++) {
                propositions[this.getVarName(current_agent, c)] = true;
                count += 1;
            };
        });
        for(var c = count; c<count+cardInHand_Begin; c++) {
            propositions[this.getVarName("p", c)] = true;
        };

        console.log("MapVal", propositions);

        variables.forEach( (variable) => {
            if(!(variable in propositions)){
                propositions[variable] = false;
            }
        });

        console.log("Valuation", propositions);

        M.setPointedWorld(new WorldValuation(new Valuation(propositions)));

        return M;
    }


    getActions() { return []; }

}