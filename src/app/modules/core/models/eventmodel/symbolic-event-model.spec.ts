import { SymbolicEventModel } from './symbolic-event-model';

describe('SymbolicEventModel', () => {
  it('should create an instance', () => {
    var agents = ["a"];
    var variables = ["xa1", "xa2"];
    expect(new SymbolicEventModel(agents, variables))).toBeTruthy();
  });
});
