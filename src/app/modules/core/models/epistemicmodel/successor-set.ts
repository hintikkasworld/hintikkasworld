import { World } from './world';

export interface SuccessorSet {
    getNumber(): Promise<number>;
    getSomeSuccessors(): Promise<World[]>;
    getRandomSuccessor(): Promise<World>;
}


