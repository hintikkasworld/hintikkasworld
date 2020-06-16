import { BehaviorSubject } from 'rxjs';
import { SuccessorSet } from '../epistemicmodel/successor-set';
import * as types from './../formula/formula';
import { environment } from 'src/environments/environment';
import { EpistemicModel } from '../epistemicmodel/epistemic-model';
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
    constructor(positions: { [agent: string]: Point }, angles: { [agent: string]: number }) {
        super();
        this.positions = positions;
        this.angle = angles;

        // restore the position of agents for drawing purposes
        for (let agent in positions) {
            this.agentPos[agent] = {
                x: this.positions[agent].x,
                y: this.positions[agent].y,
                r: 8
            };
        }
    }

    static readonly angleCone = 0.5;
    readonly positions: { [agent: string]: Point };
    readonly angle: { [agent: string]: number }; // to each agent we associate an angle

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
        for (let agent in this.positions) {
            drawVisionCone(agent, this.positions[agent], this.angle[agent]);
        }
        this.drawAgents(context);
    }

    /**
     *
     * @param agent
     * @param agentb
     * @returns true if agent sees agentb (agentb is in the cone of vision of agent)
     */
    isSee(agent: string, agentb: string): boolean {
        if (agent == agentb) {
            return true;
        }

        let dist = Math.sqrt(
            (this.positions[agentb].x - this.positions[agent].x) ** 2 + (this.positions[agentb].y - this.positions[agent].y) ** 2
        );

        if (dist == 0) {
            return true;
        }

        let scalarProduct =
            (this.positions[agentb].x - this.positions[agent].x) * Math.cos(this.angle[agent]) +
            ((this.positions[agentb].y - this.positions[agent].y) * Math.sin(this.angle[agent])) / dist;

        return scalarProduct >= Math.cos(FlatlandWorld.angleCone);
    }

    /**
     *
     * @param phi
     * @returns isSee(a,b) if the proposition is of the form a_sees_b, throws an error otherwise.
     */

    modelCheck(phi: string) {
        let l = phi.split('_');
        if (l.length == 3 && l[1] == 'sees' && l[0] in this.positions && l[2] in this.positions) {
            return this.isSee(l[0], l[2]);
        } else {
            throw new Error('Invalid atomic proposition: ' + phi);
        }
    }

    toString() {
        return JSON.stringify(this.positions) + JSON.stringify(this.angle);
    }
}

class FlatlandSuccessorSet implements SuccessorSet {
    private readonly w: FlatlandWorld;
    private readonly a: string;
    private readonly ckPositions: boolean;
    private done: boolean;

    constructor(w: FlatlandWorld, a: string, ckPositions: boolean) {
        this.w = w;
        this.a = a;
        this.ckPositions = ckPositions;
    }

    async length(): Promise<number> {
        if (this.isSingleSuccessor()) {
            return 1;
        } else {
            return Infinity;
        }
    }

    async getRandomSuccessor(): Promise<FlatlandWorld> {
        let getSuccessor = (w: FlatlandWorld, a: string): FlatlandWorld => {
            function testIfSuccessor(w: FlatlandWorld, u: FlatlandWorld) {
                for (let agent in w.positions) {
                    if (!w.isSee(a, agent) && u.isSee(a, agent)) {
                        return false;
                    }
                }
                return true;
            }

            let newPos = {};
            let newDir = {};

            for (let agent of ['a', 'b', 'c']) {
                if (w.isSee(a, agent) || a == agent) {
                    newPos[agent] = w.positions[agent];
                    newDir[agent] = w.angle[agent];
                } else {
                    if (this.ckPositions) {
                        newPos[agent] = w.positions[agent];
                    } else {
                        newPos[agent] = { x: Math.random() * 128, y: Math.random() * 64 };
                    }

                    newDir[agent] = Math.random() * 3.14 * 2.0;
                }
            }

            let potentialSuccessor = new FlatlandWorld(newPos, newDir);
            if (testIfSuccessor(w, potentialSuccessor)) {
                return potentialSuccessor;
            } else {
                return undefined;
            }
        };

        if (this.isSingleSuccessor()) {
            return this.w;
        } else {
            while (true) {
                let u = getSuccessor(this.w, this.a);
                if (u != undefined) {
                    return u;
                }
            }
        }
    }

    async getSuccessor(): Promise<World> {
        if (this.isSingleSuccessor()) {
            if (this.done) {
                return undefined;
            }
            this.done = true;
            return this.w;
        }

        for (let i = 0; i < 3; i++) {
            let u: FlatlandWorld = await this.getRandomSuccessor();
            if (u != undefined) {
                return u;
            }
        }
    }


    async getSomeSuccessors(): Promise<World[]> {
        if (this.isSingleSuccessor()) {
            if (this.done) {
                return [];
            }
            this.done = true;
            return [this.w];
        }

        let succs = [];
        for (let i = 0; i < 5; i++) {
            let u: FlatlandWorld = await this.getRandomSuccessor();
            if (u != undefined) {
                succs.push(u);
            }
        }
        return succs;
    }

