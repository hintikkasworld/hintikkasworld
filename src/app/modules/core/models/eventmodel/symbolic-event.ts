import { Formula } from './../formula/formula';

/**
 * A symbolic event. The precondition is an epistemic formula,
 * and the postcondition is encoded as a propositional formula.
 */
export class SymbolicEvent<PropRepr> {
    readonly pre: Formula;
    readonly post: PropRepr;
    
    constructor(pre: Formula, post: PropRepr) {
      this.pre = pre;
      this.post = post;
    }
}
