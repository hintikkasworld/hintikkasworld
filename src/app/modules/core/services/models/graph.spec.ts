import { Graph } from './graph';

describe('Graph', () => {
    it('should create an instance', () => {
        expect(new Graph([], [], { width: 100, height: 100 })).toBeTruthy();
    });
});
