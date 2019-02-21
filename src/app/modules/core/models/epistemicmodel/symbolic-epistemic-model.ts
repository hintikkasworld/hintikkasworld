import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';
import { Formula, AndFormula, ExactlyFormula, NotFormula, EquivFormula, AtomicFormula, FormulaFactory } from '../formula/formula';
import { BDD } from '../formula/bdd';


export class SymbolicEpistemicModel implements EpistemicModel{
    
    getAgents(): string[] {
        return this.agents;
    }
    /**
     * Implementation d'un Modele Epistemique Symbolique
     * Ici via des BDD, et Cudd
     */

     /*********
      * STATIC
      *********/
     
    /**
     * Retourne la nom d'une variable en le nom prime
     * @param varName
     */
     static getPrimedVarName(varName:string){
        return varName + SymbolicEpistemicModel.getPrimedString();
    }

    /**
     * Retourne la nom d'une variable en le nom prime
     * @param varName
     */
    static getPrimedString(){
        return "_p";
    }

    protected pointed: Valuation;
    protected propositionalAtoms:string[];
    protected constructionAtoms:string[];
    protected initialFormula:BDD;
    protected agents:string[];
    protected mapAtomDDNode:Map<string, number>;

    protected graphe: Map<string, number>;

    /**
     * 
     * @param atoms liste des atomes propositionnels decrivant l'exemple
     * @param relations Map d'un agent vers ses relations d'accessibilite
     */
    constructor(atoms:string[], constratoms:string[], f: Formula, relations:Map<string, SymbolicRelation>){
        this.pointed = null;

        this.propositionalAtoms = [];
        atoms.forEach( (value) => {
            this.propositionalAtoms.push(value);
            this.propositionalAtoms.push(SymbolicEpistemicModel.getPrimedVarName(value));
        });
        this.constructionAtoms = [];
        constratoms.forEach( (value) => {
            this.constructionAtoms.push(value);
            this.constructionAtoms.push(SymbolicEpistemicModel.getPrimedVarName(value));
        });

        this.graphe = new Map();
        this.agents = [];
        relations.forEach((value: SymbolicRelation, key: string) => {
            this.agents.push(key);
            this.graphe[key] = value.toBDD();
        });

        this.initialFormula = BDD.buildFromFormula(f);
        this.initialFormula = BDD.existentialforget(this.initialFormula, this.constructionAtoms);

    }
    
    /**
    @returns the pointed world
    **/
   getPointedWorld() {
        return this.pointed;
   }

    /**
    @returns the pointed world
    **/
   setPointedWorld(newPointedWorld: any) {
        this.pointed = newPointedWorld;
    }


    getSuccessors(w: World, a: string){

        /**
         * 
         */
        return null;
    };

    get formulaInitial() {
        return this.initialFormula
    }
}


export class BeloteTest extends ExampleDescription {

    /* On suppose 8 coeurs, 8 piques, 8 carreaux, et 8 trefles */
    private nbCards:number = 32;
    private agents = ["a", "b", "c", "d"]

    getName() { 
        return "Belote"; 
    }

    getVarName(agent:string, card:number){
        return "var_" + agent + "_" + card;
    }
    getxName(card:number){
        return "x" + "_" + card;
    }
    getyName(card:number){
        return "y" + "_" + card;
    }    
    getInitialEpistemicModel() {
        /* Creation de toutes les variables getVarName */
        let variables:string[] = [];
        let constructionVariables:string[] = [];
        this.agents.forEach( (agent) => {
            for(var i = 0; i<this.nbCards; i++) {
                variables.push(this.getVarName(agent, i));
                constructionVariables.push(this.getxName(i));
                constructionVariables.push(this.getyName(i));
            }
        });
        var lf:Array<Formula> = new Array();
        this.agents.forEach((agent) => {
            var lv:Array<string> = new Array(); 
            for(var i = 0; i<this.nbCards; i++) {
                lv.push(this.getVarName(agent,i));
                if (agent == "a") {
                    console.log("("+this.getVarName(agent,i)+ " <-> ((not "+this.getxName(i)+ ") and (not "+this.getyName(i)+")))") 
                    lf.push(FormulaFactory.createFormula("("+this.getVarName(agent,i)+ " <-> ((not "+this.getxName(i)+ ") and (not "+this.getyName(i)+")))")) 
                }
                if (agent == "b") {
                    lf.push(FormulaFactory.createFormula("("+this.getVarName(agent,i)+ " <-> ((not "+this.getxName(i)+ ") and "+this.getyName(i)+"))") )
                }
                if (agent == "c") {
                    lf.push(FormulaFactory.createFormula("("+this.getVarName(agent,i)+ " <-> ("+this.getxName(i)+ " and (not "+this.getyName(i)+")))") )
                }
                if (agent == "d") {
                    lf.push(FormulaFactory.createFormula("("+this.getVarName(agent,i)+ " <-> ("+this.getxName(i)+ " and "+this.getyName(i)+"))"))
                } 
            }           
            lf.push(new ExactlyFormula((this.nbCards/(this.agents.length)),lv))                        
        });   

        let formulaInitial = new AndFormula(lf);
        /* Cree l'Obs <<SymbolicRelation>> qui represente 
        les relations pour chaque agent var_a_c <-> var_a_c_p */
        var relationsSymboliques:Map<string, SymbolicRelation> = new Map(); 
        
        this.agents.forEach( (agent) => {
            let agentVariables= [];
            for(var i = 0; i<this.nbCards; i++) {
                agentVariables.push(this.getVarName(agent, i))
            }
            relationsSymboliques[agent] = new Obs(agentVariables);
        });

        
        let M = new SymbolicEpistemicModel(variables,  constructionVariables, formulaInitial, relationsSymboliques);
        M.setPointedWorld(null);

        return M;
    }


    getActions() { return []; }

}