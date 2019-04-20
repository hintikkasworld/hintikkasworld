
import { environment } from './../../../../../environments/environment';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { SymbolicRelation, Obs } from '../epistemicmodel/symbolic-relation';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Formula, ExactlyFormula, AndFormula, AtomicFormula, NotFormula, KFormula, OrFormula } from '../formula/formula';
import { ExplicitToSymbolic } from '../eventmodel/explicit-to-symbolic';
import { EventModelAction } from './../environment/event-model-action';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import { PropositionalAssignmentsPostcondition } from './../eventmodel/propositional-assignments-postcondition';
import { BDD } from './../formula/bdd';
import { MyTestForBDD } from "./test_bdd";

/**
 * @param valuation a valuation
 * */
class SimpleHanabiWorld extends WorldValuation {

    static readonly cardSuits = ["green", "blue", "orange", "red"];
    static readonly cardValues = ["1", "2", "3", "4", "5"];
    static readonly cardWidth = 9;
    static readonly cardHeight = 8;
    static readonly cardNumber = 5;

    constructor(valuation: Valuation) {
        super(valuation);

        this.agentPos["a"] = { x: 64, y: 16, r: 8 };
        this.agentPos["b"] = { x: 128 - SimpleHanabiWorld.cardWidth - 10, y: 32, r: 8 };
        this.agentPos["c"] = { x: 64, y: 48, r: 8 };
        this.agentPos["d"] = { x: 20, y: 32, r: 8 };

    }


    static drawHanabiCard(context: CanvasRenderingContext2D, agent: string, i: number, cardSuit: string, cardValue: string) {
        let x, y, dx, dy;
        if (agent == "a") { x = 64 - SimpleHanabiWorld.cardNumber / 2 * SimpleHanabiWorld.cardWidth; y = 0; dx = SimpleHanabiWorld.cardWidth; dy = 0; }
        if (agent == "b") { x = 128 - SimpleHanabiWorld.cardWidth; y = 10; dx = 0; dy = SimpleHanabiWorld.cardHeight; }
        if (agent == "c") { x = 64 - SimpleHanabiWorld.cardNumber / 2 * SimpleHanabiWorld.cardWidth; y = 56; dx = SimpleHanabiWorld.cardWidth; dy = 0; }
        if (agent == "d") { x = 0; y = 10; dx = 0; dy = SimpleHanabiWorld.cardHeight; }

        SimpleHanabiWorld.drawCard(context, { x: x + i * dx, y: y + i * dy, w: SimpleHanabiWorld.cardWidth, h: SimpleHanabiWorld.cardHeight, fontSize: 5, color: cardSuit, text: cardValue });

    }

    draw(context: CanvasRenderingContext2D) {
        for (let agent of environment.agents) {
            let i = 0;
            for (let card = 0; card < SimpleSymbolicHanabi.nbCards; card++)
                if (this.modelCheck(SimpleSymbolicHanabi.getVarName(agent, card))) {
                    SimpleHanabiWorld.drawHanabiCard(context, agent, i, "red", card.toString());
                    i++;
                }
            this.drawAgents(context);
        }
    }

}

/**
 * Description of atomic variables :
 * 
 * var_a_c : agent a has card c
 *
 * Values of cards, with the (c modulo 10) result :
 *  c % 10 : 1 2 3 4 5 6 7 8 9 10
 *  value  : 1 1 1 2 2 3 3 4 4 5
 *
 * Colors : 
 *   ["white", "red", "blue", "yellow", "green"]
 *   0..9     10..19  20..29   30..39   40..49 
 * 
 * Caution : This Hanabi doesn't use the position of cards.
 */
export class SimpleSymbolicHanabi extends ExampleDescription {

    static ok: boolean = false;

    /**
     * Number of cards in the game Hanabi
     */
    static readonly nbCards: number = 2;

    /**
     * List of agents
     */
    private agents = ["a", "b", "c", "d"];
    /**
     * List of cards owners : agents + t:table, p:draw, e:exil (or discarding like 'd' ?)
     */
    private owners = this.agents.concat(["t", "p", "e"]);  /* agents */
    /**
     * List of propositional variables
     */
    private variables: string[];

    getName() { return "SimpleSymbolicHanabi"; }

    static getVarName(agent: string, card: number) { return "var_" + agent + "_" + card; }


    getWorldExample() { return new SimpleHanabiWorld(new Valuation([SimpleSymbolicHanabi.getVarName("a", 2)])); }


