import { MuddyChildren } from '../examples/muddy-children';
import { Environment } from './environment';

describe('Environment', () => {
    it('should create an instance', () => {
        expect(new Environment(new MuddyChildren(0))).toBeTruthy();
    });
});
