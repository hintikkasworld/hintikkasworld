import { Scheme } from './scheme';

describe('Scheme', () => {
  it('should create an instance', () => {
    expect(new Scheme()).toBeTruthy();
  });

  it('should be able to parse', () => {
    expect(Scheme.parser("(ma or mb)").length == 3).toBeTruthy();
  });

  it('should be able to parse', () => {
    expect(Scheme.parser("(ma or mb)")[1] == "or").toBeTruthy();
  });


  it('should be able to parse', () => {
    expect(Scheme.parser("(a b)").length == 2).toBeTruthy();
  });



});
