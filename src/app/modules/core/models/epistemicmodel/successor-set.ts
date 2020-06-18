import { World } from './world';

export interface SuccessorSet {
    length(): Promise<number | { approximately: number }>;

    getSuccessor(): Promise<World>;

    getRandomSuccessor(): Promise<World>;
}
