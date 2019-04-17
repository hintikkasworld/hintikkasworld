import { Formula } from './../formula/formula';
import { Environment } from './../environment/environment';
import { EpistemicModel } from './../epistemicmodel/epistemic-model';
import { ExampleDescription } from '../environment/exampledescription';
import { World } from '../epistemicmodel/world';

interface Point {
    x: number;
    y: number;
}



class FlatlandWorld extends World {
    pos: { [agent: string]: Point };
    dir: { [agent: string]: number };


    constructor(pos: { [agent: string]: Point }, dir: { [agent: string]: number }) {
        super();
        this.pos = pos;
        this.dir = dir;

        for(let agent in pos) {
            this.agentPos[agent] = {x: this.pos[agent].x, y: this.pos[agent].y, r: 8};
        }
    }


    draw(context: CanvasRenderingContext2D) {
        this.drawAgents(context);
    }


    isSee(agent: string, agentb: string) {
        return (this.pos[agentb].x - this.pos[agent].x) * Math.cos(this.dir[agent]) + 
        (this.pos[agentb].y - this.pos[agent].y) * Math.sin(this.dir[agent]) >= 0;
    }


    modelCheck(phi: string) {
        throw new Error("Method not implemented.");
    }


    toString() {
        return JSON.stringify(this.pos) + JSON.stringify(this.dir);
    }


}




class FlatlandEpistemicModel implements EpistemicModel {
    pointedWorld;

    constructor () {
        this.pointedWorld = new FlatlandWorld({a: {x:10, y:10}, b: {x:30, y:10}, c: {x:10, y:40}}, {a: 0, b: 0, c: 0});
    }


    getPointedWorld(): World {
        return this.pointedWorld;
    }
    
    
    getAgents(): string[] {
         return ["a", "b", "c"];
    }


    getSuccessors(w: FlatlandWorld, a: string) {
        function getSuccessor(w: FlatlandWorld, a: string) {
            let newPos = {};
            let newDir = {};

            for(let agent of ["a", "b", "c"]) {
                if(w.isSee(a, agent) || a == agent) {
                    newPos[agent] = w.pos[agent];
                    newDir[agent] = w.dir[agent];
                }
                else {
                    newPos[agent] = {x: Math.random() * 128, y: Math.random() * 64};
                    newDir[agent] = Math.random() * 3.14 * 2;
                }
            }
            return new FlatlandWorld(newPos, newDir);
        }

        let succs = [];
        for(let i = 0; i < 10; i++)
            succs.push(getSuccessor(w, a));
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
        return new FlatlandWorld({a: {x:10, y:10}, b: {x:30, y:10}, c: {x:10, y:40}, d: {x:10, y:40}}, {a: 0, b: 0, c: 0, d: 0});
    }
    onRealWorldClick(env: Environment, point: any): void {

    }



}
