import { MineSweeper } from './mine-sweeper';

describe('MineSweeper', () => {
    it('should create an instance', () => {
        expect(new MineSweeper(1, 1, 0)).toBeTruthy();
    });
});
