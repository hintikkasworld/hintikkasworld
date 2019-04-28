import { ExactlyFormula, TrueFormula } from './../formula/formula';
import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Environment } from '../environment/environment';
import { Valuation } from '../epistemicmodel/valuation';
import { SymbolicEpistemicModel } from '../epistemicmodel/symbolic-epistemic-model';
import { Obs } from '../epistemicmodel/symbolic-relation';

class MineSweeperWorld extends WorldValuation {
    readonly nbcols: number;
    readonly nbrows: number;
    xt = 38;
    yt = 0;
    readonly cellSize: number;
    static imgExplosion = MineSweeperWorld.getImage("bomb.png");

    constructor(valuation: Valuation) {
        super(valuation);
        this.nbrows = 8;
        this.nbcols = 10;
        this.cellSize = 8;
        this.agentPos["a"] = { x: 16, y: 32, r: 16 };
    }



    draw(context: CanvasRenderingContext2D) {
        this.drawAgents(context);

        context.strokeStyle = "black";
        context.fillStyle = "lightgray";
        context.fillRect(this.xt, 0, this.nbcols * this.cellSize, this.nbrows * this.cellSize);
        for (let x = 0; x <= this.nbcols; x++) {
            context.beginPath();
            context.moveTo(this.xt + x * this.cellSize, this.yt);
            context.lineTo(this.xt + x * this.cellSize, this.yt + this.nbrows * this.cellSize);
            context.stroke();
        }
        for (let y = 0; y <= this.nbrows; y++) {
            context.beginPath();
            context.moveTo(this.xt, this.yt + y * this.cellSize);
            context.lineTo(this.xt + this.nbcols * this.cellSize, this.yt + y * this.cellSize);
            context.stroke();
        }

        context.font = "6px Verdana";
        let imgExplosionPadding = 2;
        for (let x = 1; x <= this.nbcols; x++)
            for (let y = 1; y <= this.nbrows; y++) {
                if (this.modelCheck("m" + y + x))
                    context.drawImage(MineSweeperWorld.imgExplosion,
                        this.xt + (x - 1) * this.cellSize + imgExplosionPadding,
                        (y - 1) * this.cellSize + imgExplosionPadding,
                        this.cellSize - 2 * imgExplosionPadding,
                        this.cellSize - 2 * imgExplosionPadding);
                else {
                    let hint = this.getHint({ x: x, y: y });

                    if (hint > 0) {
                        if (hint == 1) context.strokeStyle = "#0000FF";
                        if (hint == 2) context.strokeStyle = "#008800";
                        context.strokeText(hint.toString(), this.xt + (x - 1) * this.cellSize + this.cellSize / 3,
                            (y) * this.cellSize - this.cellSize / 3);
                    }

                }
            }
    }

    /*
     * returns the cell under the point (in point, x and y are in pixels)
     */
    getCell(point) {
        if (point.x < this.xt) return undefined;
        if (point.x > this.xt + this.nbcols * this.cellSize) return undefined;
        if (point.y < this.yt) return undefined;
        if (point.y > this.yt + this.nbrows * this.cellSize) return undefined;

        return {
            x: Math.floor((point.x - this.xt) / this.cellSize) + 1,
            y: Math.floor((point.y - this.yt) / this.cellSize) + 1
        };
    }

    /*
     * @returns the number of bombs in the neighborhood of cell
     */
    getHint(cell) {
        let c = 0;
        for (let y = Math.max(1, cell.y - 1); y <= Math.min(this.nbrows, cell.y + 1); y++)
            for (let x = Math.max(1, cell.x - 1); x <= Math.min(this.nbcols, cell.x + 1); x++)
                if (this.modelCheck("m" + y + x))
                    c++;
        return c;
    }

    /*
     * @returns true iff there is a bomb at cell
     */
    isMine(cell) {
        return this.modelCheck("m" + cell.y + cell.x);
    }
}





export class MineSweeper extends ExampleDescription {
    readonly nbcols: number;
    readonly nbrows: number;
    readonly nbmines: number;


    constructor(nbrows: number, nbcols: number, nbmines: number) {
        super();
        this.nbcols = nbcols;
        this.nbrows = nbrows;
        this.nbmines = nbmines;
    }


    getName() {
        return "Mine Sweeper";
    }


    getAtoms() {
        let A = [];
        for (let y = 1; y <= this.nbrows; y++)
            for (let x = 1; x <= this.nbcols; x++)
                A.push("m" + y.toString() + x.toString());
        return A;
    }

    /*
     * @returns the initial Kripke model of MineSweeper
     * where agent 2 only knows there are exactly two bombs.
     */
    getInitialEpistemicModel(): SymbolicEpistemicModel {
        let rels = new Map();
        rels.set("a", new Obs([]));

        let M = SymbolicEpistemicModel.build(MineSweeperWorld, ["a"],
            this.getAtoms(), rels, new ExactlyFormula(this.nbmines, this.getAtoms()));

        M.setPointedValuation(this.getValuationExample());
        return M;
    }

    /* @returns the Kripke model where the agent looses*/
    getMineSweeperGameOverKripkeModel() {
        //we do not care the model to be explicit :) It is a fake single world model
        let M = new ExplicitEpistemicModel();
        let A = [];
        for (let y = 1; y <= this.nbrows; y++)
            for (let x = 1; x <= this.nbcols; x++)
                A.push("m" + y + x);

        M.addWorld("w", new MineSweeperWorld(new Valuation(A)));
        M.makeCompleteRelation("a");
        M.setPointedWorld("w");
        return M;
    }


    getValuationExample(): Valuation {
        let V = []
        for (let i = 1; i <= this.nbmines; i++) {
            while (true) {
                const x = 1 + Math.round(Math.random() * (this.nbcols - 1));
                const y = 1 + Math.round(Math.random() * (this.nbrows - 1));
                if (!V.includes("m" + y + x)) {
                    V.push("m" + y + x);
                    break;
                }
            }
        }
        return new Valuation(V);
    }
    getWorldExample() { return new MineSweeperWorld(this.getValuationExample()); }

    /*
     * event when the player clicks on the real world
     */
    onRealWorldClick(env: Environment, point) {
        let M: SymbolicEpistemicModel = <SymbolicEpistemicModel>env.getEpistemicModel();
        let pointedWorld: MineSweeperWorld = <MineSweeperWorld>M.getPointedWorld();

        let cell = pointedWorld.getCell(point);

        if (cell == undefined) return;

        if (pointedWorld.isMine(cell)) {
            console.log("lost");
            env.setEpistemicModel(this.getMineSweeperGameOverKripkeModel());
        }
        else {
            let hint = pointedWorld.getHint(cell);

            //TODO SYMBOLIC PUBLIC ANNOUNCEMENT that the number of mines around cell is hint

        }
    }

    getActions() {
        return [];
    }


}
