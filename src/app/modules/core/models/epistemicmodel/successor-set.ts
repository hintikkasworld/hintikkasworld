import { World } from './world';

export interface SuccessorSet {
    getNumber(): number;
    getSomeSuccessors(): World[];
}


