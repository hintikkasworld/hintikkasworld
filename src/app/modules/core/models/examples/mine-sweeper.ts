import { EventModelAction } from '../environment/event-model-action';
import { SymbolicPublicAnnouncementBDD } from '../eventmodel/symbolic-public-announcement';
import { AndFormula, AtomicFormula, ExactlyFormula, Formula, NotFormula } from '../formula/formula';
import { ExplicitEpistemicModel } from '../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from '../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Environment } from '../environment/environment';
import { Valuation } from '../epistemicmodel/valuation';
import { Obs, SymbolicRelation } from '../epistemicmodel/symbolic-relation';
import { SEModelDescriptor } from '../epistemicmodel/descriptor/se-model-descriptor';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
import { SymbolicEpistemicModelBDD } from '../epistemicmodel/symbolic-epistemic-model-bdd';

class Cell {
    row: number;
    col: number;
}

class Point2D {
    x: number;
    y: number;
}

class MineSweeperWorld extends WorldValuation {
    constructor(nbrows, nbcols, clicked, valuation: Valuation) {
        super(valuation);
        this.nbrows = nbrows;
        this.nbcols = nbcols;
        this.clicked = clicked;
        this.cellSize = Math.min(16, Math.min((64 - MineSweeperWorld.yt) / nbrows, (128 - MineSweeperWorld.xt) / nbcols));
        this.agentPos['a'] = { x: 16, y: 32, r: 16 };
    }

    static readonly xt = 38;
    static readonly yt = 0;
    static imgExplosion = MineSweeperWorld.getImage('bomb.png');
    readonly nbcols: number;
    readonly nbrows: number;
    readonly cellSize: number;
    readonly clicked;

    isClicked(row, col) {
        return this.clicked[row * (this.nbcols + 1) + col];
    }

    draw(context: CanvasRenderingContext2D) {
        this.drawAgents(context);

        context.strokeStyle = 'black';
        context.fillStyle = 'lightgray';
        context.fillRect(MineSweeperWorld.xt, 0, this.nbcols * this.cellSize, this.nbrows * this.cellSize);
        for (let col = 0; col <= this.nbcols; col++) {
            context.beginPath();
            context.moveTo(MineSweeperWorld.xt + col * this.cellSize, MineSweeperWorld.yt);
            context.lineTo(MineSweeperWorld.xt + col * this.cellSize, MineSweeperWorld.yt + this.nbrows * this.cellSize);
            context.stroke();
        }
        for (let row = 0; row <= this.nbrows; row++) {
            context.beginPath();
            context.moveTo(MineSweeperWorld.xt, MineSweeperWorld.yt + row * this.cellSize);
            context.lineTo(MineSweeperWorld.xt + this.nbcols * this.cellSize, MineSweeperWorld.yt + row * this.cellSize);
            context.stroke();
        }

        context.fillStyle = 'orange';
        for (let col = 1; col <= this.nbcols; col++) {
            for (let row = 1; row <= this.nbrows; row++) {
                if (this.isClicked(row, col)) {
                    context.fillRect(
                        MineSweeperWorld.xt + (col - 1) * this.cellSize,
                        MineSweeperWorld.yt + (row - 1) * this.cellSize,
                        this.cellSize,
                        this.cellSize
                    );
                }
            }
        }

        context.font = this.cellSize - 2 + 'px Verdana';
        let imgExplosionPadding = 0;
        for (let col = 1; col <= this.nbcols; col++) {
            for (let row = 1; row <= this.nbrows; row++) {
                if (this.modelCheck(MineSweeper.getAtomicProposition(row, col))) {
                    context.drawImage(
                        MineSweeperWorld.imgExplosion,
                        MineSweeperWorld.xt + (col - 1) * this.cellSize + imgExplosionPadding,
                        (row - 1) * this.cellSize + imgExplosionPadding,
                        this.cellSize - 2 * imgExplosionPadding,
                        this.cellSize - 2 * imgExplosionPadding
                    );
                } else {
                    let hint = this.getHint({ col, row });

                    if (hint > 0) {
                        if (hint == 1) {
                            context.strokeStyle = '#0000FF';
                        }
                        if (hint == 2) {
                            context.strokeStyle = '#008800';
                        }
                        context.strokeText(
                            hint.toString(),
                            MineSweeperWorld.xt + (col - 1) * this.cellSize + this.cellSize / 3,
                            row * this.cellSize - this.cellSize / 3
                        );
                    }
                }
            }
        }
    }

