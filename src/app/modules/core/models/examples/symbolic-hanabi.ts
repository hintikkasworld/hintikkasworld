import { Action } from './../environment/action';

import { environment } from './../../../../../environments/environment';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { SymbolicRelation, Obs } from '../epistemicmodel/symbolic-relation';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Formula, ExactlyFormula, AndFormula, AtomicFormula, NotFormula, KFormula, OrFormula, EquivFormula } from '../formula/formula';
import { ExplicitToSymbolic } from '../eventmodel/explicit-to-symbolic';
import { EventModelAction } from './../environment/event-model-action';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import { SymbolicEventModel } from '../eventmodel/symbolic-event-model';
import { SymbolicEvent } from '../eventmodel/symbolic-event';
import { PropositionalAssignmentsPostcondition } from './../eventmodel/propositional-assignments-postcondition';
import { BDD } from './../formula/bdd';
import { BDDNode, BddService } from './../../../../services/bdd.service';
import { MyTestForBDD } from "./test_bdd";

/**
 * @param valuation a valuation
 * */
class SimpleHanabiWorld extends WorldValuation {

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

    static drawHanabiCard(context: CanvasRenderingContext2D, agent: string, posInHand: number, cardSuit: string, cardValue: string) {
        let x, y, dx, dy;
        if (agent == "a") { x = 64 - SimpleHanabiWorld.cardNumber / 2 * SimpleHanabiWorld.cardWidth; y = 0; dx = SimpleHanabiWorld.cardWidth; dy = 0; }
        if (agent == "b") { x = 128 - SimpleHanabiWorld.cardWidth; y = 10; dx = 0; dy = SimpleHanabiWorld.cardHeight; }
        if (agent == "c") { x = 64 - SimpleHanabiWorld.cardNumber / 2 * SimpleHanabiWorld.cardWidth; y = 56; dx = SimpleHanabiWorld.cardWidth; dy = 0; }
        if (agent == "d") { x = 0; y = 10; dx = 0; dy = SimpleHanabiWorld.cardHeight; }

        SimpleHanabiWorld.drawCard(context, {
            x: x + posInHand * dx, y: y + posInHand * dy, w: SimpleHanabiWorld.cardWidth,
            h: SimpleHanabiWorld.cardHeight, fontSize: 6, background: cardSuit, text: cardValue
        });
    }

    draw(context: CanvasRenderingContext2D) {
        for (let agent of environment.agents) {
            let posInHand = 0;
            for (let card = 0; card < SimpleSymbolicHanabi.nbCards; card++)
                if (this.modelCheck(SimpleSymbolicHanabi.getVarName(agent, card))) {
                    SimpleHanabiWorld.drawHanabiCard(context, agent, posInHand, SimpleHanabiWorld.getSuit(card), SimpleHanabiWorld.getValue(card));
                    posInHand++;
                }
            this.drawAgents(context);
        }
    }
  static getValue(card: number): string {
    //return [1, 1, 1, 2, 2, 3, 3, 4, 4, 5][card % 10].toString();
    return card.toString();
  }
    static getSuit(card: number): string { return ["white", "red", "blue", "yellow", "green"][card / 10]; }

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
    static readonly nbCards: number = 10;

    /**
     * Number of cards in hand
     */
    readonly nbCardsInHand_Begin: number = 1;

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

    private colors = ["white", "red", "blue", "yellow", "green"]

    /**
     * List of actions; lazily computed (only on demand)
     */
    private actions?: EventModelAction[];

