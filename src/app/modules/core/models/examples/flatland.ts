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
    readonly pos: { [agent: string]: Point };
    readonly dir: { [agent: string]: number };// to each agent we associate an angle
    static readonly angleCone = 0.5;

    constructor(pos: { [agent: string]: Point }, dir: { [agent: string]: number }) {
        super();
        this.pos = pos;
        this.dir = dir;

        //restore the position of agents for drawing purposes
        for (let agent in pos) {
            this.agentPos[agent] = { x: this.pos[agent].x, y: this.pos[agent].y, r: 8 };
        }
    }


    draw(context: CanvasRenderingContext2D) {
        function drawVisionCone(agent: string, p: Point, d: number) {
            let coneLength = 200;

            context.beginPath();
            context.strokeStyle = environment.agentColor[agent];
            context.moveTo(p.x, p.y);
            context.lineTo(p.x + coneLength * Math.cos(d + FlatlandWorld.angleCone), p.y + coneLength * Math.sin(d + FlatlandWorld.angleCone));
            context.stroke();
            context.moveTo(p.x, p.y);
            context.lineTo(p.x + coneLength * Math.cos(d - FlatlandWorld.angleCone), p.y + coneLength * Math.sin(d - FlatlandWorld.angleCone));
            context.stroke();
        }

        context.clearRect(0, 0, 128, 64);
        for (let agent in this.pos)
            drawVisionCone(agent, this.pos[agent], this.dir[agent]);
        this.drawAgents(context);
    }


    /**
     * 
     * @param agent 
     * @param agentb
     * @returns true if agent sees agentb (agentb is in the cone of vision of agent) 
     */
    isSee(agent: string, agentb: string): boolean {
        if(agent == agentb)
            return true;

        let dist = Math.sqrt((this.pos[agentb].x - this.pos[agent].x) ^ 2 + (this.pos[agentb].y - this.pos[agent].y) ^ 2);

        if(dist == 0)
            return true;

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
        { a: { x: 10, y: 30 }, b: { x: 50, y: 30 }, c: { x: 70, y: 50 } },
        { a: 0, b: Math.PI / 4, c: Math.PI / 2 });

    getPointedWorld(): World { return FlatlandEpistemicModel.pointedWorld; }
    getAgents(): string[] { return ["a", "b", "c"]; }

    getSuccessors(w: FlatlandWorld, a: string) {
        /**
         * 
         * @param w 
         * @param a 
         * @returns a possible world of w for agent a, or undefined (if it fails)
         */
        function getSuccessor(w: FlatlandWorld, a: string): FlatlandWorld {
            function testIfSuccessor(w: FlatlandWorld, u: FlatlandWorld) {
                for (let agent in w.pos) {
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


        if (w.isSee(a, "a") && w.isSee(a, "b") && w.isSee(a, "c"))
            return [w];
        else {
            console.log('w.isSee(a, "a") : '+ w.isSee(a, "a") );
            console.log('w.isSee(a, "b") : '+ w.isSee(a, "b") );
            console.log('w.isSee(a, "c") : '+ w.isSee(a, "c") );
            let succs = [];
            for (let i = 0; i < 50; i++) {
                let u = getSuccessor(w, a);
                if (u != undefined)
                    succs.push(u);
            }
            return succs;
        }


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
