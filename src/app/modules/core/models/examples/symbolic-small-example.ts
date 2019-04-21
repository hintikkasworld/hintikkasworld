
import { environment } from './../../../../../environments/environment';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { SymbolicRelation, Obs } from '../epistemicmodel/symbolic-relation';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Formula, ExactlyFormula, OrFormula, AndFormula, AtomicFormula, NotFormula, KFormula } from '../formula/formula';
import { ExplicitToSymbolic } from '../eventmodel/explicit-to-symbolic';
import { EventModelAction } from './../environment/event-model-action';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import { PropositionalAssignmentsPostcondition } from './../eventmodel/propositional-assignments-postcondition';

import { BddService } from './../../../../../app/services/bdd.service';
import { BDD } from './../formula/bdd';
import { MyTestForBDD } from "./test_bdd";
import { SymbolicEventModel } from '../eventmodel/symbolic-event-model';

/**
 * @param valuation a valuation
 * */
class SimpleExampleWorld extends WorldValuation {

    static readonly cardSuits = ["green", "blue", "orange", "red"];
    static readonly cardValues = ["1", "2", "3"] // "4", "5"];
    static readonly cardWidth = 9;
    static readonly cardHeight = 8;
    static readonly cardNumber = 5;

    constructor(valuation: Valuation) {
        super(valuation);

        this.agentPos["a"] = { x: 64, y: 16, r: 8 };
        this.agentPos["b"] = { x: 128 - SimpleExampleWorld.cardWidth - 10, y: 32, r: 8 };
        //this.agentPos["c"] = { x: 64, y: 48, r: 8 };
        //this.agentPos["d"] = { x: 20, y: 32, r: 8 };

    }


    static drawHanabiCard(context: CanvasRenderingContext2D, agent: string, i: number, cardSuit: string, cardValue: string) {
        let x, y, dx, dy;
        if (agent == "a") { x = 64 - SimpleExampleWorld.cardNumber / 2 * SimpleExampleWorld.cardWidth; y = 0; dx = SimpleExampleWorld.cardWidth; dy = 0; }
        if (agent == "b") { x = 128 - SimpleExampleWorld.cardWidth; y = 10; dx = 0; dy = SimpleExampleWorld.cardHeight; }
        //if (agent == "c") { x = 64 - SimpleExampleWorld.cardNumber / 2 * SimpleExampleWorld.cardWidth; y = 56; dx = SimpleExampleWorld.cardWidth; dy = 0; }
        //if (agent == "d") { x = 0; y = 10; dx = 0; dy = SimpleExampleWorld.cardHeight; }

        SimpleExampleWorld.drawCard(context, { x: x + i * dx, y: y + i * dy, w: SimpleExampleWorld.cardWidth, h: SimpleExampleWorld.cardHeight, fontSize: 5, color: cardSuit, text: cardValue });

    }

    draw(context: CanvasRenderingContext2D) {
        for (let agent of environment.agents) {
            let i = 0;
            for (let card = 0; card < SymbolicSimpleExample.nbCards; card++)
                if (this.modelCheck(SymbolicSimpleExample.getVarName(agent, card))) {
                    SimpleExampleWorld.drawHanabiCard(context, agent, i, "red", card.toString());
                    i++;
                }
            this.drawAgents(context);
        }
    }

}


export class SymbolicSimpleExample extends ExampleDescription {

    static ok: boolean = true;

    static readonly nbCards: number = 3;
    private agents = ["a", "b"];
    private owners = this.agents.concat(["p"]);  /* agents */
    private variables: string[];

    getName() {
        return "SymbolicSimpleExample";
    }

    static getVarName(agent: string, card: number) {
        return "var_" + agent + "_" + card;
    }


    getWorldExample() {
        return new SimpleExampleWorld(new Valuation([SymbolicSimpleExample.getVarName("a", 2)]));
    }


