import { environment } from '../../../../../environments/environment';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Valuation } from '../epistemicmodel/valuation';
import { Obs, SymbolicRelation } from '../epistemicmodel/symbolic-relation';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { AndFormula, AtomicFormula, ExactlyFormula, Formula, NotFormula } from '../formula/formula';
import { EventModelAction } from '../environment/event-model-action';
import { SymbolicEventModel } from '../eventmodel/symbolic-event-model';
import { SymbolicPublicAnnouncement } from '../eventmodel/symbolic-public-announcement';
import { SymbolicEvent } from '../eventmodel/symbolic-event';
import { BDDNode } from '../../../../services/bdd.service';
import { SEModelDescriptor } from '../epistemicmodel/descriptor/se-model-descriptor';
import { BDDWorkerService } from 'src/app/services/bddworker.service';

class Point {
    x: number;
    y: number;
}

/**
 * @param valuation a valuation
 * */
class SimpleHanabiWorld extends WorldValuation {
    constructor(valuation: Valuation) {
        super(valuation);
        this.state = new HanabiState(valuation, environment.agents, SimpleSymbolicHanabi.colors); // note Alex: this is kinda weird to get the env agents here

        // and what follows seems more like static things:
        this.agentPos['a'] = { x: 64, y: 16, r: 8 };
        this.agentPos['b'] = {
            x: 128 - SimpleHanabiWorld.cardWidth - 10,
            y: 32,
            r: 8
        };
        this.agentPos['c'] = { x: 64, y: 48, r: 8 };
        this.agentPos['d'] = { x: 20, y: 32, r: 8 };

        this.agentHandPos['a'] = {
            x: 64 - (SimpleHanabiWorld.cardNumber / 2) * SimpleHanabiWorld.cardWidth,
            y: 0,
            horizontal: true
        };
        this.agentHandPos['b'] = {
            x: 128 - SimpleHanabiWorld.cardWidth,
            y: 10,
            horizontal: false
        };
        this.agentHandPos['c'] = {
            x: 64 - (SimpleHanabiWorld.cardNumber / 2) * SimpleHanabiWorld.cardWidth,
            y: 56,
            horizontal: true
        };
        this.agentHandPos['d'] = { x: 0, y: 10, horizontal: false };
    }

    static readonly cardWidth = 9;
    static readonly cardHeight = 8;
    static readonly cardNumber = 5;

    private state: HanabiState;
    private agentHandPos = {};

    static drawHanabiCardArray(
        context: CanvasRenderingContext2D,
        pos: { x: number; y: number; horizontal: boolean },
        cards: number[],
        allVisible: boolean = true
    ) {
        const dx = pos.horizontal ? (allVisible ? SimpleHanabiWorld.cardWidth : SimpleHanabiWorld.cardWidth / 2) : 0;
        const dy = pos.horizontal ? 0 : allVisible ? SimpleHanabiWorld.cardHeight : SimpleHanabiWorld.cardHeight / 2;
        // console.log("drawing cards: ", cards);
        for (const [posInHand, card] of Array.from(cards.entries())) {
            SimpleHanabiWorld.drawCard(context, {
                x: pos.x + posInHand * dx,
                y: pos.y + posInHand * dy,
                w: SimpleHanabiWorld.cardWidth,
                h: SimpleHanabiWorld.cardHeight,
                fontSize: 6,
                background: SimpleSymbolicHanabi.getCardSuit(card),
                text: SimpleSymbolicHanabi.getCardValue(card)
            });
        }
    }