    /*
     * returns the cell under the point (in point, x and y are in pixels)
     */
    getCell(point: Point2D): Cell {
        if (point.x < MineSweeperWorld.xt) {
            return undefined;
        }
        if (point.x > MineSweeperWorld.xt + this.nbcols * this.cellSize) {
            return undefined;
        }
        if (point.y < MineSweeperWorld.yt) {
            return undefined;
        }
        if (point.y > MineSweeperWorld.yt + this.nbrows * this.cellSize) {
            return undefined;
        }

        return {
            col: Math.floor((point.x - MineSweeperWorld.xt) / this.cellSize) + 1,
            row: Math.floor((point.y - MineSweeperWorld.yt) / this.cellSize) + 1
        };
    }

    /*
     * @returns the number of bombs in the neighborhood of cell
     */
    getHint(cell: Cell): number {
        let c = 0;
        for (let y = Math.max(1, cell.row - 1); y <= Math.min(this.nbrows, cell.row + 1); y++) {
            for (let x = Math.max(1, cell.col - 1); x <= Math.min(this.nbcols, cell.col + 1); x++) {
                if (this.modelCheck(MineSweeper.getAtomicProposition(y, x))) {
                    c++;
                }
            }
        }
        return c;
    }

    /*
     * @returns true iff there is a bomb at cell
     */
    isMine(cell: Cell) {
        return this.modelCheck(MineSweeper.getAtomicProposition(cell.row, cell.col));
    }
}

export class MineSweeper extends ExampleDescription {
    constructor(nbrows: number, nbcols: number, nbmines: number) {
        super();
        this.nbcols = nbcols;
        this.nbrows = nbrows;
        this.nbmines = nbmines;
        this.clicked = {};
    }

    readonly nbcols: number;
    readonly nbrows: number;
    readonly nbmines: number;
    clicked: { [pos: number]: boolean };

    static getAtomicProposition(r, c) {
        return 'p_' + r.toString() + '_' + c.toString();
    }

    getDescription(): string[] {
        let A = [
            'There is a grid with mines in certain cells. Other cells either contain the number of mines adjacent (including diagonals) or are empty.'
        ];
        A.push('');
        let mine_s = 'mines';
        if (this.nbmines < 2) {
            mine_s = 'mine';
        }
        A.push(
            'The grid is of size ' +
                this.nbrows.toString() +
                'x' +
                this.nbcols.toString() +
                ' and there is ' +
                this.nbmines.toString() +
                ' ' +
                mine_s +
                '.'
        );
        return A;
    }

    getName() {
        if (this.nbrows == 8 && this.nbcols == 8 && this.nbmines == 10) {
            return 'Minesweeper easy';
        } else {
            return 'Minesweeper ' + this.nbrows + '×' + this.nbcols + ' with ' + this.nbmines + ' mines';
        }
    }

    getAtomicPropositions() {
        let A = [];
        for (let y = 1; y <= this.nbrows; y++) {
            for (let x = 1; x <= this.nbcols; x++) {
                A.push(MineSweeper.getAtomicProposition(y, x));
            }
        }
        return A;
    }

    getPropositionsNeightbor(cell: Cell): string[] {
        let A = [];
        for (let y = Math.max(1, cell.row - 1); y <= Math.min(this.nbrows, cell.row + 1); y++) {
            for (let x = Math.max(1, cell.col - 1); x <= Math.min(this.nbcols, cell.col + 1); x++) {
                A.push(MineSweeper.getAtomicProposition(y, x));
            }
        }
        return A;
    }

    getCellsNeightbor(cell: Cell): Cell[] {
        let A = [];
        for (let y = Math.max(1, cell.row - 1); y <= Math.min(this.nbrows, cell.row + 1); y++) {
            for (let x = Math.max(1, cell.col - 1); x <= Math.min(this.nbcols, cell.col + 1); x++) {
                A.push({ row: y, col: x });
            }
        }
        return A;
    }

