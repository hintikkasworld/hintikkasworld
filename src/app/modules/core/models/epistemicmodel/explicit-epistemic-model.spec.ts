import * as types from '../formula/formula'
import { ExplicitEpistemicModel } from './explicit-epistemic-model';
import { MuddyChildren } from '../examples/muddy-children';
describe('ExplicitEpistemicModel', () => {
  it('should create an instance', () => {
    expect(new ExplicitEpistemicModel()).toBeTruthy();
  });
  let m = new MuddyChildren().getInitialEpistemicModel();

  it('The formula top is true on the model', () => {
    expect((m.modelCheck("w", types.TrueFormula)) == true).toBeTruthy();

  });

});
