import { Valuation } from './valuation';
import { WorldValuation } from './world-valuation';

/**
 * this interface implements a super type of WorldValuation
 */
export interface WorldValuationType extends Function { new(val: Valuation): WorldValuation; }