    static getCardUnderCursor(
        cursor: Point,
        agent: string,
        pos: { x: number; y: number; horizontal: boolean },
        cards: number[],
        allVisible: boolean = true
    ) {
        const dx = pos.horizontal ? (allVisible ? 2 * SimpleHanabiWorld.cardWidth : SimpleHanabiWorld.cardWidth / 2) : 0;
        const dy = pos.horizontal ? 0 : allVisible ? SimpleHanabiWorld.cardHeight : SimpleHanabiWorld.cardHeight / 2;
        // console.log("drawing cards: ", cards);
        for (const [posInHand, card] of Array.from(cards.entries())) {
            let cardGUI = {
                agent,
                x: pos.x + posInHand * dx,
                y: pos.y + posInHand * dy,
                w: SimpleHanabiWorld.cardWidth,
                h: SimpleHanabiWorld.cardHeight,
                fontSize: 6,
                background: SimpleSymbolicHanabi.getCardSuit(card),
                text: SimpleSymbolicHanabi.getCardValue(card),
                nb: card
            };
            if (cardGUI.x <= cursor.x && cursor.x < cardGUI.x + cardGUI.w && cardGUI.y <= cursor.y && cursor.y < cardGUI.y + cardGUI.h) {
                return cardGUI;
            }
        }
        return undefined;
    }

    draw(context: CanvasRenderingContext2D) {
        console.log('DBRAWING WORLD with state', this.state);
        SimpleHanabiWorld.drawHanabiCardArray(context, { x: 200, y: 0, horizontal: false }, this.state.discardedCards);
        const colorDy = SimpleHanabiWorld.cardHeight;
        let colorY = 200;
        for (const color of SimpleSymbolicHanabi.colors) {
            SimpleHanabiWorld.drawHanabiCardArray(
                context,
                {
                    x: 80,
                    y: colorY,
                    horizontal: true
                },
                this.state.playedCardsByColor.get(color),
                false
            );
            colorY += colorDy;
        }
        SimpleHanabiWorld.drawHanabiCardArray(context, { x: 0, y: colorY, horizontal: true }, this.state.stackCards);

        for (let agent of environment.agents) {
            const hand = this.state.handCardsByAgent.get(agent);
            SimpleHanabiWorld.drawHanabiCardArray(context, this.agentHandPos[agent], hand);
        }
        this.drawAgents(context);
    }

    /**
     * @param cursor a point in the screen (with fields x and y)
     * @returns an object that gives information of the card under the cursor if there is one, undefined otherwise.
     */
    getCardUnderCursor(cursor: Point) {
        for (let agent of environment.agents) {
            const hand = this.state.handCardsByAgent.get(agent);
            const cardGUI = SimpleHanabiWorld.getCardUnderCursor(cursor, agent, this.agentHandPos[agent], hand);

            if (cardGUI) {
                return cardGUI;
            }
        }
        return undefined;
    }
}

/**
 * Represent a state of the world, with easy-to-process data structures.
 * This is class to avoid directly using a valuation
 */
class HanabiState {
    /**
     * Assume that the valuation given does not encode an impossible state, e.g. a card being in two hands at once.
     * If true, the construction is more efficient (we do not loop over all owners
     * for each card), but for debugging purposes it is useful to set it to false,
     * in which case the state built will be an impossible state and an error will be logged (but not thrown).
     */
    public static readonly ASSUME_STATE_IS_POSSIBLE = false;

    public playedCardsByColor = new Map<string, number[]>();
    public discardedCards = new Array<number>();
    public stackCards = new Array<number>();
    public handCardsByAgent = new Map<string, number[]>();

