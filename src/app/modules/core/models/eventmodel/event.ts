import { Formula } from '../formula/formula';
import { Postcondition } from './postcondition';

export class Event {
    pre: Formula;
    post: Postcondition;
}
