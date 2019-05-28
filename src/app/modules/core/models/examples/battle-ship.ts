import { ExampleDescription } from '../environment/exampledescription';
import { Birthday } from './birthday';
import { Flatland } from './flatland';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { Valuation } from '../epistemicmodel/valuation';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Obs } from '../epistemicmodel/symbolic-relation';
import { ExactlyFormula, TrueFormula, AndFormula, ImplyFormula, AtomicFormula, NotFormula, OrFormula } from '../formula/formula';
import { WorldValuationType } from '../epistemicmodel/world-valuation-type';

class Cell {
    row: number;
    col: number;
}


class Point2D {
    x: number;
    y: number;
}

function getRandomNumber(a: number, b: number) {
    return a + Math.round(Math.random() * (b - a));
}
function curryClass(SourceClass, arg1, arg2, arg3, arg4, arg5) {
    var curriedArgs = Array.prototype.slice.call(arguments, 1);

    return function curriedConstructor() {
        var combinedArgs = curriedArgs.concat(Array.prototype.slice.call(arguments, 0));

        // Create an object that inherits from `proto`
        var hasOwnProto = Object(SourceClass.prototype) === SourceClass.prototype;
        var obj = Object.create(hasOwnProto ? SourceClass.prototype : Object.prototype);

        // Apply the function setting `obj` as the `this` value
        var ret = SourceClass.apply(obj, combinedArgs);

        if (Object(ret) === ret) { // the result is an object?
            return ret;
        }

        return obj;
    };
};

/**
 * 
 * @param agent: name of the agent
 * @param col: column number 
 * @param row: row number
 * @returns the atom that says "in the bord of agent at cell (col,row) there is a part of a ship." 
 */
function getAtomIsTheCellOccupied(agent: string, col: number, row: number): string {
    return (agent + "_" + String.fromCharCode(64 + col) + row.toString())
}

/**
 * 
 * @param agent: name of the agent
 * @param direction: direction of the size (either "hor" for horizontal or "ver" for vertical) 
 * @param col: column number 
 * @param row: row number 
 * @param size: size of the ship
 * @returns: the atom that says "in the board of agent at cell (col,row), a ship of size 'size' and of direction 'direction' begins." 
 */

function getAtomBeginningShip(agent: string, direction: string, col: number, row: number, size: number): string {
    return (agent + "_" + direction + "_" + size + "_" + String.fromCharCode(64 + col) + row.toString())
}

class BattleShipWorld extends WorldValuation {
    readonly nbcols: number;
    readonly nbrows: number;
    readonly agents: string[];
    readonly ships: number[];
    static readonly xt = 16;
    static readonly yt = 0;
    readonly cellSize: number;
    static imgFull = BattleShipWorld.getImage("bomb.png");
    readonly clicked;

    constructor(nbrows, nbcols, agents, ships, clicked, valuation: Valuation) {
        super(valuation);
        this.nbrows = nbrows;
        this.nbcols = nbcols;
        this.agents = agents;
        this.ships = ships;
        this.clicked = clicked;
        this.cellSize = Math.min(16, Math.min((64 - BattleShipWorld.yt) / (nbrows + 1), (128 - BattleShipWorld.xt) / (3 + 2 * nbcols)));
        this.agentPos["a"] = { x: 10, y: 32, r: 10 };
        this.agentPos["b"] = { x: 128 - 10, y: 32, r: 10 };
    }

    isClicked(row, col) {
        return this.clicked[row * (this.nbcols + 1) + col];
    }