    constructor(world: Valuation, agents: string[], colors: string[]) {
        for (const a of agents) {
            this.handCardsByAgent.set(a, []);
        }
        for (const c of colors) {
            this.playedCardsByColor.set(c, []);
        }
        const ownerHasCard = (owner: string, card: number) => world.isPropositionTrue(SimpleSymbolicHanabi.getVarName(owner, card));
        for (let card = 0; card < SimpleSymbolicHanabi.nbCards; card++) {
            if (ownerHasCard('p', card)) {
                this.stackCards.push(card);
                if (HanabiState.ASSUME_STATE_IS_POSSIBLE) {
                    continue;
                }
            }
            if (ownerHasCard('e', card)) {
                this.discardedCards.push(card);
                if (HanabiState.ASSUME_STATE_IS_POSSIBLE) {
                    continue;
                }
            }
            if (ownerHasCard('t', card)) {
                const suit = SimpleSymbolicHanabi.getCardSuit(card);
                if (!this.playedCardsByColor.has(suit)) {
                    this.playedCardsByColor.set(suit, []);
                }
                this.playedCardsByColor.get(suit).push(card);
                if (HanabiState.ASSUME_STATE_IS_POSSIBLE) {
                    continue;
                }
            }
            for (const a of agents) {
                if (ownerHasCard(a, card)) {
                    this.handCardsByAgent.get(a).push(card);
                    if (HanabiState.ASSUME_STATE_IS_POSSIBLE) {
                        break;
                    }
                }
            }
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
 4*/
export class SimpleSymbolicHanabi extends ExampleDescription {
    /**
     * Number of colors
     */
    static readonly nb_colors: number = 5;

    /**
     * Number of values per color. The values are given by the array "values"
     */
    static readonly nb_values_per_color: number = 4;

    /**
     * Number of cards in the game Hanabi
     */
    static readonly nbCards: number = SimpleSymbolicHanabi.nb_colors * SimpleSymbolicHanabi.nb_values_per_color;

    public static readonly colors = ['white', 'red', 'blue', 'yellow', 'green'];
    public static readonly values = [1, 2, 3, 4, 5, 1, 2, 3, 4, 1]; // the order allows for easily creating smaller instances using nb_values_per_colors

    /**
     * Number of cards in hand
     * Need to be : (nbCardsInHand_Begin * nb_agents) > nbCards
     */
    readonly nbCardsInHand_Begin: number = 3;

    /**
     * Sort deck of cards of not
     */
    readonly random_distribution: boolean = true;

    /**
     * List of agents
     */
    private agents = ['a', 'b', 'c', 'd'];
    /**
     * List of cards owners : agents + t:table, p:draw, e:exil (or discarding like 'd' ?)
     */
    private owners = this.agents.concat(['t', 'p', 'e']); /* agents */
    /**
     * List of propositional variables
     */
    private variables: string[];

    /**
     * List of actions; lazily computed (only on demand)
     */
    private actions?: EventModelAction[];

    static getCardValue(card: number): string {
        return SimpleSymbolicHanabi.values[card % SimpleSymbolicHanabi.nb_values_per_color].toString();
        // return card.toString();
    }

    static getCardSuit(card: number): string {
        return SimpleSymbolicHanabi.colors[Math.floor(card / SimpleSymbolicHanabi.nb_values_per_color)];
    }

    static getVarName(agent: string, card: number) {
        return 'var_' + agent + '_' + card;
    }

    getDescription(): string[] {
        return [
            'Each agent has some cards between 1 and 5 and either red, yellow, blue, white or green. Each agent can only see the cards of other agents.'
        ];
    }

    getName() {
        return 'Hanabi';
    }

    getWorldExample() {
        return new SimpleHanabiWorld(new Valuation([SimpleSymbolicHanabi.getVarName('a', 2)]));
    }

    getAtomicPropositions() {
        let variables: string[] = [];
        this.owners.forEach((agent) => {
            for (let i = 0; i < SimpleSymbolicHanabi.nbCards; i++) {
                variables.push(SimpleSymbolicHanabi.getVarName(agent, i));
            }
        });
        this.variables = variables;
        return variables;
    }

    getInitialEpistemicModel() {
        let example = this;

        /**
         * Another good example of creating symbolic epistemic model.
         *
         */
        class SEModelDescriptorHanabi implements SEModelDescriptor {
            getAtomicPropositions(): string[] {
                return example.getAtomicPropositions();
            }

            getAgents(): string[] {
                return ['a', 'b', 'c', 'd'];
            }

            getSetWorldsFormulaDescription(): Formula {
                /** exactly one owner for each card*/
                let liste_rules = [];
                for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                    let cards = [];
                    example.owners.forEach((agent) => {
                        cards.push(SimpleSymbolicHanabi.getVarName(agent, c));
                    });
                    liste_rules.push(new ExactlyFormula(1, cards));
                }
                return new AndFormula(liste_rules);
            }

            getRelationDescription(agent: string): SymbolicRelation {
                let symbolicRelations: Map<string, SymbolicRelation> = new Map();
                example.agents.forEach((agent) => {
                    let seenFormulas: (Formula | string)[] = [];
                    /* Reciprocity of cards : agent does'nt see all variables of himself and draw */
                    example.owners
                        .filter((o) => o != agent && o != 'p')
                        .forEach((owner) => {
                            for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                                seenFormulas.push(SimpleSymbolicHanabi.getVarName(owner, c));
                            }
                        });

                    /* Enumeration of agent's card : : agent see the number of his cards : 0 <-> 0p and 1 <-> 1p and ... */
                    let his_cards = [];
                    for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                        his_cards.push(SimpleSymbolicHanabi.getVarName(agent, c));
                    }
                    for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                        for (let i = 0; i < example.nbCardsInHand_Begin + 1; i++) {
                            //      console.log(i, his_cards)
                            seenFormulas.push(new ExactlyFormula(i, his_cards));
                        }
                    }
                    //   console.log("ListeRel", liste_rel);
                    symbolicRelations.set(agent, new Obs(seenFormulas));
                });
                return symbolicRelations.get(agent);
            }

            getPointedValuation(): Valuation {
                let propositions: { [id: string]: boolean } = {};
                // distribution of cards between agents
                let cards: number[] = [];
                for (let c = 0; c < SimpleSymbolicHanabi.nbCards; c++) {
                    cards.push(c);
                }

                function shuffleArray(array) {
                    for (let i = array.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [array[i], array[j]] = [array[j], array[i]];
                    }
                }

                if (example.random_distribution) {
                    shuffleArray(cards);
                }

                for (let i = 0; i < cards.length; i++) {
                    let c = cards[i];
                    if (i < example.nbCardsInHand_Begin * example.agents.length) {
                        let agent = example.agents[i % example.agents.length];
                        propositions[SimpleSymbolicHanabi.getVarName(agent, c)] = true;
                    } else {
                        // in the draw
                        propositions[SimpleSymbolicHanabi.getVarName('p', c)] = true;
                    }
                }

                // others proposition as false
                example.variables.forEach((variable) => {
                    if (!(variable in propositions)) {
                        propositions[variable] = false;
                    }
                });
                return new Valuation(propositions);
            }
        }

