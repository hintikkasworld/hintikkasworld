import { BattleShip } from './battle-ship';

describe('BattleShip', () => {
    it('should create an instance', () => {
        expect(new BattleShip(0, 0, [])).toBeTruthy();
    });
});
