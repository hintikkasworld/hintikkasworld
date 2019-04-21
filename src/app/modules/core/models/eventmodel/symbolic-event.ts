import { Formula } from './../formula/formula';

/**
 * A symbolic event. The precondition is an epistemic formula,
 * and the postcondition is encoded as a propositional formula.
 */
export class SymbolicEvent<PropRepr> {
    pre: Formula;
    post: PropRepr;
    constructor(pre: Formula, post: PropRepr) {
      this.pre = pre;
      this.post = post;
    }
}
