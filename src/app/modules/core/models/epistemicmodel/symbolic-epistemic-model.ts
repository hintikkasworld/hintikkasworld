import { EpistemicModel } from './epistemic-model';
import { WorldValuation } from './world-valuation';
import { Valuation } from './valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from './world';
import { SymbolicRelation, Obs } from './symbolic-relation';


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

    protected pointed: any;
    protected propositionalAtoms:string[];
    protected agents:string[];
    protected mapAtomDDNode:Map<string, number>;

    protected graphe: number;

    /**
     * 
     * @param atoms liste des atomes propositionnels decrivant l'exemple
     * @param relations Map d'un agent vers ses relations d'accessibilite
     */
    constructor(atoms:string[], relations:Map<string, SymbolicRelation>){
        this.pointed = null;
        
        this.propositionalAtoms = [];
        let SEM = this;
        atoms.forEach(function (value) {
            SEM.propositionalAtoms.push(value);
            SEM.propositionalAtoms.push(SymbolicEpistemicModel.getPrimedVarName(value));
        });

        this.agents = [];
        relations.forEach((value: SymbolicRelation, key: string) => {
            this.agents.push(key);
        });

        
        
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

    getInitialEpistemicModel() {
        /* Creation de toutes les variables getVarName */
        let variables:string[] = [];

        let newThis = this;
        this.agents.forEach(function (agent) {
            for(var i = 0; i<newThis.nbCards; i++) {
                variables.push(newThis.getVarName(agent, i))
            }
        });
        
        /* Cree l'Obs <<SymbolicRelation>> qui represente 
        les relations pour chaque agent var_a_c <-> var_a_c_p */
        var relationsSymboliques:Map<string, SymbolicRelation> = new Map(); 
        
        let newThis2 = this;
        this.agents.forEach(function (agent) {
            let agentVariables= [];
            for(var i = 0; i<newThis2.nbCards; i++) {
                agentVariables.push(newThis2.getVarName(i, agent))
            }
            relationsSymboliques[agent] = new Obs(agentVariables);
        });
        
        let M = new SymbolicEpistemicModel(variables, relationsSymboliques);

        M.setPointedWorld(null);

        return M;
    }


    getActions() { return []; }

}