import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { Environment } from '../environment/environment';
import { FormulaFactory } from '../formula/formula';
import { ExplicitEventModel } from '../eventmodel/explicit-event-model';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { ExampleDescription } from '../environment/exampledescription';
import { EventModelAction } from '../environment/event-model-action';
import { Postcondition } from '../eventmodel/postcondition';
import { World } from '../epistemicmodel/world';

/**
 * This file implements an example that illustrate the embedding of cellular automaton Rule 110 in DEL.
 * See IJCAI 2018 - Small undecidable problems in epistemic planning from Sébastien Lê Cong, Sophie Pinchinat and
 * François Schwarzentruber
 */

/**
 * @param truePropositions an array of true propositions
 * @returns a state where two agents have consecutive numbers
 * @example new CellularAutomataWorld(["p", "r"])
 * */
class CellularAutomataWorld extends World {
    constructor(cellState: string, propositionRightTrue: boolean) {
        super();
        this.cellState = cellState;
        this.propositionRightTrue = propositionRightTrue;

        let posleft = { x: 24, y: 32, r: 24 };
        let posright = { x: 128 - 24, y: 32, r: 24 };
        this.agentPos['a'] = propositionRightTrue ? posleft : posright;
        this.agentPos['b'] = propositionRightTrue ? posright : posleft;
        this.agentPos['c'] = undefined;
    }

    static readonly cellsImg = {
        0: CellularAutomataWorld.getImage('cell0.png'),
        1: CellularAutomataWorld.getImage('cell1.png'),
    };
    readonly cellState: string;
    readonly propositionRightTrue: boolean;

    modelCheck(phi: string) {
        return phi == 'r' ? this.propositionRightTrue : this.cellState == phi;
    }

    isPropositinoRightTrue() {
        return this.propositionRightTrue;
    }

    draw(context) {
        let ytop = 32 - 8;
        let height = 32;
        /*background of the cell depending on r*/

        context.fillStyle = this.isPropositinoRightTrue() ? 'gray' : 'white';
        context.fillRect(58 - 16, ytop, 32, height);
        context.drawImage(CellularAutomataWorld.cellsImg[this.cellState], 58 - 16, ytop, 32, height);
        context.strokeStyle = '#000000';

        for (let y of [ytop, ytop + height]) {
            context.beginPath();
            context.moveTo(0, y);
            context.lineTo(128, y);
            context.stroke();
        }

        context.strokeRect(58 - 16, ytop, 32, height);
        context.font = '20px Verdana';

        context.fillStyle = 'black';
        context.fillText(this.cellState, 58 - 8, 32 + 16);

        this.drawAgents(context);
    }

    toString() {
        return this.cellState + (this.isPropositinoRightTrue() ? ' (r)' : '');
    }
}

/**
 @class A postcondition that transforms a valuation by a set of assignments
 * @description the postcondition object corresponding to assignments given in post
 * @param: post is an associative array where entries are (proposition formula)
 Formula could be already parsed formula or string that represents the formula.
 * @example new CellularAutomatonPostcondition()
 * */
class CellularAutomatonPostcondition extends Postcondition {
    private readonly f: (l: string, m: string, r: string) => string;
    private readonly putrtrue: boolean;

    constructor(f: (l: string, m: string, r: string) => string, putrtrue: boolean) {
        super();
        this.f = f;
        this.putrtrue = putrtrue;
    }

    /**
     @param M an epistemic modelCheck
     @param w an id of a possible world
     @returns a world object that is the update of the world of id w by the postcondition
     */
    perform(M: ExplicitEpistemicModel, w: string) {
        let world = M.getNode(w) as CellularAutomataWorld;

        let leftAgent = world.isPropositinoRightTrue ? 'a' : 'b';
        let rightAgent = world.isPropositinoRightTrue ? 'b' : 'a';

        let leftSuccs = M.getSuccessorsID(w, leftAgent);
        let rightSuccs = M.getSuccessorsID(w, rightAgent);
        let leftWorld: CellularAutomataWorld;
        let rightWorld: CellularAutomataWorld;
        for (let u of leftSuccs) {
            if (u != w) {
                leftWorld = M.getNode(u) as CellularAutomataWorld;
            }
        }

        for (let u of rightSuccs) {
            if (u != w) {
                rightWorld = M.getNode(u) as CellularAutomataWorld;
            }
        }

        let l: string = leftWorld == undefined ? '0' : leftWorld.cellState;
        let r: string = rightWorld == undefined ? '0' : rightWorld.cellState;

        return new CellularAutomataWorld(this.f(l, world.cellState, r), this.putrtrue || world.isPropositinoRightTrue());
    }

