import { ExplicitEpistemicModel } from './../epistemicmodel/explicit-epistemic-model';
import { WorldValuation } from './../epistemicmodel/world-valuation';
import { ExampleDescription } from '../environment/exampledescription';
import { Environment } from '../environment/environment';

class MineSweeperWorld extends WorldValuation {
    xt = 38;
    yt = 0;
    cellSize = 16;
    static imgExplosion = function () {
        let imgExplosion = new Image();
        imgExplosion.src = "assets/img/bomb.png";
        return imgExplosion;
    }();


    constructor(propositions) {
        super(propositions);
        this.agentPos["a"] = { x: 16, y: 32, r: 16 };
        this.agentPos["b"] = undefined;
        this.agentPos["c"] = undefined;


    }



    draw(context) {
        this.drawAgents(context);

        context.strokeStyle = "black";
        context.fillStyle = "lightgray";
        context.fillRect(this.xt, 0, 3 * this.cellSize, 4 * this.cellSize);
        for (let x = 0; x <= 3; x++) {
            context.beginPath();
            context.moveTo(this.xt + x * this.cellSize, this.yt);
            context.lineTo(this.xt + x * this.cellSize, this.yt + 4 * this.cellSize);
            context.stroke();
        }
        for (let y = 0; y <= 4; y++) {
            context.beginPath();
            context.moveTo(this.xt, this.yt + y * this.cellSize);
            context.lineTo(this.xt + 3 * this.cellSize, this.yt + y * this.cellSize);
            context.stroke();
        }

        context.font = "8px Verdana";
        let imgExplosionPadding = 2;
        for (let x = 1; x <= 3; x++)
            for (let y = 1; y <= 4; y++) {
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
                        context.strokeText(hint, this.xt + (x - 1) * this.cellSize + this.cellSize / 3,
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
        if (point.x > this.xt + 3 * this.cellSize) return undefined;
        if (point.y < this.yt) return undefined;
        if (point.y > this.yt + 4 * this.cellSize) return undefined;

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
        for (let y = Math.max(1, cell.y - 1); y <= Math.min(4, cell.y + 1); y++)
            for (let x = Math.max(1, cell.x - 1); x <= Math.min(3, cell.x + 1); x++)
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
    getName() {
        return "Mine Sweeper";
    }


    /*
     * @returns the initial Kripke model of MineSweeper
     * where agent 2 only knows there are exactly two bombs.
     */
    getInitialEpistemicModel(): ExplicitEpistemicModel {
        let M = new ExplicitEpistemicModel();
        for (let y = 1; y <= 4; y++)
            for (let x = 1; x <= 3; x++)
                for (let y2 = 1; y2 <= 4; y2++)
                    for (let x2 = 1; x2 <= 3; x2++)
                        if ((y < y2) || (y == y2) && (x < x2))
                            M.addWorld("w" + y + x + y2 + x2, new MineSweeperWorld(["m" + y + x, "m" + y2 + x2]));
        M.makeCompleteRelation("a");

        /*select randomly one of the worlds as the pointed world*/
        var randomKey = function (obj) {
            var keys = Object.keys(obj)
            return keys[keys.length * Math.random() << 0];
        };

        let idNode = randomKey(M.getNodes());
        M.setPointedWorld(idNode);
        return M;
    }

    /* @returns the Kripke model where the agent looses*/
    getMineSweeperGameOverKripkeModel() {
        let M = new ExplicitEpistemicModel();
        let A = [];
        for (let y = 1; y <= 4; y++)
            for (let x = 1; x <= 3; x++)
                A.push("m" + y + x);

        M.addWorld("w", new MineSweeperWorld(A));
        M.makeCompleteRelation("a");
        M.setPointedWorld("w");
        return M;
    }

    /*
     * event when the player clicks on the real world
     */
    onRealWorldClick(env: Environment, evt) {
        let M = env.getEpistemicModel();
        let cell = M.getNode(M.getPointedWorld()).getCell(evt);

        if (cell == undefined) return;

        if (M.getNode(M.getPointedWorld()).isMine(cell))
            env.setEpistemicModel(this.getMineSweeperGameOverKripkeModel());
        else {
            let hint = M.getNode(M.getPointedWorld()).getHint(cell);

            /* remove worlds in which the hint is different or
             worlds for which there is a bomb at cell*/
            for (let id in M.getNodes())
                if (M.getNode(id).isMine(cell) || (M.getNode(id).getHint(cell) !== hint))
                    M.removeNode(id);
            env.setEpistemicModel(M);
        }
    }





    getActions() {
        return [];
    }

    
}