    isSingleSuccessor(): boolean {
        return this.w.isSee(this.a, 'a') && this.w.isSee(this.a, 'b') && this.w.isSee(this.a, 'c');
    }
}

class FlatlandEpistemicModel implements EpistemicModel {
    constructor(ckPositions: boolean) {
        this.ckPositions = ckPositions;
    }

    static pointedWorld = new FlatlandWorld(
        { a: { x: 10, y: 30 }, b: { x: 50, y: 30 }, c: { x: 70, y: 50 } },
        { a: 0, b: Math.PI / 4, c: Math.PI / 2 }
    );

    readonly ckPositions: boolean;

    isLoadedObservable(): BehaviorSubject<boolean> {
        return new BehaviorSubject<boolean>(true);
    }

    isLoaded(): boolean {
        return true;
    }

    getPointedWorld(): World {
        return FlatlandEpistemicModel.pointedWorld;
    }

    getAgents(): string[] {
        return ['a', 'b', 'c'];
    }

    getSuccessors(w: FlatlandWorld, a: string): SuccessorSet {
        return new FlatlandSuccessorSet(w, a, this.ckPositions);
    }

    async check(formula: types.Formula): Promise<boolean> {
        return this.modelCheck(this.getPointedWorld(), formula);
    }

    /**
     * @param w world identifier
     * @param phi a formula (internal representation of a formula)
     * @returns true if formula phi is true in w
     * @example M.modelCheck("w", createFormula("(not p)"))
     * @example M.modelCheck("w", createFormula("(not (K a p))"))
     * */
    modelCheck(w: World, phi: types.Formula): boolean {
        switch (true) {
            case phi instanceof types.TrueFormula:
                return true;
            case phi instanceof types.AtomicFormula:
                return w.modelCheck((phi as types.AtomicFormula).getAtomicString());
            case phi instanceof types.FalseFormula:
                return false;
            case phi instanceof types.ImplyFormula:
                return (
                    !this.modelCheck(w, (phi as types.ImplyFormula).formula1) || this.modelCheck(w, (phi as types.ImplyFormula).formula2)
                );
            case phi instanceof types.EquivFormula:
                return this.modelCheck(w, (phi as types.EquivFormula).formula1) == this.modelCheck(w, (phi as types.EquivFormula).formula2);
            case phi instanceof types.AndFormula:
                return (phi as types.AndFormula).formulas.every((f) => this.modelCheck(w, f));
            case phi instanceof types.OrFormula:
                return (phi as types.OrFormula).formulas.some((f) => this.modelCheck(w, f));
            case phi instanceof types.XorFormula: {
                let c = 0;
                for (let f of (phi as types.XorFormula).formulas) {
                    if (this.modelCheck(w, f)) {
                        c++;
                    }

                    if (c > 1) {
                        return false;
                    }
                }
                return c == 1;
            }
            case phi instanceof types.NotFormula:
                return !this.modelCheck(w, (phi as types.NotFormula).formula);
            case phi instanceof types.KFormula: {
                throw new Error('Knowledge not implemented in Flatland.');
            }
            case phi instanceof types.KposFormula: {
                throw new Error('Knowledge not implemented in Flatland.');
            }
            case phi instanceof types.KwFormula: {
                throw new Error('Knowledge not implemented in Flatland.');
            }
            case phi instanceof types.ExactlyFormula: {
                let c = 0;
                for (let s of (phi as types.ExactlyFormula).variables) {
                    if (w.modelCheck(s)) {
                        c += 1;
                    }
                }
                return c == (phi as types.ExactlyFormula).count;
            }
        }
    }
}

export class Flatland extends ExampleDescription {
    constructor(ckPositions: boolean) {
        super();
        this.ckPositions = ckPositions;
    }

    readonly ckPositions: boolean;

    getDescription(): string[] {
        let A = [
            'Agents are placed in the plane, and see everything in front of them within a cone. They are uncertain about everything they do not see.'
        ];
        if (this.ckPositions) {
            A.push('');
            A.push('The positions of the agents are common knowledge.');
        }
        return A;
    }

    getAtomicPropositions() {
        let A = [];
        for (let agent in (this.getWorldExample() as FlatlandWorld).positions) {
            for (let agentb in (this.getWorldExample() as FlatlandWorld).positions) {
                A.push(agent + '_sees_' + agentb);
            }
        }
        return A;
    }

    getName() {
        if (this.ckPositions) {
            return 'Flatland with common knowledge of the positions';
        } else {
            return 'Flatland';
        }
    }

    getInitialEpistemicModel(): EpistemicModel {
        return new FlatlandEpistemicModel(this.ckPositions);
    }

    getActions() {
        return [];
    }

    getWorldExample(): World {
        return FlatlandEpistemicModel.pointedWorld;
    }

    onRealWorldClick(env: Environment, point: any): void {}
}