    /*
     * @returns the initial Kripke model of MineSweeper
     * where agent 2 only knows there are exactly two bombs.
     */
    getInitialEpistemicModel(): EpistemicModel {
        let example = this;

        /**
         * Good example of creating symbolic epistemic model in which
         * SEModelDescriptorFormulaMineSweeper implements SEModelDescriptor
         * to create a symbolic epistemic model from crash.
         */
        class SEModelDescriptorFormulaMineSweeper implements SEModelDescriptor {
            getAtomicPropositions(): string[] {
                return example.getAtomicPropositions();
            }

            getAgents() {
                return ['a'];
            }

            getPointedValuation() {
                return example.getValuationExample();
            }

            getSetWorldsFormulaDescription(): Formula {
                let f = new ExactlyFormula(example.nbmines, this.getAtomicPropositions());
                console.log(f.convertToNormalFormula().prettyPrint());
                return f;
            }

            getRelationDescription(agent: string): SymbolicRelation {
                return new Obs([]);
            }
        }

        this.clicked = {};

        let valToWorld = (val: Valuation): WorldValuation => {
            return new MineSweeperWorld(this.nbrows, this.nbcols, this.clicked, val);
        };

        return new SymbolicEpistemicModelBDD(valToWorld, new SEModelDescriptorFormulaMineSweeper());
    }

    /* @returns the Kripke model where the agent looses*/
    getMineSweeperGameOverKripkeModel() {
        // we do not care the model to be explicit :) It is a fake single world model
        let M = new ExplicitEpistemicModel();
        let A = [];
        for (let row = 1; row <= this.nbrows; row++) {
            for (let col = 1; col <= this.nbcols; col++) {
                A.push(MineSweeper.getAtomicProposition(row, col));
            }
        }

        M.addWorld('w', new MineSweeperWorld(this.nbrows, this.nbcols, {}, new Valuation(A)));
        M.makeCompleteRelation('a');
        M.setPointedWorld('w');
        return M;
    }

    getValuationExample(): Valuation {
        let V = [];
        for (let i = 1; i <= this.nbmines; i++) {
            while (true) {
                const col = 1 + Math.round(Math.random() * (this.nbcols - 1));
                const row = 1 + Math.round(Math.random() * (this.nbrows - 1));
                if (!V.includes(MineSweeper.getAtomicProposition(row, col))) {
                    V.push(MineSweeper.getAtomicProposition(row, col));
                    break;
                }
            }
        }
        return new Valuation(V);
    }

    getWorldExample() {
        return new MineSweeperWorld(this.nbrows, this.nbcols, {}, this.getValuationExample());
    }

    /*
     * event when the player clicks on the real world
     */
    onRealWorldClick(env: Environment, point) {
        let getAnnouncement = (initCell: Cell) => {
            let phis = [];
            let visited = {};
            let queue = [];
            queue.push(initCell);

            while (queue.length > 0) {
                let cell = queue.pop();

                if (visited[cell.row * (this.nbcols + 1) + cell.col] == undefined) {
                    visited[cell.row * (this.nbcols + 1) + cell.col] = true;
                    const hint = pointedWorld.getHint(cell);
                    this.clicked[cell.row * (this.nbcols + 1) + cell.col] = true;

                    const phi = new AndFormula([
                        new ExactlyFormula(hint, this.getPropositionsNeightbor(cell)),
                        new NotFormula(new AtomicFormula(MineSweeper.getAtomicProposition(cell.row, cell.col)))
                    ]);

                    phis.push(phi);
                    if (hint == 0) {
                        queue = queue.concat(this.getCellsNeightbor(cell));
                    }
                }
            }

            return new AndFormula(phis);
        };

        let M: SymbolicEpistemicModelBDD = env.epistemicModel as SymbolicEpistemicModelBDD;
        let pointedWorld: MineSweeperWorld = M.getPointedWorld() as MineSweeperWorld;

        let cell: Cell = pointedWorld.getCell(point);

        if (cell == undefined) {
            return;
        }

        if (pointedWorld.isMine(cell)) {
            console.log('lost');
            env.setEpistemicModel(this.getMineSweeperGameOverKripkeModel());
        } else {
            let phi = getAnnouncement(cell);
            // TODO SYMBOLIC PUBLIC ANNOUNCEMENT that the number of mines around cell is hint
            env.perform(
                new EventModelAction({
                    name: 'give hint',
                    eventModel: new SymbolicPublicAnnouncementBDD(phi)
                })
            );
        }
    }

    getActions() {
        return [];
    }
}
