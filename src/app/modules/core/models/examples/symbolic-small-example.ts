
import { environment } from './../../../../../environments/environment';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { SymbolicRelation, Obs } from '../epistemicmodel/symbolic-relation';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Formula, ExactlyFormula, AndFormula, AtomicFormula, NotFormula } from '../formula/formula';
import { ExplicitToSymbolic } from '../eventmodel/explicit-to-symbolic';
import { EventModelAction } from './../environment/event-model-action';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import { PropositionalAssignmentsPostcondition } from './../eventmodel/propositional-assignments-postcondition';

import { BddService } from './../../../../../app/services/bdd.service';
import { BDD } from './../formula/bdd';
import { LCONTAINER_LENGTH } from '@angular/core/src/render3/interfaces/container';

/**
 * @param valuation a valuation
 * */
class SimpleExampleWorld extends WorldValuation {

    static readonly cardSuits = ["green", "blue", "orange", "red"];
    static readonly cardValues = ["1", "2", "3", "4", "5"];
    static readonly cardWidth = 9;
    static readonly cardHeight = 8;
    static readonly cardNumber = 5;

    constructor(valuation: Valuation) {
        super(valuation);

        this.agentPos["a"] = { x: 64, y: 16, r: 8 };
        this.agentPos["b"] = { x: 128 - SimpleExampleWorld.cardWidth - 10, y: 32, r: 8 };
        this.agentPos["c"] = { x: 64, y: 48, r: 8 };
        this.agentPos["d"] = { x: 20, y: 32, r: 8 };

    }


