import { SuccessorSet } from './successor-set';
import { World } from './world';

export class ExplicitSuccessorSet implements SuccessorSet {

    private readonly successors: World[];
    constructor(successors: World[]) {
        this.successors = successors;
    }

    getNumber(): number {
        return this.successors.length;
    }
       
    getSomeSuccessors(): World[] {
        return this.successors;
    }



}
