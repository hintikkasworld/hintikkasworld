import { Birthday } from './birthday';

describe('Birthday', () => {
    it('should create an instance', () => {
        expect(
            new Birthday(
                'Line',
                [
                    { day: 15, month: 'jl' },
                    { day: 3, month: 'jl' },
                    { day: 19, month: 'jl' },
                    { day: 17, month: 'j' },
                    { day: 18, month: 'j' },
                    { day: 14, month: 'm' },
                    { day: 3, month: 'm' },
                    { day: 14, month: 'a' },
                    { day: 15, month: 'a' },
                    { day: 17, month: 'a' }
                ],
                { day: 3, month: 'm' }
            )
        ).toBeTruthy();
    });
});
