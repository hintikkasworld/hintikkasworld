import { environment } from 'src/environments/environment';
import { Formula } from './../formula/formula';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from '../epistemicmodel/world';
import { Environment } from '../environment/environment';

interface Point {
    x: number;
    y: number;
}



class FlatlandWorld extends World {
    pos: { [agent: string]: Point };
    dir: { [agent: string]: number };
    static readonly angleCone = 0.5;

    constructor(pos: { [agent: string]: Point }, dir: { [agent: string]: number }) {
        super();
        this.pos = pos;
        this.dir = dir;

        for (let agent in pos) {
            this.agentPos[agent] = { x: this.pos[agent].x, y: this.pos[agent].y, r: 8 };
        }
    }


    draw(context: CanvasRenderingContext2D) {
        function drawVisionCone(agent: string, p: Point, d: number) {
            let l = 200;

            context.beginPath();
            context.strokeStyle = environment.agentColor[agent];
            context.moveTo(p.x, p.y);
            context.lineTo(p.x + l * Math.cos(d + FlatlandWorld.angleCone), p.y + l * Math.sin(d + FlatlandWorld.angleCone));
            context.stroke();
            context.moveTo(p.x, p.y);
            context.lineTo(p.x + l * Math.cos(d - FlatlandWorld.angleCone), p.y + l * Math.sin(d - FlatlandWorld.angleCone));
            context.stroke();
        }


        for (let agent in this.pos) {
            drawVisionCone(agent, this.pos[agent], this.dir[agent]);
        }



        this.drawAgents(context);
    }


    isSee(agent: string, agentb: string) {
        let dist = Math.sqrt((this.pos[agentb].x - this.pos[agent].x) ^ 2 + (this.pos[agentb].y - this.pos[agent].y) ^ 2);
        let scalarProduct = (this.pos[agentb].x - this.pos[agent].x) * Math.cos(this.dir[agent]) +
            (this.pos[agentb].y - this.pos[agent].y) * Math.sin(this.dir[agent]) / dist;

        return scalarProduct >= Math.cos(FlatlandWorld.angleCone);
    }


    modelCheck(phi: string) {
        throw new Error("Method not implemented.");
    }


    toString() {
        return JSON.stringify(this.pos) + JSON.stringify(this.dir);
    }


}




class FlatlandEpistemicModel implements EpistemicModel {
    static pointedWorld = new FlatlandWorld(
        { a: { x: 10, y: 10 }, b: { x: 30, y: 10 }, c: { x: 10, y: 40 } },
         { a: 0, b: 0, c: 0 });

    constructor() {

    }


    getPointedWorld(): World {
        return FlatlandEpistemicModel.pointedWorld;
    }


    getAgents(): string[] {
        return ["a", "b", "c"];
    }


    getSuccessors(w: FlatlandWorld, a: string) {
        function getSuccessor(w: FlatlandWorld, a: string) {
            function testIfSuccessor(w: FlatlandWorld, u: FlatlandWorld) {
                for (let agent of ["a", "b", "c"]) {
                    if (!w.isSee(a, agent) && u.isSee(a, agent))
                        return false;
                }
                return true;
            }

            let newPos = {};
            let newDir = {};

            for (let agent of ["a", "b", "c"]) {
                if (w.isSee(a, agent) || a == agent) {
                    newPos[agent] = w.pos[agent];
                    newDir[agent] = w.dir[agent];
                }
                else {
                    newPos[agent] = { x: Math.random() * 128, y: Math.random() * 64 };
                    newDir[agent] = Math.random() * 3.14 * 2;
                }
            }

            let potentialSuccessor = new FlatlandWorld(newPos, newDir);
            if (testIfSuccessor(w, potentialSuccessor))
                return potentialSuccessor;
            else
                return undefined;

        }

        let succs = [];
        for (let i = 0; i < 50; i++) {
            let u = getSuccessor(w, a);
            if (u != undefined)
                succs.push(u);
        }
        return succs;
    }

    check(formula: Formula) {
        throw new Error("Method not implemented.");
    }


}




export class Flatland implements ExampleDescription {
    getName() {
        return "Flatland";
    }

    getInitialEpistemicModel(): EpistemicModel {
        return new FlatlandEpistemicModel();
    }
    getActions() {
        return [];
    }
    getWorldExample(): World {
        return FlatlandEpistemicModel.pointedWorld;
    }
    onRealWorldClick(env: Environment, point: any): void {

    }



}
