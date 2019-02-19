import { Rectangle } from './rectangle';

describe('Rectangle', () => {
  it('should create an instance', () => {
    expect(new Rectangle(0, 0, 5, 5)).toBeTruthy();
  });
});