    draw(context: CanvasRenderingContext2D) {
        this.drawAgents(context);

        // We draw the backgrounds of the grids.
        context.fillStyle = "lightgray";

        context.fillRect(BattleShipWorld.xt, 0, this.nbcols * this.cellSize, this.nbrows * this.cellSize);
        context.fillRect(BattleShipWorld.xt + (this.nbcols + 1) * this.cellSize, 0, this.nbcols * this.cellSize, this.nbrows * this.cellSize);
        let imgFullPadding = 0;

        // We draw the left grid.
        context.strokeStyle = "black";
        for (let col = 0; col <= this.nbcols; col++) {
            context.beginPath();
            context.moveTo(BattleShipWorld.xt + col * this.cellSize, BattleShipWorld.yt);
            context.lineTo(BattleShipWorld.xt + col * this.cellSize, BattleShipWorld.yt + this.nbrows * this.cellSize);
            context.stroke();
        }
        for (let row = 0; row <= this.nbrows; row++) {
            context.beginPath();
            context.moveTo(BattleShipWorld.xt, BattleShipWorld.yt + row * this.cellSize);
            context.lineTo(BattleShipWorld.xt + this.nbcols * this.cellSize, BattleShipWorld.yt + row * this.cellSize);
            context.stroke();
        }

        // We draw the right grid.
        for (let col = this.nbcols + 1; col <= 2 * this.nbcols + 1; col++) {
            context.beginPath();
            context.moveTo(BattleShipWorld.xt + col * this.cellSize, BattleShipWorld.yt);
            context.lineTo(BattleShipWorld.xt + col * this.cellSize, BattleShipWorld.yt + this.nbrows * this.cellSize);
            context.stroke();
        }
        for (let row = 0; row <= this.nbrows; row++) {
            context.beginPath();
            context.moveTo(BattleShipWorld.xt + (this.nbcols + 1) * this.cellSize, BattleShipWorld.yt + row * this.cellSize);
            context.lineTo(BattleShipWorld.xt + (2 * this.nbcols + 1) * this.cellSize, BattleShipWorld.yt + row * this.cellSize);
            context.stroke();
        }

        // We place the boats of the left grid.

        context.strokeStyle = "b";
        context.fillStyle = "gray";
        for (let agent = 0; agent <= this.agents.length - 1; agent++) {
            for (let col = 1; col <= this.nbcols; col++) {
                for (let row = 1; row <= this.nbrows; row++) {
                    for (let size = 0; size <= this.ships.length - 1; size++) {
                        if (this.modelCheck(getAtomBeginningShip(this.agents[agent], "hor", col, row, this.ships[size]))) {
                            this.placeBoat(context, col, row, this.ships[size], agent * (this.nbcols + 1), "hor");
                        }
                        else {
                            if (this.modelCheck(getAtomBeginningShip(this.agents[agent], "ver", col, row, this.ships[size]))) {
                                this.placeBoat(context, col, row, this.ships[size], agent * (this.nbcols + 1), "ver");

                            }
                        }

                    }
                }
            }
        }

    }

    /**
     * Function that draws a boat.
     * @param context: the canevas to draw into 
     * @param col: the column of the start of the boat. 
     * @param row: the row of the start of the boat. 
     * @param size: the size of the boat. 
     * @param coloffset: the offset on the column if we have to draw on the grid on the right player. 
     * @param direction: the direction of the boat (either "hor" for horizontal or "ver" for vertical) 
     */
    placeBoat(context, col: number, row: number, size: number, coloffset: number, direction: string) {
        if (direction == "hor") {
            context.fillRect(BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize, (row - 1) * this.cellSize, size * this.cellSize, this.cellSize);
            context.beginPath()
            context.rect(BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize, (row - 1) * this.cellSize, size * this.cellSize, this.cellSize)
            context.stroke();
        }
        else {
            if (direction == "ver") {
                context.fillRect(BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize, (row - 1) * this.cellSize, this.cellSize, size * this.cellSize);
                context.beginPath()
                context.rect(BattleShipWorld.xt + (col - 1 + coloffset) * this.cellSize, (row - 1) * this.cellSize, this.cellSize, size * this.cellSize)
                context.stroke();
            }
        }

    }
    /*
     * returns the cell under the point (in point, x and y are in pixels)
     */
    getCell(point: Point2D): Cell {
        if (point.x < BattleShipWorld.xt) return undefined;
        if (point.x > BattleShipWorld.xt + this.nbcols * this.cellSize) return undefined;
        if (point.y < BattleShipWorld.yt) return undefined;
        if (point.y > BattleShipWorld.yt + this.nbrows * this.cellSize) return undefined;

        return {
            col: Math.floor((point.x - BattleShipWorld.xt) / this.cellSize) + 1,
            row: Math.floor((point.y - BattleShipWorld.yt) / this.cellSize) + 1
        };
    }

