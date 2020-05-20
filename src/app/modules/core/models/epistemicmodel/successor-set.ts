import { World } from './world';

export interface SuccessorSet {
    length(): Promise<number>;

    getSomeSuccessors(): Promise<World[]>;

    getRandomSuccessor(): Promise<World>;
}