    static drawHanabiCard(context: CanvasRenderingContext2D, agent: string, i: number, cardSuit: string, cardValue: string) {
        let x, y, dx, dy;
        if (agent == "a") { x = 64 - SimpleExampleWorld.cardNumber / 2 * SimpleExampleWorld.cardWidth; y = 0; dx = SimpleExampleWorld.cardWidth; dy = 0; }
        if (agent == "b") { x = 128 - SimpleExampleWorld.cardWidth; y = 10; dx = 0; dy = SimpleExampleWorld.cardHeight; }
        if (agent == "c") { x = 64 - SimpleExampleWorld.cardNumber / 2 * SimpleExampleWorld.cardWidth; y = 56; dx = SimpleExampleWorld.cardWidth; dy = 0; }
        if (agent == "d") { x = 0; y = 10; dx = 0; dy = SimpleExampleWorld.cardHeight; }

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

/**
 * Class to test BDD on with ng serve because ng test doesn"t load cudd.
 */
class MyTestForBDD {

    private static n: number = 0;

    /**
     * Run tests with MyTestForBDD.run()
     */
    static run(): void{
        console.log(" === Run tests ===")
        MyTestForBDD.testInitialisation();
        MyTestForBDD.simpleFormula();
        MyTestForBDD.someBDDMethod();
        MyTestForBDD.testPick();
        console.log(" ==> " + MyTestForBDD.n + " success.")
        console.log(" === End tests ===")
    }

    /**
     * Assertion method
     * @param condition conditon as boolean
     * @param message message as string
     */
    private static assert(condition: boolean, message: string){
        MyTestForBDD.n = MyTestForBDD.n + 1;
        if(!condition){
            message = message || "Assertion failed";
            if (typeof Error !== "undefined"){
                throw new Error(message);
            }
            throw message; //fallback
        }else{
            console.log("OK : '" + message + "'")
        }
    }

    /**
     * console.log variable and successors in BDDNode
     * @param variable 
     */
    private static printThenElse(variable: number): void{
        let service = BDD.bddService;
        console.log(service.getAtomOf(variable), ":", variable, "|", "Then", service.getThenOf(variable), "Else", service.getElseOf(variable), "True :", service.createTrue(), "False:", service.createFalse());
    }

    /**
     * Basic tests
     */
    private static testInitialisation(){

        let service = BDD.bddService;
        MyTestForBDD.assert(service != null, "BDD.bddService is not null.");

        let bTrue = service.createTrue();
        MyTestForBDD.assert(service.isTrue(bTrue), "True is true.");

        let bFalse = service.createFalse();
        MyTestForBDD.assert(service.isFalse(bFalse), "False is false.");
    }

    /**
     * Tests on simple formula : And, Or, getAtomOf, isInternal, isFalse, isTrue, Not, Implies, Equiv, getThen, getElse, 
     */
    private static simpleFormula(){

        let service = BDD.bddService;
        let bAtomP = service.createLiteral("p");
        let bTrue = service.createTrue();
        let bFalse = service.createFalse();

        MyTestForBDD.assert(service.getAtomOf(bAtomP) == "p", "p is p.");
        
        MyTestForBDD.assert(typeof service.applyIte(service.createCopy(bAtomP), service.createCopy(bTrue), service.createCopy(bFalse)) === "number", "applyIte(p, top, bot) is a number.");
    
        MyTestForBDD.assert(!service.isInternalNode(bTrue), "True is not an InternalNode");
        MyTestForBDD.assert(service.isInternalNode(bAtomP), "p is an InternalNode");

        MyTestForBDD.assert(service.getAtomOf(service.applyAnd([service.createCopy(bAtomP), service.createCopy(bTrue)])) == "p", "service.getAtomOf(service.applyAnd([bAtomP, bTrue]) == p")
        
        MyTestForBDD.assert(service.isFalse(service.applyAnd([service.createCopy(bAtomP), service.createCopy(bFalse)])), "(p and false) is false");
        MyTestForBDD.assert(service.isTrue(service.applyOr([service.createCopy(bAtomP), service.createCopy(bTrue)])), "(p or true) is true");

        let notP = service.applyNot(service.createCopy(bAtomP));

        MyTestForBDD.assert(service.isFalse(service.applyAnd([service.createCopy(bAtomP), service.createCopy(notP)])), "(p and not p) is false");
        MyTestForBDD.assert(service.isTrue(service.applyOr([service.createCopy(bAtomP), service.createCopy(notP)])), "(p or not p) is true");

        MyTestForBDD.assert(service.isFalse(service.applyNot(service.createTrue())), "not true is false");
        MyTestForBDD.assert(service.isTrue(service.applyNot(service.createFalse())), "not false is true");

        let bAtomQ = service.createLiteral("q");

        let or1 = service.applyAnd([service.createLiteral("q"), service.createLiteral("p")]);

        let or2 = service.applyOr([service.createCopy(bAtomQ), service.createCopy(bAtomP)]);

        //console.log("PICK", service.pickSolutions(or2));

        let notQ = service.applyNot(service.createCopy(bAtomQ));
        let implies1 = service.applyImplies(service.createCopy(bAtomP), service.createCopy(bAtomQ));
        let implies2 = service.applyImplies(service.createCopy(bAtomQ), service.createCopy(bAtomP));
        let nporq = service.applyOr([service.createCopy(notP), service.createCopy(bAtomQ)]);
        let nqorp = service.applyOr([service.createCopy(bAtomP), service.createCopy(notQ)]);
        MyTestForBDD.assert(implies1 == nporq, "p -> q == not p or q");
        MyTestForBDD.assert(implies2 == nqorp, "q -> p == not q or p");

        MyTestForBDD.assert(
            service.applyEquiv(service.createCopy(bAtomP), service.createCopy(bAtomQ)) 
            == 
            service.applyAnd([service.createCopy(implies1), service.createCopy(implies2)]),
            "p <-> q == (p->q) and (q->p).");

        MyTestForBDD.printThenElse(bAtomP);
        MyTestForBDD.printThenElse(notP);

        MyTestForBDD.assert(service.isTrue(service.getThenOf(bAtomP)), "IF of p is true");
        MyTestForBDD.assert(service.isFalse(service.getElseOf(bAtomP)), "Else of p is false");
        MyTestForBDD.assert(service.isFalse(service.getThenOf(notP)), "IF of not p is false");
        MyTestForBDD.assert(service.isTrue(service.getElseOf(notP)), "ELSE of not p is true");

        MyTestForBDD.assert(service.isTrue(service.applyExistentialForget(service.createCopy(bAtomP), ["p"])), "EForget(p, ['p']) == True")
        
        MyTestForBDD.assert(BDD.buildFromFormula(new AtomicFormula("p")) == bAtomP, "buildFromFormula(p) == p"); 
    }

    /**
     * Tests on buildFromFormula, cube
     */
    private static someBDDMethod(){

        let service = BDD.bddService;

        let bAtomP = service.createLiteral("p");
        let bAtomQ = service.createLiteral("q");
        let notQ = service.applyNot(service.createCopy(bAtomQ));
        let notP = service.applyNot(service.createCopy(bAtomP));

        // (p&q)|(np&nq)
        let phi = service.applyOr([
            service.applyAnd([service.createCopy(bAtomP), service.createCopy(bAtomQ)]), 
            service.applyAnd([service.createCopy(notP), service.createCopy(notQ)])]
        )

        MyTestForBDD.assert(service.isTrue(service.applyExistentialForget(service.createCopy(phi), ["p"])), "EForget( (p&q)|(np&nq) , ['p']) == True")
        MyTestForBDD.assert(service.isFalse(service.applyUniversalForget(service.createCopy(phi), ["p"])), "UForget( (p&q)|(np&nq) , ['p']) == False")

        let map = new Map();
        for(const [i, vari] of Array.from(["a", "b", "c"].entries())){
            map.set(vari, i % 2 == 0);
        }

        console.log(map);

        let anbc = service.applyAnd([service.createLiteral("a"), service.applyNot(service.createLiteral("b")), service.createLiteral("c")]);
        let anbc2 = BDD.buildFromFormula(new AndFormula([new AtomicFormula("a"), new NotFormula(new AtomicFormula("b")), new AtomicFormula("c") ]))
        let cube = service.createCube(map);
        MyTestForBDD.assert(cube == anbc && anbc == anbc2 && cube == anbc2 , "cube([a:t, b:f, c:t]) == a & not b & c == buildFromFormula");        

    }

    private static testPick(){
        let service = BDD.bddService;
        let bAtomP = service.createLiteral("p");
        let notP = service.applyNot(service.createCopy(bAtomP));

        MyTestForBDD.assert(service.pickSolutions(bAtomP).length == 1, "len(pickSolutions(p))==1");

    }


}


export class SymbolicSimpleExample extends ExampleDescription {

    static ok: boolean = false;

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

        /* DIRTY TESTS HERE.... */
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
            
            // console.log("ListeRel", liste_rel);
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

        M.setPointedWorld(new Valuation(propositions));

        console.log("TEST");

        console.log("InitialWorld", new Valuation(propositions));

        console.log("Graphe a", M.getAgentGraphe("a"));

        console.log("Pick one", BDD.bddService.pickOneSolution(M.getAgentGraphe("a")));

        console.log(BDD.bddService.pickSolutions(M.getAgentGraphe("a"), 10));

        return M;
    }


    getActions() {
        return [];

        console.log("NO ACTION FOR THE MOMENT", SymbolicSimpleExample.ok);

        const that = this;

        function draw(current_agent) {

        }

        let list = [];
        
        return [];
    }
}