import { SuccessorSet } from './successor-set';
import { World } from './world';

export class ExplicitSuccessorSet implements SuccessorSet {

    private readonly successors: World[];
    private done: boolean = false;
    constructor(successors: World[]) {
        this.successors = successors;
    }

    async getNumber(): Promise<number> {
        return this.successors.length;
    }
       
    async getSomeSuccessors(): Promise<World[]> {
        if(this.done)
            return [];
        else {
            this.done = true;
            return this.successors;
        }
            
    }


    async getRandomSuccessor(): Promise<World> {
        return this.successors[Math.floor(Math.random() * this.successors.length)];
    }

}