    getInitialEpistemicModel() {

        /* DIRTY TESTS HERE.... */
        //      MyTestForBDD.run();


        /* Creation of all variables getVarName */
        let variables: string[] = [];
        this.owners.forEach((agent) => {
            for (let i = 0; i < SimpleSymbolicHanabi.nbCards; i++) {
                variables.push(SimpleSymbolicHanabi.getVarName(agent, i));
            }
        });
        this.variables = variables;

        console.log("Variables", variables);

        /* Create Obs <<SymbolicRelation>> which represent relations of each agent like var_a_c <-> var_a_c_p */
        let symbolicRelations: Map<string, SymbolicRelation> = new Map();
        this.agents.forEach((agent) => {
            let liste_rel: (Formula | string)[] = [];
            /* Reciprocity of cards : agent does'nt see all variables of himself and draw */
            this.owners.forEach((agentb) => {
                for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                    if (agent != agentb && agent != "p") {
                        liste_rel.push(SimpleSymbolicHanabi.getVarName(agentb, c));
                    };
                };
            });

            /* Enumeration of agent's card : : agent see the number of his cards : 0 <-> 0p and 1 <-> 1p and ... */
            let his_cards = [];
            for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                his_cards.push(SimpleSymbolicHanabi.getVarName(agent, c));
            }
            for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                for (var i = 1; i < 6; i++) {
                    liste_rel.push(new ExactlyFormula(i, his_cards));
                };
            };
         //   console.log("ListeRel", liste_rel);
            symbolicRelations.set(agent, new Obs(liste_rel));

        });

       // console.log("RelationsSymboliques", relationsSymboliques);

        /* Unicity of cards : a card is here only once : a:1 but no b:1 ... */
        let liste_rules = [];
        for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
            let cards = []
            this.owners.forEach((agent) => {
                cards.push(SimpleSymbolicHanabi.getVarName(agent, c));
            });
            liste_rules.push(new ExactlyFormula(1, cards));
        }
        let rules = new AndFormula(liste_rules);

       // console.log("Rules", rules);

        let M = SymbolicEpistemicModel.build(SimpleHanabiWorld, this.agents, variables, symbolicRelations, rules);

        console.log("Fin SEM");

        let cardInHand_Begin = 2;
        let count = 0;

        let propositions: { [id: string]: boolean } = {};
        this.agents.forEach((current_agent) => {
            for (var c = 0; c < cardInHand_Begin; c++) {
                propositions[SimpleSymbolicHanabi.getVarName(current_agent, count)] = true;
                count += 1;
            };
        });
        for (var c = count; c < count + cardInHand_Begin; c++) {
            propositions[SimpleSymbolicHanabi.getVarName("p", c)] = true;
        };

        //console.log("MapVal", propositions);

        variables.forEach((variable) => {
            if (!(variable in propositions)) {
                propositions[variable] = false;
            }
        });

        console.log("Valuation", propositions);

        M.setPointedValuation(new Valuation(propositions));


        function test(M: SymbolicEpistemicModel) {
            console.log("TEST");

            console.log("InitialWorld", new Valuation(propositions));
    
            console.log("Graphe a", M.getAgentSymbolicRelation("a"));
    
            console.log("Pick one", BDD.bddService.pickOneSolution(M.getAgentSymbolicRelation("a")));
    
            console.log(BDD.bddService.pickSolutions(M.getAgentSymbolicRelation("a"), 10));
    
            let form = new KFormula("a", new AtomicFormula(SimpleSymbolicHanabi.getVarName("a", 0)));
            console.log(form.prettyPrint(), M.check(form));
            let form2 = new KFormula("a", new AtomicFormula(SimpleSymbolicHanabi.getVarName("b", 1)));
            console.log(form2.prettyPrint(), M.check(form2));
    
            let form3 = new KFormula("b", new AtomicFormula(SimpleSymbolicHanabi.getVarName("a", 0)));
            console.log(form3.prettyPrint(), M.check(form3));
            let form4 = new KFormula("b", new AtomicFormula(SimpleSymbolicHanabi.getVarName("b", 1)));
            console.log(form4.prettyPrint(), M.check(form4));
    
            let form5 = new KFormula("a", new OrFormula([
                new AtomicFormula(SimpleSymbolicHanabi.getVarName("b", 1)),
                new AtomicFormula(SimpleSymbolicHanabi.getVarName("b", 2))]));
            console.log(form5.prettyPrint(), M.check(form5));
    
        }


        //test(M);
      
        return M;
    }


    getActions() {
        return [];
        console.log("BEGIN ACTION", SimpleSymbolicHanabi.ok);

        const that = this;

        function draw(current_agent) {

            console.log(current_agent + " draws.");

            var E = new ExplicitEventModel();

            for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                let post = {};
                post[SimpleSymbolicHanabi.getVarName(current_agent, c)] = true;
                post[SimpleSymbolicHanabi.getVarName("p", c)] = false;

                let pre = new AndFormula([
                    new AtomicFormula(SimpleSymbolicHanabi.getVarName("p", c)),
                    new NotFormula(
                        new AtomicFormula(SimpleSymbolicHanabi.getVarName(current_agent, c))
                    )]
                );
                console.log(pre, post);
                E.addAction(current_agent + " draws " + c, pre, new PropositionalAssignmentsPostcondition(post));
            }

            for (let agent of that.agents) {
                E.makeReflexiveRelation(agent);
            }

            for (let event in E.getNodes()) {
                for (let event2 in E.getNodes()) {
                    E.addEdge(current_agent, event, event2);
                }
            }
            E.setPointedAction(current_agent + " draws " + (SimpleSymbolicHanabi.nbCards - 1));
            console.log("end draw");
            return E;

        }

        function play(agent, card, destination) {

            console.log(agent + " " + destination + " " + card);

            var E = new ExplicitEventModel();

            let post = {};

            post[SimpleSymbolicHanabi.getVarName(agent, card)] = false;
            post[SimpleSymbolicHanabi.getVarName(destination, card)] = true;

            let pre = new AndFormula([
                new AtomicFormula(SimpleSymbolicHanabi.getVarName(agent, card)),
                new NotFormula(
                    new AtomicFormula(SimpleSymbolicHanabi.getVarName(destination, card))
                )]
            );

            let name = agent + " play " + card;

            E.addAction(name, pre, new PropositionalAssignmentsPostcondition(post));

            for (let agent in that.agents) {
                E.makeReflexiveRelation(agent);
            }

            return E;
        }

        function valueAnnoucement(agent, nbCards, value) {

            console.log(agent + " " + nbCards + " " + value)

            var E = new ExplicitEventModel();

            let liste_var = [];

            let nbcolors = SimpleSymbolicHanabi.nbCards / 10;
            let nbcardsbyvalue = [3, 2, 2, 2, 1]
            let sum = [0, 4, 6, 8, 9]

            for (var color = 0; color < nbcolors; color++) {
                for (var c = 0; c < nbcardsbyvalue[value - 1]; c++) {
                    liste_var.push(SimpleSymbolicHanabi.getVarName(agent, c + (10 * nbcolors) + sum[value]));
                };
            }

            let pre = new ExactlyFormula(nbCards, liste_var);
            let name = nbCards + " out of " + value;
            E.addAction(name, pre);

            for (let agent in that.agents) {
                E.makeReflexiveRelation(agent);
            }
            return E;
        }

        function colorAnnoucement(agent, nbCards, color) {

            console.log(agent + " " + nbCards + " " + color)

            var E = new ExplicitEventModel();

            let liste_var = [];

            let nbcolors = SimpleSymbolicHanabi.nbCards / 10;

            for (var c = (nbcolors - 1) * 10; c < ((nbcolors - 1) * 10) + 10; c++) {
                liste_var.push(SimpleSymbolicHanabi.getVarName(agent, c));
            };

            let pre = new ExactlyFormula(nbCards, liste_var);
            let name = nbCards + " out of " + color;
            E.addAction(name, pre);

            for (let agent in that.agents) {
                E.makeReflexiveRelation(agent);
            }
            return E;
        }

        let list = [];


        /* DRAWS */
        //for (let agent of this.agents) {
        console.log(this.agents[0]);
        let ema = new EventModelAction(
            {
                name: "Agent " + this.agents[0] + " draws a card.",
                eventModel: ExplicitToSymbolic.translate(draw(this.agents[0]), this.variables, this.agents)
            }
        );
        list.push(ema);

        // for (let agent of this.agents) {
        //     for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
        //         /* PLAY */
        //         let ema = new EventModelAction(
        //             {
        //                 name: "Agent " + agent + " plays card " + c + ".",
        //                 eventModel: ExplicitToSymbolic.translate(play(agent, c, "t"), this.variables)
        //             }
        //         );
        //         list.push(ema);
        //         /* DISCARD */
        //         let ema2 = new EventModelAction(
        //             {
        //                 name: "Agent " + agent + " discards card " + c + ".",
        //                 eventModel: ExplicitToSymbolic.translate(play(agent, c, "e"), this.variables)
        //             }
        //         );
        //         list.push(ema2);
        //     }
        // }

        // for (let agent of this.agents) {
        //     for (var c = 1; c < SimpleSymbolicHanabi.nbCards + 1; c++) {
        //         for (var val = 1; val < 9; val++) {
        //             let ema2 = new EventModelAction(
        //                 {
        //                     name: "Agent " + agent + " has " + c + " cards of value " + val + ".",
        //                     eventModel: ExplicitToSymbolic.translate(valueAnnoucement(agent, c, val), this.variables)
        //                 }
        //             );
        //             list.push(ema2);
        //         }
        //     }
        // }

        // for (let agent of this.agents) {
        //     for (var color in ["white", "red", "blue", "yellow", "green"]) {
        //         let ema2 = new EventModelAction(
        //             {
        //                 name: "Agent " + agent + " has " + c + " cards of color " + color + ".",
        //                 eventModel: ExplicitToSymbolic.translate(colorAnnoucement(agent, c, color), this.variables)
        //             }
        //         );
        //         list.push(ema2);
        //     }
        // } 

        return [];
    }
}