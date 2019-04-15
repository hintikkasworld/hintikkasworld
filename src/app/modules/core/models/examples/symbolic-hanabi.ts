
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import {SymbolicRelation, Obs} from '../epistemicmodel/symbolic-relation';
import {SymbolicEpistemicModel} from '../epistemicmodel/symbolic-epistemic-model';
import {ExactlyFormula, AndFormula, AtomicFormula, NotFormula} from '../formula/formula';
import { ExplicitToSymbolic } from '../eventmodel/explicit-to-symbolic';
import { BDD } from '../formula/bdd';
import { SymbolicEventModel } from './../eventmodel/symbolic-event-model';
import { EventModelAction } from './../environment/event-model-action';
import { EventModel } from './../eventmodel/event-model';
import { Formula, FormulaFactory } from '../formula/formula';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import { PropositionalAssignmentsPostcondition } from './../eventmodel/propositional-assignments-postcondition';
import { ScaleContinuousNumeric } from 'd3';




export class SimpleSymbolicHanabi extends ExampleDescription {

    private nbCards:number = 20;
    /* 
    var_a_3 : agent a has card 3 = card with value 1
    nb : 1 2 3 4 5 6 7 8 9 10
    val: 1 1 1 2 2 3 3 4 4 5

    ["white", "red", "blue", "yellow", "green"]
    0..9     10..19  20..29   30..39   40..49 
    */
    private agents = ["a", "b", "c", "d"];
    private owners = this.agents.concat(["t", "p", "e"]);  /* agents + t:table, p:draw, e:exil*/ 

    private variables: string[];

    getName() { 
        return "SimpleSymbolicHanabi"; 
    }

    getVarName(agent:string, card:number) {
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

        this.variables = variables;
        
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

        function draw(current_agent){

            var E = new ExplicitEventModel();
            
            let events = [];
            
            for(var c = 0; c<this.nbCards; c++) {
                let post  = {};
                post[this.getVarName(current_agent, c)] = true;
                post[this.getVarName("p", c)] = false;
                
                let pre   = new AndFormula([ 
                    new AtomicFormula(this.getVarName("p", c)), 
                    new NotFormula(
                        new AtomicFormula(this.getVarName(current_agent, c))
                    )]
                );

                let name  = current_agent + " pioche " + c;

                E.addAction(name, pre, new PropositionalAssignmentsPostcondition(post));
            }
            
            for(let agent in this.agents){
                E.makeReflexiveRelation(agent);
            }

            for(let event in events){
                for(let event2 in events){
                    E.addEdge(current_agent, event, event2);
                }
            }
            E.setPointedAction(current_agent + " draws " + (this.nbCards-1));
            return E;
            
        }

        function play(agent, card, destination){
            var E = new ExplicitEventModel();

            let post  = {};

            post[this.getVarName(agent, card)] = false;
            post[this.getVarName(destination, card)] = true;
            
            let pre   = new AndFormula([ 
                new AtomicFormula(this.getVarName(agent, card)), 
                new NotFormula(
                    new AtomicFormula(this.getVarName(destination, card))
                )]
            );

            let name  = agent + " play " + c;

            E.addAction(name, pre, new PropositionalAssignmentsPostcondition(post));

            for(let agent in this.agents){
                E.makeReflexiveRelation(agent);
            }

            return E;
        }

        function valueAnnoucement(agent, nbCards, value){
            var E = new ExplicitEventModel();

            let liste_var = [];

            let nbcolors = this.nbCards / 10; 
            let nbcardsbyvalue = [3, 2, 2, 2, 1]
            let sum = [0, 4, 6, 8, 9]

            for(var color = 0; color<nbcolors; color++) {
                for(var c = 0; c<nbcardsbyvalue[value-1]; c++) {
                    liste_var.push(this.getVarName(agent, c+(10*nbcolors) + sum[value]));
                };
            }
            
            let pre = new ExactlyFormula(nbCards, liste_var);
            let post = null;
            let name = nbCards + " out of " + value;
            E.addAction(name, pre, new PropositionalAssignmentsPostcondition(post));

            for(let agent in this.agents){
                E.makeReflexiveRelation(agent);
            }
            return E;
        }

        function colorAnnoucement(agent, nbCards, color){
            var E = new ExplicitEventModel();

            let liste_var = [];

            let nbcolors = this.nbCards / 10; 

            for(var c = (nbcolors-1)*10; c<((nbcolors-1)*10)+10; c++) {
                liste_var.push(this.getVarName(agent, c));
            };
            
            let pre = new ExactlyFormula(nbCards, liste_var);
            let post = null;
            let name = nbCards + " out of " + color;
            E.addAction(name, pre, new PropositionalAssignmentsPostcondition(post));

            for(let agent in this.agents){
                E.makeReflexiveRelation(agent);
            }
            return E;
        }

        let liste = [];
        /* DRAWS */
        for(let agent in this.agents){
            let ema = new EventModelAction(
                {
                name: "Agent " + agent + " draws a card.",
                eventModel: <EventModel> draw(agent)
                }
            );
            liste.push(ema);
        }
        

        for(let agent in this.agents){
            for(var c = 0; c<this.nbCards; c++) {
                /* PLAY */
                let ema = new EventModelAction(
                    {
                    name: "Agent " + agent + " plays card " + c + ".",
                    eventModel: <EventModel> play(agent, c, "t")
                    }
                );
                liste.push(ema);

                let ema2 = new EventModelAction(
                    {
                    name: "Agent " + agent + " discards card " + c + ".",
                    eventModel: <EventModel> play(agent, c, "e")
                    }
                );
                liste.push(ema2);
            }
        }

        for(let agent in this.agents){
            for(var c = 1; c<this.nbCards+1; c++) {
                for(var val = 1; val<9; val++) {
                    let ema2 = new EventModelAction(
                        {
                        name: "Agent " + agent + " has " + c + " cards of value " + val +".",
                        eventModel: <EventModel> valueAnnoucement(agent, c, val)
                        }
                    );
                    liste.push(ema2);
                }
            }
        }

        for(let agent in this.agents){
            for(var color in ["white", "red", "blue", "yellow", "green"]) {
                let ema2 = new EventModelAction(
                    {
                    name: "Agent " + agent + " has " + c + " cards of color " + color +".",
                    eventModel: <EventModel> valueAnnoucement(agent, c, color)
                    }
                );
                liste.push(ema2);
            }
        }

        return liste; 
    }
}