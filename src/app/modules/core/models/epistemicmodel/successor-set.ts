import { World } from './world';

export interface SuccessorSet {
    getNumber(): number;
    getSomeSuccessors(): Promise<World[]>;
    getRandomSuccessor(): Promise<World>;
}


