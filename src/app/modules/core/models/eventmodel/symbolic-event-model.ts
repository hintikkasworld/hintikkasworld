import { EventModel } from "./event-model";
import { EpistemicModel } from "../epistemicmodel/epistemic-model";
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { TrivialPostcondition } from './trivial-postcondition';
import { Formula } from '../formula/formula';
import { Postcondition } from './postcondition';
import { environment } from 'src/environments/environment';
import { Graph } from './../graph';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { ExplicitToSymbolic } from './explicit-to-symbolic';

export class SymbolicEventModel implements EventModel  {

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
    static getPostedVarName(varName:string){
        return varName + SymbolicEventModel.getPostedString();
    }

    static getPostedString(){
        return "_+"
    }

    static isPosted(str: string){
        return str.includes(SymbolicEventModel.getPostedString());
    }

    static getPrimedPostedVarName(varName:string){
        return varName + SymbolicEventModel.getPostedString() + SymbolicEpistemicModel.getPrimedString();
    }

    static varsToPosted(vars: string[]){
        let liste = {};
        for(let vari in vars){
            liste[vari] = SymbolicEventModel.getPostedVarName(vari);
        }
        return liste;
    }



    private agents: string[];
    private variables: string[];
    private uniqueEvents: {};
    private agentsEvents: {};
    private pointed: string;

    constructor(agents: string[], variables: string[]) {
        this.agents = agents;
        this.variables = variables;

        this.uniqueEvents = {}
        this.agentsEvents = {}
        for(let agent in agents){
            this.agentsEvents[agent] = {};
        }

    }

    apply(M: EpistemicModel): EpistemicModel{

        if(M instanceof ExplicitEpistemicModel) {
            throw new Error("Need to have an SymbolicEpistemicModel to go with SymbolicEventModel");
        }

        var bdd_single_event = this.getPointedAction();

        for(var agent in this.agents){
            var ev_for_agent = this.getPlayerEvent(this.pointed, agent);
        }
        /* 
        

        

        for agent in self.agents:

            ev_for_agent = event_model.getPlayerEvent(ev_pointe, agent)

            vars_moins = set()
            for var in self.manager.support(ev_for_agent):
                var2 = var.replace("+", "")
                vars_moins.add(var2)
            vars_moins = list(vars_moins)

            vars_plus = [SymbolicEventModel.getPosted(var) for var in vars_moins]

            transfert = {vars_plus[i]: vars_moins[i] for i in range(0, len(vars_moins))}

            # actual pointer
            pointeur = self.agent_graph[agent].pointeur
            pointeur = self.manager.apply("and", pointeur, ev_for_agent)
            pointeur = self.manager.exist(vars_moins, pointeur)
            pointeur = self.manager.let(transfert, pointeur)

            self.agent_graph[agent].setPointed(pointeur)

        # Find the new true world
        res = self.manager.apply("and", self.pointed, bdd_single_pointe)
        sols = self.get_valuation(res)
        if sols == None:
            raise Exception("Pas de solution a cette requete. L'action {} est impossible.".format(ev_pointe))

        res = self.manager.exist([s for s, v in sols.items() if s+"+" in sols.keys()], res)  # Oublie - des +
        res = self.manager.apply("and", res, self.manager.cube({s[:-1]: v for s, v in sols.items() if "+" in s}))  # And Post
        res = self.manager.exist({s: v for s, v in sols.items() if SymbolicEventModel.getPostedSymbol() in s}, res)  #  Oublie des Post
        self.pointed = res
        return res
        */

        return null;
    };

    setPointedAction(e: string): void {
        this.pointed = e;
    }

    getPointedAction(): string{
        return this.pointed;
    }

    addUniqueEvent(key, event){
        this.uniqueEvents[key] = event;
    }

    getUniqueEvent(key){
        return this.uniqueEvents[key];
    }

    addPlayerEvent(key, agent, event){
        this.agentsEvents[agent][key] = event;
    }

    getPlayerEvent(key, agent){
        return this.agentsEvents[agent][key];
    }

    
}
