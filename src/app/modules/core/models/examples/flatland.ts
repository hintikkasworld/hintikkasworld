import { SuccessorSet } from './../epistemicmodel/successor-set';
import { environment } from 'src/environments/environment';
import { Formula } from './../formula/formula';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from '../epistemicmodel/world';
import { Environment } from '../environment/environment';


/**
 * A point in the plane
 */
interface Point {
    x: number;
    y: number;
}


/**
 * A FlatlandWorld is a world in which agents are located in the plane. They have positions and a direction
 * of view.
 */
class FlatlandWorld extends World {
    readonly positions: { [agent: string]: Point };
    readonly angle: { [agent: string]: number };// to each agent we associate an angle
    static readonly angleCone = 0.5;

    constructor(positions: { [agent: string]: Point }, angles: { [agent: string]: number }) {
        super();
        this.positions = positions;
        this.angle = angles;

        //restore the position of agents for drawing purposes
        for (let agent in positions) {
            this.agentPos[agent] = { x: this.positions[agent].x, y: this.positions[agent].y, r: 8 };
        }
    }


    draw(context: CanvasRenderingContext2D) {
        function drawVisionCone(agent: string, pos: Point, angle: number) {
            let coneLength = 200;

            let p1: Point = {
                x: pos.x + coneLength * Math.cos(angle + FlatlandWorld.angleCone),
                y: pos.y + coneLength * Math.sin(angle + FlatlandWorld.angleCone)
            };

            let p2: Point = {
                x: pos.x + coneLength * Math.cos(angle - FlatlandWorld.angleCone),
                y: pos.y + coneLength * Math.sin(angle - FlatlandWorld.angleCone)
            };


            context.strokeStyle = environment.agentColor[agent];
            context.beginPath();
            context.moveTo(pos.x, pos.y);
            context.lineTo(p1.x, p1.y);
            context.stroke();
            context.moveTo(pos.x, pos.y);
            context.lineTo(p2.x, p2.y);
            context.stroke();


            context.fillStyle = environment.agentColor[agent];
            context.beginPath();
            context.moveTo(pos.x, pos.y);
            context.lineTo(p1.x, p1.y);
            context.lineTo(p2.x, p2.y);
            context.globalAlpha = 0.2;
            context.closePath();
            context.fill();
            context.globalAlpha = 1.0;
        }

        context.clearRect(0, 0, 128, 64);
        for (let agent in this.positions)
            drawVisionCone(agent, this.positions[agent], this.angle[agent]);
        this.drawAgents(context);
    }


    /**
     * 
     * @param agent 
     * @param agentb
     * @returns true if agent sees agentb (agentb is in the cone of vision of agent) 
     */
    isSee(agent: string, agentb: string): boolean {
        if (agent == agentb)
            return true;

        let dist = Math.sqrt((this.positions[agentb].x - this.positions[agent].x) ^ 2
            + (this.positions[agentb].y - this.positions[agent].y) ^ 2);

        if (dist == 0)
            return true;

        let scalarProduct = (this.positions[agentb].x - this.positions[agent].x) * Math.cos(this.angle[agent]) +
            (this.positions[agentb].y - this.positions[agent].y) * Math.sin(this.angle[agent]) / dist;

        return scalarProduct >= Math.cos(FlatlandWorld.angleCone);
    }


    modelCheck(phi: string) {
        throw new Error("Method not implemented.");
    }


    toString() {
        return JSON.stringify(this.positions) + JSON.stringify(this.angle);
    }


}


class FlatlandSuccessorSet implements SuccessorSet {
    private readonly w: FlatlandWorld;
    private readonly a: string;

    constructor(w: FlatlandWorld, a: string) {
        this.w = w;
        this.a = a;
    }

    getNumber(): number {
        if (this.isSingleSuccessor())
            return 1;
        else
            return Infinity;
    }



    async getRandomSuccessor(): Promise<FlatlandWorld> {
        function getSuccessor(w: FlatlandWorld, a: string): FlatlandWorld {
            function testIfSuccessor(w: FlatlandWorld, u: FlatlandWorld) {
                for (let agent in w.positions) {
                    if (!w.isSee(a, agent) && u.isSee(a, agent))
                        return false;
                }
                return true;
            }

            let newPos = {};
            let newDir = {};

            for (let agent of ["a", "b", "c"]) {
                if (w.isSee(a, agent) || a == agent) {
                    newPos[agent] = w.positions[agent];
                    newDir[agent] = w.angle[agent];
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


        if (this.isSingleSuccessor())
            return this.w;
        else {
            while (true) {
                let u = getSuccessor(this.w, this.a);
                if (u != undefined)
                    return u;
            }
        }
    }

    async getSomeSuccessors() {
        let succs = [];
        for (let i = 0; i < 5; i++) {
            let u: FlatlandWorld = await this.getRandomSuccessor();
            if (u != undefined)
                succs.push(u);
        }
        return succs;
    }


    isSingleSuccessor(): boolean {
        return this.w.isSee(this.a, "a") && this.w.isSee(this.a, "b") && this.w.isSee(this.a, "c");
    }

}

class FlatlandEpistemicModel implements EpistemicModel {
    static pointedWorld = new FlatlandWorld(
        { a: { x: 10, y: 30 }, b: { x: 50, y: 30 }, c: { x: 70, y: 50 } },
        { a: 0, b: Math.PI / 4, c: Math.PI / 2 });

    getPointedWorld(): World { return FlatlandEpistemicModel.pointedWorld; }
    getAgents(): string[] { return ["a", "b", "c"]; }

    getSuccessors(w: FlatlandWorld, a: string): SuccessorSet {
        return new FlatlandSuccessorSet(w, a);
    }

    check(formula: Formula) {
        throw new Error("Method not implemented.");
    }
}




export class Flatland implements ExampleDescription {
    getName() { return "Flatland"; }
    getInitialEpistemicModel(): EpistemicModel { return new FlatlandEpistemicModel(); }
    getActions() { return []; }
    getWorldExample(): World { return FlatlandEpistemicModel.pointedWorld; }
    onRealWorldClick(env: Environment, point: any): void { }
}