    /*
     * @returns the number of bombs in the neighborhood of cell
     */
    getHint(cell: Cell): number {
        let c = 0;
        for (let y = Math.max(1, cell.row - 1); y <= Math.min(this.nbrows, cell.row + 1); y++)
            for (let x = Math.max(1, cell.col - 1); x <= Math.min(this.nbcols, cell.col + 1); x++)
                if (this.modelCheck("m" + y + x))
                    c++;
        return c;
    }

    /*
     * @returns true iff there is a bomb at cell
     */
    isMine(cell: Cell) { return this.modelCheck("m" + cell.row + cell.col); }
}

export class BattleShip extends ExampleDescription {

    readonly nbcols: number;
    readonly nbrows: number;
    readonly ships: number[];
    readonly agents = ["a", "b"];
    clicked;
    readonly atmset: string[];

    readonly shipsduplfree: number[]
    atmsetShips = new Map();
    constructor(nbrows: number, nbcols: number, ships: number[]) {
        super();
        this.nbcols = nbcols;
        this.nbrows = nbrows;
        this.ships = ships;
        this.atmset = this.generateAtomicPropositions();
        this.shipsduplfree = [];
        for (let i = 0; i <= this.ships.length - 1; i++) {
            if (!(this.shipsduplfree.includes(this.ships[i]))) {
                this.shipsduplfree.push(this.ships[i]);
            }
        }
    }

    getAtomicPropositions(): string[] {
        return this.atmset;
    }

    /**
     * examples of propositions:
     * a_hor_3_A2: there is a horizontal ship of length 3 starting in A2 in a's grid  (the ship is in A2-A3-A4)
     * a_ver_3_A2: there is a vertical ship of length 3 starting in A2 in a's grid  (the ship is in A2-B2-C2)
     */
    generateAtomicPropositions(): string[] {
        let A = [];
        //this.atmsetShips = new Map();
        /* for (let x = 1; x <= this.nbcols; x++) {
              for (let y = 1; y <= this.nbrows; y++) {
                 for (var agent = 0; agent < this.agents.length; agent++) {
                     A.push(getAtomIsTheCellOccupied(this.agents[agent],x,y));
                  }
              }
         }*/


        for (let agent = 0; agent < this.agents.length; agent++) {
            let S = [];
            let m = new Map();
            for (let size = 0; size < this.ships.length; size++) {
                if (!(S.includes(this.ships[size]))) {
                    S.push(this.ships[size])
                    let ll = [];
                    for (let x = 1; x <= this.nbcols + 1 - this.ships[size]; x++) {
                        for (let y = 1; y <= this.nbrows; y++) {
                            A.push(getAtomBeginningShip(this.agents[agent], "hor", x, y, this.ships[size]));
                            ll.push(getAtomBeginningShip(this.agents[agent], "hor", x, y, this.ships[size]))
                        }
                    }


                    for (let x = 1; x <= this.nbcols; x++) {
                        for (let y = 1; y <= this.nbrows + 1 - this.ships[size]; y++) {

                            A.push(getAtomBeginningShip(this.agents[agent], "ver", x, y, this.ships[size]));
                            ll.push(getAtomBeginningShip(this.agents[agent], "ver", x, y, this.ships[size]));
                        }

                    }
                    m.set(this.ships[size], ll);
                }

            }
            this.atmsetShips.set(this.agents[agent], m)
        }
        return A;
    }
    getName() {
        return "BattleShip.";
    }
    getInitialEpistemicModel(): import("../epistemicmodel/epistemic-model").EpistemicModel {
        this.clicked = {};
        let rels = new Map();
        rels.set("a", new Obs([]));
        rels.set("b", new Obs([]));
        let l = [];

        for (let i = 0; i < this.shipsduplfree.length; i++) {
            for (let agent = 0; agent <= this.agents.length - 1; agent++) {
                l.push(new ExactlyFormula(1, this.atmsetShips.get(this.agents[agent]).get(this.shipsduplfree[i])))
                for (let col = 1; col <= this.nbcols; col++) {
                    for (let row = 1; row <= this.nbrows; row++) {
                        l.push(new OrFormula([new NotFormula(new AtomicFormula(getAtomBeginningShip(this.agents[agent], "hor", col, row, this.shipsduplfree[i]))),
                        new NotFormula(new AtomicFormula(getAtomBeginningShip(this.agents[agent], "ver", col, row, this.shipsduplfree[i])))]))
                        let l2 = [];
                        for (let i2 = 0; i2 <= this.shipsduplfree.length - 1; i2++) {
                            if (i2 != i) {
                                for (let col2 = Math.min(1, col - this.shipsduplfree[i] + 1); col2 <= col; col++) {
                                    l2.push(new NotFormula(new AtomicFormula(getAtomBeginningShip(this.agents[agent], "hor", col2, row, this.shipsduplfree[i]))))
                                }
                                for (let row2 = Math.min(1, row - this.shipsduplfree[i] + 1); row2 <= row; row++) {
                                    l2.push(new NotFormula(new AtomicFormula(getAtomBeginningShip(this.agents[agent], "ver", col, row2, this.shipsduplfree[i]))))
                                }
                            }
                        }
                        /* l.push(new ImplyFormula(new OrFormula([new AtomicFormula(getAtomBeginningShip(this.agents[agent],"hor",col,row,this.shipsduplfree[i])),new AtomicFormula(getAtomBeginningShip(this.agents[agent],"ver",col,row,this.shipsduplfree[i]))])
                             ,new AndFormula(l2))) */
                    }
                }
            }
        }


        //  let M = SymbolicEpistemicModel.build(this.getWorldClass(), ["a"], this.getAtomicPropositions(), rels, new ExactlyFormula(this.ships.reduce((a,b) => a + b, 0), this.getAtomicPropositions()));
        // 
        console.log(l)
        console.log(this.getAtomicPropositions())
        let M = SymbolicEpistemicModel.build(this.getWorldClass(), ["a", "b"], this.getAtomicPropositions(), rels, new AndFormula(l));
        M.setPointedValuation(this.getValuationExample());
        return M;
    }