    getName() { return "Hanabi"; }

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
            let seenFormulas: (Formula | string)[] = [];
            /* Reciprocity of cards : agent does'nt see all variables of himself and draw */
            this.owners.filter(o => (o != agent && o != "p")).forEach((owner) => {
                for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                    seenFormulas.push(SimpleSymbolicHanabi.getVarName(owner, c));
                };
            });

            /* Enumeration of agent's card : : agent see the number of his cards : 0 <-> 0p and 1 <-> 1p and ... */
            let his_cards = [];
            for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                his_cards.push(SimpleSymbolicHanabi.getVarName(agent, c));
            }
            for (var c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                for (var i = 0; i < this.nbCardsInHand_Begin + 1; i++) {
                    //      console.log(i, his_cards)
                    seenFormulas.push(new ExactlyFormula(i, his_cards));
                };
            };
            //   console.log("ListeRel", liste_rel);
            symbolicRelations.set(agent, new Obs(seenFormulas));

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

        // BEGIN WORLD
        let count = 0;
        let propositions: { [id: string]: boolean } = {};
        // distribution of cards between agents
        while (count < SimpleSymbolicHanabi.nbCards && count < this.nbCardsInHand_Begin * this.agents.length) {
            let agent = this.agents[count % this.agents.length];
            propositions[SimpleSymbolicHanabi.getVarName(agent, count)] = true;
            count++;
        }
        // the rest in the draw
        for (var c = count; c < SimpleSymbolicHanabi.nbCards; c++)
            propositions[SimpleSymbolicHanabi.getVarName("p", c)] = true;
        // others proposition as false
        variables.forEach((variable) => {
            if (!(variable in propositions)) {
                propositions[variable] = false;
            }
        });
        console.log("Valuation", new Valuation(propositions));


        let M = SymbolicEpistemicModel.build(SimpleHanabiWorld, this.agents, variables, symbolicRelations, rules);
        M.setPointedValuation(new Valuation(propositions));

        console.log("Fin SEM");

        function test(M: SymbolicEpistemicModel) {
            console.log("TEST");

            console.log("InitialWorld", new Valuation(propositions));

            console.log("Graphe a", M.getAgentSymbolicRelation("a"));

            //console.log("Pick one", BDD.bddService.pickOneSolution(M.getAgentSymbolicRelation("a")));

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
        if (this.actions !== undefined) return this.actions;
        console.log("BEGIN ACTION", SimpleSymbolicHanabi.ok);

        const listActions: EventModelAction[] = [];

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

        /**
         * Get Formula var_pos1_value && !var_pos2_value && !+_var_pos1_value && +_var_pos2_value
         * This formula swap two variables between worlds and posted world.
         * @param pos1 first possessor
         * @param pos2 second possessor
         * @param value value of card
         * @param prime if a use primed variables
         */
        function precondition_symbolic_transfert(pos1: string, pos2: string, value: number): Formula {
            let var1 = SimpleSymbolicHanabi.getVarName(pos1, value)
            let var2 = SimpleSymbolicHanabi.getVarName(pos2, value)
            return new AndFormula([new AtomicFormula(var1), new NotFormula(new AtomicFormula(var2))])
        }

       /**
         * Get BDDNode Equivalent to : "var_pos1_value && !var_pos2_value && !+_var_pos1_value && +_var_pos2_value", with frame
         * This formula swap two variables between worlds and posted world.
         * @param pos1 first possessor
         * @param pos2 second possessor
         * @param value value of card
         */
        function symbolic_transfert_card(pos1: string, pos2: string, value: number): BDDNode{
            // var_pos1_value && not var_post2_value
            let var1 = SimpleSymbolicHanabi.getVarName(pos1, value)
            let var2 = SimpleSymbolicHanabi.getVarName(pos2, value)
            let pre = precondition_symbolic_transfert(pos1, pos2, value)
            // not +_var_pos1_value && +_var_post2_value
            let post = new AndFormula([
                new AtomicFormula(SymbolicEventModel.getPostedVarName(var2)),
                new NotFormula(new AtomicFormula(SymbolicEventModel.getPostedVarName(var1)))
            ])
            const postBdd = BDD.buildFromFormula(new AndFormula([pre, post]));
            //console.log("postBdd = ", BDD.bddService.pickAllSolutions(postBdd));

            const list_var: string[] = that.variables.filter(
                vari => (vari != var1 && vari != var2)
            )
            let frame = SymbolicEventModel.frame(list_var, false);
            let res = BDD.bddService.applyAnd([postBdd, frame])
            //console.log("symbolic transfert", new AndFormula([pre, post]).prettyPrint(), BDD.bddService.pickSolutions(res, 20))
            return res;
        }

        const cacheDrawSymbolic = new Map<string, SymbolicEventModel>();
        let cacheDrawAction = new Map<string, SymbolicEventModel>();

        /**
         * return the SymbolicEventModel for "agent current_agent draws."
         * @param current_agent string for the agent
         */
        function draw_symbolic(current_agent: string): SymbolicEventModel{
          function getName(agent, card){
              return agent + " draws " + card;
          }
          function putInMapInTwoWays(map, vari1, vari2){
              map.set(vari1, vari2)
          }

          var t0 = performance.now();

          console.log("computing event model for " + current_agent + " draws (symbolic).");
          let sem: SymbolicEventModel;
          if (cacheDrawSymbolic.has(current_agent)) sem = cacheDrawSymbolic.get(current_agent);
          else {
                console.log("read cache", cacheDrawAction, cacheDrawAction.size)
                if(cacheDrawAction.size>0){
                    // Draw has already been calculated, so we will rename variables
                    let tmp_sem;
                    let transfert_agent;

                    // we take the first existing BDDNode we find...
                    cacheDrawAction.forEach((value: SymbolicEventModel, key: string) => {
                        tmp_sem = value;
                        transfert_agent = key;
                    });

                    console.log("tmp_sem", tmp_sem, tmp_sem.getUniqueEvents())

                    let renamingMap = new Map<string, string>()

                    for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                        const var_a = SimpleSymbolicHanabi.getVarName(current_agent, c)
                        const var_t_a = SimpleSymbolicHanabi.getVarName(transfert_agent, c)
                        putInMapInTwoWays(renamingMap, var_a, var_t_a)
                        putInMapInTwoWays(renamingMap, SymbolicEpistemicModel.getPrimedVarName(var_a), SymbolicEpistemicModel.getPrimedVarName(var_t_a))
                        putInMapInTwoWays(renamingMap, SymbolicEventModel.getPostedVarName(var_a), SymbolicEventModel.getPostedVarName(var_t_a))
                        putInMapInTwoWays(renamingMap, SymbolicEventModel.getPrimedPostedVarName(var_a), SymbolicEventModel.getPrimedPostedVarName(var_t_a))
                    }
                    console.log("renamingMap", renamingMap)

                    const events = new Map<string, SymbolicEvent<BDDNode>>();
                    const agentRelations = new Map<string, BDDNode>();
                    
                    tmp_sem.getUniqueEvents().forEach((value: SymbolicEvent<BDDNode>, key: string) => {
                        console.log("uniqueEvents", key, value)
                        if(key==current_agent || key==transfert_agent){
                            const bdd = BDD.bddService.applyRenaming(BDD.bddService.createCopy(value.post), renamingMap)
                            const pre = value.pre.renameAtoms(vari => renamingMap.get(vari))
                            events.set(key, new SymbolicEvent(pre, bdd))
                        }else{
                            events.set(key, new SymbolicEvent(value.pre, BDD.bddService.createCopy(value.post)))
                        }

                    });
                    
                    tmp_sem.getPlayerRelations().forEach((value: BDDNode, key: string) => {
                        console.log("playerRelatons", key, value)
                        if(key==current_agent || key==transfert_agent){
                            agentRelations.set(key, BDD.bddService.applyRenaming(BDD.bddService.createCopy(value), renamingMap))
                        }else{
                            agentRelations.set(key, BDD.bddService.createCopy(value))
                        }
                    });
                    sem = new SymbolicEventModel(that.agents, that.variables, events, agentRelations, getName(current_agent, SimpleSymbolicHanabi.nbCards - 1))

                }else{
                    const events = new Map<string, SymbolicEvent<BDDNode>>();
                    const agentRelations = new Map<string, BDDNode>();

                    let events_bdd:  Map<string, BDDNode> = new Map<string, BDDNode>();
                    for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                        const pre = precondition_symbolic_transfert("p", current_agent, c)
                        const bdd_transfert = symbolic_transfert_card("p", current_agent, c)
                        const name = getName(current_agent, c);
                        // just "var_pos1_value && !var_pos2_value && !+_var_pos1_value && +_var_pos2_value"
                        events.set(name, new SymbolicEvent(pre, bdd_transfert));
                        events_bdd.set(name, bdd_transfert)
                        //console.log("Created event", name, "prec=", pre, "bdd=", BDD.bddService.pickSolutions(bdd_transfert));
                    }

                    let transfert = SymbolicEpistemicModel.getMapNotPrimeToPrime(that.variables.concat(that.variables.map(v => SymbolicEventModel.getPostedVarName(v))));
                    //console.log("transfert draw", transfert)

                    let list_or = []
                    for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                        list_or.push(BDD.bddService.createCopy(events_bdd.get(getName(current_agent, c))));
                    }
                    const or_bdd = BDD.bddService.applyOr(list_or)
                    const or_bdd_prime = BDD.bddService.applyRenaming(BDD.bddService.createCopy(or_bdd), transfert)
                    const agent_draws = BDD.bddService.applyAnd([or_bdd, or_bdd_prime]);
                    agentRelations.set(current_agent, agent_draws);

                    //console.log("OR LA ", BDD.bddService.nodeToString(agent_draws), BDD.bddService.pickSolutions(agent_draws))

                    /* Relation for other players */
                    const arcsForOthers = [];
                    for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                        const name = getName(current_agent, c);
                        // "var_pos1_value && !var_pos2_value && !+_var_pos1_value && +_var_pos2_value"
                        const event = events_bdd.get(name);
                        const eventPrime = BDD.bddService.applyRenaming(BDD.bddService.createCopy(event), transfert);
                        const arc = BDD.bddService.applyAnd([BDD.bddService.createCopy(event), eventPrime]) 
                        arcsForOthers.push(arc);

                    }
                    const relationForOthers = BDD.bddService.applyOr(arcsForOthers);
                    for(let agent of that.agents){
                            if(agent != current_agent){
                                agentRelations.set(agent, relationForOthers);
                            }
                    }
                    //console.log("ICI", BDD.bddService.nodeToString(relationForOthers), BDD.bddService.pickSolutions(relationForOthers));

                    sem = new SymbolicEventModel(that.agents, that.variables, events,
                        agentRelations, null);

                    cacheDrawSymbolic.set(current_agent, sem);
                }
                
            }
            // TODO the pointed event should be drawn randomly ?
            // the current implem cannot work more than once
            const E = sem.copyWithAnotherPointedEvent(getName(current_agent, SimpleSymbolicHanabi.nbCards - 1));

            // PUT IN THE CACHE TO USE IT, AND RENAME
            // cacheDrawAction.set(current_agent, sem)

            var t1 = performance.now();
            console.log("Call DRAW took " + (t1 - t0) + " milliseconds for agent " + current_agent)
            
            return E;
        }

        function play(agent: string, card: number, destination: string): SymbolicEventModel {
            function getName(agent, card){
                if(destination=="p")
                    return agent + " plays " + card;
                return agent + " discards " + card;
            }

            const events = new Map<string, SymbolicEvent<BDDNode>>();
            const agentRelations = new Map<string, BDDNode>();
            let events_bdd:  Map<string, BDDNode> = new Map<string, BDDNode>();

            const pre = precondition_symbolic_transfert(agent, destination, card)
            const bdd_transfert = symbolic_transfert_card(agent, destination, card)
            const name = getName(agent, card);

            events.set(name, new SymbolicEvent(pre, bdd_transfert));
            events_bdd.set(name, bdd_transfert)

            let transfert = SymbolicEpistemicModel.getMapNotPrimeToPrime(that.variables.concat(that.variables.map(v => SymbolicEventModel.getPostedVarName(v))));
            
            const eventPrime = BDD.bddService.applyRenaming(BDD.bddService.createCopy(events_bdd.get(name)), transfert);
            const arc = BDD.bddService.applyAnd([BDD.bddService.createCopy(events_bdd.get(name)), eventPrime]) 

            for(let agent of that.agents)
                agentRelations.set(agent, arc);
            
            return new SymbolicEventModel(that.agents, that.variables, events, agentRelations, name);
        }

        function valueAnnoucement(agent:string, nbCards:number, value:number): SymbolicEventModel{

            //console.log(agent + " " + nbCards + " " + value)

            let liste_var = [];

            let nbcolors = SimpleSymbolicHanabi.nbCards / 10;
            let nbcardsbyvalue = [3, 2, 2, 2, 1]
            let sum = [0, 4, 6, 8, 9]

            for (var color = 0; color < nbcolors+1; color++) {
                for (var c = 0; c < nbcardsbyvalue[value - 1]; c++) {
                    const n = c + (10 * color) + sum[value-1]
                    if(n<SimpleSymbolicHanabi.nbCards)
                        liste_var.push(SimpleSymbolicHanabi.getVarName(agent, n));
                };
            }

            let name = "agent " + agent + " has " + nbCards + " out of " + value;

            const events = new Map<string, SymbolicEvent<BDDNode>>();
            const agentRelations = new Map<string, BDDNode>();
            let events_bdd:  Map<string, BDDNode> = new Map<string, BDDNode>();

            let pre = new ExactlyFormula(nbCards, liste_var);
            let pre_bdd = BDD.buildFromFormula(pre);
            //let support = BDD.bddService.support(pre_bdd)

            const list_var: string[] = that.variables;
            let frame = SymbolicEventModel.frame(list_var, false);
            const bdd_transfert = BDD.bddService.applyAnd([frame, pre_bdd])

            events.set(name, new SymbolicEvent(pre, bdd_transfert));
            events_bdd.set(name, bdd_transfert)

            let transfert = SymbolicEpistemicModel.getMapNotPrimeToPrime(that.variables.concat(that.variables.map(v => SymbolicEventModel.getPostedVarName(v))));
            
            const eventPrime = BDD.bddService.applyRenaming(BDD.bddService.createCopy(events_bdd.get(name)), transfert);
            const arc = BDD.bddService.applyAnd([BDD.bddService.createCopy(events_bdd.get(name)), eventPrime]) 

            for(let agent of that.agents)
                agentRelations.set(agent, arc);
            
            return new SymbolicEventModel(that.agents, that.variables, events, agentRelations, name);
        }

        function colorAnnoucement(agent:string, nbCards:number, color:string): SymbolicEventModel{

            //console.log(agent + " " + nbCards + " " + color)

            let liste_var = [];

            
            const id_c = that.colors.indexOf(color)
            for (var c = 0; c < 10; c++)
                liste_var.push(SimpleSymbolicHanabi.getVarName(agent, id_c*10+c));
            
            //console.log(colorAnnoucement, agent, nbCards, color, liste_var)

            let name = "agent " + agent + " has " + nbCards + " out of " + color;

            const events = new Map<string, SymbolicEvent<BDDNode>>();
            const agentRelations = new Map<string, BDDNode>();
            let events_bdd:  Map<string, BDDNode> = new Map<string, BDDNode>();

            let pre = new ExactlyFormula(nbCards, liste_var);
            let pre_bdd = BDD.buildFromFormula(pre);
            //let support = BDD.bddService.support(pre_bdd)

            const list_var: string[] = that.variables;
            let frame = SymbolicEventModel.frame(list_var, false);
            const bdd_transfert = BDD.bddService.applyAnd([frame, pre_bdd])

            events.set(name, new SymbolicEvent(pre, bdd_transfert));
            events_bdd.set(name, bdd_transfert)

            let transfert = SymbolicEpistemicModel.getMapNotPrimeToPrime(that.variables.concat(that.variables.map(v => SymbolicEventModel.getPostedVarName(v))));
            
            const eventPrime = BDD.bddService.applyRenaming(BDD.bddService.createCopy(events_bdd.get(name)), transfert);
            const arc = BDD.bddService.applyAnd([BDD.bddService.createCopy(events_bdd.get(name)), eventPrime]) 

            for(let agent of that.agents)
                agentRelations.set(agent, arc);
            
            return new SymbolicEventModel(that.agents, that.variables, events, agentRelations, name);
        }
        


        /* DRAWS */
        /*
        for (let agent of this.agents) {
            listActions.push(new EventModelAction({
                name: "Agent " + agent + " draws a card. (explicite, err:Nonclique)",
                eventModel: ExplicitToSymbolic.translate(draw(agent), this.variables, this.agents)
            }));
            // DEBUG: we stop here for now
            break;
        }*/

        /* DRAWS */
        for (let agent of this.agents) {
            listActions.push(new EventModelAction({
                name: "Agent " + agent + " draws a card.",
                eventModel: draw_symbolic(agent)
            }));
            // DEBUG: we stop here for now
            // break;
        }

        /* play */
        for (let agent of this.agents) {
            for (var nb = 0; nb < SimpleSymbolicHanabi.nbCards; nb++) { 
                listActions.push(new EventModelAction({
                    name: "Agent " + agent + " plays " + nb + ".",
                    eventModel: play(agent, nb, "p")
                }));
            }
        }

        /* discard */
        for (let agent of this.agents) {
            for (var nb = 0; nb < SimpleSymbolicHanabi.nbCards; nb++) { 
                listActions.push(new EventModelAction({
                    name: "Agent " + agent + " discards " + nb + ".",
                    eventModel: play(agent, nb, "e")
                }));
            }
        }

        /* Value announce */
        for (let agent of this.agents) {
            for (var value = 1; value < 6; value++) { 
                for (var nb = 1; nb < 6; nb++) { 
                    listActions.push(new EventModelAction({
                        name: "Agent " + agent + " has " + nb + " out of " + value + ".",
                        eventModel: valueAnnoucement(agent, nb, value)
                    }));
                    // DEBUG: we stop here for now
                    // break;
                }
            }
        }

        /* Color annouce */
        for (let agent of this.agents) {
            for(let color of this.colors){
                for (var nb = 1; nb < 6; nb++) { 
                    listActions.push(new EventModelAction({
                        name: "Agent " + agent + " has " + nb + " out of " + color + ".",
                        eventModel: colorAnnoucement(agent, nb, color)
                    }));
                }
            }
        }

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

        console.log(listActions);
        this.actions = listActions;
        return listActions; //play("a", 1, "b")];
        
    }
}
