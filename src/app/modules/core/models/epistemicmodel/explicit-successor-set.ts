import { SuccessorSet } from './successor-set';
import { World } from './world';

export class ExplicitSuccessorSet implements SuccessorSet {
    private readonly successors: World[];
    private successors_given = 0;

    constructor(successors: World[]) {
        this.successors = successors;
    }

    async length(): Promise<number> {
        return this.successors.length;
    }

    async getSuccessor(): Promise<World> {
        if (this.successors_given >= this.successors.length) {
            return undefined;
        }
        return this.successors[this.successors_given++];
    }

    async getSomeSuccessors(): Promise<World[]> {
        if (this.successors_given >= this.successors.length) {
            return [];
        }
        this.successors_given = this.successors.length;
        return this.successors;
    }

    async getRandomSuccessor(): Promise<World> {
        return this.successors[Math.floor(Math.random() * this.successors.length)];
    }
}