    getValuationExample(): Valuation {
        let V = []
        for (let agent = 0; agent <= this.agents.length - 1; agent++) {
            for (let i = 0; i <= this.ships.length - 1; i++) {
                while (true) {
                    if (getRandomNumber(0, 1) == 0) {
                        const dir = "ver"
                        const col = getRandomNumber(1, this.nbcols);
                        const row = getRandomNumber(1, this.nbrows + 1 - this.ships[i]);
                        var b = true;
                        for (let x = row; x <= row + this.ships[i] - 1; x++) {
                            if (V.includes(getAtomIsTheCellOccupied(this.agents[agent], col, x))) {
                                b = false
                            }
                        }
                        if (b) {
                            for (let x = row; x <= row + this.ships[i] - 1; x++) {
                                V.push(getAtomIsTheCellOccupied(this.agents[agent], col, x));
                            }
                            V.push(getAtomBeginningShip(this.agents[agent], dir, col, row, this.ships[i]))
                            break;
                        }
                    }
                    else {
                        const dir = "hor"
                        const col = getRandomNumber(1, this.nbcols + 1 - this.ships[i]);
                        const row = getRandomNumber(1, this.nbrows);
                        var b = true;
                        for (let y = col; y <= col + this.ships[i] - 1; y++) {
                            if (V.includes(getAtomIsTheCellOccupied(this.agents[agent], y, row))) {
                                b = false
                            }
                        }
                        if (b) {
                            for (let y = col; y <= col + this.ships[i] - 1; y++) {
                                V.push(getAtomIsTheCellOccupied(this.agents[agent], y, row));
                            }
                            V.push(getAtomBeginningShip(this.agents[agent], dir, col, row, this.ships[i]))
                            break;
                        }
                    }

                }
            }
        }

        return new Valuation(V);
    }
    getWorldClass(): import("../epistemicmodel/world-valuation-type").WorldValuationType {
        return <WorldValuationType><unknown>curryClass(BattleShipWorld, this.nbrows, this.nbcols, this.agents, this.ships, this.clicked);
    }
    getDescription(): string[] {
        return [""]
    }
    getActions() {
        return [];
    }


}