        this.variables = this.getAtomicPropositions();

        console.log('Variables', this.variables);

        /* Create Obs <<SymbolicRelation>> which represent relations of each agent like var_a_c <-> var_a_c_p */

        // console.log("RelationsSymboliques", relationsSymboliques);

        // SymbolicEpistemicModel.build(SimpleHanabiWorld, this.agents, this.variables, symbolicRelations, rules, new Valuation(propositions));
        let M = new SymbolicEpistemicModel(SimpleHanabiWorld, new SEModelDescriptorHanabi());

        console.log('Fin SEM');

        /*   function test(M: SymbolicEpistemicModel) {
               console.log("TEST");

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

           }*/

        // test(M);

        return M;
    }

    async getEventModelPlay(agent: string, card: number, destination: string): Promise<SymbolicEventModel> {
        /**
         * Get Formula var_pos1_value && !var_pos2_value && !+_var_pos1_value && +_var_pos2_value
         * This formula swap two variables between worlds and posted world.
         * @param pos1 first possessor
         * @param pos2 second possessor
         * @param value value of card
         * @param prime if a use primed variables
         */
        let precondition_symbolic_transfert = (pos1: string, pos2: string, value: number): Formula => {
            let var1 = SimpleSymbolicHanabi.getVarName(pos1, value);
            let var2 = SimpleSymbolicHanabi.getVarName(pos2, value);
            return new AndFormula([new AtomicFormula(var1), new NotFormula(new AtomicFormula(var2))]);
        };

        /**
         * Get BDDNode Equivalent to : "var_pos1_value && !var_pos2_value && !+_var_pos1_value && +_var_pos2_value", with frame
         * This formula swap two variables between worlds and posted world.
         * @param pos1 first possessor
         * @param pos2 second possessor
         * @param value value of card
         */
        let symbolic_transfert_card = async (pos1: string, pos2: string, value: number): Promise<BDDNode> => {
            // var_pos1_value && not var_post2_value
            let var1 = SimpleSymbolicHanabi.getVarName(pos1, value);
            let var2 = SimpleSymbolicHanabi.getVarName(pos2, value);
            let pre = precondition_symbolic_transfert(pos1, pos2, value);
            // not +_var_pos1_value && +_var_post2_value
            let post = new AndFormula([
                new AtomicFormula(SymbolicEventModel.getPostedVarName(var2)),
                new NotFormula(new AtomicFormula(SymbolicEventModel.getPostedVarName(var1)))
            ]);
            const postBdd = await BDDWorkerService.formulaToBDD(new AndFormula([pre, post]));
            // console.log("postBdd = ", BDD.bddService.pickAllSolutions(postBdd));

            const list_var: string[] = this.variables.filter((vari) => vari != var1 && vari != var2);
            let frame = await SymbolicEventModel.frame(list_var, false);
            let res = await BDDWorkerService.applyAnd([postBdd, frame]);
            // console.log("symbolic transfert", new AndFormula([pre, post]).prettyPrint(), BDD.bddService.pickSolutions(res, 20))
            return res;
        };

        function getName(agent, card) {
            if (destination == 'p') {
                return agent + ' plays ' + card;
            }
            return agent + ' discards ' + card;
        }

        const events = new Map<string, SymbolicEvent<BDDNode>>();
        const agentRelations = new Map<string, BDDNode>();
        let events_bdd: Map<string, BDDNode> = new Map<string, BDDNode>();

        const pre = precondition_symbolic_transfert(agent, destination, card);
        const bdd_transfert = await symbolic_transfert_card(agent, destination, card);
        const name = getName(agent, card);

        events.set(name, new SymbolicEvent(pre, bdd_transfert));
        events_bdd.set(name, bdd_transfert);

        let transfert = SymbolicEpistemicModel.getMapNotPrimeToPrime(
            this.variables.concat(this.variables.map((v) => SymbolicEventModel.getPostedVarName(v)))
        );

        const eventPrime = await BDDWorkerService.applyRenaming(await BDDWorkerService.createCopy(events_bdd.get(name)), transfert);
        const arc = await BDDWorkerService.applyAnd([await BDDWorkerService.createCopy(events_bdd.get(name)), eventPrime]);

        for (let agent of this.agents) {
            agentRelations.set(agent, arc);
        }

        return new SymbolicEventModel(this.agents, this.variables, events, agentRelations, name);
    }

    getActions() {
        if (this.actions !== undefined) {
            return this.actions;
        }

        const listActions: EventModelAction[] = [];

        const that = this;

        const cacheDrawSymbolic = new Map<string, SymbolicEventModel>();
        let cacheDrawAction = new Map<string, SymbolicEventModel>();

        function valueAnnoucement(agent: string, nbCards: number, value: number): SymbolicPublicAnnouncement {
            // console.log("ValueAnnoucement " + agent + " has " + nbCards + " card(s) of value '" + value + "'")

            if (SimpleSymbolicHanabi.nb_values_per_color != 10) {
                throw new Error('ERROR: this method only works when SimpleSymbolicHanabi.nb_values_per_color == 10');
            }
            let liste_var = [];
            let nbcardsbyvalue = [3, 2, 2, 2, 1];
            let sum = [0, 3, 5, 7, 9];
            for (let color = 0; color < SimpleSymbolicHanabi.nb_colors; color++) {
                for (let c = 0; c < nbcardsbyvalue[value - 1]; c++) {
                    const n = c + 10 * color + sum[value - 1];
                    if (n < SimpleSymbolicHanabi.nbCards) {
                        liste_var.push(SimpleSymbolicHanabi.getVarName(agent, n));
                    }
                }
            }

            let pre = new ExactlyFormula(nbCards, liste_var);

            // console.log(liste_var)

            return new SymbolicPublicAnnouncement(pre, that.agents);
            // return new SymbolicEventModel(that.agents, that.variables, events, agentRelations, name);
        }

        function colorAnnoucement(agent: string, nbCards: number, color: string): SymbolicPublicAnnouncement {
            // console.log(agent + " " + nbCards + " " + color)

            let liste_var = [];

            const id_c = SimpleSymbolicHanabi.colors.indexOf(color);
            for (let c = 0; c < 10; c++) {
                let n = id_c * 10 + c;
                if (n < SimpleSymbolicHanabi.nbCards) {
                    liste_var.push(SimpleSymbolicHanabi.getVarName(agent, n));
                }
            }

            // console.log("colorAnnoucement", agent, nbCards, color, liste_var)

            let pre = new ExactlyFormula(nbCards, liste_var);

            return new SymbolicPublicAnnouncement(pre, that.agents);
            // return new SymbolicEventModel(that.agents, that.variables, events, agentRelations, name);
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
        /*
        for (let agent of this.agents) {
            listActions.push(new EventModelAction({
                name: "Agent " + agent + " draws a card.",
                eventModel: draw_symbolic(agent)
            }));
            // DEBUG: we stop here for now
            // break;
        }*/

        /* Value announce */
        /*for (let agent of this.agents) {
            for (var value = 1; value < 6; value++) {
                for (var nb = 1; nb < 2; nb++) {
                    listActions.push(new EventModelAction({
                        name: "Agent " + agent + " has " + nb + "  '" + value + "' card(s).",
                        eventModel: valueAnnoucement(agent, nb, value)
                    }));
                    // DEBUG: we stop here for now
                    // break;
                }
            }
        }
*/
        /* Color annouce */
        /*    for (let agent of this.agents) {
                for (var color = 0; color < this.nb_colors; color++) {
                    let color_string = SimpleSymbolicHanabi.colors[color]
                    for (var nb = 1; nb < 6; nb++) {
                        listActions.push(new EventModelAction({
                            name: "Agent " + agent + " has " + nb + " " + color_string + " card(s).",
                            eventModel: colorAnnoucement(agent, nb, color_string)
                        }));
                    }
                }
            }*/
        console.log(listActions);
        this.actions = listActions;
        return listActions;
    }

    /**
     onRealWorldClick(env: Environment, point: { x: number; y: number; }) {
        let w = <SimpleHanabiWorld>env.getEpistemicModel().getPointedWorld();
        let card = w.getCardUnderCursor(point);
        if (card != undefined)
            env.perform(new EventModelAction({
                name: "Agent " + card.agent + " plays " + card.nb + ".",
                eventModel: this.getEventModelPlay(card.agent, card.nb, "p")
            }));
    }

     onRealWorldClickRight(env: Environment, point: { x: number; y: number; }) {
        let w = <SimpleHanabiWorld>env.getEpistemicModel().getPointedWorld();
        let card = w.getCardUnderCursor(point);
        console.log(card)
        if (card != undefined)
            env.perform(new EventModelAction({
                name: "Agent " + card.agent + " discards " + card.nb + ".",
                eventModel: this.getEventModelPlay(card.agent, card.nb, "e")
            }));
    } */
}