    getInitialEpistemicModel() {

        /* Francois : DIRTY TESTS HERE.... 
        * MyTestForBDD.run() is launch at the begining of the webapp ??
        */
        MyTestForBDD.run();

        /* Creation of all variables getVarName */
        var variables: string[] = [];
        this.owners.forEach((agent) => {
            for (var i = 0; i < SymbolicSimpleExample.nbCards; i++) {
                variables.push(SymbolicSimpleExample.getVarName(agent, i));
            }
        });
        this.variables = variables;

        console.log("Variables", variables);

        /* Create Obs <<SymbolicRelation>> which represent relations of each agent like var_a_c <-> var_a_c_p */
        let relationsSymboliques: Map<string, SymbolicRelation> = new Map();
        this.agents.forEach((current_agent) => {

            let liste_rel: (Formula|string)[] = [];
            /* Reciprocity of cards : agent all his variables */
            this.owners.forEach((agent) => {
                for (var c = 0; c < SymbolicSimpleExample.nbCards; c++) {
                    if (current_agent == agent) {
                        liste_rel.push(SymbolicSimpleExample.getVarName(agent, c));
                    };
                };
            });

            /* Enumeration of agent's card : : agent see the number of others cards : 0 <-> 0p and 1 <-> 1p and ... */
            this.agents.forEach((other_agent) => {
                let others_cards = [];
                for (var c = 0; c < SymbolicSimpleExample.nbCards; c++) {
                    others_cards.push(SymbolicSimpleExample.getVarName(other_agent, c));
                }
                for (var c = 0; c < SymbolicSimpleExample.nbCards; c++) {
                    for (var i = 1; i < SymbolicSimpleExample.nbCards; i++) {
                        liste_rel.push(new ExactlyFormula(i, others_cards));
                    };
                };
            });
            
            console.log("ListeRel", liste_rel);
            relationsSymboliques.set(current_agent, new Obs(liste_rel));

        });

        console.log("RelationsSymboliques", relationsSymboliques);

        /* Unicity of cards : a card is here only once : a:1 but no b:1 ... */
        let liste_rules = [];
        for (var c = 0; c < SymbolicSimpleExample.nbCards; c++) {
            let cards = []
            this.owners.forEach((agent) => {
                cards.push(SymbolicSimpleExample.getVarName(agent, c));
            });
            liste_rules.push(new ExactlyFormula(1, cards));
        }
        let rules = new AndFormula(liste_rules);

        console.log("Rules", rules);

        let M = SymbolicEpistemicModel.build(SimpleExampleWorld, this.agents, variables, relationsSymboliques, rules);

        console.log("Fin SEM");

        let cardInHand_Begin = 1;
        let count = 0;

        let propositions: { [id: string]: boolean } = {};
        this.agents.forEach((current_agent) => {
            for (var c = 0; c < cardInHand_Begin; c++) {
                propositions[SymbolicSimpleExample.getVarName(current_agent, count)] = true;
                count += 1;
            };
        });
        for (var c = count; c < count + cardInHand_Begin; c++) {
            propositions[SymbolicSimpleExample.getVarName("p", c)] = true;
        };

        console.log("MapVal", propositions);

        variables.forEach((variable) => {
            if (!(variable in propositions)) {
                propositions[variable] = false;
            }
        });

        console.log("Valuation", propositions, );

        M.setPointedValuation(new Valuation(propositions));


        /**
         * Francois : HERE TRY ALL TESTS :
         * getSucessors
         * modelChecking
         * apply
         */

         
        console.log("Graphe a", M.getAgentSymbolicRelation("a"));

        console.log("InitialWorld", new Valuation(propositions).toString());

        for(let val of M.getSuccessors(M.getPointedWorld(), "a"))
            console.log("A successors", val.toString());
        

        for(let val of M.getSuccessors(M.getPointedWorld(), "b"))
            console.log("B successors", val.toString());
        

        let form = new KFormula("a", new AtomicFormula(SymbolicSimpleExample.getVarName("a", 0)));
        console.log(form.prettyPrint(), M.check(form));
        let form2 = new KFormula("a", new AtomicFormula(SymbolicSimpleExample.getVarName("b", 1)));
        console.log(form2.prettyPrint(), M.check(form2));

        let form3 = new KFormula("b", new AtomicFormula(SymbolicSimpleExample.getVarName("a", 0)));
        console.log(form3.prettyPrint(), M.check(form3));
        let form4 = new KFormula("b", new AtomicFormula(SymbolicSimpleExample.getVarName("b", 1)));
        console.log(form4.prettyPrint(), M.check(form4));

        let form5 = new KFormula("a", new OrFormula([
            new AtomicFormula(SymbolicSimpleExample.getVarName("b", 1)),
            new AtomicFormula(SymbolicSimpleExample.getVarName("b", 2))]));
        console.log(form5.prettyPrint(), M.check(form5));


        let actions = this.getActions()

        console.log(actions);

        let newSEM: SymbolicEpistemicModel = actions[0].perform(M);


        console.log("new world", newSEM.getPointedWorld().valuation.toString())
        
        let ci = 0;
        for(let val of newSEM.getSuccessors(newSEM.getPointedWorld(), "a")){
            console.log("A successors", val.toString());
            if(ci > 10){
                break;
            } 
            ci++;
        }
        
        for(let val of newSEM.getSuccessors(newSEM.getPointedWorld(), "b")){
            console.log("B successors", val.toString());
            if(ci > 10){
                break;
            } 
            ci++;
        }

        console.log("FIN")

        return M;
    }


    getActions() {

        // Francois : STOP THE MULTIPLE CALL OF getActions()
        if(!SymbolicSimpleExample.ok) return []
        SymbolicSimpleExample.ok = false;

        console.log("create actions");

        function announce(agents, value) {
            var E = new ExplicitEventModel();
            let pre: Formula = new AtomicFormula(SymbolicSimpleExample.getVarName("p", value))
            let name = "Agents learns draw is " + value +".";
            E.addAction(name, pre);
            for(let agent of agents) E.makeReflexiveRelation(agent);
            E.setPointedAction(name);
            return E;
        }

        let list = [];
        
        for(let card = SymbolicSimpleExample.nbCards-1; card>1; card--){
            list.push(new EventModelAction(
                {
                    name: "Agents learn draw is " + card +".",
                    eventModel: ExplicitToSymbolic.translate(announce(this.agents, card), this.variables, this.agents)
                }
            ));
        }
        
        console.log(list);
        return list;
    }
}