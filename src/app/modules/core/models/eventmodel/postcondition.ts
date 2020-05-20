import { EpistemicModel } from '../epistemicmodel/epistemic-model';

export abstract class Postcondition {
    /**
     * @param e a world
     * @returns a copy of the world
     */
    static cloneWorld(e: any) {
        if (e instanceof Function) {
            return e;
        }
        if (e instanceof Array) {
            let c = [];

            for (let i in e) {
                c[i] = Postcondition.cloneWorld(e[i]); // here it is not a world, it is ugly...
            }

            return c;
        } else {
            if (e instanceof Object) {
                let c = $.extend(true, Object.create(Object.getPrototypeOf(e)), e);

                for (let i in e) {
                    c[i] = Postcondition.cloneWorld(e[i]); // here it is not a world, it is ugly...
                }
                return c;
            } else {
                return e;
            }
        }
    }

    abstract perform(M: EpistemicModel, w: string);

    abstract toString(): string;
}
