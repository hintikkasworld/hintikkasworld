
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import {SymbolicRelation, Obs} from '../epistemicmodel/symbolic-relation';
import {SymbolicEpistemicModel} from '../epistemicmodel/symbolic-epistemic-model';
import {ExactlyFormula, AndFormula} from '../formula/formula';
import { BDD } from '../formula/bdd';
import { SymbolicEventModel } from './../eventmodel/symbolic-event-model';
import { EventModelAction } from './../environment/event-model-action';
import { EventModel } from './../eventmodel/event-model';
import { Formula, FormulaFactory } from '../formula/formula';


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


    getActions() { 
        
        let liste = [];
        
        liste.push(
            new EventModelAction({name: "Action 1", 
                eventModel: SymbolicEventModel.getEventModelPublicAnnouncement(FormulaFactory.createFormula("(ma or mb)"))}));
        
        return liste; 
    
    }

}