    toString() {
        return 'f';
    }

    // Sorry, need to test with that
    getValuation() {
        return null;
    }
}

export class CellularAutomaton extends ExampleDescription {
    getDescription(): string[] {
        return [
            "The model is a simulation of rule 110 in cellular automata. Agents' knowledge simulate the current word and the actions simulate the computation steps.",
        ];
    }

    getAtomicPropositions(): string[] {
        return ['r', '1', '0'];
    }

    getName() {
        return 'Simulation of rule 110 cellular automaton';
    }

    getInitialEpistemicModel(): EpistemicModel {
        function getCellularAutomataInitialEpistemicModel(inputWord: string) {
            let M = new ExplicitEpistemicModel();

            let n = inputWord.length;

            let i1 = -Math.floor(n / 2) - 1;
            let i2 = Math.floor(n / 2) + 1;

            function getInputSymbol(i: number) {
                let j = i - i1 - 1;
                if (j < 0) {
                    return '0';
                }
                if (j > inputWord.length - 1) {
                    return '0';
                }
                return inputWord[j];
            }

            for (let i = i1; i <= i2; i++) {
                M.addWorld('w' + i, new CellularAutomataWorld(getInputSymbol(i), i % 2 == 0));
            }

            M.makeReflexiveRelation('a');
            M.makeReflexiveRelation('b');

            for (let i = i1; i < i2; i++) {
                if (i % 2 == 0) {
                    M.addEdge('b', 'w' + i, 'w' + (i + 1));
                } else {
                    M.addEdge('a', 'w' + i, 'w' + (i + 1));
                }
            }
            M.makeSymmetricRelation('a');
            M.makeSymmetricRelation('b');

            M.setPointedWorld('w0');

            return M;
        }

        return getCellularAutomataInitialEpistemicModel('01001');
    }

    getActions() {
        function getRule110CellularAutomataTransitionFunctionText(): string {
            return (
                '000 0' +
                '\n' +
                '001 1' +
                '\n' +
                '010 1' +
                '\n' +
                '011 1' +
                '\n' +
                '100 0' +
                '\n' +
                '101 1' +
                '\n' +
                '110 1' +
                '\n' +
                '111 0' +
                '\n'
            );
        }

        /**
         @example getCellularAutomataFunction()("1","1","1") returns "0"
         */
        function getCellularAutomataFunction(cellularAutomatonCode: string): (l: string, m: string, r: string) => string {
            let transitionFunctionCode = cellularAutomatonCode;
            let transitionFunction = {};
            transitionFunction['   '] = ' ';
            for (let line of transitionFunctionCode.split('\n')) {
                if (line != '') {
                    line = line + '     ';
                    transitionFunction[line.substring(0, 3)] = line[4];
                }
            }
            return (l, m, r) => (transitionFunction[l + m + r] != undefined ? transitionFunction[l + m + r] : '0');
        }

        function getCellularAutomataEventModel(cellularAutomatonCode: string) {
            let E = new ExplicitEventModel();

            let nKar = FormulaFactory.createFormula('(not (Kpos a r))');
            let nKbr = FormulaFactory.createFormula('(not (Kpos b r))');

            let f = getCellularAutomataFunction(cellularAutomatonCode);
            let post = new CellularAutomatonPostcondition(f, false);
            let postr = new CellularAutomatonPostcondition(f, true);
            E.addAction('e-3', nKbr, post);
            E.addAction('e-2', nKbr, postr);
            E.addAction('e-1', nKbr, post);
            E.addAction('e0', FormulaFactory.createFormula('((Kpos a r) and (Kpos b r))'), post);
            E.addAction('e1', nKar, post);
            E.addAction('e2', nKar, postr);
            E.addAction('e3', nKar, post);

            let intToEvent = (i: number) => 'e' + i;

            for (let i = -1; i <= 1; i++) {
                E.addEdge('a', intToEvent(2 * i - 1), intToEvent(2 * i));
            }

            for (let i = -1; i <= 1; i++) {
                E.addEdge('b', intToEvent(2 * i), intToEvent(2 * i + 1));
            }

            E.makeReflexiveRelation('a');
            E.makeReflexiveRelation('b');

            E.makeSymmetricRelation('a');
            E.makeSymmetricRelation('b');

            E.setPointedAction('e0');

            return E;
        }

        return [
            new EventModelAction({
                name: 'one-step computation',
                eventModel: getCellularAutomataEventModel(getRule110CellularAutomataTransitionFunctionText()),
            }),
        ];
    }

    getWorldExample(): World {
        return new CellularAutomataWorld('1', false);
    }

    onRealWorldClick(env: Environment, point: any): void {}
}
