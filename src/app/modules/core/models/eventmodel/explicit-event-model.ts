import { environment } from 'src/environments/environment';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { Postcondition } from './postcondition';
import { TrivialPostcondition } from './trivial-postcondition';
import { Formula, FormulaFactory } from '../formula/formula';
import { EventModel } from './event-model';
import { Graph } from '../graph';
import { Event } from './event';
import { World } from '../epistemicmodel/world';

export class ExplicitEventModel extends Graph<Event> implements EventModel<ExplicitEpistemicModel> {
    constructor() {
        super();
    }

    static getEventModelPublicAnnouncement(formula: Formula): ExplicitEventModel {
        let E = new ExplicitEventModel();
        E.addAction('e', formula, new TrivialPostcondition());

        for (let a of environment.agents) {
            E.addLoop(a, 'e');
        }

        E.setPointedAction('e');

        return E;
    }

    static getActionModelPrivateAnnouncement(formula: Formula, agent: string) {
        let E = new ExplicitEventModel();
        E.addAction('e', formula, new TrivialPostcondition());
        E.addAction('t', FormulaFactory.createFormula('top'), new TrivialPostcondition());

        E.addLoop(agent, 'e');
        E.addLoop(agent, 't');
        E.setPointedAction('e');

        for (let a of environment.agents) {
            if (a != agent) {
                E.addEdge(a, 'e', 't');
                E.addLoop(a, 't');
            }
        }

        return E;
    }

    static getActionModelSemiPrivateAnnouncement(formula: Formula, agent: string) {
        let E = new ExplicitEventModel();
        E.addAction('e', formula, new TrivialPostcondition());
        E.addAction('t', FormulaFactory.createNegationOf(formula), new TrivialPostcondition());

        E.addLoop(agent, 'e');
        E.addLoop(agent, 't');
        E.setPointedAction('e');

        for (let a of environment.agents) {
            if (a != agent) {
                E.addEdge(a, 'e', 't');
                E.addEdge(a, 't', 'e');
                E.addLoop(a, 't');
                E.addLoop(a, 'e');
            }
        }

        return E;
    }

    setPointedAction(e: string) {
        if (this.nodes[e] == undefined) {
            throw new Error('the action model does not contain any world of ID ' + e);
        }

        this.setPointedNode(e);
    }

    getPointedAction(): string {
        return this.getPointedNode();
    }

    /**
     * @memberof ActionModel
     * @param e event identifier
     * @param pre a precondition (a formula).
     * @param post a postcondition (an object that represents the postcondition).
     If post is undefined/unspecified, then the postcondition is trivial
     If post is an associate array then post is implicitely replaced by
     new PropositionalAssignmentsPostcondition(post)
     * @example E.addAction("e1", createFormula("(K a p)"))
     * @example E.addAction("e1", "(K a p)")
     * @example E.addAction("e1", "(K a p)", {"p": "(K a q)", "q": "(not p)"})
     * */
    addAction(e: string, pre: Formula, post: Postcondition = new TrivialPostcondition()) {
        this.addNode(e, {
            pre: pre,
            post: post
        });
    }

    /**
     * @param e event identifier
     * @returns (the internal representation of) a formula that is the
     precondition of e
     * */
    getPrecondition(e): Formula {
        return (this.nodes[e] as Event).pre;
    }

    /**
     * @param e event identifier
     * @returns the postcondition of e. The postcondition is an object that
     should implement
     * */
    getPostcondition(e): Postcondition {
        return (this.nodes[e] as Event).post;
    }

    async isApplicableIn(M: ExplicitEpistemicModel): Promise<boolean> {
        return M.check(this.getPrecondition(this.getPointedAction()));
    }

    apply(M: ExplicitEpistemicModel): ExplicitEpistemicModel {
        /**
         * @param a world identifier w
         * @param an event identifier e
         * @returns the identifier of (w, e)
         */
        function createWorldActionName(w: string, e: string): string {
            return w + '_' + e;
        }

        /**
         * @param M epistemic model
         * @param E action model
         * @returns the epistemic model that is the product of M and E
         */
        function product(M: ExplicitEpistemicModel, E: ExplicitEventModel): ExplicitEpistemicModel {
            let ME = new ExplicitEpistemicModel();
            let agents = environment.agents;

            for (let w in M.getNodes()) {
                for (let e in E.nodes) {
                    if (M.modelCheck(w, E.getPrecondition(e))) {
                        const we = createWorldActionName(w, e);
                        const newcontent: World = E.getPostcondition(e).perform(M, w);
                        ME.addWorld(we, newcontent);
                    }
                }
            }

            for (let w1 in M.getNodes()) {
                for (let e1 in E.nodes) {
                    let we1 = createWorldActionName(w1, e1);
                    if (ME.hasNode(we1)) {
                        for (let a of agents) {
                            let succw1 = M.getSuccessorsID(w1, a);
                            let succe1 = E.getSuccessorsID(e1, a);
                            for (let w2 of succw1) {
                                for (let e2 of succe1) {
                                    let we2 = createWorldActionName(w2, e2);
                                    if (ME.hasNode(we2)) {
                                        ME.addEdge(a, we1, we2);
                                    }
                                }
                            }
                        }
                    }
                }
            }

            if (M.getPointedWorldID() != undefined && E.getPointedAction() != undefined) {
                let we = createWorldActionName(M.getPointedWorldID(), E.getPointedAction());
                if (ME.hasNode(we)) {
                    ME.setPointedWorld(we);
                } else {
                    throw new Error('cannot be applied!');
                }
            }

            return ME;
        }

        return product(M, this);
    }
}
